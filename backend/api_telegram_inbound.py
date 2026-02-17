from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
import requests
import json
import datetime
import asyncio
import os
from services.telegram_service import TelegramBotService


router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

# Global variable to track polling
polling_active = False
last_update_id = 0

def _parse_service_account_manually(json_string):
   """Manually parse service account JSON when regular JSON parsing fails"""
   try:
       import re
       
       # Extract fields using regex
       fields = {}
       
       patterns = {
           'type': r'"type":\s*"([^"]*)"',
           'project_id': r'"project_id":\s*"([^"]*)"',
           'private_key_id': r'"private_key_id":\s*"([^"]*)"',
           'client_email': r'"client_email":\s*"([^"]*)"',
           'client_id': r'"client_id":\s*"([^"]*)"',
           'auth_uri': r'"auth_uri":\s*"([^"]*)"',
           'token_uri': r'"token_uri":\s*"([^"]*)"',
           'auth_provider_x509_cert_url': r'"auth_provider_x509_cert_url":\s*"([^"]*)"',
           'client_x509_cert_url': r'"client_x509_cert_url":\s*"([^"]*)"',
           'universe_domain': r'"universe_domain":\s*"([^"]*)"'
       }
       
       # Special pattern for private key (may contain newlines)
       private_key_pattern = r'"private_key":\s*"(-----BEGIN PRIVATE KEY-----[^"]*-----END PRIVATE KEY-----)"'
       
       for field, pattern in patterns.items():
           match = re.search(pattern, json_string)
           if match:
               fields[field] = match.group(1)
       
       # Handle private key separately
       private_key_match = re.search(private_key_pattern, json_string, re.DOTALL)
       if private_key_match:
           private_key = private_key_match.group(1)
           # Ensure proper newlines
           private_key = private_key.replace('\\n', '\n')
           fields['private_key'] = private_key
       
       # Check if we got the essential fields
       required_fields = ['type', 'project_id', 'private_key', 'client_email']
       if all(field in fields for field in required_fields):
           return fields
       else:
           missing = [f for f in required_fields if f not in fields]
           logger.error(f"Manual parsing missing required fields: {missing}")
           return None
           
   except Exception as e:
       logger.error(f"Manual parsing failed: {e}")
       return None

