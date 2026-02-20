"""
Research Agent - Intelligence Gatherer
Performs ZoomInfo/LinkedIn lookups, caches contact data
Runs in batches to avoid rate limits
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent_runner import AgentRunner

class ResearchAgent(AgentRunner):
    def __init__(self):
        super().__init__('research', 'Research Agent')
        self.cache_duration_days = 90  # Cache data for 90 days
    
    def check_cache_freshness(self) -> Dict[str, Any]:
        """Check research cache freshness in Google Sheets."""
        try:
            print("🔍 Checking research cache freshness...")
            
            # In a real implementation, this would check a Research_Cache tab
            # For now, we'll simulate with a placeholder
            
            stats = {
                'total_contacts': 0,
                'fresh': 0,
                'stale': 0,
                'missing': 0
            }
            
            print(f"✅ Cache status: {stats['fresh']} fresh, {stats['stale']} stale, {stats['missing']} missing")
            return stats
            
        except Exception as e:
            print(f"❌ Failed to check cache: {e}")
            return {'total_contacts': 0, 'fresh': 0, 'stale': 0, 'missing': 0}
    
    def get_research_queue(self) -> List[str]:
        """Get list of contacts needing research from HubSpot."""
        try:
            print("📋 Checking for contacts needing research...")
            
            # In real implementation, this would:
            # 1. Fetch deals from HubSpot
            # 2. Extract contact names
            # 3. Check against cache
            # 4. Return list of contacts needing lookup
            
            # Placeholder
            queue = []
            
            print(f"✅ Research queue: {len(queue)} contacts")
            return queue
            
        except Exception as e:
            print(f"❌ Failed to get research queue: {e}")
            return []
    
    def run_cache_check(self):
        """Main task: Check research cache and queue status."""
        try:
            self.update_agent_status('working', 'Checking research cache...')
            self.log_activity('cache_check', status='started')
            
            # Check cache freshness
            cache_stats = self.check_cache_freshness()
            
            # Check research queue
            research_queue = self.get_research_queue()
            
            # Prepare status message
            status_parts = []
            
            if cache_stats['total_contacts'] > 0:
                fresh_pct = int((cache_stats['fresh'] / cache_stats['total_contacts']) * 100)
                status_parts.append(f"📊 {cache_stats['total_contacts']} contacts ({fresh_pct}% fresh)")
            else:
                status_parts.append("📊 No cached data yet")
            
            if research_queue:
                status_parts.append(f"🔍 {len(research_queue)} contacts queued")
            else:
                status_parts.append("✅ Cache up to date")
            
            status_message = " • ".join(status_parts)
            
            # Update dashboard
            self.update_agent_status('idle', status_message)
            
            report = {
                'timestamp': datetime.now().isoformat(),
                'cache': cache_stats,
                'queue_size': len(research_queue)
            }
            
            self.log_activity('cache_check', status='success', 
                            details=json.dumps(report, indent=2))
            
            # Send alert if queue is large
            if len(research_queue) >= 10:
                alert = f"🔍 **Research Agent Alert**\n\n{len(research_queue)} contacts need research.\n\nScheduled for Sunday night batch processing."
                self.send_telegram_alert(alert)
            
            print("✅ Cache check complete")
            
        except Exception as e:
            print(f"❌ Cache check failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('cache_check', status='error', details=str(e))
    
    def run_batch_research(self):
        """Process research queue in batch (Sunday nights only)."""
        try:
            # Safety check: Only run on Sundays
            now = datetime.now()
            if now.weekday() != 6:  # 6 = Sunday
                print("📅 Not Sunday, skipping batch research")
                return
            
            self.update_agent_status('working', 'Running batch research...')
            self.log_activity('batch_research', status='started')
            
            # Get research queue
            research_queue = self.get_research_queue()
            
            if not research_queue:
                print("✅ No research needed")
                self.update_agent_status('idle', '✅ Cache up to date')
                return
            
            # Process queue (max 15 lookups per batch to avoid rate limits)
            processed = 0
            max_batch = 15
            
            for contact in research_queue[:max_batch]:
                print(f"🔍 Researching: {contact}")
                
                # In real implementation, this would:
                # 1. Check ZoomInfo API
                # 2. If not found, fallback to LinkedIn (rate limited)
                # 3. Cache results in Google Sheets
                # 4. Add timestamp + expiry date
                
                processed += 1
            
            # Update dashboard
            status_message = f"✅ Researched {processed} contacts"
            self.update_agent_status('idle', status_message)
            self.log_activity('batch_research', status='success', 
                            details=f"Processed {processed}/{len(research_queue)} contacts")
            
            # Send completion alert
            remaining = len(research_queue) - processed
            alert = f"🔍 **Research Agent Completed**\n\nResearched {processed} contacts.\n\n"
            
            if remaining > 0:
                alert += f"{remaining} contacts remaining for next week."
            else:
                alert += "All contacts researched! Cache is fresh. ✅"
            
            self.send_telegram_alert(alert)
            
            print("✅ Batch research complete")
            
        except Exception as e:
            print(f"❌ Batch research failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('batch_research', status='error', details=str(e))

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Research Agent - Intelligence Gatherer')
    parser.add_argument('--task', default='cache_check', 
                       help='Task to run (default: cache_check, or batch_research)')
    
    args = parser.parse_args()
    
    agent = ResearchAgent()
    
    if args.task == 'cache_check':
        agent.run_cache_check()
    elif args.task == 'batch_research':
        agent.run_batch_research()
    else:
        print(f"❌ Unknown task: {args.task}")
        sys.exit(1)
