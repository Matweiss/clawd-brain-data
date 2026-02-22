=== OPENCLAW BACKUP PACKAGE ===

Files in this directory:
- openclaw-critical-YYYYMMDD-HHMMSS.tar.gz = Complete backup archive
- checksums.txt = SHA256 verification hashes

To restore:
1. tar -xzf openclaw-critical-*.tar.gz
2. sha256sum -c checksums.txt
3. Copy files to new container at original paths
4. Restart OpenClaw gateway

See RECOVERY.md for detailed instructions.
