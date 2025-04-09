import os
import uuid
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from typing_extensions import TypedDict
import json
import re
import traceback
from datetime import datetime, timedelta
import sys
from io import StringIO
import logging # Add this import at the top
import sys     # Add this import at the top

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app) # Keep CORS

# --- ADD THIS LOGGING ---
# Configure basic logging to go to stderr (visible in Vercel logs)
app.logger.setLevel(logging.DEBUG) 
handler = logging.StreamHandler(sys.stderr)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s '
    '[in %(pathname)s:%(lineno)d]'
))
app.logger.addHandler(handler)

@app.before_request
def log_request_info():
    """Log incoming request details before routing."""
    app.logger.debug('*** Request Received ***')
    app.logger.debug('Path: %s', request.path)
    app.logger.debug('Method: %s', request.method)
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Base URL: %s', request.base_url)
    app.logger.debug('URL Root: %s', request.url_root)
    app.logger.debug('Script Root: %s', request.script_root)
    app.logger.debug('Rule: %s', request.url_rule) # Might be None here
    app.logger.debug('************************')
# --- Configuration ---
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("Error: Gemini API key not found. Make sure it's set in your .env file.")
    exit()


# --- Data Models ---
class Transcript(TypedDict):
    timestamp: str
    subtitle: str

# --- Helper Functions ---
def parse_timestamp_to_seconds(ts_str):
    """Converts HH:MM:SS.ms or MM:SS.ms to seconds (float). Returns None on failure."""
    try:
        parts = ts_str.split(':')
        if len(parts) == 3:  # HH:MM:SS.ms
            h, m, s_ms = parts
            sec_float = float(s_ms)
            total_seconds = int(h) * 3600 + int(m) * 60 + sec_float
        elif len(parts) == 2:  # MM:SS.ms
            m, s_ms = parts
            sec_float = float(s_ms)
            total_seconds = int(m) * 60 + sec_float
        else:
            return None
        return total_seconds
    except ValueError:
        return None

def format_seconds_to_srt(seconds):
    """Converts seconds (float) to HH:MM:SS,ms SRT format."""
    if seconds < 0:
        seconds = 0
    delta = timedelta(seconds=seconds)
    hours = delta.seconds // 3600
    minutes = (delta.seconds % 3600) // 60
    secs = delta.seconds % 60
    milliseconds = delta.microseconds // 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"

def transcript_to_srt(transcript_data, duration_per_subtitle=5.0):
    """Converts transcript data to SRT format string."""
    srt_content = StringIO()
    for i, item in enumerate(transcript_data, start=1):
        timestamp = item.get('timestamp', '')
        subtitle = item.get('subtitle', '').strip()
        if not timestamp or not subtitle:
            continue

        start_seconds = parse_timestamp_to_seconds(timestamp)
        if start_seconds is None:
            print(f"Warning: Skipping invalid timestamp '{timestamp}' at index {i-1}")
            continue

        # Define end time as start time + duration (e.g., 5 seconds)
        end_seconds = start_seconds + duration_per_subtitle
        start_time = format_seconds_to_srt(start_seconds)
        end_time = format_seconds_to_srt(end_seconds)

        # Write SRT entry
        srt_content.write(f"{i}\n")
        srt_content.write(f"{start_time} --> {end_time}\n")
        srt_content.write(f"{subtitle}\n\n")

    srt_str = srt_content.getvalue()
    srt_content.close()
    return srt_str

