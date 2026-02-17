# === TELEGRAM MESSAGE SENDING API ===
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import logging
import requests
import datetime
import base64
import re

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

DATA_URL_PATTERN = re.compile(r'^data:(?P<mime>[\w/\-+.]+);base64,(?P<data>.+)$')

def normalize_media_type(value: Optional[str]) -> str:
    if not value:
        return ''
    value = value.lower()
    if value in ['photo', 'image', 'picture', 'img']:
        return 'photo'
    if value in ['video', 'clip']:
        return 'video'
    if value in ['document', 'file', 'doc', 'pdf']:
        return 'document'
    return value

def infer_media_type_from_mime(mime_type: str) -> str:
    if not mime_type:
        return 'document'
    if mime_type.startswith('image/'):
        return 'photo'
    if mime_type.startswith('video/'):
        return 'video'
    return 'document'

def guess_extension(mime_type: str, media_type: str) -> str:
    extension_map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'application/pdf': 'pdf'
    }
    if mime_type in extension_map:
        return extension_map[mime_type]
    if media_type == 'photo':
        return 'jpg'
    if media_type == 'video':
        return 'mp4'
    return 'bin'

def detect_mime_from_bytes(file_bytes: bytes) -> str:
    if not file_bytes:
        return 'application/octet-stream'
    if file_bytes.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if file_bytes.startswith(b'GIF8'):
        return 'image/gif'
    if len(file_bytes) > 12 and file_bytes[4:8] == b'ftyp':
        return 'video/mp4'
    if file_bytes.startswith(b'%PDF'):
        return 'application/pdf'
    return 'application/octet-stream'

def decode_media_input(media_url: Optional[str]):
    if not media_url or not isinstance(media_url, str):
        return None
    candidate = media_url.strip()
    data_url_match = DATA_URL_PATTERN.match(candidate)
    if data_url_match:
        mime_type = data_url_match.group('mime')
        data_part = data_url_match.group('data')
        try:
            decoded = base64.b64decode(data_part, validate=True)
            return decoded, mime_type
        except Exception:
            return None
    if candidate.startswith('base64,'):
        candidate = candidate.split(',', 1)[1]
    if len(candidate) > 100 and re.fullmatch(r'[A-Za-z0-9+/=\s]+', candidate):
        try:
            decoded = base64.b64decode(candidate, validate=True)
            mime_type = detect_mime_from_bytes(decoded)
            return decoded, mime_type
        except Exception:
            return None
    return None

class TelegramRequest(BaseModel):
    """Request model for Telegram operations"""
    model_config = ConfigDict(populate_by_name=True)
    bot_token: str = Field(..., description="Telegram bot token")
    chat_id: str = Field(..., description="Chat ID to send message to")
    message: Optional[str] = Field(default=None, description="Message to send")
    parse_mode: Optional[str] = Field(default="HTML", description="Parse mode: HTML, Markdown, or None")
    media_type: Optional[str] = Field(default=None, alias="mediaType", description="Media type: photo, video, document")
    media_url: Optional[str] = Field(default=None, alias="mediaUrl", description="Media URL or Telegram file ID")
    caption: Optional[str] = Field(default=None, description="Media caption")

class TelegramResponse(BaseModel):
    """Response model for Telegram operations"""
    success: bool
    message_id: Optional[int] = None
    error: Optional[str] = None
    timestamp: str

@router.post("/api/telegram", response_model=TelegramResponse)
async def send_telegram_message(request: TelegramRequest):
    """
    Send a message via Telegram Bot API
    
    - **bot_token**: Telegram bot token
    - **chat_id**: Chat ID to send the message to
    - **message**: The message to send
    """
    try:
        logger.info(f"Sending Telegram message to chat_id: {request.chat_id}")
        logger.info(f"Message length: {len(request.message) if request.message else 0}")
        logger.info(f"Bot token preview: {request.bot_token[:10]}..." if len(request.bot_token) > 10 else "Invalid token")

        decoded_media = decode_media_input(request.media_url)
        file_bytes = None
        detected_mime = None
        media_type = normalize_media_type(request.media_type)

        if decoded_media:
            file_bytes, detected_mime = decoded_media
            if not media_type:
                media_type = infer_media_type_from_mime(detected_mime)

        if file_bytes and not media_type:
            media_type = 'document'

        has_media = bool(media_type and (request.media_url or file_bytes))

        if not has_media and not request.message:
            raise HTTPException(status_code=400, detail="Message or media is required")

        response = None

        if has_media:
            endpoint_map = {
                'photo': ('sendPhoto', 'photo'),
                'image': ('sendPhoto', 'photo'),
                'picture': ('sendPhoto', 'photo'),
                'img': ('sendPhoto', 'photo'),
                'video': ('sendVideo', 'video'),
                'clip': ('sendVideo', 'video'),
                'document': ('sendDocument', 'document'),
                'file': ('sendDocument', 'document'),
                'doc': ('sendDocument', 'document'),
                'pdf': ('sendDocument', 'document')
            }

            endpoint, field_name = endpoint_map.get(media_type, ('sendDocument', 'document'))
            url = f"https://api.telegram.org/bot{request.bot_token}/{endpoint}"
            payload = {
                'chat_id': request.chat_id
            }

            caption = request.caption or request.message
            if caption:
                payload['caption'] = caption
            if request.parse_mode and request.parse_mode.upper() != 'NONE':
                payload['parse_mode'] = request.parse_mode

            if file_bytes:
                filename = f"upload.{guess_extension(detected_mime, media_type)}"
                files = {
                    field_name: (filename, file_bytes)
                }
                logger.info(f"Making request to Telegram API: {url} (multipart upload)")
                response = requests.post(url, data=payload, files=files, timeout=60)
            else:
                payload[field_name] = request.media_url if endpoint != 'sendMessage' else request.message or ''
                logger.info(f"Making request to Telegram API: {url}")
                response = requests.post(url, json=payload, timeout=30)
        else:
            url = f"https://api.telegram.org/bot{request.bot_token}/sendMessage"
            payload = {
                'chat_id': request.chat_id,
                'text': request.message or ''
            }
            if request.parse_mode and request.parse_mode.upper() != 'NONE':
                payload['parse_mode'] = request.parse_mode
            logger.info(f"Making request to Telegram API: {url}")
            response = requests.post(url, json=payload, timeout=30)
        
        if response is None:
            raise HTTPException(status_code=500, detail="Failed to prepare Telegram request")
        
        logger.info(f"Telegram API response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            logger.info("✅ Telegram message sent successfully")
            
            # Extract message ID from response
            message_id = response_data.get('result', {}).get('message_id')
            
            return TelegramResponse(
                success=True,
                message_id=message_id,
                timestamp=f"{__import__('datetime').datetime.now().isoformat()}Z"
            )
        else:
            error_text = response.text
            logger.error(f"❌ Failed to send Telegram message. Status: {response.status_code}, Response: {error_text}")
            
            # Try to parse error response
            try:
                error_data = response.json()
                error_description = error_data.get('description', error_text)
            except:
                error_description = error_text
            
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Telegram API error: {error_description}"
            )
            
    except requests.RequestException as e:
        logger.error(f"❌ Network error sending Telegram message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Network error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error sending Telegram message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

