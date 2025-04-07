# # backend/app.py

# import os
# import uuid
# from flask import Flask, request, jsonify
# from flask_cors import CORS # Import CORS
# from dotenv import load_dotenv
# from google import genai
# from google.genai import types
# from typing_extensions import TypedDict
# import json
# import re
# import traceback

# # --- Configuration ---
# # Load environment variables from .env file in the same directory
# load_dotenv()
# GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# if not GEMINI_API_KEY:
#     print("Error: Gemini API key not found. Make sure it's set in your .env file.")
#     exit() # Exit if API key is missing

# # --- Flask App Initialization ---
# app = Flask(__name__)
# CORS(app) # Enable CORS for all routes (important for frontend communication)

# # --- Data Models ---
# class Transcript(TypedDict):
#     timestamp: str
#     subtitle: str

# # --- Core Logic ---

# # Generate Transcript Function
# def generate_transcript(youtube_url, request_id):
#     print(f"Starting transcript generation for: {youtube_url} (ID: {request_id})")

#     # Use the globally configured client
#     # Model choice: gemini-1.5-pro-latest supports video input directly
#     # Check Gemini documentation for latest model capabilities.
#     # client = genai.Client(model_name='models/gemini-1.5-pro-latest')
#     client = genai.Client(api_key=GEMINI_API_KEY)
#     prompt = """
#     Analyze the following YouTube video and generate accurate timestamps with corresponding subtitles.
#     Requirements:
#     1. Language: Cantonese or English (prioritize accuracy in spoken language).
#     2. Provide timestamps in the format MM:SS and the spoken text at each timestamp.
#     3. Return the result STRICTLY as a JSON array of objects with 'timestamp' and 'subtitle' fields. Do not include ```json markdown or any other text outside the JSON array.
#     Example: [{"timestamp": "00:05 - 00:10", "subtitle": "Hello there."}, {"timestamp": "00:11 - 00:17", "subtitle": "This is a test."}]
#     """
#     # Constructing the content parts for the API call
#     content = types.Content(
#         parts=[
#             types.Part(text=prompt),
#             # Gemini 1.5 Pro can handle direct video URIs
#             types.Part(file_data=types.FileData(file_uri=youtube_url))
#         ]
#     )

#     try:
#         response = client.models.generate_content(
#             model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
#             contents=content,
#             config=types.GenerateContentConfig(
#                 response_mime_type='application/json',
#                 response_schema=list[Transcript],
#                 temperature=0.0,
#             )
#         )
#         response_text = response.text
#         print(f"Raw transcript response text: {response_text}")

#         # Attempt to parse the JSON response
#         try:
#             # Handle potential markdown code fences (though the prompt asks not to include them)
#             json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
#             if json_match:
#                 json_str = json_match.group(1)
#             else:
#                 json_str = response_text.strip() # Assume clean JSON

#             transcript_data = json.loads(json_str)

#             # Validate the structure of the parsed data
#             if not isinstance(transcript_data, list):
#                  raise ValueError(f"Response is not a list: {transcript_data}")
#             for item in transcript_data:
#                 if not isinstance(item, dict) or 'timestamp' not in item or 'subtitle' not in item:
#                     raise ValueError(f"Invalid transcript item format: {item}")

#             print(f"Transcript successfully generated and parsed for ID: {request_id}.")
#             return transcript_data

#         except json.JSONDecodeError as json_err:
#             print(f"Error decoding JSON response for ID {request_id}: {json_err}")
#             print(f"Problematic response text: {response_text}")
#             raise ValueError(f"Failed to decode JSON response from Gemini: {json_err}")
#         except ValueError as val_err:
#              print(f"Error validating transcript structure for ID {request_id}: {val_err}")
#              raise val_err # Re-raise the validation error

#     except Exception as e:
#         print(f"Error during Gemini API call for transcript (ID: {request_id}): {e}")
#         traceback.print_exc()
#         # Raise a more specific error to be caught by the route handler
#         raise RuntimeError(f"Gemini API call failed: {e}")