# --- Core Logic ---
def generate_transcript(youtube_url, request_id):
    print(f"Starting transcript generation for: {youtube_url} (ID: {request_id})")
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = """
    Analyze the following YouTube video and generate accurate timestamps with corresponding subtitles.
    Requirements:
    1. Language: Cantonese or English (prioritize accuracy in spoken language).
    2. Provide timestamps in the format HH:MM:SS.mmm (e.g., 00:00:05.123) and the spoken text at each timestamp.
    3. Return the result STRICTLY as a JSON array of objects with 'timestamp' and 'subtitle' fields. Do not include ```json markdown or any other text outside the JSON array.
    
    **Example Output:**
    [
    {"timestamp": "00:00:05.123", "subtitle": "Hello there."},
    {"timestamp": "00:00:11.456", "subtitle": "This is a test."}, 
    {"timestamp": "00:03:24.150", "subtitle": "而天使沒有給予同情"}
    ]
    """
    content = types.Content(
        parts=[
            types.Part(text=prompt),
            types.Part(file_data=types.FileData(mime_type="video/mp4", file_uri=youtube_url))
        ]
    )

    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-pro-exp-03-25',
            contents=content,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=list[Transcript],
                temperature=1.0,
            )
        )
        response_text = response.text.strip()  # Strip whitespace
        print(f"Raw transcript response text (ID: {request_id}): '{response_text}'")  # Log raw response

        try:
            transcript_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"Warning: Direct JSON parsing failed for transcript (ID: {request_id}): {e}. Trying markdown extraction.")
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text, re.DOTALL)
            if json_match:
                extracted_json = json_match.group(1).strip()
                print(f"Extracted JSON from markdown (ID: {request_id}): '{extracted_json}'")  # Log extracted content
                if not extracted_json:
                    raise ValueError("Extracted JSON from markdown is empty.")
                try:
                    transcript_data = json.loads(extracted_json)
                    print(f"Successfully extracted transcript JSON from markdown (ID: {request_id}).")
                except json.JSONDecodeError as inner_err:
                    print(f"Error decoding extracted JSON for transcript (ID: {request_id}): {inner_err}", file=sys.stderr)
                    raise ValueError(f"Failed to decode extracted JSON from Gemini: {inner_err}")
            else:
                print(f"Error: Could not find JSON in markdown for transcript (ID: {request_id}). Response: '{response_text}'", file=sys.stderr)
                raise ValueError("Failed to parse Gemini response as JSON (no valid markdown found).")

        # Validate structure
        if not isinstance(transcript_data, list):
            raise ValueError(f"Validated response is not a list: {transcript_data}")
        for i, item in enumerate(transcript_data):
            if not isinstance(item, dict) or 'timestamp' not in item or 'subtitle' not in item:
                raise ValueError(f"Invalid transcript item format at index {i}: {item}")
            # Validate timestamp format
            if not re.fullmatch(r"\d{2}:\d{2}:\d{2}\.\d{3}", item['timestamp']):
                print(f"Warning: Timestamp format mismatch at index {i}: '{item['timestamp']}'")

        print(f"Transcript successfully generated and parsed for ID: {request_id}.")
        return transcript_data

    except Exception as e:
        print(f"Error during transcript generation/parsing (ID: {request_id}): {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise


# Generate Styled Caption Function
def generate_multiple_captions(transcript_data, style, language, num_captions=3, request_id=""):    
    print(f"Starting caption generation (Style: {style}) for ID: {request_id}")

    # Combine subtitles into a single text block
    full_transcript_text = " ".join([item.get('subtitle', '').strip() for item in transcript_data if item.get('subtitle')])

    if not full_transcript_text:
        print(f"Warning: Empty transcript provided for caption generation (ID: {request_id}).")
        return ["Error: Transcript is empty, cannot generate captions."]

    # --- MODIFIED PROMPT ---
    prompt = f"""
    You are an expert social media copywriter specializing in Instagram.
    Based on the following video transcript, generate exactly **{num_captions}** distinct and engaging Instagram post caption variations in the **{language}** language.

    **Core Requirements:**
    1.  **Language & Style:** All captions MUST be in **{language}** and reflect a **{style}** tone.
    2.  **Distinct Variations:** Each caption should offer a different angle, hook, or call-to-action related to the transcript content.
    3.  **Conciseness:** Keep captions suitable for Instagram (generally under 150 words in {language}).
    4.  **Engagement:** Aim to be compelling, encourage likes, comments, or shares.
    5.  **Content Essence:** Capture the main theme or key message of the transcript.
    6.  **Formatting:** Include relevant emojis and hashtags (appropriate for {language}, e.g., #主題 or #Topic).
    7.  **Output Format:** Return the result ONLY as a valid JSON array of strings. Each string in the array should be one complete caption variation. Do NOT include ```json markdown, numbering, explanations, or any text outside the JSON array.

    **Transcript (Mixed English/Cantonese expected):**
    ---
    {full_transcript_text}
    ---

    Generate the {num_captions} distinct **{style}** Instagram captions in **{language}** as a JSON array of strings now:
    """
    client = genai.Client(api_key=GEMINI_API_KEY)
    generation_config = types.GenerateContentConfig(
        response_mime_type='application/json',
        temperature=0.9, # Slightly higher temp for more variation
        # candidate_count=1 # Requesting variations is done via prompt, not this param usually
    )
    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
            contents=prompt,
            config=generation_config
        )        # Clean up the response text (remove potential leading/trailing whitespace)
        response_text = response.text.strip()

        print(f"Raw captions response text (ID: {request_id}): {response_text}")

        # <<< ROBUST PARSING LOGIC >>>
        captions_list = None
        try:
            # Try direct parsing first
            data = json.loads(response_text)
            if isinstance(data, list) and all(isinstance(item, str) for item in data):
                captions_list = data
                print(f"Successfully parsed direct JSON list for captions (ID: {request_id}).")
            else:
                print(f"Warning: Direct JSON parse result is not a list of strings (ID: {request_id}). Type: {type(data)}")
        except json.JSONDecodeError:
            print(f"Warning: Direct JSON parsing failed for captions (ID: {request_id}). Trying markdown extraction.")
            # If direct parsing fails, try extracting from markdown
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response_text, re.DOTALL)
            if json_match:
                try:
                    extracted_json_str = json_match.group(1)
                    data = json.loads(extracted_json_str)
                    if isinstance(data, list) and all(isinstance(item, str) for item in data):
                        captions_list = data
                        print(f"Successfully extracted captions JSON from markdown (ID: {request_id}).")
                    else:
                         print(f"Warning: Extracted JSON from markdown is not a list of strings (ID: {request_id}). Data: {data}")
                except json.JSONDecodeError as inner_err:
                    print(f"Error decoding extracted JSON for captions (ID: {request_id}): {inner_err}", file=sys.stderr)
                    # Keep captions_list as None

            if not captions_list: # If markdown extraction also failed or didn't yield correct type
                 print(f"Error: Could not parse valid JSON list from response even after markdown check (ID: {request_id}).", file=sys.stderr)
                 print(f"Problematic raw response: {response_text}", file=sys.stderr)
                 raise ValueError("Invalid format received for captions, could not parse JSON list.")
        #<<< END ROBUST PARSING LOGIC >>>

        if not captions_list: # Should not happen if logic above is sound, but safety check
            raise ValueError("Caption list is unexpectedly empty after processing.")

        # Limit to requested number just in case Gemini gives more
        final_captions = [cap.strip() for cap in captions_list if cap.strip()][:num_captions]

        print(f"Successfully generated and parsed {len(final_captions)} captions for ID: {request_id}.")
        return final_captions

    except Exception as e:
        print(f"Error during caption generation/parsing (ID: {request_id}): {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        if isinstance(e, (ValueError, json.JSONDecodeError)):
             raise ValueError(f"Error processing caption data: {e}")
        else:
             raise RuntimeError(f"Gemini API call failed for captions: {e}")

# --- Flask Routes ---
# Add this ABOVE your existing routes for testing
@app.route('/')
def home_test():
    return "Flask app is running!"


@app.route('/generate_transcript', methods=['POST'])
def generate_transcript_route():
    """Endpoint for transcript generation with SRT download."""
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 415
    data = request.get_json()
    youtube_link = data.get('youtube_link')
    format_type = data.get('format', 'json')  # Default to JSON, allow 'srt'

    if not youtube_link or not youtube_link.startswith('http'):
        return jsonify({'error': 'Valid "youtube_link" required.'}), 400

    request_id = str(uuid.uuid4())
    print(f"--- Transcript Request ID: {request_id}, URL: {youtube_link}, Format: {format_type} ---")
    
    try:
        transcript = generate_transcript(youtube_link, request_id)
        
        if format_type.lower() == 'srt':
            srt_content = transcript_to_srt(transcript)
            if not srt_content.strip():
                return jsonify({'error': 'No valid subtitles generated for SRT.'}), 400
            
            # Return as downloadable file
            srt_io = StringIO(srt_content)
            return send_file(
                srt_io,
                mimetype='text/plain',
                as_attachment=True,
                download_name=f"transcript_{request_id}.srt"
            )
        else:
            return jsonify({'transcript': transcript})  # Default JSON response

    except ValueError as ve:
        return jsonify({'error': f"Data Processing Error: {ve}"}), 400
    except RuntimeError as re:
        return jsonify({'error': f"Service Error: {re}"}), 500
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return jsonify({'error': f"Unexpected Server Error: {e}"}), 500


@app.route('/generate_caption', methods=['POST'])
def generate_caption_route():
    """ Endpoint for generating multiple captions. """
    if not request.is_json: return jsonify({'error': 'Request must be JSON'}), 415
    data = request.get_json()

    transcript_data = data.get('transcript')
    style = data.get('style')
    language = data.get('language', 'Cantonese')
    # <<< GET num_captions from request, default to 3 >>>
    try:
        num_captions = int(data.get('num_captions', 3))
        if not 1 <= num_captions <= 5: # Set reasonable limits
             raise ValueError("Number of captions must be between 1 and 5.")
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid "num_captions" parameter (must be an integer between 1 and 5).'}), 400
    # <<< END GET num_captions >>>


    # Validation
    if not transcript_data or not isinstance(transcript_data, list):
        return jsonify({'error': 'Invalid or missing "transcript" (must be array).' }), 400
    if not style: return jsonify({'error': 'Missing "style".'}), 400
    if language.lower() not in ['english', 'cantonese']:
        return jsonify({'error': 'Invalid "language". Use "English" or "Cantonese".'}), 400

    request_id = str(uuid.uuid4())
    print(f"--- Caption Request ID: {request_id}, Style: {style}, Lang: {language}, Num: {num_captions} ---")

    try:
        captions_list = generate_multiple_captions(
            transcript_data, style, language, num_captions, request_id
        )
        # Return the list under the key 'captions'
        return jsonify({'captions': captions_list}) # Returns {"captions": ["cap1", "cap2", ...]}
    except ValueError as ve: return jsonify({'error': f"Data Processing Error: {ve}"}), 400
    except RuntimeError as re: return jsonify({'error': f"Service Error: {re}"}), 500
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return jsonify({'error': f"Unexpected Server Error: {e}"}), 500
    

if __name__ == '__main__':
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 5000))
    print(f"--- Starting Flask server on http://{host}:{port} ---")
    app.run(debug=True, host=host, port=port)