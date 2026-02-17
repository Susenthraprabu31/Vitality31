
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from typing import Dict, Any, Optional
from uuid import uuid4
import uvicorn
import os
import inspect
import time
from contextlib import asynccontextmanager
import requests
import json

# Import models
from models import ResponseModel

# Import database dependencies
from database.db import get_db, engine
from database.models import Base
from sqlalchemy.orm import Session
from sqlalchemy import text
from pathlib import Path

# Import service files

# Register incoming webhooks from workflows
def register_incoming_webhooks():
    """Register all incoming webhooks defined in workflows"""
    try:
        # WhatsApp webhooks are handled directly by FastAPI endpoints
        print("✅ WhatsApp webhook endpoints registered:")
        print("   GET /webhook/whatsapp/whatsapp-trigger-1770013817891")
        print("   POST /webhook/whatsapp/whatsapp-trigger-1770013817891")
    except Exception as e:
        pass  # Continue if registration fails

# RLS setup helper (runs on startup)
def apply_rls_setup():
    """
    Enable RLS and apply dynamic policies for user-generated tables.
    Controlled by ENABLE_RLS_ON_STARTUP (default: true).
    """
    if os.getenv("ENABLE_RLS_ON_STARTUP", "true").lower() not in ("1", "true", "yes"):
        print("RLS setup skipped (ENABLE_RLS_ON_STARTUP=false)")
        return

    rls_path = Path(__file__).parent / "database" / "rls_setup.sql"
    if not rls_path.exists():
        print("RLS setup script not found, skipping")
        return

    try:
        with engine.begin() as conn:
            if conn.dialect.name != "postgresql":
                print("Skipping RLS setup: not PostgreSQL")
                return
            rls_sql = rls_path.read_text()
            conn.execute(text(rls_sql))
            print("✅ RLS policies applied successfully")
    except Exception as e:
        print(f"⚠️ RLS policy setup failed: {e}")

# Define lifespan for application startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
    apply_rls_setup()
    
            # Register incoming webhooks from workflows (only if incoming webhooks exist)
    register_incoming_webhooks()

    
    # Import and include Telegram API router
    try:
        from api_telegram import router as telegram_router
        app.include_router(telegram_router)
    except ImportError as e:
        pass
    
    
    # Import and include Telegram Inbound API router (must be before polling setup)
    try:
        from api_telegram_inbound import router as telegram_inbound_router
        app.include_router(telegram_inbound_router)
    except ImportError:
        pass
    
    # Auto-start Telegram polling
    try:
        from api_telegram_inbound import polling_active, poll_telegram_updates, get_bot_token, delete_webhook
        import asyncio
        
        if get_bot_token() and not polling_active:
            # Delete any existing webhook first (required before polling) - async, non-blocking
            await delete_webhook(get_bot_token())
            
            # Import the global variable properly
            import api_telegram_inbound
            api_telegram_inbound.polling_active = True
            
            # Start polling in background - store task to prevent garbage collection
            polling_task = asyncio.create_task(poll_telegram_updates())
            # Store task in module to prevent garbage collection
            api_telegram_inbound._polling_task = polling_task
            
    except Exception:
        pass
    
    yield
    # Shutdown: Add any cleanup code here if needed
    
    print("Shutting down application")

