from flask import Flask, request, jsonify, send_from_directory
import requests
import time
from tabulate import tabulate
from deep_translator import GoogleTranslator
import langdetect
import google.generativeai as genai
import pytesseract # Added for OCR
from PIL import Image # Added for Image handling
import io # Added for reading image stream
import os
import re
from flask_cors import CORS  # Import CORS for cross-origin support
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import json
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# --- Configuration ---
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create a directory to save uploaded images
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configure Gemini API key from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Hugging Face API Token from environment variables
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# List of fake news detection models to try
# These are more modern or specialized for fake news detection
FAKE_NEWS_MODELS = [
    "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli-ling-wanli",  # Excellent NLI model with fact verification
    "facebook/bart-large-mnli",  # Facebook's fact verification model
    "microsoft/deberta-v2-xlarge-mnli",  # Microsoft's powerful factual entailment model
    "roberta-large-mnli",  # Classic but effective
    "wisesight/roberta-base-fake-news"  # Original model as fallback
]

# Primary model to use first
PRIMARY_MODEL = FAKE_NEWS_MODELS[0]

# List of supported languages for translation
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'vi': 'Vietnamese',
    'kn': 'Kannada'
}

# --- Helper Functions ---

def get_prediction(model_name, input_text):
    """Sends text to Hugging Face model for prediction."""
    try:
        url = f"https://api-inference.huggingface.co/models/{model_name}"
        # Add a timeout to prevent indefinite hangs
        response = requests.post(url, headers=HEADERS, json={"inputs": input_text}, timeout=20)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        result = response.json()
        print(f"\n🔍 Model ({model_name}) response:", result)

        # Different models use different formats, handle them appropriately
        # NLI models label format: "entailment", "contradiction", "neutral"
        # Fake news models label format: "FAKE"/"REAL" or 0/1 etc.
        
        if model_name.endswith("mnli") or "fever" in model_name.lower():
            # For NLI models, we check if the statement is true by checking the "entailment" probability
            # Prepare a simple claim to test against
            if isinstance(result, list) and result:
                if isinstance(result[0], dict) and 'labels' in result[0]:
                    # Get scores for different labels
                    label_scores = {label: score for label, score in zip(result[0]['labels'], result[0]['scores'])}
                    
                    # For NLI models:
                    # - If high "entailment" score → REAL
                    # - If high "contradiction" score → FAKE
                    # - If high "neutral" score → UNSURE
                    
                    # Ensure labels are lowercase for consistency
                    normalized_scores = {k.lower(): v for k, v in label_scores.items()}
                    
                    if 'entailment' in normalized_scores and normalized_scores['entailment'] > 0.5:
                        label = "REAL"
                        score = normalized_scores['entailment'] * 10
                    elif 'contradiction' in normalized_scores and normalized_scores['contradiction'] > 0.5:
                        label = "FAKE"
                        score = normalized_scores['contradiction'] * 10
                    else:
                        label = "UNSURE"
                        score = 5.0
                    
                    # Ensure score is capped at 10.0 and properly rounded
                    score = min(round(score, 1), 10.0)
                    return score, label, result
                    
            # If we can't parse NLI format, return None to trigger fallback
            return None, None, {"error": "Could not parse NLI model response", "details": result}

        # Model sometimes returns a list of lists, handle that
        if isinstance(result, list) and result and isinstance(result[0], list):
            predictions = result[0]
        elif isinstance(result, list):
             predictions = result # Original expected format
        else:
             return None, None, {"error": "Unexpected model response format", "details": result}

        if not predictions:
             return None, None, {"error": "Empty prediction list from model", "details": result}

        # Ensure items in predictions are dictionaries with 'label' and 'score'
        valid_predictions = [p for p in predictions if isinstance(p, dict) and 'label' in p and 'score' in p]
        if not valid_predictions:
            return None, None, {"error": "No valid predictions found in model response", "details": result}

        top_result = max(valid_predictions, key=lambda x: x['score'])
        
        # Cap the confidence score at 9.0 to avoid absolute certainty
        # This will allow Gemini verification for very high confidence results
        score = min(round(top_result['score'] * 10, 1), 9.0) 
        
        label = top_result['label'].upper() # Ensure label is uppercase (FAKE/REAL)
        # Map common variations if needed (e.g., some models use 0/1 or true/false)
        if label == 'LABEL_0' or label == '0': label = 'FAKE'
        if label == 'LABEL_1' or label == '1': label = 'REAL'

        return score, label, predictions
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Hugging Face API Error ({model_name}): {e}")
        return None, None, {"error": f"API request failed: {str(e)}"}
    except Exception as e:
        print(f"⚠️ Error processing prediction ({model_name}): {e}")
        return None, None, {"error": f"Prediction processing error: {str(e)}"}


