#!/bin/bash
# Work Agent Pipeline Refresh - Cron Wrapper
# Runs hourly during work hours (8 AM - 5 PM PST, Mon-Fri)

cd /data/.openclaw/workspace/agents
python3 work_agent.py --task pipeline_refresh >> /data/.openclaw/workspace/logs/work-agent.log 2>&1
