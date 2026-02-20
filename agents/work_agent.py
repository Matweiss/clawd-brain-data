"""
Work Agent - Sales Chief of Staff
Monitors HubSpot pipeline, Gmail, Calendar
Updates Command Center dashboard
Sends alerts for urgent items
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any
import requests

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent_runner import AgentRunner

class WorkAgent(AgentRunner):
    def __init__(self):
        super().__init__('work', 'Work Agent')
        self.hubspot_token = self._get_hubspot_token()
        self.owner_id = "728033696"  # Mat's HubSpot owner ID
    
    def _get_hubspot_token(self) -> str:
        """Get HubSpot API token from credentials file."""
        try:
            # Hardcoded for now (from API-CREDENTIALS.md)
            return "pat-na1-a249996e-eb7d-4184-841f-2759d28a8323"
            
        except Exception as e:
            print(f"❌ Failed to load HubSpot token: {e}")
            sys.exit(1)
    
    def fetch_pipeline_stats(self) -> Dict[str, Any]:
        """Fetch pipeline stats from HubSpot."""
        try:
            print("📊 Fetching HubSpot pipeline stats...")
            
            # Fetch deals
            url = "https://api.hubapi.com/crm/v3/objects/deals"
            headers = {
                "Authorization": f"Bearer {self.hubspot_token}",
                "Content-Type": "application/json"
            }
            
            params = {
                "limit": 100,
                "properties": "dealname,amount,dealstage,closedate,pipeline,hs_lastmodifieddate,hubspot_owner_id",
                "associations": "contacts"
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            deals = response.json().get('results', [])
            
            # Filter for Mat's deals
            mat_deals = [
                d for d in deals 
                if d.get('properties', {}).get('hubspot_owner_id') == self.owner_id
            ]
            
            # Calculate stats
            total_value = sum(
                float(d.get('properties', {}).get('amount', 0) or 0) 
                for d in mat_deals
            )
            
            deal_count = len(mat_deals)
            
            # Count by stage
            stage_counts = {}
            for deal in mat_deals:
                stage = deal.get('properties', {}).get('dealstage', 'unknown')
                stage_counts[stage] = stage_counts.get(stage, 0) + 1
            
            # Find stale deals (not modified in 7+ days)
            stale_threshold = datetime.now() - timedelta(days=7)
            stale_deals = []
            
            for deal in mat_deals:
                last_modified = deal.get('properties', {}).get('hs_lastmodifieddate')
                if last_modified:
                    try:
                        modified_date = datetime.fromisoformat(last_modified.replace('Z', '+00:00'))
                        if modified_date < stale_threshold:
                            stale_deals.append({
                                'name': deal.get('properties', {}).get('dealname', 'Unknown'),
                                'stage': deal.get('properties', {}).get('dealstage', 'Unknown'),
                                'last_modified': last_modified
                            })
                    except:
                        pass
            
            stats = {
                'total_value': total_value,
                'deal_count': deal_count,
                'stage_counts': stage_counts,
                'stale_deals': stale_deals,
                'stale_count': len(stale_deals)
            }
            
            print(f"✅ Pipeline: ${total_value:,.0f} across {deal_count} deals")
            print(f"⚠️ Stale deals: {len(stale_deals)}")
            
            return stats
            
        except requests.exceptions.HTTPError as e:
            print(f"❌ HubSpot API error: {e}")
            print(f"Response: {e.response.text}")
            return {}
        except Exception as e:
            print(f"❌ Failed to fetch pipeline stats: {e}")
            return {}
    
    def check_calendar_meetings(self) -> List[Dict[str, Any]]:
        """Check for upcoming meetings today."""
        try:
            print("📅 Checking calendar for today's meetings...")
            
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            
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
            
            calendar = build('calendar', 'v3', credentials=creds)
            
            # Get today's events
            now = datetime.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
            today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat() + 'Z'
            
            events_result = calendar.events().list(
                calendarId='primary',
                timeMin=today_start,
                timeMax=today_end,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Filter for external meetings (not personal/all-day)
            meetings = []
            for event in events:
                # Skip all-day events
                if 'dateTime' not in event.get('start', {}):
                    continue
                
                # Skip personal calendar events
                summary = event.get('summary', '')
                if any(keyword in summary.lower() for keyword in ['yoga', 'workout', 'personal']):
                    continue
                
                meetings.append({
                    'summary': summary,
                    'start': event['start']['dateTime'],
                    'attendees': len(event.get('attendees', []))
                })
            
            print(f"✅ Found {len(meetings)} meetings today")
            return meetings
            
        except Exception as e:
            print(f"❌ Failed to check calendar: {e}")
            return []
    
    def run_pipeline_refresh(self):
        """Main task: Refresh pipeline and update dashboard."""
        try:
            self.update_agent_status('working', 'Refreshing pipeline...')
            self.log_activity('pipeline_refresh', status='started')
            
            # Fetch pipeline stats
            stats = self.fetch_pipeline_stats()
            
            if not stats:
                self.update_agent_status('error', 'Failed to fetch pipeline')
                self.log_activity('pipeline_refresh', status='error', 
                                details='HubSpot API error')
                return
            
            # Check calendar
            meetings = self.check_calendar_meetings()
            
            # Prepare status message
            status_parts = [
                f"${stats['total_value']:,.0f} pipeline",
                f"{stats['deal_count']} deals"
            ]
            
            if stats['stale_count'] > 0:
                status_parts.append(f"{stats['stale_count']} stale")
            
            if meetings:
                status_parts.append(f"{len(meetings)} meetings today")
            
            status_message = " • ".join(status_parts)
            
            # Update dashboard
            self.update_agent_status('idle', status_message)
            self.log_activity('pipeline_refresh', status='success', 
                            details=json.dumps(stats, indent=2))
            
            # Send alert if there are stale deals
            if stats['stale_count'] >= 3:
                stale_names = [d['name'] for d in stats['stale_deals'][:3]]
                alert_message = f"⚠️ Work Agent Alert:\n\n{stats['stale_count']} stale deals need attention:\n\n"
                alert_message += "\n".join(f"• {name}" for name in stale_names)
                
                if stats['stale_count'] > 3:
                    alert_message += f"\n• ...and {stats['stale_count'] - 3} more"
                
                self.send_telegram_alert(alert_message)
            
            print("✅ Pipeline refresh complete")
            
        except Exception as e:
            print(f"❌ Pipeline refresh failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('pipeline_refresh', status='error', details=str(e))

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Work Agent - Sales Chief of Staff')
    parser.add_argument('--task', default='pipeline_refresh', 
                       help='Task to run (default: pipeline_refresh)')
    
    args = parser.parse_args()
    
    agent = WorkAgent()
    
    if args.task == 'pipeline_refresh':
        agent.run_pipeline_refresh()
    else:
        print(f"❌ Unknown task: {args.task}")
        sys.exit(1)