def get_gemini_response(input_text):
    """Uses Gemini for fallback prediction and explanation."""
    prompt = (
        "You are an unbiased Fact checker and a Fake News detection system. "
        "Analyze the following text objectively. Do not express personal opinions or feelings. "
        "Focus solely on evaluating the factual nature of the statement based on reliable information. \n\n"
        f"User Input: \"{input_text}\"\n\n"
        "1. Classification: Classify the input strictly as 'REAL', 'FAKE', or 'UNSURE'. "
        "2. Confidence Rating: Provide a confidence score for your classification on a scale of 0 to 10 (e.g., Confidence Rating: 8.5). "
        "3. Justification: Provide a concise, neutral justification for your classification, citing potential evidence or lack thereof if possible. Avoid subjective language."
    )
    try:
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        print(f"\n✨ Gemini Raw Response:\n{response_text}") # Log Gemini output

        # Refined Regex for better extraction
        label_match = re.search(r"Classification:\s*\b(REAL|FAKE|UNSURE)\b", response_text, re.IGNORECASE)
        conf_match = re.search(r"Confidence Rating:\s*(\d+(?:\.\d+)?)", response_text, re.IGNORECASE)

        label = label_match.group(1).upper() if label_match else "UNSURE"
        # Default confidence to 5.0 if not found, ensure it's within 0-10
        confidence = min(max(float(conf_match.group(1)), 0.0), 10.0) if conf_match else 5.0

        # Extract Justification more reliably
        justification_match = re.search(r"Justification:(.*)", response_text, re.IGNORECASE | re.DOTALL)
        explanation = justification_match.group(1).strip() if justification_match else response_text # Fallback to full text

        # Combine label, confidence, and explanation for the final output string
        final_explanation = f"Classification: {label}\nConfidence Rating: {confidence}\nJustification: {explanation}"

        return confidence, label, final_explanation # Return the structured explanation
    except Exception as e:
        print(f"⚠️ Gemini API Error: {e}")
        # Extract error details if possible from the exception object
        error_details = str(e)
        # Check for specific Gemini error types if the library provides them
        # Example: if isinstance(e, google.api_core.exceptions.PermissionDenied): ...
        return 5.0, "UNSURE", f"⚠️ Gemini Error: {error_details}"


def get_simple_explanation(input_text, label):
    """Generates a basic explanation for the primary model's classification."""
    # This is very basic, Gemini's explanation is usually much better.
    return f"The primary model classified this input as '{label}' based on patterns learned from its training data."

def translate_text(text, target_lang, source_lang='auto'):
    """Translates text using GoogleTranslator."""
    if not text or not target_lang or source_lang == target_lang:
        return text # No translation needed
    try:
        return GoogleTranslator(source=source_lang, target=target_lang).translate(text)
    except Exception as e:
        print(f"⚠️ Translation Error from {source_lang} to {target_lang}: {e}")
        return f"⚠️ Translation Failed: {text}" # Return original text with error marker