# # Generate Styled Caption Function
# def generate_styled_caption(transcript_data, style, language, request_id): # Added 'language' parameter
#     print(f"Starting caption generation (Style: {style}, Lang: {language}) for ID: {request_id}")

#     full_transcript_text = " ".join([item.get('subtitle', '') for item in transcript_data])

#     if not full_transcript_text.strip():
#         print(f"Warning: Empty transcript provided for caption generation (ID: {request_id}).")
#         return "Could not generate caption: Transcript is empty."

#     client = genai.Client(api_key=GEMINI_API_KEY)

#     # --- MODIFIED PROMPT ---
#     # Added instruction for the output language
#     prompt = f"""
#     Given the following video transcript, please generate an engaging Instagram post caption in the **{language}** language.
#     The desired style for the caption is: **{style}**.

#     Guidelines:
#     1. Generate the caption ONLY in **{language}**.
#     2. Keep the caption concise and suitable for Instagram (ideally under 150 words in the target language).
#     3. Capture the main essence or key takeaway from the transcript.
#     4. Incorporate relevant emojis and hashtags (appropriate for the language and content, e.g., #主題 #影片內容 or #YourTopic #VideoContent).
#     5. Ensure the tone matches the requested style ('{style}').
#     6. Do NOT just summarize. Create a compelling caption to encourage engagement.
#     7. Return ONLY the caption text in {language}, without any introductory phrases like "Here is the caption:", explanations, or markdown formatting.

#     Transcript (primarily {language} or English):
#     ---
#     {full_transcript_text}
#     ---

#     Generate the **{style}** Instagram caption in **{language}** now:
#     """
#     # --- END OF MODIFIED PROMPT ---

#     try:
#         response = client.models.generate_content(
#             model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
#             contents=prompt,
#         )

#         caption = response.text.strip()
#         print(f"Caption successfully generated by Gemini API for ID: {request_id}.")
#         return caption
#     except Exception as e:
#         print(f"Error during Gemini API call for caption (ID: {request_id}): {e}")
#         traceback.print_exc()
#         raise RuntimeError(f"Gemini API call for caption failed: {e}")

# # --- Flask Routes ---

# # /generate_transcript route remains unchanged

# # Modified Caption Generation Route
# @app.route('/generate_caption', methods=['POST'])
# def generate_caption_route():
#     data = request.get_json()
#     if not data:
#         return jsonify({'error': 'Missing JSON body.'}), 400

#     transcript_data = data.get('transcript')
#     style = data.get('style')
#     # --- NEW: Get language parameter ---
#     # Default to 'English' if not provided
#     language = data.get('language', 'English')
#     # --- END NEW ---


#     if not transcript_data or not isinstance(transcript_data, list):
#         return jsonify({'error': 'Missing or invalid "transcript" data.'}), 400
#     if not style:
#         return jsonify({'error': 'Missing "style" parameter.'}), 400
#     # --- NEW: Validate language ---
#     if language.lower() not in ['english', 'cantonese']:
#          return jsonify({'error': 'Invalid "language" parameter. Must be "English" or "Cantonese".'}), 400
#     # --- END NEW ---


#     request_id = str(uuid.uuid4())
#     print(f"--- Processing Caption (Style: {style}, Lang: {language}) with Request ID: {request_id} ---") # Added language log

#     try:
#         # --- Pass language to the function ---
#         caption = generate_styled_caption(transcript_data, style, language, request_id)
#         # --- END ---
#         return jsonify({'caption': caption})
#     except RuntimeError as re:
#         print(f"Runtime error in /generate_caption for ID {request_id}: {re}")
#         return jsonify({'error': f"服務器錯誤：無法生成標題。 {re}"}), 500
#     except Exception as e:
#         print(f"Unhandled error in /generate_caption route for ID {request_id}: {e}")
#         traceback.print_exc()
#         return jsonify({'error': f"嚴重錯誤：生成標題時發生意外問題。 {e}"}), 500
    

