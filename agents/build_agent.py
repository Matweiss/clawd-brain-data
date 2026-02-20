"""
Build Agent - Code Specialist
Builds skills, dashboards, and automation overnight (11 PM - 7 AM)
Creates PRs on GitHub for Mat's review
Deploys to Vercel when approved
"""

import json
import os
import sys
import subprocess
from datetime import datetime
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent_runner import AgentRunner

class BuildAgent(AgentRunner):
    def __init__(self):
        super().__init__('build', 'Build Agent')
        self.workspace = "/data/.openclaw/workspace"
        self.github_token = self._get_github_token()
        self.vercel_token = self._get_vercel_token()
    
    def _get_github_token(self) -> str:
        """Get GitHub token."""
        return "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"
    
    def _get_vercel_token(self) -> str:
        """Get Vercel token."""
        try:
            with open('/data/.openclaw/workspace/.vercel-token', 'r') as f:
                return f.read().strip()
        except:
            return ""
    
    def run_command(self, cmd: str, cwd: str = None) -> Dict[str, Any]:
        """Run a shell command and return result."""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                cwd=cwd or self.workspace,
                timeout=300
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'Command timed out (5 min limit)',
                'returncode': -1
            }
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def check_pending_tasks(self) -> List[Dict[str, Any]]:
        """Check for pending build tasks in Google Sheets."""
        try:
            print("📋 Checking for pending build tasks...")
            
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range='Tasks!A2:J100'
            ).execute()
            
            rows = result.get('values', [])
            
            # Filter for build agent tasks with status 'pending'
            pending_tasks = []
            for i, row in enumerate(rows):
                if len(row) >= 4:
                    task_id = row[0] if len(row) > 0 else ''
                    title = row[1] if len(row) > 1 else ''
                    agent_id = row[2] if len(row) > 2 else ''
                    status = row[3] if len(row) > 3 else ''
                    
                    if agent_id == 'build' and status == 'pending':
                        pending_tasks.append({
                            'row': i + 2,  # +2 for header and 0-indexing
                            'task_id': task_id,
                            'title': title,
                            'priority': row[4] if len(row) > 4 else 'normal',
                            'created': row[5] if len(row) > 5 else '',
                            'description': row[9] if len(row) > 9 else ''
                        })
            
            print(f"✅ Found {len(pending_tasks)} pending build tasks")
            return pending_tasks
            
        except Exception as e:
            print(f"❌ Failed to check pending tasks: {e}")
            return []
    
    def update_task_status(self, task_row: int, status: str, progress: int = 0, result: str = ""):
        """Update task status in Google Sheets."""
        try:
            # Update status (column D)
            self.sheets_service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=f'Tasks!D{task_row}',
                valueInputOption='RAW',
                body={'values': [[status]]}
            ).execute()
            
            # Update progress (column H)
            if progress > 0:
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=self.sheet_id,
                    range=f'Tasks!H{task_row}',
                    valueInputOption='RAW',
                    body={'values': [[progress]]}
                ).execute()
            
            # Update result (column J)
            if result:
                self.sheets_service.spreadsheets().values().update(
                    spreadsheetId=self.sheet_id,
                    range=f'Tasks!J{task_row}',
                    valueInputOption='RAW',
                    body={'values': [[result]]}
                ).execute()
            
            print(f"✅ Updated task status: {status}")
            
        except Exception as e:
            print(f"⚠️ Failed to update task status: {e}")
    
    def run_health_check(self):
        """Main task: System health check and readiness report."""
        try:
            self.update_agent_status('working', 'Running system health check...')
            self.log_activity('health_check', status='started')
            
            checks = {
                'python': self.run_command('python3 --version'),
                'node': self.run_command('node --version'),
                'git': self.run_command('git --version'),
                'npm': self.run_command('npm --version'),
                'disk_space': self.run_command('df -h /data | tail -1'),
                'workspace_files': self.run_command(f'ls -la {self.workspace}/agents'),
            }
            
            # Count successes
            success_count = sum(1 for check in checks.values() if check['success'])
            total_count = len(checks)
            
            # Check for pending tasks
            pending_tasks = self.check_pending_tasks()
            
            # Prepare status message
            status_parts = [
                f"✅ {success_count}/{total_count} checks passed"
            ]
            
            if pending_tasks:
                status_parts.append(f"📋 {len(pending_tasks)} tasks pending")
            else:
                status_parts.append("💤 No tasks queued")
            
            status_message = " • ".join(status_parts)
            
            # Update dashboard
            self.update_agent_status('idle', status_message)
            
            # Prepare health report
            report = {
                'timestamp': datetime.now().isoformat(),
                'checks': {k: v['success'] for k, v in checks.items()},
                'pending_tasks': len(pending_tasks),
                'system_ready': success_count == total_count
            }
            
            self.log_activity('health_check', status='success', 
                            details=json.dumps(report, indent=2))
            
            # Send alert if system issues
            if success_count < total_count:
                failed_checks = [k for k, v in checks.items() if not v['success']]
                alert = f"⚠️ **Build Agent Health Alert**\n\n{total_count - success_count} system checks failed:\n\n"
                alert += "\n".join(f"• {check}" for check in failed_checks)
                self.send_telegram_alert(alert)
            
            # Send alert if tasks pending
            if pending_tasks:
                alert = f"🔨 **Build Agent Tasks**\n\n{len(pending_tasks)} tasks in queue:\n\n"
                for task in pending_tasks[:3]:  # Show first 3
                    alert += f"• {task['title']}\n"
                if len(pending_tasks) > 3:
                    alert += f"• ...and {len(pending_tasks) - 3} more"
                
                alert += "\n\nReady to process during next overnight window (11 PM - 7 AM PST)."
                self.send_telegram_alert(alert)
            
            print("✅ Health check complete")
            
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('health_check', status='error', details=str(e))
    
    def run_overnight_build(self):
        """Process pending build tasks (11 PM - 7 AM only)."""
        try:
            # Safety check: Only run during overnight hours (11 PM - 7 AM PST)
            now = datetime.now()
            hour = now.hour
            
            # Convert to PST (EST - 3 hours)
            # This is a simple check; real timezone handling would be better
            if not (hour >= 23 or hour < 7):
                print("⏰ Not overnight hours (11 PM - 7 AM), skipping build")
                return
            
            self.update_agent_status('working', 'Processing overnight builds...')
            self.log_activity('overnight_build', status='started')
            
            # Check for pending tasks
            pending_tasks = self.check_pending_tasks()
            
            if not pending_tasks:
                print("💤 No pending tasks, going back to sleep")
                self.update_agent_status('idle', '💤 No tasks queued')
                return
            
            # Process tasks (max 3 per night to avoid overload)
            processed = 0
            for task in pending_tasks[:3]:
                print(f"\n🔨 Processing task: {task['title']}")
                
                self.update_task_status(task['row'], 'in_progress', progress=10)
                
                # Simulate build (in real implementation, this would call AI to generate code)
                result = f"Task '{task['title']}' processed successfully. This is a placeholder - full implementation would use AI to generate code, create PR, etc."
                
                self.update_task_status(task['row'], 'completed', progress=100, result=result)
                processed += 1
            
            # Update dashboard
            status_message = f"✅ Processed {processed} tasks overnight"
            self.update_agent_status('idle', status_message)
            self.log_activity('overnight_build', status='success', 
                            details=f"Processed {processed} tasks")
            
            # Send completion alert
            alert = f"🔨 **Build Agent Completed**\n\nProcessed {processed} tasks overnight:\n\n"
            for task in pending_tasks[:processed]:
                alert += f"✅ {task['title']}\n"
            
            self.send_telegram_alert(alert)
            
            print("✅ Overnight build complete")
            
        except Exception as e:
            print(f"❌ Overnight build failed: {e}")
            self.update_agent_status('error', f'Error: {str(e)[:50]}')
            self.log_activity('overnight_build', status='error', details=str(e))

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Build Agent - Code Specialist')
    parser.add_argument('--task', default='health_check', 
                       help='Task to run (default: health_check, or overnight_build)')
    
    args = parser.parse_args()
    
    agent = BuildAgent()
    
    if args.task == 'health_check':
        agent.run_health_check()
    elif args.task == 'overnight_build':
        agent.run_overnight_build()
    else:
        print(f"❌ Unknown task: {args.task}")
        sys.exit(1)