# Dynamic credential loading from flow integration
def load_flow_credentials():
   """Load credentials from flow integration file"""
   try:
       import sys
       import os
       sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'lib'))
       
       # Read flow integration file
       flow_file_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'lib', 'flow-integration.ts')
       
       if not os.path.exists(flow_file_path):
           return None, None, None
           
       with open(flow_file_path, 'r', encoding='utf-8') as f:
           content = f.read()
       
       bot_token = None
       spreadsheet_id = None
       service_account_json = None
       
       # Extract bot token
       import re
       token_match = re.search(r'"botToken":"([^"]+)"', content)
       if token_match:
           bot_token = token_match.group(1)
       
       # Extract spreadsheet ID
       sheet_match = re.search(r'"SPREADSHEET_ID":"static:([^"]+)"', content)
       if sheet_match:
           spreadsheet_id = sheet_match.group(1)
       
       # Extract service account JSON using multiple comprehensive strategies
       service_account_json = None
       
       # Strategy 1: Look for the complete service account in the flow data
       service_patterns = [
           # Pattern for static field in inputs
           r'"SERVICE_ACCOUNT_JSON_STRING":"static:([^"]*\{[^}]*\}[^"]*)"',
           # Pattern for const declaration
           r'const serviceAccountJson = `([^`]*\{[^`]*\}[^`]*)`',
           # Pattern without static prefix
           r'"SERVICE_ACCOUNT_JSON_STRING":"([^"]*\{[^}]*\}[^"]*)"',
           # Look for raw JSON structure
           r'(\{[^}]*"type"[^}]*"service_account"[^}]*\})',
       ]
       
       for i, pattern in enumerate(service_patterns, 1):
           match = re.search(pattern, content, re.DOTALL)
           if match:
               raw_json = match.group(1)
               break
       else:
           raw_json = None
       
       if raw_json:
           # Clean up the JSON string step by step
           cleaned_json = raw_json
           
           # Remove static: prefix if present
           if cleaned_json.startswith('static:'):
               cleaned_json = cleaned_json[7:]
           
           # Special handling for private key in JSON from flow integration
           # The private key has \\n that needs to become actual newlines
           try:
               import json
               
               # First, try to parse as-is (might work if properly formatted)
               try:
                   parsed_json = json.loads(cleaned_json)
               except json.JSONDecodeError:
                   
                   # Fix common escape issues specifically for the private key
                   fixed_json = cleaned_json
                   
                   # Handle double-escaped newlines in private key
                   fixed_json = fixed_json.replace('\\\\n', '\\n')
                   
                   # Handle escaped quotes
                   fixed_json = fixed_json.replace('\\"', '"')
                   
                   # Try parsing again
                   try:
                       parsed_json = json.loads(fixed_json)
                   except json.JSONDecodeError as e2:
                       logger.error(f"Still failed after escape fixes: {e2}")
                       
                       # Manual fix for the private key field
                       # Look for the private key pattern and fix it specifically
                       import re
                       
                       # Find the private key and fix its newlines
                       key_pattern = r'"private_key":\s*"([^"]*)"'
                       key_match = re.search(key_pattern, fixed_json)
                       
                       if key_match:
                           original_key = key_match.group(1)
                           # Fix the newlines in the private key
                           fixed_key = original_key.replace('\\n', '\n')
                           # Replace in the JSON
                           fixed_json = fixed_json.replace(original_key, fixed_key)
                           
                           try:
                               parsed_json = json.loads(fixed_json)
                           except json.JSONDecodeError as e3:
                               logger.error(f"Even manual fix failed: {e3}")
                               # Create the JSON dict manually
                               parsed_json = _parse_service_account_manually(fixed_json)
                       else:
                           logger.error("Could not find private_key pattern")
                           parsed_json = None
               
               if parsed_json:
                   # Validate it has required fields for service account
                   required_fields = ['type', 'project_id', 'private_key', 'client_email']
                   missing_fields = [field for field in required_fields if field not in parsed_json]
                   
                   if not missing_fields:
                       # Ensure private key has proper newlines
                       if 'private_key' in parsed_json:
                           # Make sure private key has actual newlines, not escaped ones
                           private_key = parsed_json['private_key']
                           if '\\n' in private_key:
                               parsed_json['private_key'] = private_key.replace('\\n', '\n')
                       
                       service_account_json = json.dumps(parsed_json)
                   else:
                       logger.error(f"Service account JSON missing required fields: {missing_fields}")
               else:
                   logger.error("Failed to parse service account JSON with all methods")
                   
           except Exception as e:
               logger.error(f"Exception during JSON processing: {e}")
               import traceback
               logger.error(f"Traceback: {traceback.format_exc()}")
       
       return bot_token, spreadsheet_id, service_account_json
       
   except Exception as e:
       logger.error(f"Error loading flow credentials: {str(e)}")
       import traceback
       logger.error(f"Traceback: {traceback.format_exc()}")
       return None, None, None

# Load credentials from flow integration
FLOW_BOT_TOKEN, FLOW_SPREADSHEET_ID, FLOW_SERVICE_ACCOUNT_JSON = load_flow_credentials()

# Configuration with workflow-specific values and environment variables as fallback
# No credential names configured, using default env variables
BOT_TOKEN = os.getenv('INBOUND_TELEGRAM_BOT_TOKEN') or os.getenv('TELEGRAM_BOT_TOKEN') or FLOW_BOT_TOKEN or ''

WEBHOOK_ID = 'telegram-inbound-1770014553742'

# Bot configurations: Map bot tokens to their node IDs and webhook IDs
bot_configs = {
    'DEFAULT': {
        'node_id': 'telegram-inbound-1770014553742',
        'webhook_id': 'telegram-inbound-1770014553742',
        'credential_name': 'Gopinath_inbound',
        'env_var': 'INBOUND_TELEGRAM_BOT_TOKEN',
        'use_default_env_var': True,
        'last_update_id': 0
    }
}