# # --- Main Execution ---
# if __name__ == '__main__':
#     # Ensure the server is accessible on the network
#     # The React Native app will connect to http://<YOUR_LOCAL_IP>:5000
#     host = '0.0.0.0'
#     port = int(os.environ.get('PORT', 5000))
#     print(f"--- Starting Flask server on http://{host}:{port} ---")
#     print("Make sure your React Native app connects to this address.")
#     app.run(debug=True, host=host, port=port) # debug=True is helpful for development



# backend/app.py

import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from typing_extensions import TypedDict
import json
import re
import traceback

# --- Configuration ---
# Load environment variables from .env file in the same directory
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("Error: Gemini API key not found. Make sure it's set in your .env file.")
    exit() # Exit if API key is missing

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app) # Enable CORS for all routes (important for frontend communication)

# --- Data Models ---
class Transcript(TypedDict):
    timestamp: str
    subtitle: str

# --- Core Logic ---

# Generate Transcript Function
def generate_transcript(youtube_url, request_id):
    print(f"Starting transcript generation for: {youtube_url} (ID: {request_id})")

    # Use the globally configured client
    # Model choice: gemini-1.5-pro-latest supports video input directly
    # Check Gemini documentation for latest model capabilities.
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = """
    Analyze the following YouTube video and generate accurate timestamps with corresponding subtitles.
    Requirements:
    1. Language: Cantonese or English (prioritize accuracy in spoken language).
    2. Provide timestamps in the format MM:SS and the spoken text at each timestamp.
    3. Return the result STRICTLY as a JSON array of objects with 'timestamp' and 'subtitle' fields. Do not include ```json markdown or any other text outside the JSON array.
    Example: [{"timestamp": "00:05", "subtitle": "Hello there."}, {"timestamp": "00:10", "subtitle": "This is a test."}]
    """
    # Constructing the content parts for the API call
    content = types.Content(
        parts=[
            types.Part(text=prompt),
            # Gemini 1.5 Pro can handle direct video URIs
            types.Part(file_data=types.FileData(mime_type="video/mp4", file_uri=youtube_url))
        ]
    )

    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
            contents=content,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=list[Transcript],
                temperature=1.0,
            )
        )
        response_text = response.text
        print(f"Raw transcript response text: {response_text}")

        # Attempt to parse the JSON response
        try:
            # Handle potential markdown code fences (though the prompt asks not to include them)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response_text.strip() # Assume clean JSON

            transcript_data = json.loads(json_str)

            # Validate the structure of the parsed data
            if not isinstance(transcript_data, list):
                 raise ValueError(f"Response is not a list: {transcript_data}")
            for item in transcript_data:
                if not isinstance(item, dict) or 'timestamp' not in item or 'subtitle' not in item:
                    raise ValueError(f"Invalid transcript item format: {item}")

            print(f"Transcript successfully generated and parsed for ID: {request_id}.")
            return transcript_data

        except json.JSONDecodeError as json_err:
            print(f"Error decoding JSON response for ID {request_id}: {json_err}")
            print(f"Problematic response text: {response_text}")
            raise ValueError(f"Failed to decode JSON response from Gemini: {json_err}")
        except ValueError as val_err:
             print(f"Error validating transcript structure for ID {request_id}: {val_err}")
             raise val_err # Re-raise the validation error

    except Exception as e:
        print(f"Error during Gemini API call for transcript (ID: {request_id}): {e}")
        traceback.print_exc()
        # Raise a more specific error to be caught by the route handler
        raise RuntimeError(f"Gemini API call failed: {e}")

