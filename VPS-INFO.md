# Mat's VPS Configuration

**Provider:** Hostinger  
**Plan:** KVM 2  
**OS:** Ubuntu 24.04.3 LTS  

---

## Server Details

**Hostname:** srv882799.hstgr.cloud  
**IP Address:** 31.97.142.214  
**IPv6:** 2a02:4780:2d:5c24::1  
**Location:** Boston, US  

**Resources:**
- CPU: 2 cores (24% usage)
- RAM: 8 GB (23% usage, ~59% in terminal)
- Disk: 71/100 GB used (74.5% of 95.82GB in terminal)
- Bandwidth: 0.023/8 TB used
- Uptime: 93 days

---

## Running Services

**OpenClaw:**
- Docker container: `openclaw-yhqj-openclaw-1`
- Internal IP: 172.20.0.2
- Browser relay port: 18792
- Status: Running

**n8n:**
- Available on VPS
- Automation workflows

---

## Access Information

**SSH Connection:**
```bash
ssh root@31.97.142.214
# or
ssh root@srv882799.hstgr.cloud
```

**Last login from:** 169.254.0.1  
**Login time:** Fri Feb 20 22:22:18 2026

---

## Chrome Extension SSH Tunnel

**Command to run on Mac:**
```bash
ssh -L 18792:localhost:18792 root@31.97.142.214 -N
```

**What this does:**
- Creates tunnel from Mac port 18792 → VPS port 18792
- Allows Chrome extension to connect to OpenClaw browser relay
- Keep terminal window open while using browser relay

**After tunnel is running:**
1. Chrome extension should show green/connected
2. Click extension icon on any tab (Vercel, HubSpot, etc.)
3. Badge shows ON → Clawd has access to that tab

---

## Docker Info

**Check OpenClaw container:**
```bash
docker ps -q | xargs -n 1 docker inspect --format '{{.Name}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**OpenClaw logs:**
```bash
docker logs openclaw-yhqj-openclaw-1
```

**Restart OpenClaw:**
```bash
docker restart openclaw-yhqj-openclaw-1
```

---

## System Status

**System Load:** 0.48  
**Processes:** 153  
**Memory:** 59% used, 0% swap  

**Security:**
- Malware scanner: Active
- Firewall: Configured
- Snapshots: 2 available

**Updates:**
- 35 updates available
- 1 update failed (check /var/log/unattended-upgrades/)

---

## Quick Commands

**Check disk space:**
```bash
df -h
```

**Check memory:**
```bash
free -h
```

**System info:**
```bash
htop
```

**Docker status:**
```bash
docker ps
```

---

## Hostinger Dashboard

**URL:** https://hpanel.hostinger.com (assumed)  
**Server ID:** srv882799  

**Available in dashboard:**
- OpenClaw link
- Docker manager
- Firewall rules
- Snapshots (2)
- Malware scanner

---

## Notes

- **Backup:** Not currently enabled (Hostinger offers $6/mo automated daily backups)
- **Security:** ESM Apps available for additional security updates
- **Performance:** Running well (24% CPU, 23% RAM, plenty of bandwidth)
- **Uptime:** Excellent (93 days)

---

**Last Updated:** 2026-02-20 5:24 PM EST
