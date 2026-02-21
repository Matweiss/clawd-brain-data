"""
Supabase client for Python agents
Reads credentials from /data/.openclaw/workspace/.env.supabase
"""

import os
import requests
from datetime import datetime

class SupabaseClient:
    def __init__(self):
        # Load credentials from .env.supabase
        env_file = '/data/.openclaw/workspace/.env.supabase'
        self.url = None
        self.service_key = None
        
        if os.path.exists(env_file):
            with open(env_file) as f:
                for line in f:
                    if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
                        self.url = line.split('=', 1)[1].strip()
                    elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                        self.service_key = line.split('=', 1)[1].strip()
        
        if not self.url or not self.service_key:
            raise ValueError("Missing Supabase credentials in .env.supabase")
        
        self.headers = {
            'apikey': self.service_key,
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def update_agent_status(self, agent_id: str, status: str, current_task: str = '', 
                           tasks_completed: int = None, success_rate: int = None):
        """Update agent status in Supabase"""
        data = {
            'agent_id': agent_id,
            'status': status,
            'current_task': current_task,
            'last_active': datetime.utcnow().isoformat()
        }
        
        if tasks_completed is not None:
            data['tasks_completed'] = tasks_completed
        if success_rate is not None:
            data['success_rate'] = success_rate
        
        # Upsert (insert or update)
        url = f'{self.url}/rest/v1/agents?agent_id=eq.{agent_id}'
        
        # Try PATCH first (update if exists)
        response = requests.patch(url, json=data, headers=self.headers)
        
        if response.status_code == 404 or (response.status_code == 200 and not response.text):
            # Doesn't exist, do POST to create
            url = f'{self.url}/rest/v1/agents'
            response = requests.post(url, json=data, headers=self.headers)
        
        response.raise_for_status()
        return response.json() if response.text else []
    
    def log_activity(self, action: str, entity_type: str = None, entity_id: str = None, details: dict = None):
        """Log activity to activity_log table"""
        data = {
            'action': action,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'details': details or {}
        }
        
        url = f'{self.url}/rest/v1/activity_log'
        response = requests.post(url, json=data, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def create_task(self, title: str, task_type: str = 'other', status: str = 'todo', 
                   created_by: str = 'clawd', **kwargs):
        """Create a new task"""
        data = {
            'title': title,
            'type': task_type,
            'status': status,
            'created_by': created_by,
            **kwargs
        }
        
        url = f'{self.url}/rest/v1/tasks'
        response = requests.post(url, json=data, headers=self.headers)
        response.raise_for_status()
        return response.json()