# Generate Styled Caption Function
def generate_styled_caption(transcript_data, style, language, request_id):
    print(f"Starting caption generation (Style: {style}) for ID: {request_id}")

    # Combine subtitles into a single text block
    full_transcript_text = " ".join([item.get('subtitle', '') for item in transcript_data])

    if not full_transcript_text.strip():
        print(f"Warning: Empty transcript provided for caption generation (ID: {request_id}).")
        return "Could not generate caption: Transcript is empty."

    # Use a suitable model for text generation (flash is often faster/cheaper)
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
    Given the following video transcript, please generate an engaging Instagram post caption in the **{language}** language.
    The desired style for the caption is: **{style}**.

    Guidelines:
    1. Generate the caption ONLY in **{language}**.
    2. Keep the caption concise and suitable for Instagram (ideally under 150 words in the target language).
    3. Capture the main essence or key takeaway from the transcript.
    4. Incorporate relevant emojis and hashtags (appropriate for the language and content, e.g., #主題 #影片內容 or #YourTopic #VideoContent).
    5. Ensure the tone matches the requested style ('{style}').
    6. Do NOT just summarize. Create a compelling caption to encourage engagement.
    7. Return ONLY the caption text in {language}, without any introductory phrases like "Here is the caption:", explanations, or markdown formatting.

    Transcript (primarily {language} or English):
    ---
    {full_transcript_text}
    ---

    Generate the **{style}** Instagram caption in **{language}** now:
    """

    try:
        response = client.models.generate_content(
            model='models/gemini-2.5-pro-exp-03-25',  # Adjusted to a valid model name
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=list[Transcript],
                temperature=1.0,
            )
        )        # Clean up the response text (remove potential leading/trailing whitespace)
        response_text = response.text.strip()
        
        print(f"Raw caption response text (ID: {request_id}): {response_text}")

        caption = "" # Initialize caption variable

        # --- NEW: Attempt to parse as JSON first ---
        try:
            # Check if it looks like JSON array/object before trying to parse
            if response_text.startswith(('[', '{')) and response_text.endswith((']', '}')):
                data = json.loads(response_text)
                # Assuming the API returns JSON like: [{"subtitle": "Actual caption..."}]
                # Or maybe: {"caption": "Actual caption..."} - Adjust based on observation
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                    # Prioritize a 'caption' key if present, otherwise try 'subtitle'
                    if 'caption' in data[0]:
                        caption = data[0]['caption'].strip()
                        print(f"Extracted caption from JSON list (key 'caption') for ID: {request_id}")
                    elif 'subtitle' in data[0]:
                         caption = data[0]['subtitle'].strip()
                         print(f"Extracted caption from JSON list (key 'subtitle') for ID: {request_id}")

                elif isinstance(data, dict):
                     if 'caption' in data:
                         caption = data['caption'].strip()
                         print(f"Extracted caption from JSON object (key 'caption') for ID: {request_id}")
                     elif 'subtitle' in data: # Less likely for single object?
                         caption = data['subtitle'].strip()
                         print(f"Extracted caption from JSON object (key 'subtitle') for ID: {request_id}")

                # If we extracted something, use it. Otherwise, fall through.
                if not caption:
                     print(f"Warning: Parsed JSON but couldn't find 'caption' or 'subtitle' key (ID: {request_id}). JSON: {data}")
                     # Fallback to using the raw text if extraction failed
                     caption = response_text

            else:
                 # Doesn't look like JSON, treat as plain text
                 caption = response_text
                 print(f"API returned non-JSON text as expected (ID: {request_id}).")

        except json.JSONDecodeError:
            # It wasn't valid JSON, so treat the raw response as the caption
            print(f"API response was not valid JSON, treating as plain text (ID: {request_id}).")
            caption = response_text
        # --- END JSON Parsing Logic ---


        if not caption: # If caption is still empty after all attempts
             print(f"Warning: Caption result is empty after processing (ID: {request_id}). Raw response: {response_text}")
             # You might return an error or a default message here
             return "Error: Could not generate a valid caption."


        print(f"Final caption to return for ID {request_id}: {caption}")
        return caption

    except Exception as e:
        print(f"Error during Gemini API call or processing for caption (ID: {request_id}): {e}")
        traceback.print_exc()
        raise RuntimeError(f"Gemini API call for caption failed: {e}")

# --- Flask Routes ---

@app.route('/generate_transcript', methods=['POST'])
def generate_transcript_route():
    """
    Endpoint to generate transcript from a YouTube URL.
    Expects JSON: {"youtube_link": "..."}
    Returns JSON: {"transcript": [...]} or {"error": "..."}
    """
    data = request.get_json()
    if not data or 'youtube_link' not in data:
         return jsonify({'error': 'Missing "youtube_link" in JSON body.'}), 400

    youtube_link = data['youtube_link']
    if not youtube_link or not youtube_link.startswith('http'):
        return jsonify({'error': 'Invalid or empty YouTube link provided.'}), 400

    print(f"--- Received Link in Route: {youtube_link} ---")
    request_id = str(uuid.uuid4())
    print(f"--- Processing Transcript with Request ID: {request_id} ---")

    try:
        transcript = generate_transcript(youtube_link, request_id)
        return jsonify({'transcript': transcript})
    except ValueError as ve: # Catch specific validation/parsing errors from generate_transcript
        print(f"Value error in /generate_transcript for ID {request_id}: {ve}")
        return jsonify({'error': f"處理字幕時發生錯誤：{ve}"}), 400 # User-friendly error
    except RuntimeError as re: # Catch Gemini API call errors
        print(f"Runtime error in /generate_transcript for ID {request_id}: {re}")
        return jsonify({'error': f"服務器錯誤：無法生成字幕。請稍後再試。"}), 500 # User-friendly error
    except Exception as e: # Catch any other unexpected errors
        print(f"Unhandled error in /generate_transcript route for ID {request_id}: {e}")
        traceback.print_exc()
        return jsonify({'error': f"嚴重錯誤：處理請求時發生意外問題。"}), 500 # Generic server error

@app.route('/generate_caption', methods=['POST'])
def generate_caption_route():
    """
    Endpoint to generate a styled Instagram caption from transcript data.
    Expects JSON: {"transcript": [...], "style": "..."}
    Returns JSON: {"caption": "..."} or {"error": "..."}
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON body.'}), 400

    transcript_data = data.get('transcript')
    style = data.get('style')
    language = data.get('language', 'Cantonese')

    # Validate input
    if not transcript_data or not isinstance(transcript_data, list):
        return jsonify({'error': 'Missing or invalid "transcript" data in JSON body (must be an array).'}), 400
    if not style:
        return jsonify({'error': 'Missing "style" parameter in JSON body.'}), 400
    if language.lower() not in ['english', 'cantonese']:
        return jsonify({'error': 'Invalid "language" parameter. Must be "English" or "Cantonese".'}), 400
    
    request_id = str(uuid.uuid4())
    print(f"--- Processing Caption (Style: {style}) with Request ID: {request_id} ---")

    try:
        caption = generate_styled_caption(transcript_data, style, language, request_id)
        return jsonify({'caption': caption})
    except RuntimeError as re: # Catch Gemini API call errors
        print(f"Runtime error in /generate_caption for ID {request_id}: {re}")
        return jsonify({'error': f"服務器錯誤：無法生成標題。請稍後再試。"}), 500
    except Exception as e: # Catch any other unexpected errors
        print(f"Unhandled error in /generate_caption route for ID {request_id}: {e}")
        traceback.print_exc()
        return jsonify({'error': f"嚴重錯誤：生成標題時發生意外問題。"}), 500

# --- Main Execution ---
if __name__ == '__main__':
    # Ensure the server is accessible on the network
    # The React Native app will connect to http://<YOUR_LOCAL_IP>:5000
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 5000))
    print(f"--- Starting Flask server on http://{host}:{port} ---")
    print("Make sure your React Native app connects to this address.")
    app.run(debug=True, host=host, port=port) # debug=True is helpful for development