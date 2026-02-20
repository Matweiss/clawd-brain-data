"""
Base class for all Clawd agents.
Handles Google Sheets I/O, Telegram alerts, error handling, retries.
"""

import json
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class AgentRunner:
    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.sheet_id = "1BBmXDzOHRMulBNXuOlRwxx0Dnu2Y-qk1O1n9XyJUg-o"
        self.telegram_chat_id = "8001393940"
        self.sheets_service = None
        self._init_google_sheets()
    
    def _init_google_sheets(self):
        """Initialize Google Sheets API client."""
        try:
            # Load Google OAuth token
            with open('/data/.openclaw/google-token.json', 'r') as f:
                token_data = json.load(f)
            
            creds = Credentials(
                token=token_data['access_token'],
                refresh_token=token_data['refresh_token'],
                token_uri='https://oauth2.googleapis.com/token',
                client_id=token_data['client_id'],
                client_secret=token_data['client_secret']
            )
            
            self.sheets_service = build('sheets', 'v4', credentials=creds)
            print(f"✅ Google Sheets API initialized for {self.agent_name}")
        except Exception as e:
            print(f"❌ Failed to initialize Google Sheets: {e}")
            sys.exit(1)
    
    def update_agent_status(self, status: str, current_task: str = "", 
                           tasks_completed: Optional[int] = None,
                           success_rate: Optional[int] = None):
        """Update agent status in Sheets."""
        try:
            # Read current agents
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range='Agents!A2:G10'
            ).execute()
            
            rows = result.get('values', [])
            
            # Find this agent's row
            row_index = None
            for i, row in enumerate(rows):
                if row[0] == self.agent_id:
                    row_index = i + 2  # +2 because of header and 0-indexing
                    break
            
            if row_index is None:
                print(f"⚠️ Agent {self.agent_id} not found in Agents tab")
                return
            
            # Prepare update values
            updates = {
                'status': status,
                'current_task': current_task,
                'last_active': datetime.now().isoformat()
            }
            
            # Update specific cells
            range_name = f"Agents!C{row_index}:E{row_index}"
            values = [[status, current_task, datetime.now().isoformat()]]
            
            self.sheets_service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption='RAW',
                body={'values': values}
            ).execute()
            
            # Update tasks_completed if provided
            if tasks_completed is not None:
                range_name = f"Agents!F{row_index}"
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=self.sheet_id,
                    range=range_name,
                    valueInputOption='RAW',
                    body={'values': [[tasks_completed]]}
                ).execute()
            
            # Update success_rate if provided
            if success_rate is not None:
                range_name = f"Agents!G{row_index}"
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=self.sheet_id,
                    range=range_name,
                    valueInputOption='RAW',
                    body={'values': [[success_rate]]}
                ).execute()
            
            print(f"✅ Updated {self.agent_name} status: {status}")
            
        except HttpError as e:
            print(f"❌ Sheets API error: {e}")
        except Exception as e:
            print(f"❌ Failed to update agent status: {e}")
    
    def log_activity(self, action: str, task_id: str = "", 
                     status: str = "success", details: str = ""):
        """Log activity to Activity_Log tab."""
        try:
            values = [[
                datetime.now().isoformat(),
                self.agent_id,
                action,
                task_id,
                status,
                details
            ]]
            
            self.sheets_service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range='Activity_Log!A:F',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body={'values': values}
            ).execute()
            
            print(f"✅ Logged activity: {action}")
            
        except Exception as e:
            print(f"❌ Failed to log activity: {e}")
    
    def send_telegram_alert(self, message: str, silent: bool = False):
        """Send alert to Mat via Telegram."""
        try:
            # Use OpenClaw's internal message tool
            import subprocess
            
            # Escape quotes in message
            safe_message = message.replace('"', '\\"')
            
            cmd = f'openclaw message send --channel telegram --to {self.telegram_chat_id} --message "{safe_message}"'
            
            if silent:
                cmd += ' --silent'
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Telegram alert sent")
            else:
                print(f"⚠️ Telegram alert failed: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Failed to send Telegram alert: {e}")
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value from Config tab."""
        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range='Config!A:B'
            ).execute()
            
            rows = result.get('values', [])
            
            for row in rows:
                if len(row) >= 2 and row[0] == key:
                    return row[1]
            
            return default
            
        except Exception as e:
            print(f"⚠️ Failed to get config {key}: {e}")
            return default
    
    def run(self):
        """Override this method in subclasses."""
        raise NotImplementedError("Subclasses must implement run() method")

if __name__ == '__main__':
    print("AgentRunner base class - do not run directly")
    print("Use work_agent.py, lifestyle_agent.py, etc.")
