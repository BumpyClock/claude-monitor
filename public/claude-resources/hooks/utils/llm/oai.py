#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "openai",
#     "python-dotenv",
# ]
# ///

import os
import sys
from dotenv import load_dotenv


def prompt_llm(prompt_text):
    """
    Base OpenAI LLM prompting method using fastest model.

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
            # Log to same file as summarizer for debugging
            try:
                with open(".claude/logs/summarizer.log", "a") as f:
                    f.write(f"[DEBUG] Loaded .env from: {env_path}\n")
            except:
                pass
            break

    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Debug logging
    try:
        with open(".claude/logs/summarizer.log", "a") as f:
            f.write(f"[DEBUG] Environment loaded: {env_loaded}, API key found: {bool(api_key)}\n")
            f.write(f"[DEBUG] Using base URL: {base_url}, model: {model}\n")
            if not api_key:
                f.write(f"[DEBUG] Current working directory: {current_dir}\n")
                f.write(f"[DEBUG] Checked paths: {possible_env_paths}\n")
    except:
        pass
    
    if not api_key:
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, base_url=base_url)

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt_text}],
            max_tokens=100,
            temperature=0.7,
        )

        result = response.choices[0].message.content.strip()
        
        # Debug log successful response
        try:
            with open(".claude/logs/summarizer.log", "a") as f:
                f.write(f"[DEBUG] OpenAI call successful, response length: {len(result)}\n")
        except:
            pass
            
        return result

    except Exception as e:
        # Debug log the error
        try:
            with open(".claude/logs/summarizer.log", "a") as f:
                f.write(f"[DEBUG] OpenAI call failed: {str(e)}\n")
        except:
            pass
        return None


def generate_completion_message():
    """
    Generate a completion message using OpenAI LLM.

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
                print("Error calling OpenAI API")
    else:
        print("Usage: ./oai.py 'your prompt here' or ./oai.py --completion")


if __name__ == "__main__":
    main()