# Auto Media Archive Skill

Automatically archives incoming photos and files to the memory system.

## Usage

When you receive a photo or file, simply say:
- "Archive this"
- "Save this to memory"
- "Store this photo"

Or include context:
- "Archive this - ESP32 placement in living room"
- "Save this for the camera planning project"

The system will:
1. Copy the file to `memory/archive/media/`
2. Update the media index with description
3. Link to relevant projects if mentioned

## Automatic Detection

The skill also auto-detects when photos are sent during specific contexts:
- Room photos during ESP32 optimization
- Screenshots during troubleshooting
- Floor plans during home planning

## Archive Location

All files stored at: `memory/archive/media/`
Index at: `memory/media-archive-index.md`
