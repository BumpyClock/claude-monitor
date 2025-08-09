#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "ollama",
#     "python-dotenv",
# ]
# ///

import os
import sys
from dotenv import load_dotenv


def prompt_llm(prompt_text):
    """
    Base Ollama LLM prompting method using fastest model.

    Args:
        prompt_text (str): The prompt to send to the model

    Returns:
        str: The model's response text, or None if error
    """
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
        if check_dir == "/":  # Reached root
            break
    
    # Try loading from each possible location
    env_loaded = False
    for env_path in possible_env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            env_loaded = True
            # Comment out detailed env logging
            # try:
            #     with open(".claude/logs/summarizer.log", "a") as f:
            #         f.write(f"[DEBUG] Loaded .env from: {env_path}\n")
            # except:
            #     pass
            break

    api_key = os.getenv("OLLAMA_API_KEY")
    base_url = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
    model = os.getenv("OLLAMA_MODEL", "gpt-oss:120b")
    
    # Log only if API key is missing for debugging
    if not api_key:
        try:
            with open(".claude/logs/summarizer.log", "a") as f:
                f.write(f"[DEBUG] Ollama API key not found in .env\n")
        except:
            pass
    
    if not api_key:
        return None

    try:
        from ollama import Client

        # Create client with API key if provided
        if api_key:
            client = Client(
                host=base_url,
                headers={'Authorization': f'Bearer {api_key}'}
            )
        else:
            client = Client(host=base_url)

        # Use streaming to get complete response
        messages = [{"role": "user", "content": prompt_text}]

        # Get response with streaming
        response_text = ""
        try:
            for part in client.chat(model, messages=messages, stream=True):
                # Extract content using your exact pattern
                if 'message' in part and 'content' in part['message']:
                    content = part['message']['content']
                    if content:  # Only process non-empty content
                        response_text += content
                        # Don't print when called from subprocess to avoid duplicate output
                        
        except Exception as stream_error:
            try:
                with open(".claude/logs/summarizer.log", "a") as f:
                    f.write(f"[ERROR] Ollama stream error: {str(stream_error)}\n")
            except:
                pass
            
        return response_text.strip() if response_text.strip() else None

    except Exception as e:
        # Log critical errors only
        try:
            with open(".claude/logs/summarizer.log", "a") as f:
                f.write(f"[ERROR] Ollama call failed: {str(e)}\n")
        except:
            pass
        return None


def generate_completion_message():
    """
    Generate a completion message using Ollama LLM.

    Returns:
        str: A natural language completion message, or None if error
    """
    engineer_name = os.getenv("ENGINEER_NAME", "").strip()

    if engineer_name:
        name_instruction = f"Sometimes (about 30% of the time) include the engineer's name '{engineer_name}' in a natural way."
        examples = f"""Examples of the style: 
- Standard: "Work complete!", "All done!", "Task finished!", "Ready for your next move!"
- Personalized: "{engineer_name}, all set!", "Ready for you, {engineer_name}!", "Complete, {engineer_name}!", "{engineer_name}, we're done!" """
    else:
        name_instruction = ""
        examples = """Examples of the style: "Work complete!", "All done!", "Task finished!", "Ready for your next move!" """

    prompt = f"""Generate a short, friendly completion message for when an AI coding assistant finishes a task. 

Requirements:
- Keep it under 10 words
- Make it positive and future focused
- Use natural, conversational language
- Focus on completion/readiness
- Do NOT include quotes, formatting, or explanations
- Return ONLY the completion message text
{name_instruction}

{examples}

Generate ONE completion message:"""

    response = prompt_llm(prompt)

    # Clean up response - remove quotes and extra formatting
    if response:
        response = response.strip().strip('"').strip("'").strip()
        # Take first line if multiple lines
        response = response.split("\n")[0].strip()

    return response


def main():
    """Command line interface for testing."""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--completion":
            message = generate_completion_message()
            if message:
                print(message)
            else:
                print("Error generating completion message")
        else:
            prompt_text = " ".join(sys.argv[1:])
            response = prompt_llm(prompt_text)
            if response:
                print(response)
            else:
                print("Error calling Ollama API")
    else:
        # Read from stdin if no arguments provided
        try:
            prompt_text = sys.stdin.read().strip()
            if prompt_text:
                response = prompt_llm(prompt_text)
                if response:
                    print(response)
                else:
                    print("Error calling Ollama API")
            else:
                print("Usage: ./ollama_provider.py 'your prompt here' or ./ollama_provider.py --completion")
        except:
            print("Usage: ./ollama_provider.py 'your prompt here' or ./ollama_provider.py --completion")


if __name__ == "__main__":
    main()