# Get bot token for a specific node
def get_bot_token_for_node(node_id: str = None):
   """Get bot token for a specific node, or return default"""
   if not node_id:
       return get_bot_token()
   
   # Find the bot config for this node
   for config_key, config in bot_configs.items():
       if config['node_id'] == node_id:
           if config.get('use_default_env_var'):
               # Use default env var
               token = os.getenv('INBOUND_TELEGRAM_BOT_TOKEN')
           else:
               # Use credential-name-based env var
               token = os.getenv(config['env_var'])
           if token:
               return token
   
   # Fallback to default
   return get_bot_token()

# Get node ID and webhook ID for a bot token
def get_node_info_for_bot_token(bot_token: str):
   """Find which node/webhook ID corresponds to a bot token"""
   for config_key, config in bot_configs.items():
       if config.get('use_default_env_var'):
           # Check default env var
           token = os.getenv('INBOUND_TELEGRAM_BOT_TOKEN')
       else:
           # Check credential-name-based env var
           token = os.getenv(config['env_var'])
       if token and token == bot_token:
           return config['node_id'], config['webhook_id']
   
   # Fallback to default
   return WEBHOOK_ID, WEBHOOK_ID


# Global variables to store credentials from frontend
_runtime_bot_token = None

def get_bot_token():
   """Get bot token from runtime config or environment"""
   return _runtime_bot_token or BOT_TOKEN

async def delete_webhook(bot_token: str = None):
   """Delete any existing webhook to allow polling (async, non-blocking)"""
   try:
       import httpx
       token = bot_token or get_bot_token()
       if not token:
           return {'success': False, 'message': 'No bot token available'}
       
       url = f"https://api.telegram.org/bot{token}/deleteWebhook"
       async with httpx.AsyncClient(timeout=10.0) as client:
           response = await client.post(url)
           
           if response.status_code == 200:
               result = response.json()
               if result.get('ok'):
                   return {'success': True, 'message': 'Webhook deleted', 'response': result}
               else:
                   return {'success': False, 'message': result.get('description', 'Unknown error')}
           else:
               logger.error(f" Failed to delete webhook: {response.status_code} - {response.text}")
               return {'success': False, 'message': f"HTTP {response.status_code}: {response.text}"}
           
   except Exception as e:
       logger.error(f" Error deleting webhook: {str(e)}")
       return {'success': False, 'message': str(e)}

# Note: Template processing is now handled by the frontend workflow engine



# Store last_update_id per bot token (keyed by node_id for uniqueness)
bot_update_ids = {}

async def poll_telegram_updates_for_bot(bot_token: str, node_id: str, webhook_id: str, bot_name: str):
   """Poll Telegram for new updates for a specific bot"""
   import httpx
   
   # Initialize last_update_id for this bot if not exists (use node_id as key for uniqueness)
   if node_id not in bot_update_ids:
       bot_update_ids[node_id] = 0
   
   last_update_id = bot_update_ids[node_id]
   
   while polling_active:
       try:
           # Get updates from Telegram using async httpx (non-blocking)
           url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
           params = {
               'offset': last_update_id + 1,
               'timeout': 10,
               'limit': 100
           }
           
           async with httpx.AsyncClient(timeout=15.0) as client:
               response = await client.get(url, params=params)
               
               if response.status_code == 200:
                   data = response.json()
                   
                   if data.get('ok') and data.get('result'):
                       updates = data['result']
                       
                       for update in updates:
                           update_id = update.get('update_id')
                           message = update.get('message')
                           
                           if message and update_id > last_update_id:
                               # Process the message with the correct webhook_id
                               await process_telegram_message(message, webhook_id)
                               bot_update_ids[node_id] = update_id
                               last_update_id = update_id
                               
               else:
                   logger.error(f"Failed to get updates from bot '{bot_name}': {response.status_code} - {response.text}")
               
       except Exception as e:
           logger.error(f"Error polling Telegram updates for bot '{bot_name}': {str(e)}")
           
       # Wait before next poll
       await asyncio.sleep(2)


