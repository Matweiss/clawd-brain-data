# Memory System - Natural Language Skill

Use conversational commands to interact with the memory system.

## Commands

### Projects

**Add a project:**
- "Add project ESP32 Optimization with high priority"
- "Create a new project called Camera Planning"
- "Start tracking the Living Room Renovation project"

**Update project:**
- "Mark ESP32 Optimization as blocked"
- "Update Camera Planning status to completed"
- "Set priority of Living Room to low"

**List projects:**
- "Show me all projects"
- "What projects are active?"
- "List high priority projects"

### Media

**Archive media:**
- "Archive this photo"
- "Save this to the media archive"
- "Store this file for the home automation project"

**Search media:**
- "Find photos of the living room"
- "Show me archived floor plans"
- "Search for ESP32 photos"

### Conversations

**Log conversation:**
- "Log this conversation about the ESP32 issue"
- "Remember we decided to use static IPs"
- "Save this troubleshooting session"

**Search conversations:**
- "Find when we discussed the camera placement"
- "Search for ESP32 troubleshooting notes"
- "What did we decide about the dashboard?"

### Memory Search

**Universal search:**
- "Search memory for camera planning"
- "Find everything about ESP32"
- "What do we have on home automation?"

## Smart Context

The system automatically detects:
- **Project mentions** → Links media/logs to projects
- **Room names** → Tags photos with room context
- **Decisions** → Extracts and logs action items
- **Timelines** → Identifies deadlines and priorities

## Examples

**Natural conversation:**
> "I'm working on the ESP32 project. Here's a photo of the art room placement."

Result:
- Photo archived to `media/archive/`
- Tagged with "ESP32 Optimization" project
- Tagged with "Art Room" location
- Index updated with full context

**Quick capture:**
> "Remember that we need to buy more ESP32s by Friday"

Result:
- Logged as action item
- Linked to ESP32 project
- Friday noted as deadline
