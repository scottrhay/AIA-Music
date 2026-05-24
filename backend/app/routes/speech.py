from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required
import requests
import os

bp = Blueprint('speech', __name__)


@bp.route('/synthesize', methods=['POST'])
@jwt_required()
def synthesize_speech():
    """Synthesize speech from text using Azure Speech API."""
    data = request.get_json()

    text = data.get('text', '').strip()
    voice_name = data.get('voice_name', 'en-US-AndrewMultilingualNeural')

    if not text:
        return jsonify({'error': 'Text is required'}), 400

    # Limit text length
    if len(text) > 10000:
        return jsonify({'error': 'Text exceeds maximum length of 10000 characters'}), 400

    azure_speech_key = os.getenv('AZURE_SPEECH_KEY')
    azure_speech_region = os.getenv('AZURE_SPEECH_REGION', 'eastus2')

    if not azure_speech_key:
        return jsonify({'error': 'Azure Speech API key is not configured'}), 500

    # Azure TTS endpoint
    tts_endpoint = f'https://{azure_speech_region}.tts.speech.microsoft.com/cognitiveservices/v1'

    # Build SSML
    ssml = f'''<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
        <voice name='{voice_name}'>
            {text}
        </voice>
    </speak>'''

    headers = {
        'Ocp-Apim-Subscription-Key': azure_speech_key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
    }

    try:
        response = requests.post(tts_endpoint, data=ssml.encode('utf-8'), headers=headers, timeout=30)

        if response.status_code == 401:
            return jsonify({'error': 'Azure Speech API authentication failed'}), 500
        elif response.status_code == 403:
            return jsonify({'error': 'Azure Speech API access denied'}), 500
        elif response.status_code == 429:
            return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
        elif response.status_code >= 500:
            return jsonify({'error': 'Azure Speech API is unavailable'}), 503

        response.raise_for_status()

        # Return audio as binary response
        return Response(
            response.content,
            mimetype='audio/mpeg',
            headers={
                'Content-Disposition': 'attachment; filename="speech.mp3"'
            }
        )

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out'}), 504
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Speech synthesis error: {str(e)}")
        return jsonify({'error': 'Failed to synthesize speech'}), 500


@bp.route('/voices', methods=['GET'])
@jwt_required()
def get_voices():
    """Get available Azure Speech voices."""
    # Return predefined list of voices
    voices = [
        {'id': 'en-US-AndrewMultilingualNeural', 'name': 'Andrew Dragon HD Latest', 'gender': 'Male'},
        {'id': 'en-US-AvaMultilingualNeural', 'name': 'Ava Multilingual', 'gender': 'Female'},
        {'id': 'en-US-AndrewMultilingualNeural', 'name': 'Andrew Multilingual', 'gender': 'Male'},
        {'id': 'en-US-PhoebeMultilingualNeural', 'name': 'Phoebe Multilingual', 'gender': 'Female'},
        {'id': 'en-US-ChristopherMultilingualNeural', 'name': 'Christopher Multilingual', 'gender': 'Male'},
        {'id': 'en-US-BrandonMultilingualNeural', 'name': 'Brandon Multilingual', 'gender': 'Male'},
        {'id': 'en-US-DustinMultilingualNeural', 'name': 'Dustin Multilingual', 'gender': 'Male'},
        {'id': 'en-US-SteffanMultilingualNeural', 'name': 'Steffan Multilingual', 'gender': 'Male'},
    ]

    return jsonify({'voices': voices}), 200
