# Skill Security Audit SOP
## Standard Operating Procedure for Evaluating ClawHub Skills

---

## Overview

Before installing any skill from ClawHub, run through this security audit checklist. Skills can execute code, access files, and interact with external services - a malicious or poorly designed skill could compromise your system or data.

---

## 🔴 CRITICAL: Pre-Installation Checklist

### 1. Source Verification
- [ ] **Publisher Identity**: Who published the skill? Verified author or anonymous?
- [ ] **Repository Link**: Does the skill link to a public GitHub repo?
- [ ] **Download Count**: How many installs? (Higher = more eyes on it)
- [ ] **Last Updated**: Recently maintained or abandoned?
- [ ] **Version History**: Regular updates or single release?

### 2. Code Review (SKILL.md + Scripts/)
```bash
# Download skill without installing
clawhub download <skill-name> --extract-to /tmp/skill-review

# Review the SKILL.md
cat /tmp/skill-review/SKILL.md

# List all files
find /tmp/skill-review -type f
```

**Check for:**
- [ ] **Network Calls**: Any `curl`, `wget`, `fetch` to external domains?
- [ ] **File System Access**: Reading/writing outside workspace?
- [ ] **Environment Variables**: Accessing sensitive vars (TOKEN, KEY, PASSWORD)?
- [ ] **Command Execution**: Running shell commands (`exec`, `spawn`, `system`)?
- [ ] **Privilege Escalation**: `sudo`, `chmod +s`, modifying system files?
- [ ] **Persistence**: Adding cron jobs, startup scripts, services?
- [ ] **Data Exfiltration**: Sending data to unknown endpoints?

### 3. Script Analysis (if scripts/ directory exists)
```bash
# Check all scripts for suspicious patterns
grep -r "curl\|wget\|http" /tmp/skill-review/scripts/
grep -r "rm -rf\|sudo\|chmod 777" /tmp/skill-review/scripts/
grep -r "eval\|exec\|system(" /tmp/skill-review/scripts/
grep -r "process.env\|os.environ" /tmp/skill-review/scripts/
```

### 4. Permission Requirements
- [ ] **File Permissions**: Does it need write access outside workspace?
- [ ] **Network Access**: Does it need internet access?
- [ ] **API Keys**: Does it require API keys? If so, which services?
- [ ] **Binary Execution**: Does it install or run binaries?

### 5. Scope Analysis
- [ ] **Least Privilege**: Does the skill request minimal necessary permissions?
- [ ] **Sandboxed**: Does it respect OpenClaw's sandbox boundaries?
- [ ] **Reversible**: Can you easily uninstall without residue?

---

## 🟡 MEDIUM: Risk Assessment

### Risk Levels

| Level | Criteria | Action |
|-------|----------|--------|
| **🟢 LOW** | No scripts, pure documentation, reads only | Safe to install |
| **🟡 MEDIUM** | Scripts present but sandboxed, no network calls | Review scripts, test in isolated env |
| **🟠 HIGH** | Network calls to known APIs, file writes | Careful review, monitor closely |
| **🔴 CRITICAL** | Unknown external domains, privilege escalation, obfuscated code | **DO NOT INSTALL** |

### Red Flags 🚩
- **Obfuscated code** or base64-encoded payloads
- **Minified scripts** without source maps
- **External domains** that don't match the skill's purpose
- **Requests for admin/root** privileges
- **Cryptocurrency** or mining references
- **Keylogger** patterns or input capture
- **Encrypted payloads** or suspicious downloads

---

## 🟢 SAFE: Installation Process

### Step-by-Step Installation

```bash
# 1. Backup current state
cd ~/.openclaw/workspace
git add -A && git commit -m "Pre-skill-install backup"

# 2. Download and review (don't install yet)
clawhub download <skill-name> --extract-to /tmp/skill-review

# 3. Run security audit (see checklist above)
# ... perform all checks ...

# 4. If safe, install in test environment first
clawhub install <skill-name> --dir /tmp/test-skills

# 5. Test the skill with non-sensitive data
# ... test functionality ...

# 6. Monitor for unexpected behavior
# Watch for: network connections, file changes, CPU usage

# 7. If all clear, install to production
clawhub install <skill-name>

# 8. Verify installation
clawhub list | grep <skill-name>
```

---

## 📋 Post-Installation Monitoring

### First 24 Hours
- [ ] Monitor network connections: `netstat -tulpn | grep <process>`
- [ ] Check file system changes: `find ~/.openclaw -mtime -1 -type f`
- [ ] Review OpenClaw logs for errors
- [ ] Test skill functionality works as expected

### Ongoing
- [ ] Monthly review of installed skills
- [ ] Update skills regularly: `clawhub update --all`
- [ ] Remove unused skills: `clawhub uninstall <skill-name>`

---

## 🛠️ Automated Audit Script

Save this as `~/.openclaw/scripts/audit-skill.sh`:

```bash
#!/bin/bash
# Skill Security Audit Script

SKILL_NAME=$1
AUDIT_DIR="/tmp/skill-audit-$(date +%s)"

echo "🔍 Auditing skill: $SKILL_NAME"
echo ""

# Download skill
clawhub download "$SKILL_NAME" --extract-to "$AUDIT_DIR" 2>/dev/null

if [ ! -d "$AUDIT_DIR" ]; then
    echo "❌ Failed to download skill"
    exit 1
fi

echo "📁 Files in skill:"
find "$AUDIT_DIR" -type f | head -20

echo ""
echo "🔍 Checking for red flags..."

# Check for network calls
NETWORK=$(grep -r "curl\|wget\|fetch(" "$AUDIT_DIR" 2>/dev/null | wc -l)
echo "  Network calls found: $NETWORK"

# Check for eval/exec
EXEC=$(grep -r "eval\|exec\|system(" "$AUDIT_DIR" 2>/dev/null | wc -l)
echo "  Exec calls found: $EXEC"

# Check for environment access
ENV=$(grep -r "process.env\|os.environ\|ENV\[" "$AUDIT_DIR" 2>/dev/null | wc -l)
echo "  Environment access found: $ENV"

# Check for file writes
WRITE=$(grep -r "writeFile\|fs.write\|>\s*\$" "$AUDIT_DIR" 2>/dev/null | wc -l)
echo "  File write operations: $WRITE"

echo ""
echo "📋 SKILL.md first 50 lines:"
head -50 "$AUDIT_DIR/SKILL.md" 2>/dev/null || echo "No SKILL.md found"

# Cleanup
rm -rf "$AUDIT_DIR"

echo ""
echo "✅ Audit complete. Review findings before installing."
```

Make executable: `chmod +x ~/.openclaw/scripts/audit-skill.sh`

---

## ⚡ Quick Decision Matrix

| Question | If YES | If NO |
|----------|--------|-------|
| Is it from a verified publisher? | Safer | Research more |
| Does it access the internet? | Check domains carefully | Lower risk |
| Does it run shell commands? | Review each command | Safer |
| Does it write files? | Check where | Safer |
| Is the code obfuscated? | **DON'T INSTALL** | Safer |
| Has it been updated recently? | Active maintenance | May be abandoned |
| Are there many downloads? | Community vetted | Less validation |

---

## 📞 Escalation

If you find a malicious skill:
1. **DO NOT INSTALL**
2. Report to: clawhub.com/report
3. Document findings
4. Warn others in community channels

---

**Remember**: When in doubt, don't install. Your system's security is worth more than the convenience of a skill.

*Created: March 10, 2026*
*Version: 1.0*