# Store active polling tasks to prevent garbage collection
_telegram_polling_tasks = []

async def poll_telegram_updates():
   """Poll Telegram for new updates - starts polling for all configured bots"""
   global _telegram_polling_tasks

   # Clear any existing tasks (if restarting)
   _telegram_polling_tasks.clear()
   
   # Start polling for each configured bot
   for config_key, config in bot_configs.items():
       # Get bot token based on whether it uses default or credential-name-based env var
       if config.get('use_default_env_var'):
           bot_token = os.getenv('INBOUND_TELEGRAM_BOT_TOKEN')
           env_var_name = 'INBOUND_TELEGRAM_BOT_TOKEN'
       else:
           bot_token = os.getenv(config['env_var'])
           env_var_name = config['env_var']
       
       if bot_token:
           node_id = config['node_id']
           webhook_id = config['webhook_id']
           bot_name = config['credential_name'] or node_id
           
           # Delete any existing webhook for this bot (async, non-blocking)
           await delete_webhook(bot_token)
           
           # Start polling task for this bot and store it to prevent garbage collection
           task = asyncio.create_task(poll_telegram_updates_for_bot(bot_token, node_id, webhook_id, bot_name))
           _telegram_polling_tasks.append(task)
   
   # Tasks are started and will run independently in the background
   # Don't await them - they run indefinitely and should not block other async tasks
   # The tasks are stored in _telegram_polling_tasks to prevent garbage collection


async def process_telegram_message(message, webhook_id=None):
   """Process a Telegram message and trigger workflow chain"""
   try:
       message_id = message.get('message_id')
       chat = message.get('chat', {})
       chat_id = chat.get('id')
       text = message.get('text', '')
       from_user = message.get('from', {})
       user_id = from_user.get('id')
       username = from_user.get('username', '')
       first_name = from_user.get('first_name', '')
       last_name = from_user.get('last_name', '')
       
       # Extract reply-to-message data if present
       reply_to_message = message.get('reply_to_message', None)
       reply_to_message_id = str(reply_to_message.get('message_id')) if reply_to_message else ''
       # Handle both text and caption for different message types (text messages use 'text', media messages use 'caption')
       reply_to_message_text = ''
       if reply_to_message:
           reply_to_message_text = reply_to_message.get('text', '') or reply_to_message.get('caption', '') or ''
       reply_to_from_user = reply_to_message.get('from', {}) if reply_to_message else {}
       reply_to_user_id = str(reply_to_from_user.get('id', '')) if reply_to_from_user else ''
       reply_to_username = reply_to_from_user.get('username', '') if reply_to_from_user else ''
       reply_to_first_name = reply_to_from_user.get('first_name', '') if reply_to_from_user else ''
       reply_to_last_name = reply_to_from_user.get('last_name', '') if reply_to_from_user else ''

       # Prepare message data for workflow execution
       message_data = {
           'messageId': str(message_id),
               'messageText': text,
           'chatId': str(chat_id),
           'userId': str(user_id),
               'username': username,
               'firstName': first_name,
               'lastName': last_name,
               'fullName': f"{first_name} {last_name}".strip(),
           'timestamp': datetime.datetime.now().isoformat(),
           'messageDate': datetime.datetime.now().isoformat(),
           'chatType': chat.get('type', 'private'),
           'messageType': 'text',
           'from': from_user,
           'chat': chat,
           'replyToMessage': reply_to_message,  # Full reply object
           'replyToMessageId': reply_to_message_id,
           'replyToMessageText': reply_to_message_text,
           'replyToMessageUserId': reply_to_user_id,
           'replyToMessageUsername': reply_to_username,
           'replyToMessageFirstName': reply_to_first_name,
           'replyToMessageLastName': reply_to_last_name,
           'rawMessage': message
       }
       
       # === TRIGGER FRONTEND WORKFLOW EXECUTION ===
       try:
           # Get frontend URL from environment variable
           # Uses FRONTEND_URL from backend .env file (e.g., http://localhost:3001)
           frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3001")
           
           # Prepare trigger data for frontend workflow execution
           trigger_data = {
               "nodeId": webhook_id or WEBHOOK_ID,
               "nodeType": "telegram-inbound",
               "data": message_data,
               "triggerType": "telegram_inbound"
           }
           
           # Make request to frontend to execute workflow using async httpx (non-blocking)
           import httpx
           async with httpx.AsyncClient(timeout=30.0) as client:
               response = await client.post(
                   f"{frontend_url}/api/telegram-inbound-trigger",
                   json=trigger_data,
                   headers={'Content-Type': 'application/json'}
               )
               
               if response.status_code != 200:
                   logger.error(f"Frontend workflow execution returned status: {response.status_code}")
               
       except httpx.ConnectError as conn_error:
           logger.error(f" Cannot connect to frontend at {frontend_url}: {conn_error}")
           logger.error(" Make sure frontend is running on the correct port")
       except httpx.TimeoutException as timeout_error:
           logger.error(f" Frontend workflow execution timed out: {timeout_error}")
       except Exception as trigger_error:
           logger.error(f" Error triggering frontend workflow: {trigger_error}")
           import traceback
           logger.error(f"Traceback: {traceback.format_exc()}")
           
   except Exception as e:
       logger.error(f" Error processing message: {str(e)}")
       import traceback
       logger.error(f"Traceback: {traceback.format_exc()}")

