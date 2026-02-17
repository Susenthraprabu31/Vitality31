
# ===== Google Sheets Webhook Handlers =====

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Dict, Any, Optional
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)
google_sheets_webhook_router = APIRouter(prefix="/api/webhooks/google-sheets", tags=["Google Sheets Webhooks"])

# In-memory storage for webhook data (for reliability and replay capability)
webhook_data_store: Dict[str, Dict[str, Any]] = {}


@google_sheets_webhook_router.post("/google-sheets-trigger-1770831498824")
async def handle_google_sheets_webhook_google_sheets_trigger_1770831498824(
    request: Request,
    x_google_sheets_signature: Optional[str] = Header(None)
):
    """
    Handle Google Sheets webhook for workflow: Form submission Flow
    
    Workflow ID: 5e4a3799-4263-4485-bae2-4a5cd25642ee
    Node ID: google-sheets-trigger-1770831498824
    Spreadsheet: 1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg
    Sheet: Form Responses 1
    Event Type: *
    """
    try:
        # Parse webhook payload
        payload = await request.json()
        
        logger.info(f"📊 Google Sheets webhook received for node google-sheets-trigger-1770831498824")
        logger.debug(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Extract event data from Google Apps Script webhook payload
        # Apps Script sends: { event, spreadsheetId, sheetName, rowData, oldRowData, rowIndex, columnIndex, newValue, oldValue, timestamp }
        event_data = {
            "trigger": "google-sheets-webhook",
            "triggerType": "google-sheets-webhook",
            "source": "google-sheets-webhook",
            "event": payload.get("event", "*"),
            "spreadsheetId": payload.get("spreadsheetId", "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg"),
            "sheetName": payload.get("sheetName", "Form Responses 1"),
            "rowData": payload.get("rowData", []),
            "oldRowData": payload.get("oldRowData", []),
            "rowIndex": payload.get("rowIndex"),
            "columnIndex": payload.get("columnIndex"),
            "newValue": payload.get("newValue"),
            "oldValue": payload.get("oldValue"),
            "timestamp": payload.get("timestamp") or datetime.now().isoformat(),
            "nodeId": "google-sheets-trigger-1770831498824",
            "workflowId": "5e4a3799-4263-4485-bae2-4a5cd25642ee",
            "outputVariable": "sheetTriggerResult"
        }
        
        # Store webhook data for backup and replay capability
        webhook_data_store["google-sheets-trigger-1770831498824"] = {
            "data": event_data,
            "timestamp": datetime.now().isoformat(),
            "consumed": False
        }
        
        logger.info(f"✅ Google Sheets webhook processed and stored successfully")
        logger.debug(f"Event data: {json.dumps(event_data, indent=2)}")
        
        # === TRIGGER FRONTEND WORKFLOW EXECUTION ===
        # Call frontend to execute the complete workflow
        import requests
        import os
        
        try:
            logger.info(f"🚀 Triggering frontend workflow execution for Google Sheets node google-sheets-trigger-1770831498824")
            
            # Get frontend URL from environment
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3001")
            
            # Prepare trigger data for frontend workflow execution
            trigger_data = {
                "nodeId": "google-sheets-trigger-1770831498824",
                "nodeType": "google-sheets-trigger",
                "data": event_data,
                "triggerType": "google_sheets_webhook"
            }
            
            logger.info(f"📋 Calling Google Sheets webhook trigger: {frontend_url}/api/google-sheets-webhook-trigger")
            logger.info(f"📊 Payload keys: {list(trigger_data.keys())}")
            
            # Make request to frontend Google Sheets webhook trigger to execute workflow
            response = requests.post(
                f"{frontend_url}/api/google-sheets-webhook-trigger",
                json=trigger_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Frontend workflow executed successfully!")
                logger.info(f"📊 Result: {result.get('message', 'Success')}")
                if 'availableVariables' in result:
                    logger.info(f"📋 Available variables: {result['availableVariables']}")
            else:
                logger.warning(f"⚠️ Frontend workflow execution failed: {response.status_code}")
                logger.warning(f"📄 Response: {response.text[:500]}...")  # Limit output
                
        except requests.exceptions.ConnectionError as conn_error:
            logger.error(f"❌ Cannot connect to frontend at {frontend_url}: {conn_error}")
            logger.info("💡 Make sure frontend is running on the correct port")
        except requests.exceptions.Timeout as timeout_error:
            logger.error(f"⏰ Frontend workflow execution timed out: {timeout_error}")
        except Exception as trigger_error:
            logger.error(f"❌ Error triggering frontend workflow: {trigger_error}")
            logger.info("⚠️ Continuing with basic webhook processing")
        
        # Webhook response
        webhook_response = {
            "status": "success",
            "message": "Webhook received and processed",
            "nodeId": "google-sheets-trigger-1770831498824",
            "workflowId": "5e4a3799-4263-4485-bae2-4a5cd25642ee",
            "spreadsheetId": "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg",
            "sheetName": "Form Responses 1",
            "event": event_data.get("event"),
            "stored": True
        }
        
        logger.info(f"📤 Webhook response: {webhook_response}")
        
        return webhook_response
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in Google Sheets webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"❌ Error processing Google Sheets webhook: {e}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))

@google_sheets_webhook_router.get("/google-sheets-trigger-1770831498824/poll")
async def poll_google_sheets_webhook_google_sheets_trigger_1770831498824():
    """
    Check for webhook data for node google-sheets-trigger-1770831498824
    Used by frontend to verify webhook delivery
    """
    node_data = webhook_data_store.get("google-sheets-trigger-1770831498824")
    
    if node_data and not node_data.get("consumed", False):
        logger.info(f"📬 Webhook data available for node google-sheets-trigger-1770831498824")
        return {
            "success": True,
            "hasData": True,
            "data": node_data["data"],
            "timestamp": node_data["timestamp"]
        }
    else:
        return {
            "success": True,
            "hasData": False,
            "message": "No new webhook data available"
        }

@google_sheets_webhook_router.post("/google-sheets-trigger-1770831498824/consume")
async def consume_google_sheets_webhook_google_sheets_trigger_1770831498824():
    """
    Mark webhook data as consumed for node google-sheets-trigger-1770831498824
    """
    if "google-sheets-trigger-1770831498824" in webhook_data_store:
        webhook_data_store["google-sheets-trigger-1770831498824"]["consumed"] = True
        logger.info(f"✅ Webhook data marked as consumed for node google-sheets-trigger-1770831498824")
        return {"success": True, "message": "Data consumed"}
    else:
        return {"success": False, "message": "No data to consume"}


# ===== Google Sheets Apps Script Template Generator =====

def generate_google_sheets_apps_script(node_id: str, spreadsheet_id: str, sheet_name: str, backend_url: str) -> str:
    """
    Generate Google Apps Script code for the user to deploy in their Google Sheet
    """
    return f"""
// ===== Google Sheets Trigger - Auto-generated =====
// Node ID: {node_id}
// Sheet: {sheet_name}
// Backend URL: {backend_url}

function onEdit(e) {{
  var sheet = e.source.getActiveSheet();
  
  // Only trigger for the specified sheet
  if (sheet.getName() !== "{sheet_name}") {{
    return;
  }}
  
  var range = e.range;
  var row = range.getRow();
  var col = range.getColumn();
  var numRows = sheet.getLastRow();
  var numCols = sheet.getLastColumn();
  
  // Get entire row data
  var rowData = [];
  if (numCols > 0) {{
    rowData = sheet.getRange(row, 1, 1, numCols).getValues()[0];
  }}
  
  // Get old value (if available)
  var oldValue = e.oldValue || null;
  var newValue = e.value || null;
  
  // Prepare webhook payload
  var payload = {{
    event: "UPDATE",
    spreadsheetId: e.source.getId(),
    sheetName: sheet.getName(),
    rowIndex: row,
    columnIndex: col,
    rowData: rowData,
    newValue: newValue,
    oldValue: oldValue,
    timestamp: new Date().toISOString()
  }};
  
  // Send to backend webhook
  var webhookUrl = "{backend_url}/api/webhooks/google-sheets/{node_id}";
  
  try {{
    var options = {{
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }};
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    var responseCode = response.getResponseCode();
    
    if (responseCode === 200) {{
      Logger.log("✅ Webhook sent successfully");
    }} else {{
      Logger.log("⚠️ Webhook failed with status: " + responseCode);
      Logger.log("Response: " + response.getContentText());
    }}
  }} catch (error) {{
    Logger.log("❌ Error sending webhook: " + error);
  }}
}}

// Optional: Handle new rows (INSERT)
function onOpen(e) {{
  // Can be used to detect new rows if needed
  Logger.log("Spreadsheet opened");
}}

// Optional: Handle row deletion (DELETE)
function onRowDelete() {{
  // Custom function to handle row deletions
  // Note: Google Sheets doesn't have a built-in onDelete trigger
}}
"""

@google_sheets_webhook_router.get("/apps-script-template/{node_id}")
async def get_apps_script_template(node_id: str):
    """
    Get the Google Apps Script template for a specific node
    """
    # This would typically look up the node configuration from the database
    # For now, return a generic template
    backend_url = "https://your-backend-url.com"  # Replace with actual backend URL
    spreadsheet_id = "your-spreadsheet-id"
    sheet_name = "Sheet1"
    
    script = generate_google_sheets_apps_script(node_id, spreadsheet_id, sheet_name, backend_url)
    
    return {
        "success": True,
        "nodeId": node_id,
        "script": script,
        "instructions": [
            "1. Open your Google Sheet",
            "2. Go to Extensions → Apps Script",
            "3. Delete any existing code",
            "4. Paste the generated script",
            "5. Save the script (Ctrl+S or Cmd+S)",
            "6. Close the Apps Script editor",
            "7. Edit a cell in your sheet to test the trigger"
        ]
    }
