import requests
import logging
import sys
import traceback
import json
import os

class TelegramBotService:
    """
    Comprehensive service class for Telegram Bot API operations.
    Supports all major Telegram Bot API functions including:
    - Send/Edit/Delete messages
    - File operations
    - Chat management
    - Webhook management
    """

    def __init__(self, bot_token: str):
        """
        Initializes the service with bot token.

        Parameters:
            bot_token (str): The Telegram bot token.
        """
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        
        # Setup logging to stdout
        self.logger = logging.getLogger(__name__)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
        self.logger.info(f"Initialized Telegram Bot service")

    def send_message(self, chat_id: str, text: str, parse_mode: str = "", reply_to_message_id: str = "") -> dict:
        """Send a text message to a chat"""
        url = f'{self.base_url}/sendMessage'
        data = {
            'chat_id': chat_id,
            'text': text
        }
        
        if parse_mode:
            data['parse_mode'] = parse_mode
        if reply_to_message_id:
            data['reply_to_message_id'] = int(reply_to_message_id)
        
        return self._make_request(url, data)

    def edit_text_message(self, chat_id: str, message_id: str, text: str, parse_mode: str = "") -> dict:
        """Edit text of an existing message"""
        url = f'{self.base_url}/editMessageText'
        data = {
            'chat_id': chat_id,
            'message_id': int(message_id),
            'text': text
        }
        
        if parse_mode:
            data['parse_mode'] = parse_mode
            
        return self._make_request(url, data)

    def edit_media_message(self, chat_id: str, message_id: str, media_type: str, media_url: str, caption: str = "") -> dict:
        """Edit media in an existing message"""
        url = f'{self.base_url}/editMessageMedia'
        
        media_data = {
            "type": media_type,
            "media": media_url
        }
        
        if caption:
            media_data["caption"] = caption
        
        data = {
            'chat_id': chat_id,
            'message_id': int(message_id),
            'media': media_data
        }
        
        return self._make_request(url, data)

    def edit_message_caption(self, chat_id: str, message_id: str, caption: str, parse_mode: str = "") -> dict:
        """Edit caption of a media message"""
        url = f'{self.base_url}/editMessageCaption'
        data = {
            'chat_id': chat_id,
            'message_id': int(message_id),
            'caption': caption
        }
        
        if parse_mode:
            data['parse_mode'] = parse_mode
            
        return self._make_request(url, data)

    def delete_message(self, chat_id: str, message_id: str) -> dict:
        """Delete a message (must be under 48 hours old)"""
        url = f'{self.base_url}/deleteMessage'
        data = {
            'chat_id': chat_id,
            'message_id': int(message_id)
        }
        
        return self._make_request(url, data)

    def forward_message(self, chat_id: str, from_chat_id: str, message_id: str) -> dict:
        """Forward a message to another chat"""
        url = f'{self.base_url}/forwardMessage'
        data = {
            'chat_id': chat_id,
            'from_chat_id': from_chat_id,
            'message_id': int(message_id)
        }
        
        return self._make_request(url, data)

    def download_file(self, file_id: str, download_path: str = "./downloads/") -> dict:
        """Download a file sent to the bot"""
        try:
            # Get file info
            url = f'{self.base_url}/getFile'
            data = {"file_id": file_id}
            
            response = requests.post(url, json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    file_path = result["result"]["file_path"]
                    file_url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
                    
                    # Download file
                    file_response = requests.get(file_url)
                    
                    if file_response.status_code == 200:
                        # Create directory if it doesn't exist
                        os.makedirs(download_path, exist_ok=True)
                        
                        # Save file
                        filename = os.path.basename(file_path)
                        full_path = os.path.join(download_path, filename)
                        
                        with open(full_path, 'wb') as f:
                            f.write(file_response.content)
                        
                        return {
                            "success": True,
                            "file_path": full_path,
                            "file_size": result["result"]["file_size"],
                            "file_unique_id": result["result"]["file_unique_id"]
                        }
                    else:
                        raise Exception(f"Failed to download file: {file_response.text}")
                else:
                    raise Exception(f"Failed to get file info: {result}")
            else:
                raise Exception(f"Failed to get file: {response.text}")
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def kick_chat_member(self, chat_id: str, user_id: str, until_date: str = "") -> dict:
        """Kick a member from a chat"""
        url = f'{self.base_url}/kickChatMember'
        data = {
            'chat_id': chat_id,
            'user_id': int(user_id)
        }
        
        if until_date:
            data['until_date'] = int(until_date)
            
        return self._make_request(url, data)

    def unpin_message(self, chat_id: str, message_id: str = "") -> dict:
        """Unpin a message in a chat"""
        url = f'{self.base_url}/unpinChatMessage'
        data = {"chat_id": chat_id}
        
        if message_id:
            data["message_id"] = int(message_id)
            
        return self._make_request(url, data)

    def answer_inline_query(self, inline_query_id: str, results: str, cache_time: str = "300") -> dict:
        """Answer an inline query"""
        url = f'{self.base_url}/answerInlineQuery'
        
        # Parse results if it's a string
        if isinstance(results, str):
            try:
                results = json.loads(results)
            except json.JSONDecodeError:
                results = []
        
        data = {
            "inline_query_id": inline_query_id,
            "results": results
        }
        
        if cache_time:
            data["cache_time"] = int(cache_time)
            
        return self._make_request(url, data)

    def make_api_call(self, method: str, parameters: str) -> dict:
        """Make a custom API call to Telegram Bot API"""
        url = f'{self.base_url}/{method}'
        
        # Parse parameters if it's a string
        if isinstance(parameters, str):
            try:
                parameters = json.loads(parameters)
            except json.JSONDecodeError:
                parameters = {}
                
        return self._make_request(url, parameters)

    def list_updates(self, offset: str = "", limit: str = "100", timeout: str = "0") -> dict:
        """Get list of recent updates"""
        url = f'{self.base_url}/getUpdates'
        data = {}
        
        if offset:
            data["offset"] = int(offset)
        if limit:
            data["limit"] = int(limit)
        if timeout:
            data["timeout"] = int(timeout)
            
        return self._make_request(url, data)

    def get_chat_info(self, chat_id: str) -> dict:
        """Get chat information"""
        url = f'{self.base_url}/getChat'
        data = {"chat_id": chat_id}
        
        return self._make_request(url, data)

    def list_administrators(self, chat_id: str) -> dict:
        """Get list of administrators in a chat"""
        url = f'{self.base_url}/getChatAdministrators'
        data = {"chat_id": chat_id}
        
        return self._make_request(url, data)

    def get_member_count(self, chat_id: str) -> dict:
        """Get number of members in a chat"""
        url = f'{self.base_url}/getChatMemberCount'
        data = {"chat_id": chat_id}
        
        return self._make_request(url, data)

    def set_webhook(self, webhook_url: str, update_types: str = "message") -> dict:
        """Set webhook for receiving updates"""
        url = f'{self.base_url}/setWebhook'
        data = {
            "url": webhook_url,
            "allowed_updates": update_types.split(",") if update_types else ["message"]
        }
        
        return self._make_request(url, data)

    def delete_webhook(self) -> dict:
        """Delete webhook to allow polling"""
        url = f'{self.base_url}/deleteWebhook'
        data = {}
        
        return self._make_request(url, data)

    def _make_request(self, url: str, data: dict) -> dict:
        """Make HTTP request to Telegram API"""
        try:
            self.logger.info(f"Making request to: {url}")
            response = requests.post(url, json=data, timeout=10)
            
            self.logger.info(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.logger.info(" Request successful!")
                return {'success': True, 'response': result}
            else:
                self.logger.error(f" Request failed. Status code: {response.status_code}")
                self.logger.error(f"Response text: {response.text}")
                return {'success': False, 'error': response.text}
        except requests.RequestException as e:
            self.logger.error(f" An exception occurred: {str(e)}")
            traceback.print_exc()
            return {'success': False, 'error': str(e)}
        except Exception as e:
            self.logger.error(f" Unexpected error: {str(e)}")
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

# Legacy compatibility class
class SendTelegramMessageService(TelegramBotService):
    """Legacy compatibility wrapper"""
    
    def __init__(self, bot_token: str, chat_id: str, message: str):
        super().__init__(bot_token)
        self.chat_id = chat_id
        self.message = message
        
    def send_message(self) -> dict:
        """Legacy method for sending message"""
        return super().send_message(self.chat_id, self.message)
