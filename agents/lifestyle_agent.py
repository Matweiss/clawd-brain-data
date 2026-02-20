"""
Lifestyle Agent - Personal Concierge
Tracks yoga attendance, plans weekends, wellness reminders, family logistics
Updates Command Center dashboard
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent_runner import AgentRunner

class LifestyleAgent(AgentRunner):
    def __init__(self):
        super().__init__('lifestyle', 'Lifestyle Agent')
    
    def check_yoga_this_week(self) -> Dict[str, Any]:
        """Check yoga attendance this week from Google Calendar."""
        try:
            print("🧘 Checking yoga attendance this week...")
            
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
            
            # Get this week's events (Monday - Sunday)
            now = datetime.now()
            # Find Monday of this week
            days_since_monday = now.weekday()  # 0 = Monday
            week_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = (week_start + timedelta(days=7)).replace(hour=23, minute=59, second=59)
            
            week_start_iso = week_start.isoformat() + 'Z'
            week_end_iso = week_end.isoformat() + 'Z'
            
            events_result = calendar.events().list(
                calendarId='primary',
                timeMin=week_start_iso,
                timeMax=week_end_iso,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Count yoga classes (CorePower or yoga-related)
            yoga_classes = []
            for event in events:
                summary = event.get('summary', '').lower()
                if any(keyword in summary for keyword in ['yoga', 'corepower', 'sculpt', 'c2']):
                    yoga_classes.append({
                        'summary': event.get('summary', ''),
                        'start': event['start'].get('dateTime', event['start'].get('date')),
                    })
            
            yoga_count = len(yoga_classes)
            goal = 5
            remaining = max(0, goal - yoga_count)
            
            # Calculate days left in week
            days_left = (week_end.date() - now.date()).days
            
            stats = {
                'count': yoga_count,
                'goal': goal,
                'remaining': remaining,
                'days_left': days_left,
                'classes': yoga_classes,
                'on_track': yoga_count >= goal or (days_left >= remaining)
            }
            
            print(f"✅ Yoga: {yoga_count}/5 this week ({remaining} remaining, {days_left} days left)")
            
            return stats
            
        except Exception as e:
            print(f"❌ Failed to check yoga: {e}")
            return {'count': 0, 'goal': 5, 'remaining': 5, 'days_left': 0, 'classes': [], 'on_track': False}
    
    def check_sarah_trip_countdown(self) -> Dict[str, Any]:
        """Calculate countdown to Sarah's NYC trip."""
        try:
            # Sarah's trip: March 30, 2026
            trip_date = datetime(2026, 3, 30)
            now = datetime.now()
            days_until = (trip_date - now).days
            
            weeks_until = days_until // 7
            
            return {
                'date': 'March 30, 2026',
                'days_until': days_until,
                'weeks_until': weeks_until
            }
            
        except Exception as e:
            print(f"❌ Failed to calculate trip countdown: {e}")
            return {'date': 'March 30, 2026', 'days_until': 0, 'weeks_until': 0}
    
    def suggest_weekend_activity(self) -> str:
        """Suggest a weekend activity based on time of year."""
        now = datetime.now()
        day_of_week = now.weekday()  # 0 = Monday, 6 = Sunday
        
        # Only suggest on Friday (4) or Saturday (5)
        if day_of_week not in [4, 5]:
            return ""
        
        # Month-based suggestions
        month = now.month
        
        suggestions = {
            1: "Winter movie night at home? Check new releases on streaming.",
            2: "Valentine's month! Book a nice dinner reservation for you and Sarah.",
            3: "Spring is coming! Plan a hike or outdoor brunch this weekend.",
            4: "Perfect weather for outdoor activities! Beach day or hiking?",
            5: "Great time for a weekend getaway. Santa Barbara? Palm Springs?",
            6: "Summer vibes! Beach day, BBQ, or explore a new LA neighborhood.",
            7: "Beat the heat! Movie theater, museum, or indoor climbing?",
            8: "Last summer weekends! Make the most of beach season.",
            9: "Fall vibes starting! Farmers market + new restaurant?",
            10: "October adventures! Pumpkin patch, fall hike, or cozy dinner out.",
            11: "Holiday season prep! Start planning Thanksgiving or shop for gifts.",
            12: "Holiday mode! Ice skating, light displays, or cozy home movie marathon."
        }
        
        return suggestions.get(month, "Plan something fun this weekend!")
    
    def run_wellness_check(self):
        """Main task: Wellness check and lifestyle update."""
        try:
            self.update_agent_status('working', 'Running wellness check...')
            self.log_activity('wellness_check', status='started')
            
            # Check yoga attendance
            yoga_stats = self.check_yoga_this_week()
            
            # Check Sarah's trip countdown
            trip_countdown = self.check_sarah_trip_countdown()
            
            # Weekend suggestion (if Friday/Saturday)
            weekend_suggestion = self.suggest_weekend_activity()
            
            # Prepare status message
            status_parts = [
                f"🧘 {yoga_stats['count']}/5 yoga",
            ]
            
            if yoga_stats['remaining'] > 0 and yoga_stats['days_left'] > 0:
                status_parts.append(f"{yoga_stats['remaining']} more needed")
            elif yoga_stats['count'] >= 5:
                status_parts.append("✅ goal hit!")
            
            status_parts.append(f"✈️ {trip_countdown['days_until']}d until Sarah's trip")
            
            status_message = " • ".join(status_parts)
            
            # Update dashboard
            self.update_agent_status('idle', status_message)
            self.log_activity('wellness_check', status='success', 
                            details=json.dumps({
                                'yoga': yoga_stats,
                                'sarah_trip': trip_countdown
                            }, indent=2))
            
            # Send alerts if needed
            alerts = []
            
            # Yoga alert if behind schedule
            if yoga_stats['days_left'] <= 2 and yoga_stats['remaining'] > yoga_stats['days_left']:
                alerts.append(f"🧘 **Yoga Alert!**\n\nYou're at {yoga_stats['count']}/5 classes this week with only {yoga_stats['days_left']} days left.\n\nNeed {yoga_stats['remaining']} more classes to hit your goal. Book some sessions! 💪")
            
            # Trip prep alert (2 weeks out)
            if 10 <= trip_countdown['days_until'] <= 14:
                alerts.append(f"✈️ **Sarah's Trip Prep**\n\nSarah's NYC trip is in {trip_countdown['days_until']} days (March 30).\n\nTime to:\n• Check flight confirmations\n• Plan activities/reservations\n• Pack list?\n• Arrange Diggy care")
            
            # Weekend suggestion
            if weekend_suggestion:
                alerts.append(f"🎉 **Weekend Idea**\n\n{weekend_suggestion}")
            
            # Send consolidated alert if any
            if alerts:
                alert_message = "\n\n---\n\n".join(alerts)
                self.send_telegram_alert(alert_message)
            
            print("✅ Wellness check complete")
            
        except Exception as e:
            print(f"❌ Wellness check failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('wellness_check', status='error', details=str(e))

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Lifestyle Agent - Personal Concierge')
    parser.add_argument('--task', default='wellness_check', 
                       help='Task to run (default: wellness_check)')
    
    args = parser.parse_args()
    
    agent = LifestyleAgent()
    
    if args.task == 'wellness_check':
        agent.run_wellness_check()
    else:
        print(f"❌ Unknown task: {args.task}")
        sys.exit(1)