# Note: Google Sheets integration is now handled through the workflow chain
# The frontend will execute the complete workflow including any Google Sheets nodes

@router.post("/api/webhooks/telegram/{webhook_id}")
async def telegram_webhook_handler(webhook_id: str, request: Request):
   """
   Handle incoming webhook requests from Telegram.
   This endpoint receives messages from Telegram and triggers the flow.
   
   - **webhook_id**: The ID of the webhook (used to identify which flow to trigger)
   """
   try:
       # Parse the incoming JSON payload
       payload = await request.json()
       
       # Extract message data
       message = payload.get('message', {})
       if message:
           # Process message with workflow-specific configuration
           await process_telegram_message(message, webhook_id)
       
       # Always return 200 OK to Telegram to acknowledge receipt
       return JSONResponse(
           status_code=200,
           content={"status": "success", "message": "Webhook received and processed", "webhook_id": webhook_id}
       )
       
   except Exception as e:
       logger.error(f" Error processing Telegram webhook: {str(e)}")
       # Still return 200 to Telegram to prevent retries
       return JSONResponse(
           status_code=200,
           content={"status": "error", "message": f"Error processing webhook: {str(e)}", "webhook_id": webhook_id}
       )

@router.post("/api/start-telegram-polling")
async def start_telegram_polling(background_tasks: BackgroundTasks):
   """Start polling Telegram for new messages"""
   global polling_active
   
   if polling_active:
       return JSONResponse(
           status_code=200,
           content={"message": "Polling is already active"}
       )
   
   polling_active = True
   
   # Start the polling task in the background
   background_tasks.add_task(poll_telegram_updates)
   
   return JSONResponse(
       status_code=200,
       content={
           "success": True,
           "message": "Telegram polling started! Send messages to your bot to see them saved to Google Sheets."
       }
   )

@router.post("/api/stop-telegram-polling")
async def stop_telegram_polling():
   """Stop polling Telegram for new messages"""
   global polling_active
   
   polling_active = False
   
   return JSONResponse(
       status_code=200,
       content={
           "success": True,
           "message": "Telegram polling stopped."
       }
   )

@router.get("/api/telegram-status")
async def get_telegram_status():
   """Get the current status of Telegram polling"""
   return JSONResponse(
       status_code=200,
       content={
           "polling_active": polling_active,
           "last_update_id": last_update_id,
           "bot_token_configured": bool(get_bot_token()),
           "message": "Polling is active" if polling_active else "Polling is inactive"
       }
   )