# Create FastAPI app
app = FastAPI(
    title="Generated API",
    description="API generated from Simplita workflow",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# Import and include CRUD API router
from api_crud import router as crud_router
app.include_router(crud_router)

# Include authentication router if auth pages exist
try:
    from api_auth import router as auth_router
    app.include_router(auth_router)
    print("✅ Authentication API routes loaded")
except ImportError as e:
    print(f"⚠️ Warning: Could not import auth router: {e}")

# Import and include custom API router
from api_custom import router as custom_router
app.include_router(custom_router)


# Include Google Sheets webhook router
try:
    from google_sheets_webhooks import google_sheets_webhook_router
    app.include_router(google_sheets_webhook_router)
    print("✅ Google Sheets webhook endpoints registered")
except ImportError as e:
    print(f"⚠️ Google Sheets webhook router not available: {e}")



# Import and include JavaScript Execution API router
try:
    from api_javascript_execution import router as javascript_router, alias_router as javascript_alias_router
    app.include_router(javascript_router)
    app.include_router(javascript_alias_router)  # Alias for /api/execute-javascript
    print("📜 JavaScript Execution API implementation loaded successfully")
    print("   - Primary endpoint: /api/javascript/execute")
    print("   - Alias endpoint: /api/execute-javascript")
except ImportError as e:
    print(f"WARNING: JavaScript Execution API router not available: {e}")
    print("Note: Node.js must be installed on the system for JavaScript execution")

# Root endpoint
@app.get("/", response_model=ResponseModel)
async def read_root():
    return {
        "success": True,
        "message": "API is running",
        "data": {"version": "1.0.0"}
    }

# Generic incoming webhook endpoint (fallback for other webhook types)
@app.api_route("/webhook/{webhook_id}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
async def receive_webhook(webhook_id: str, request: Request):
    """Receive incoming webhook requests (generic fallback)"""
    try:
        method = request.method
        
        # Check if method is allowed for this webhook (only if webhook_service is available)
        try:
            # Check if webhook_service is available (it's only imported for non-WhatsApp webhooks)
            if 'webhook_service' in globals():
                webhook_config = webhook_service.get_webhook_config(webhook_id)
                if webhook_config:
                    allowed_methods = webhook_config.get("allowedMethods", ["GET", "POST", "PUT", "PATCH", "DELETE"])
                    if method not in allowed_methods:
                        return JSONResponse(
                            content={
                                "status": "error", 
                                "message": f"Method {method} not allowed for webhook {webhook_id}",
                                "allowed_methods": allowed_methods
                            },
                            status_code=405
                        )
            else:
                # webhook_service not available - this is normal for WhatsApp-only setups
                print(f"ℹ️ Webhook service not available for {webhook_id}, allowing all methods")
        except Exception as webhook_check_error:
            # If webhook service check fails, allow all methods (graceful degradation)
            print(f"⚠️ Webhook config check failed: {webhook_check_error}")
            pass
        
        # Get headers and request body
        headers = {k.lower(): v for k, v in request.headers.items()}
        query_params = dict(request.query_params)
        
        # ✅ CRITICAL: For SVIX verification, we need raw body bytes BEFORE parsing JSON
        # Store raw body for signature verification
        raw_body_bytes = None
        try:
            if method not in ["GET", "HEAD", "OPTIONS"]:
                # Read raw body bytes first (before parsing)
                raw_body_bytes = await request.body()
                
                content_type = headers.get("content-type", "")
                if "application/json" in content_type:
                    try:
                        import json
                        request_data = json.loads(raw_body_bytes.decode("utf-8"))
                    except json.JSONDecodeError:
                        request_data = {"body": raw_body_bytes.decode("utf-8", errors="ignore")}
                elif "application/x-www-form-urlencoded" in content_type:
                    form_data = await request.form()
                    request_data = dict(form_data)
                else:
                    request_data = {"body": raw_body_bytes.decode("utf-8", errors="ignore") if raw_body_bytes else ""}
            else:
                request_data = {}
        except Exception as e:
            print(f"Error reading request body: {e}")
            request_data = {}
        
        if 'webhook_service' in globals():
            response_data = await webhook_service.handle_incoming_webhook(
                webhook_id=webhook_id,
                request_data=request_data,
                headers=headers,
                method=method,
                query_params=query_params,
                raw_body_bytes=raw_body_bytes
            )
            return JSONResponse(response_data)
        
        # Basic webhook response
        return JSONResponse({
            "status": "success",
            "message": f"Generic webhook {webhook_id} processed",
            "method": method,
            "data": request_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")
# WhatsApp Webhook for node: whatsapp-trigger-1770013817891
@app.get("/webhook/whatsapp/whatsapp-trigger-1770013817891")
@app.post("/webhook/whatsapp/whatsapp-trigger-1770013817891")
async def whatsapp_webhook_whatsapp_trigger_1770013817891(request: Request):
    """
    WhatsApp webhook endpoint for node: whatsapp-trigger-1770013817891
    
    This endpoint handles webhook verification and message processing
    for the specific WhatsApp trigger node.
    """
    
    if request.method == "GET":
        # Webhook verification for Meta WhatsApp Business API
        mode = request.query_params.get("hub.mode")
        token = request.query_params.get("hub.verify_token")
        challenge = request.query_params.get("hub.challenge")
        
        print(f"🔐 WhatsApp webhook verification for node whatsapp-trigger-1770013817891")
        print(f"   Mode: {mode}")
        print(f"   Token received: {bool(token)}")
        print(f"   Challenge: {challenge}")
        
        if mode and token:
            expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
            
            if mode == "subscribe" and token == expected_token:
                print(f"✅ WhatsApp webhook verification successful for node whatsapp-trigger-1770013817891")
                # Meta WhatsApp API requires the challenge to be returned as plain text, not JSON
                return PlainTextResponse(content=challenge)
            else:
                print(f"❌ WhatsApp webhook verification failed for node whatsapp-trigger-1770013817891: Invalid token")
                raise HTTPException(status_code=403, detail="Forbidden - Invalid verify token")
        
        raise HTTPException(status_code=400, detail="Bad Request - Missing verification parameters")
    
    else:
        # Handle incoming webhook
        try:
            body = await request.json()
            print(f"📱 WhatsApp webhook received for node whatsapp-trigger-1770013817891:")
            print(f"   Body: {body}")
            
            # Extract webhook data
            entries = body.get("entry", [])
            
            for entry in entries:
                changes = entry.get("changes", [])
                
                for change in changes:
                    field = change.get("field")
                    value = change.get("value", {})
                    
                    print(f"   Processing field: {field}")
                    
                    # Process messages
                    if field == "messages" and "messages" in value:
                        
                        for message in value["messages"]:
                            # Apply message type filter
                            message_type = message.get("type", "")
                            
                            
                            # Apply sender filter
                            # Helper function to format phone number with + prefix
                            def format_phone_number(phone):
                                if phone and not phone.startswith('+'):
                                    return f"+{phone}"
                                return phone
                            
                            sender_phone = format_phone_number(message.get("from", ""))
                            
                            
                            # Extract message data for workflow variables
                            sender_phone = format_phone_number(message.get("from"))
                            
                            message_data = {
                                # Complete webhook JSON
                                "whatsappWebhookData": body,
                                
                                # Message variables
                                "whatsappMessageId": message.get("id"),
                                "whatsappMessageFrom": sender_phone,
                                "whatsappMessageType": message.get("type"),
                                "whatsappMessageTimestamp": message.get("timestamp"),
                                
                                # Sender information
                                "whatsappSenderPhone": sender_phone,
                                "whatsappSenderName": value.get("contacts", [{}])[0].get("profile", {}).get("name", ""),
                                
                                # Business account info
                                "whatsappBusinessAccountId": "",
                                "whatsappPhoneNumberId": "",
                                
                                # Contact information
                                "whatsappContactName": value.get("contacts", [{}])[0].get("profile", {}).get("name", ""),
                                "whatsappContactNumber": sender_phone,
                            }
                            
                            # Extract message content based on type
                            message_body = ""
                            media_url = None
                            button_reply = ""
                            list_reply = ""
                            
                            if message_type == "text":
                                message_body = message.get("text", {}).get("body", "")
                            elif message_type == "image":
                                image_data = message.get("image", {})
                                media_url = image_data.get("id")  # Use media ID for retrieval
                                message_body = image_data.get("caption", "")
                            elif message_type == "video":
                                video_data = message.get("video", {})
                                media_url = video_data.get("id")
                                message_body = video_data.get("caption", "")
                            elif message_type == "audio":
                                audio_data = message.get("audio", {})
                                media_url = audio_data.get("id")
                            elif message_type == "document":
                                document_data = message.get("document", {})
                                media_url = document_data.get("id")
                                message_body = document_data.get("filename", "")
                            elif message_type == "interactive":
                                interactive_data = message.get("interactive", {})
                                if interactive_data.get("type") == "button_reply":
                                    button_reply = interactive_data.get("button_reply", {}).get("title", "")
                                    message_body = button_reply
                                elif interactive_data.get("type") == "list_reply":
                                    list_reply = interactive_data.get("list_reply", {}).get("title", "")
                                    message_body = list_reply
                            
                            # Add extracted content to message data
                            message_data.update({
                                "whatsappMessageBody": message_body,
                                "whatsappMediaUrl": media_url,
                                "whatsappButtonReply": button_reply,
                                "whatsappListReply": list_reply,
                            })
                            
                            print(f"📥 WhatsApp message processed for node whatsapp-trigger-1770013817891: {message_data}")
                            
                            # Trigger frontend workflow execution with WhatsApp data
                            try:
                                # Frontend flow trigger endpoint
                                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3001")
                                frontend_trigger_url = f"{frontend_url}/api/webhook-trigger"
                                
                                # Prepare trigger payload for frontend
                                frontend_payload = {
                                    "nodeId": "whatsapp-trigger-1770013817891",
                                    "nodeType": "whatsapp-trigger",
                                    "data": message_data,
                                    "triggerType": "whatsapp_webhook"
                                }
                                
                                print(f"🚀 Triggering frontend flow execution via {frontend_trigger_url}")
                                print(f"📋 Payload keys: {list(frontend_payload.keys())}")
                                
                                # Make request to frontend to trigger flow
                                response = requests.post(
                                    frontend_trigger_url,
                                    json=frontend_payload,
                                    headers={'Content-Type': 'application/json'},
                                    timeout=5
                                )
                                
                                if response.status_code == 200:
                                    result = response.json()
                                    print(f"✅ Frontend flow triggered successfully: {result.get('message', 'Success')}")
                                    print(f"📊 Available variables: {result.get('availableVariables', [])}")
                                else:
                                    print(f"⚠️ Frontend flow trigger failed: {response.status_code} - {response.text}")
                                    
                            except Exception as frontend_error:
                                print(f"❌ Error triggering frontend flow: {frontend_error}")
                                print("⚠️ Continuing webhook processing despite trigger failure")
                        
                    
                    # Process message status updates
                    elif field == "messages" and "statuses" in value:
                        
                        print(f"📊 Message status field not subscribed for node whatsapp-trigger-1770013817891")
                        
            
            # Store last message data for UI display (in a real app, use database)
            global last_whatsapp_messages
            if 'last_whatsapp_messages' not in globals():
                last_whatsapp_messages = {}
            
            # Store the most recent message for this node
            if 'message_data' in locals():
                last_whatsapp_messages["whatsapp-trigger-1770013817891"] = {
                    "timestamp": message_data.get("whatsappMessageTimestamp"),
                    "from": message_data.get("whatsappMessageFrom"),
                    "body": message_data.get("whatsappMessageBody", ""),
                    "type": message_data.get("whatsappMessageType", ""),
                    "sender_name": message_data.get("whatsappSenderName", ""),
                    "received_at": int(time.time())
                }
                print(f"📱 Stored last message for UI: {last_whatsapp_messages['whatsapp-trigger-1770013817891']}")
            
            return {"status": "processed", "node_id": "whatsapp-trigger-1770013817891", "message_count": len(last_whatsapp_messages.get("whatsapp-trigger-1770013817891", {}))}
            
        except Exception as e:
            print(f"❌ Error processing WhatsApp webhook for node whatsapp-trigger-1770013817891: {e}")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# API endpoint to get last message for WhatsApp trigger nodes
@app.get("/api/whatsapp/last-message/{node_id}")
async def get_last_whatsapp_message(node_id: str):
    """Get the last received WhatsApp message for a specific trigger node"""
    try:
        global last_whatsapp_messages
        if 'last_whatsapp_messages' not in globals():
            last_whatsapp_messages = {}
        
        last_message = last_whatsapp_messages.get(node_id)
        
        if last_message:
            return {
                "success": True,
                "nodeId": node_id,
                "lastMessage": last_message,
                "hasMessage": True
            }
        else:
            return {
                "success": True,
                "nodeId": node_id,
                "lastMessage": None,
                "hasMessage": False
            }
            
    except Exception as e:
        print(f"❌ Error getting last message for node {node_id}: {e}")
        return {
            "success": False,
            "error": str(e),
            "nodeId": node_id,
            "hasMessage": False
        }

    # Root endpoint
    @app.get("/", response_model=ResponseModel)
    async def read_root():
        return {
            "success": True,
            "message": "API is running",
            "data": {"version": "1.0.0"}
        }
    
    # API Status endpoint
    @app.get("/api/status", response_model=ResponseModel)
    async def api_status():
        """
        API status endpoint
        """
        return {
            "success": True,
            "message": "API is operational",
            "data": {"version": "1.0.0"}
        }
    
# Run the app
if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    # Use 127.0.0.1 for better localhost compatibility
    uvicorn.run("main:app", host="localhost", port=port, reload=True)
@app.get("/api/status", response_model=ResponseModel)
async def api_status():
    """
    API status endpoint
    """
    return {
        "success": True,
        "message": "API is operational",
        "data": {"version": "1.0.0"}
    }