def process_text_for_fakery(input_text, original_input_identifier="N/A"):
    """
    Core logic for checking news text. Handles validation, language,
    prediction, fallback, and translation.
    Returns a tuple: (response_dict, status_code)
    """
    if not input_text:
        return {"error": "Input text is empty after processing (e.g., OCR failed or empty input)."}, 400

    # --- Language Detection ---
    try:
        detected_lang = langdetect.detect(input_text)
        # Force English if the detected language is unclear or unsupported
        if detected_lang not in SUPPORTED_LANGUAGES.keys():
            detected_lang = 'en'
            print(f"⚠️ Detected language '{detected_lang}' not supported, defaulting to English.")
    except langdetect.lang_detect_exception.LangDetectException:
        detected_lang = 'en'
        print("⚠️ Language detection failed, defaulting to English.")

    lower_input = input_text.lower().strip()
    word_count = len(lower_input.split())

    # --- Input Validation Messages (with language awareness) ---
    validation_messages = {
        'en': {
            'too_short': "🛑 Input is too short. Please provide a complete statement or headline (at least 3 words).",
            'question': "🛑 Input appears to be a question. Please provide a factual statement or headline.",
            'subjective': "📋 Input appears subjective or contains personal opinions/attacks. Please provide a factual or neutral statement.",
            'meaningless': "🛑 Input lacks meaningful content. Please provide a complete statement or headline."
        },
        'kn': {
            'too_short': "🛑 ಇನ್‌ಪುಟ್ ತುಂಬಾ ಚಿಕ್ಕದಾಗಿದೆ. ದಯವಿಟ್ಟು ಪೂರ್ಣ ಹೇಳಿಕೆ ಅಥವಾ ಶೀರ್ಷಿಕೆಯನ್ನು ಒದಗಿಸಿ (ಕನಿಷ್ಠ 3 ಪದಗಳು).",
            'question': "🛑 ಇನ್‌ಪುಟ್ ಪ್ರಶ್ನೆಯಂತೆ ಕಾಣುತ್ತದೆ. ದಯವಿಟ್ಟು ವಾಸ್ತವಿಕ ಹೇಳಿಕೆ ಅಥವಾ ಶೀರ್ಷಿಕೆಯನ್ನು ಒದಗಿಸಿ.",
            'subjective': "📋 ಇನ್‌ಪುಟ್ ವಸ್ತುನಿಷ್ಠವಾಗಿ ಕಾಣುತ್ತದೆ ಅಥವಾ ವೈಯಕ್ತಿಕ ಅಭಿಪ್ರಾಯಗಳು/ದಾಳಿಗಳನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ. ದಯವಿಟ್ಟು ವಾಸ್ತವಿಕ ಅಥವಾ ತಟಸ್ಥ ಹೇಳಿಕೆಯನ್ನು ಒದಗಿಸಿ.",
            'meaningless': "🛑 ಇನ್‌ಪುಟ್‌ನಲ್ಲಿ ಅರ್ಥಪೂರ್ಣ ವಿಷಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಪೂರ್ಣ ಹೇಳಿಕೆ ಅಥವಾ ಶೀರ್ಷಿಕೆಯನ್ನು ಒದಗಿಸಿ."
        }
    }
    
    # Get messages for the detected language, fallback to English if not available
    messages = validation_messages.get(detected_lang, validation_messages['en'])

    # --- Enhanced Input Validation ---
    if word_count < 3:
        return {
            "input": original_input_identifier,
            "message": messages['too_short'],
            "label": "INVALID",
            "confidence_score": 0,
            "fallback_triggered": False,
            "used_model": "N/A"
        }, 400

    # Question validation
    question_starters = (
        "what", "why", "how", "when", "where", "who", "whom",
        "is ", "are ", "was ", "were ", "do ", "does ", "did ", "can ", "could ",
        "should ", "would ", "will ", "shall ", "have ", "has ", "had ",
        "am i", "are we", "do they", "did he", "does she", "will it", "could they",
        "can i", "can we", "should i", "should we", "must i", "would they"
    )
    if lower_input.endswith("?") or any(lower_input.startswith(q) for q in question_starters):
        return {
            "input": original_input_identifier,
            "message": messages['question'],
            "label": "INVALID",
            "confidence_score": 0,
            "fallback_triggered": False,
            "used_model": "N/A"
        }, 400

    # Subjective validation
    subjective_keywords = [
        "best", "worst", "amazing", "awesome", "terrible", "beautiful", "ugly", "superior", "inferior",
        "i think", "i believe", "in my opinion", "greatest", "favorite", "strongest", "nicest",
        "most beautiful", "most amazing", "most delicious", "should be", "needs to be",
        "fool", "idiot", "stupid", "dumb", "smart", "genius", "moron", "incompetent",
        "great", "terrible", "horrible", "wonderful", "perfect", "awful"
    ]
    
    if any(phrase in lower_input for phrase in subjective_keywords):
        return {
            "input": original_input_identifier,
            "message": messages['subjective'],
            "label": "INVALID",
            "confidence_score": 0,
            "fallback_triggered": False,
            "used_model": "N/A"
        }, 400

    # Meaningful content validation
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"}
    meaningful_words = [word for word in lower_input.split() if word not in stop_words]
    
    if len(meaningful_words) < 2:
        return {
            "input": original_input_identifier,
            "message": messages['meaningless'],
            "label": "INVALID",
            "confidence_score": 0,
            "fallback_triggered": False,
            "used_model": "N/A"
        }, 400

    # --- Process text in English if needed ---
    original_lang = detected_lang
    text_to_process = input_text
    
    # Only translate if the language is not English and is in our supported languages
    needs_translation = detected_lang != 'en' and detected_lang in SUPPORTED_LANGUAGES.keys()
    
    if needs_translation:
        print(f"🌐 Detected language: {detected_lang}. Translating to English for processing.")
        translated_to_en = translate_text(input_text, 'en', detected_lang)
        if "⚠️ Translation Failed:" in translated_to_en:
            return {
                "input": original_input_identifier,
                "label": "UNSURE",
                "confidence_score": "N/A",
                "fallback_triggered": False,
                "used_model": "N/A",
                "message": f"🌐 Translation failed. Please try again."
            }, 500
        text_to_process = translated_to_en

    # --- Prediction Logic ---
    # Try each model until one works
    score = None
    label = None
    primary_output = None
    used_model = "None"
    
    # Try each model until one works
    for model in FAKE_NEWS_MODELS:
        print(f"Trying model: {model}")
        score, label, primary_output = get_prediction(model, text_to_process)
        if score is not None and label is not None:
            used_model = model
            print(f"✅ Successfully got prediction from {used_model}")
            break
    
    fallback_triggered = False
    explanation = ""

    # --- Always Use Gemini for Verification ---
    # For statements with high confidence or low confidence, we'll use Gemini
    # to verify and potentially adjust the assessment
    gemini_score, gemini_label, gemini_explanation = get_gemini_response(text_to_process)
    
    # If the primary model is very confident (>7.5) but Gemini disagrees with the label
    # OR if the primary model has low confidence (<6)
    # Use Gemini's assessment
    if score is None or score < 6 or (score > 7.5 and gemini_label != label):
        print(f"⚠️ Using Gemini as either primary model failed, had low confidence, or disagreed with Gemini.")
        fallback_triggered = True
        used_model = "Google Gemini"
        
        # Average confidence scores if both models provided them
        if score is not None:
            # If models disagree, reduce confidence
            if gemini_label != label:
                # Lower confidence when models disagree
                final_score = min(gemini_score, score * 0.8)
            else:
                # Average confidence when models agree
                final_score = (gemini_score + score) / 2
        else:
            final_score = gemini_score
            
        # Ensure score is capped at 10.0 and properly rounded
        score = min(round(final_score, 1), 10.0)
        label = gemini_label
        explanation = gemini_explanation
        
        if "⚠️ Gemini Error:" in explanation:
            return {
                "input": original_input_identifier,
                "label": "UNSURE",
                "confidence_score": score,
                "fallback_triggered": True,
                "used_model": "Google Gemini",
                "explanation": "An error occurred while processing your request."
            }, 500
    else:
        explanation = get_simple_explanation(text_to_process, label)
        
        # Even when we're using the primary model's label, we can incorporate
        # Gemini's explanation to provide more context
        if "⚠️ Gemini Error:" not in gemini_explanation:
            explanation += "\n\nAdditional context from our AI: " + gemini_explanation

    # --- Result Translation (if necessary) ---
    if needs_translation:
        print(f"🌐 Translating results back to original language: {original_lang}")
        try:
            final_label = translate_text(label, original_lang, 'en')
            final_explanation = translate_text(explanation, original_lang, 'en')
            
            # Verify translation success
            if "⚠️ Translation Failed:" in final_label or "⚠️ Translation Failed:" in final_explanation:
                # If translation fails, return the English results
                final_label = label
                final_explanation = explanation
        except Exception as e:
            print(f"⚠️ Translation error: {e}")
            final_label = label
            final_explanation = explanation
    else:
        final_label = label
        final_explanation = explanation

    # --- Construct Response ---
    response_data = {
        "input": original_input_identifier,
        "label": final_label,
        "confidence_score": score,
        "fallback_triggered": fallback_triggered,
        "used_model": used_model,
        "explanation": final_explanation,
        "language": original_lang  # Add language information to response
    }
    return response_data, 200


