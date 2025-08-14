#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Constants for Claude Code Hooks.
"""

import os
import time
import random
from pathlib import Path

# Cross-platform file locking
try:
    import fcntl
    HAS_FCNTL = True
except ImportError:
    # Windows doesn't have fcntl, but we can use msvcrt for file locking
    try:
        import msvcrt
        HAS_MSVCRT = True
        HAS_FCNTL = False
    except ImportError:
        # Fallback to no locking (graceful degradation)
        HAS_FCNTL = False
        HAS_MSVCRT = False

# Base directory for all logs
# Default is 'logs' in the current working directory
LOG_BASE_DIR = os.environ.get("CLAUDE_HOOKS_LOG_DIR", "logs")

def get_session_log_dir(session_id: str) -> Path:
    """
    Get the log directory for a specific session.
    
    Args:
        session_id: The Claude session ID
        
    Returns:
        Path object for the session's log directory
    """
    return Path(LOG_BASE_DIR) / session_id

def _acquire_lock(file_handle):
    """Cross-platform file locking helper."""
    if HAS_FCNTL:
        fcntl.flock(file_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    elif HAS_MSVCRT:
        # Windows file locking using msvcrt
        msvcrt.locking(file_handle.fileno(), msvcrt.LK_NBLCK, 1)
    else:
        # No locking available - rely on retry logic
        pass

def ensure_session_log_dir(session_id: str) -> Path:
    """
    Ensure the log directory for a session exists with atomic operations.
    
    Args:
        session_id: The Claude session ID
        
    Returns:
        Path object for the session's log directory
    """
    log_dir = get_session_log_dir(session_id)
    
    # Use atomic directory creation with file locking to prevent race conditions
    if not log_dir.exists():
        # Create a lock file for this session directory creation
        lock_file = Path(LOG_BASE_DIR) / f".{session_id}.lock"
        
        # Ensure base log directory exists first
        Path(LOG_BASE_DIR).mkdir(parents=True, exist_ok=True)
        
        try:
            # Try to acquire exclusive lock for directory creation
            with open(lock_file, 'w') as f:
                _acquire_lock(f)
                
                # Double-check if directory was created by another process
                if not log_dir.exists():
                    log_dir.mkdir(parents=True, exist_ok=True)
                    
        except (OSError, IOError):
            # If locking fails, fall back to simple mkdir with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    log_dir.mkdir(parents=True, exist_ok=True)
                    break
                except FileExistsError:
                    # Directory was created by another process, which is fine
                    break
                except OSError as e:
                    if attempt == max_retries - 1:
                        raise e
                    # Brief random delay to reduce collision probability
                    time.sleep(random.uniform(0.01, 0.05))
        finally:
            # Clean up lock file if it exists
            try:
                lock_file.unlink(missing_ok=True)
            except OSError:
                pass  # Lock file cleanup is best-effort
    
    return log_dir