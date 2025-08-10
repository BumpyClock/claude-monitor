#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Shared LLM Client Module

Centralizes LLM provider logic to eliminate code duplication between
summarizer.py and stop.py. Provides consistent provider selection,
environment loading, and subprocess-based LLM calling.
"""

import os
import subprocess
import random
from pathlib import Path
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv


def _log_to_file(message: str, log_file: str = ".claude/logs/summarizer.log") -> None:
    """Log message to file with timestamp."""
    try:
        # Ensure log directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        timestamp = datetime.now().isoformat()
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass  # Fail silently to not break hooks


def load_project_environment() -> None:
    """Load environment variables from various possible .env locations."""
    # Try multiple locations for .env file
    current_dir = os.getcwd()
    possible_env_paths = [
        ".env",  # Current directory
        os.path.join(current_dir, ".env"),  # Explicit current directory
        os.path.expanduser("~/.claude/.env"),  # User claude directory
    ]
    
    # Walk up the directory tree to find .env
    check_dir = current_dir
    for _ in range(5):  # Don't go too far up
        env_path = os.path.join(check_dir, ".env")
        possible_env_paths.append(env_path)
        check_dir = os.path.dirname(check_dir)
        if check_dir == "/" or check_dir == check_dir:  # Reached root or no change
            break
    
    # Try loading from each possible location
    for env_path in possible_env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)
            break


def get_available_provider() -> str:
    """
    Determine which LLM provider to use based on environment variables and availability.
    
    Returns:
        str: 'ollama', 'openai', 'anthropic', or 'fallback'
    """
    load_project_environment()
    
    # Check explicit provider preference
    preferred_provider = os.getenv("SUMMARY_LLM_PROVIDER", "").lower()
    
    # Check API key availability
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    has_ollama = bool(os.getenv("OLLAMA_API_KEY"))
    
    # Honor explicit preference if API key is available
    if preferred_provider == "anthropic" and has_anthropic:
        return "anthropic"
    elif preferred_provider == "openai" and has_openai:
        return "openai"
    elif preferred_provider == "ollama" and has_ollama:
        return "ollama"
    elif preferred_provider in ["claude", "anth"] and has_anthropic:
        return "anthropic"
    elif preferred_provider in ["gpt", "oai"] and has_openai:
        return "openai"
    
    # Auto-select based on availability (prefer Ollama, then OpenAI, then Anthropic)
    if has_ollama:
        return "ollama"
    elif has_openai:
        return "openai"
    elif has_anthropic:
        return "anthropic"
    else:
        return "fallback"


def call_llm_provider(prompt_text: str, provider: str = None, mode: str = 'prompt') -> Optional[str]:
    """
    Call LLM provider via subprocess with standardized interface.
    
    Args:
        prompt_text: The prompt to send (for mode='prompt') or ignored (for mode='completion')
        provider: Specific provider to use, or None for auto-detection
        mode: 'prompt' (send via stdin) or 'completion' (use --completion flag)
        
    Returns:
        str: The model's response, or None if failed
    """
    if provider is None:
        provider = get_available_provider()
    
    if provider == "fallback":
        return None
        
    # Get script directory and construct LLM script paths
    script_dir = Path(__file__).parent
    llm_dir = script_dir / "llm"
    
    # Map providers to script files
    provider_scripts = {
        "ollama": llm_dir / "ollama_provider.py",
        "openai": llm_dir / "oai.py", 
        "anthropic": llm_dir / "anth.py"
    }
    
    script_path = provider_scripts.get(provider)
    if not script_path or not script_path.exists():
        return None
        
    try:
        # Build command based on mode
        if mode == 'completion':
            # Completion mode: use --completion flag
            cmd = [str(script_path), "--completion"]
            input_data = None
        else:
            # Prompt mode: send prompt via stdin
            cmd = [str(script_path)]
            input_data = prompt_text
            
        # Execute subprocess
        result = subprocess.run(
            cmd,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Check if successful
        if result.returncode == 0 and result.stdout.strip() and not result.stdout.strip().startswith("Error"):
            return result.stdout.strip()
        else:
            error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
            _log_to_file(f"{provider.capitalize()} failed: {error_msg}")
            return None
            
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, Exception) as e:
        _log_to_file(f"{provider.capitalize()} error: {str(e)}")
        return None


def call_llm_with_fallback(prompt_text: str, mode: str = 'prompt') -> tuple[Optional[str], str]:
    """
    Call LLM with automatic fallback through provider chain.
    
    Args:
        prompt_text: The prompt to send to the LLM
        mode: 'prompt' (send via stdin) or 'completion' (use --completion flag)
        
    Returns:
        tuple: (response, provider_used) where provider_used is the successful provider name
    """
    provider = get_available_provider()
    
    # Try primary provider first
    if provider != "fallback":
        result = call_llm_provider(prompt_text, provider, mode)
        if result:
            return result, provider
    
    # Try fallback chain: Ollama > OpenAI > Anthropic
    fallback_order = ["ollama", "openai", "anthropic"]
    for fallback_provider in fallback_order:
        if fallback_provider != provider:  # Skip if we already tried it
            result = call_llm_provider(prompt_text, fallback_provider, mode)
            if result:
                return result, fallback_provider
                
    return None, "none"


def get_completion_message() -> str:
    """
    Generate completion message using available LLM services.
    Priority order: Ollama > OpenAI > Anthropic > fallback to random message
    
    Returns:
        str: Generated or fallback completion message
    """
    # Try to get LLM-generated completion message
    llm_response, provider_used = call_llm_with_fallback("", mode='completion')
    if llm_response:
        return llm_response
    
    # Fallback to random predefined message
    fallback_messages = [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Job complete!",
        "Ready for next task!",
    ]
    return random.choice(fallback_messages)


# For backwards compatibility - these functions mirror the summarizer.py interface
def _get_llm_provider() -> str:
    """Backwards compatibility alias for get_available_provider()."""
    return get_available_provider()


def _prompt_llm(prompt_text: str) -> Optional[str]:
    """Backwards compatibility alias for call_llm_with_fallback()."""
    response, provider_used = call_llm_with_fallback(prompt_text, mode='prompt')
    return response


def _load_environment() -> None:
    """Backwards compatibility alias for load_project_environment()."""
    load_project_environment()