# --- Flask Routes ---

@app.route('/')
def home():
    return "🧠 Fake News Detection API is live! Use /check_news (POST JSON) or /check_news_image (POST form-data)."

@app.route('/check_news', methods=['POST'])
def check_news_route():
    """Endpoint for text-based news checking."""
    if not request.is_json:
         return jsonify({"error": "Request must be JSON"}), 415 # Unsupported Media Type

    data = request.get_json()
    input_text = data.get("text", "").strip()

    if not input_text:
        # Use process_text_for_fakery to handle empty input consistently
        response_data, status_code = process_text_for_fakery("", "")
        return jsonify(response_data), status_code

    # Call the core processing function
    response_data, status_code = process_text_for_fakery(input_text, input_text)
    return jsonify(response_data), status_code

@app.route('/check_news_image', methods=['POST'])
def check_news_image_route():
    """Endpoint for image-based news checking using OCR."""
    file_path = None  # Initialize file_path variable for cleanup later
    
    if 'image' not in request.files:
        return jsonify({"error": "No 'image' file part found in the request."}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No image file selected."}), 400

    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
         return jsonify({"error": f"Invalid image format. Allowed formats: {', '.join(allowed_extensions)}"}), 400

    try:
        # Create directory if it doesn't exist
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
            
        # Use a unique filename to avoid collisions and security issues
        import uuid
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Read image
        img = Image.open(file_path)
        
        # For very large images, resize to improve OCR performance
        max_dimension = 2000
        if img.width > max_dimension or img.height > max_dimension:
            ratio = min(max_dimension / img.width, max_dimension / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
            img.save(file_path)  # Save the resized image

        # Check for Tesseract installation
        if not pytesseract.pytesseract.tesseract_cmd:
            # Set default path for Windows
            if os.name == 'nt':
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            # For Linux/Mac, assume it's in PATH

        # Perform OCR with additional config for better results
        extracted_text = pytesseract.image_to_string(
            img, 
            config='--psm 3 --oem 3'  # Page segmentation mode 3 (fully automatic) and OCR Engine mode 3 (default)
        ).strip()
        
        print(f"\n📄 OCR Extracted Text:\n---\n{extracted_text}\n---")

        # Close the image before deleting
        img.close()

        # Delete the file immediately after processing
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ Deleted temporary file: {file_path}")

        if not extracted_text or len(extracted_text) < 5:  # Require minimum meaningful text
             return jsonify({
                 "input": f"Image: {file.filename}",
                 "message": "🚫 OCR could not detect readable text in the image. Try a clearer image with visible text.",
                 "label": "UNSURE",
                 "confidence_score": 0,
                 "fallback_triggered": False,
                 "used_model": "OCR Preprocessing"
                 }), 400

        # Call the core processing function with extracted text
        # Pass the filename as the original identifier
        response_data, status_code = process_text_for_fakery(extracted_text, f"Image: {file.filename}")
        return jsonify(response_data), status_code

    except pytesseract.TesseractNotFoundError:
         print("ERROR: Tesseract is not installed or not in your PATH.")
         return jsonify({"error": "OCR Error: Tesseract is not installed. Please install Tesseract OCR to process images."}), 500
    except Image.UnidentifiedImageError:
        return jsonify({"error": f"Cannot identify image file: {file.filename}. It might be corrupted or an unsupported format."}), 400
    except Exception as e:
        print(f"⚠️ Error processing image file: {e}")
        return jsonify({"error": f"An unexpected error occurred during image processing: {str(e)}"}), 500
    finally:
        # Cleanup in finally block to ensure file is deleted even if an error occurs
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                print(f"✅ Deleted temporary file in finally block: {file_path}")
        except Exception as cleanup_error:
            print(f"⚠️ Error during file cleanup: {cleanup_error}")

# Define cleanup function
def cleanup_uploads():
    """Clean up any leftover files in the upload folder."""
    try:
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            print(f"✅ Cleaned up {UPLOAD_FOLDER} folder")
    except Exception as e:
        print(f"⚠️ Error cleaning upload folder: {e}")

# Clean up on startup
cleanup_uploads()

# Alternative for newer Flask versions that don't support before_first_request
@app.before_request
def cleanup_before_request():
    """Clean up old files periodically."""
    # Only clean up occasionally to avoid doing it on every request
    import random
    if random.random() < 0.01:  # ~1% chance to clean up on any request
        cleanup_uploads()

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Return 404 for upload requests since we no longer store files."""
    return jsonify({"error": "File not found. Images are not stored after processing."}), 404

# --- Additional API Endpoint for Translation ---
@app.route('/translate_result', methods=['POST'])
def translate_result_endpoint():
    """Endpoint to translate analysis results to a different language."""
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415
        
    data = request.get_json()
    target_language = data.get('target_language')
    content = data.get('content')
    
    if not target_language or not content:
        return jsonify({"error": "Missing target_language or content parameter"}), 400
        
    if target_language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": f"Language {target_language} not supported. Supported languages: {list(SUPPORTED_LANGUAGES.keys())}"}), 400
    
    # If already in target language, return as is
    if target_language == 'en':
        return jsonify({"translated_content": content}), 200
    
    try:
        translated_content = translate_text(content, target_language, 'en')
        return jsonify({"translated_content": translated_content}), 200
    except Exception as e:
        return jsonify({"error": f"Translation error: {str(e)}"}), 500

# MongoDB Integration
client = MongoClient('mongodb://localhost:27017')
db = client['factflow']
users_collection = db['users']
history_collection = db['history']

# Helper for JSON serialization with ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

# User Authentication Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if email already exists
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 400
    
    # Create user
    user = {
        'username': data['username'],
        'email': data['email'],
        'password': generate_password_hash(data['password'])
    }
    
    result = users_collection.insert_one(user)
    
    return jsonify({
        'message': 'User registered successfully',
        'userId': str(result.inserted_id)
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'userId': str(user['_id']),
        'username': user['username'],
        'email': user['email']
    }), 200

# User History Routes
@app.route('/user/save-history', methods=['POST'])
def save_history():
    data = request.json
    
    # Verify user exists
    user = users_collection.find_one({'_id': ObjectId(data['userId'])})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Create history entry
    history_entry = {
        'userId': ObjectId(data['userId']),
        'content': data['content'],
        'type': data['type'],
        'result': data['result'],
        'confidence': data['confidence'],
        'timestamp': data['timestamp']
    }
    
    result = history_collection.insert_one(history_entry)
    
    return jsonify({
        'message': 'History saved successfully',
        'historyId': str(result.inserted_id)
    }), 201

@app.route('/user/history/<user_id>', methods=['GET'])
def get_user_history(user_id):
    # Verify user exists
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get user history
    history = list(history_collection.find({'userId': ObjectId(user_id)}).sort('timestamp', -1))
    
    # Convert ObjectId to string for JSON serialization
    history_serialized = json.loads(JSONEncoder().encode({'history': history}))
    
    return jsonify(history_serialized), 200

# --- Main Execution ---
if __name__ == '__main__':
    # Run Flask app 
    app.run(debug=True, host='0.0.0.0', port=5000) # Listen on all interfaces 