"""
Base class for all Clawd agents.
Handles Supabase I/O, Telegram alerts, error handling, retries.
"""

import json
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import requests

# Import Supabase client
from supabase_client import SupabaseClient

class AgentRunner:
    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.telegram_chat_id = "8001393940"
        self.supabase = SupabaseClient()
        print(f"✅ Supabase initialized for {self.agent_name}")
    
    def update_agent_status(self, status: str, current_task: str = "", 
                           tasks_completed: Optional[int] = None,
                           success_rate: Optional[int] = None):
        """Update agent status in Supabase."""
        try:
            self.supabase.update_agent_status(
                agent_id=self.agent_id,
                status=status,
                current_task=current_task,
                tasks_completed=tasks_completed,
                success_rate=success_rate
            )
            print(f"✅ Updated {self.agent_name} status: {status}")
        except Exception as e:
            print(f"❌ Failed to update agent status: {e}")
    
    def log_activity(self, action: str, task_id: str = "", 
                     status: str = "success", details: str = ""):
        """Log activity to Supabase activity_log table."""
        try:
            self.supabase.log_activity(
                action=action,
                entity_type='agent',
                entity_id=self.agent_id,
                details={
                    'task_id': task_id,
                    'status': status,
                    'details': details
                }
            )
            print(f"✅ Logged activity: {action}")
            
        except Exception as e:
            print(f"❌ Failed to log activity: {e}")
    
    def send_telegram_alert(self, message: str, silent: bool = False):
        """Send alert to Mat via Telegram."""
        try:
            # Use OpenClaw's internal message tool
            import subprocess
            
            # Escape quotes in message
            safe_message = message.replace('"', '\\"').replace('$', '\\$')
            
            cmd = f'openclaw message send --channel telegram --target {self.telegram_chat_id} --message "{safe_message}"'
            
            if silent:
                cmd += ' --silent'
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Telegram alert sent")
            else:
                print(f"⚠️ Telegram alert failed: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Failed to send Telegram alert: {e}")
    
    def run(self):
        """Override this method in subclasses."""
        raise NotImplementedError("Subclasses must implement run() method")

if __name__ == '__main__':
    print("AgentRunner base class - do not run directly")
    print("Use work_agent.py, lifestyle_agent.py, etc.")