@router.post("/api/register-telegram-webhook")
async def register_telegram_webhook(request: Request):
   """
   Register a webhook URL with Telegram.
   
   Request body should contain:
   - bot_token: The Telegram bot token
   - webhook_url: The URL to register as webhook
   """
   try:
       data = await request.json()
       bot_token = data.get('bot_token', get_bot_token())
       webhook_url = data.get('webhook_url')
       
       if not bot_token or not webhook_url:
           return JSONResponse(
               status_code=400,
               content={"success": False, "error": "Missing bot_token or webhook_url"}
           )
       
       # Use the TelegramBotService to register the webhook
       telegram_service = TelegramBotService(bot_token)
       result = telegram_service.set_webhook(webhook_url)
       
       if result.get('success'):
           return JSONResponse(
               status_code=200,
               content={
                   "success": True,
                   "message": "Webhook registered successfully",
                   "response": result.get('response')
               }
           )
       else:
           logger.error(f" Failed to register webhook: {result.get('error')}")
           return JSONResponse(
               status_code=400,
               content={
                   "success": False,
                   "error": f"Failed to register webhook: {result.get('error')}"
               }
           )
           
   except Exception as e:
       logger.error(f" Error registering webhook: {str(e)}")
       return JSONResponse(
           status_code=500,
           content={"success": False, "error": f"Error registering webhook: {str(e)}"}
       )

@router.post("/api/test-telegram-connection")
async def test_telegram_connection():
   """Test the connection to Telegram and start polling"""
   try:
       if not get_bot_token():
           return JSONResponse(
               status_code=400,
               content={
                   "success": False,
                   "error": "Bot token not configured. Please configure credentials first."
               }
           )
       
       # Test bot connection
       url = f"https://api.telegram.org/bot{get_bot_token()}/getMe"
       response = requests.get(url, timeout=10)
       
       if response.status_code == 200:
           bot_info = response.json()
           
           # Start polling automatically
           global polling_active
           if not polling_active:
               polling_active = True
               
               # Start polling in background
               import asyncio
               asyncio.create_task(poll_telegram_updates())
           
           return JSONResponse(
               status_code=200,
               content={
                   "success": True,
                   "bot_info": bot_info,
                   "polling_active": polling_active,
                   "configuration": {
                       "bot_token_configured": bool(get_bot_token())
                   },
                   "message": "Bot connection successful and polling started! Send a message to your bot to test."
               }
           )
       else:
           return JSONResponse(
               status_code=400,
               content={
                   "success": False,
                   "error": f"Failed to connect to Telegram: {response.text}"
               }
           )
           
   except Exception as e:
       logger.error(f" Error testing Telegram connection: {str(e)}")
       return JSONResponse(
           status_code=500,
           content={"success": False, "error": f"Error testing connection: {str(e)}"}
       )

@router.post("/api/telegram/configure")
async def configure_telegram_credentials(request: Request):
   """
   Configure Telegram credentials from frontend configuration
   
   Request body should contain:
   - bot_token: Telegram bot token
   """
   global _runtime_bot_token
   
   try:
       config = await request.json()
       
       # Extract credentials from config
       bot_token = config.get('bot_token')
       
       if bot_token:
           _runtime_bot_token = bot_token
       
       # Start polling if bot token is available and not already active
       global polling_active
       if get_bot_token() and not polling_active:
           polling_active = True
           asyncio.create_task(poll_telegram_updates())
       
       return JSONResponse(
           status_code=200,
           content={
               "success": True,
               "message": "Credentials configured successfully",
               "configuration": {
                   "bot_token_configured": bool(get_bot_token()),
                   "polling_active": polling_active
               }
           }
       )
       
   except Exception as e:
       logger.error(f" Error configuring credentials: {str(e)}")
       return JSONResponse(
           status_code=500,
           content={"success": False, "error": f"Error configuring credentials: {str(e)}"}
       )
    
   