# Project: ESP32 + LD2410 Presence Detection Optimization

## Status
**Created:** 2026-03-18  
**Priority:** This Week  
**Category:** Smart Home / IoT

## Current Setup
- **Hardware:** 9× ESP32 microcontrollers + LD2410 radar sensors
- **Deployment:** Throughout the house (full coverage)
- **Function:** Presence detection
- **Integration:** Connected to Home Assistant
- **Issue:** Feels unoptimized — coverage gaps or overlap issues

## Goal
Optimize presence detection accuracy using **triangulation techniques** — multiple sensors working together to pinpoint location more precisely than single-point detection.

## Research Resources
- **RuView** (https://github.com/ruvnet/RuView): WiFi DensePose implementation
  - ESP32 mesh sensing (3-6 nodes for room coverage)
  - Channel State Information (CSI) analysis
  - Multistatic fusion (N×(N-1) signal paths)
  - ~$8 per ESP32-S3 node
- **LD2410:** 24GHz mmWave radar module (current hardware)
  - Good for single-point presence/motion
  - Limited range/accuracy vs. CSI-based systems

## Potential Approaches

### Option 1: LD2410 Triangulation Network
- Multiple LD2410s per room (3-4 units)
- Overlapping detection zones
- Weighted average of sensor readings for position
- Lower cost, uses existing hardware

### Option 2: WiFi CSI Upgrade (RuView-style)
- Add ESP32-S3 nodes with CSI firmware
- Leverage existing WiFi router signals
- Much higher accuracy (sub-inch with mesh)
- Can detect pose, breathing, not just presence

### Option 3: Hybrid Approach
- LD2410 for presence trigger (fast, low power)
- ESP32 CSI mesh for fine-grained location
- Fallback between systems

## Open Questions
- What's the current LD2410 positioning/room coverage?
- How many ESP32s already deployed?
- Integration with existing HA automation rules?
- Video/resource on triangulation Mat mentioned?

## Reference Videos
- **Triangulation Technique:** https://youtu.be/Lj3wN7UPukg?si=xSgZWdHv_j8WlBpp
  - *Pending review - will extract technique details*

## Floor Plan & Sensor Mapping
Mat will provide:
- [ ] House floor plan with measurements
- [ ] Current ESP32/LD2410 placement (9 units)
- [ ] Problem areas (false positives, dead zones, slow response)

## Triangulation Strategy
With 9 sensors already deployed, we can implement **multilateration**:

1. **Zone-based groups** — 3-4 sensors per room/area for overlapping coverage
2. **Signal strength weighting** — Closest sensor = highest weight
3. **Cross-room tracking** — Handoff between zones as you move
4. **Accuracy improvement targets:**
   - Current: Room-level presence
   - Target: Zone-level (e.g., "kitchen island" vs "kitchen sink")

## Next Steps
1. Mat sends floor plan + current sensor locations
2. I analyze placement for triangulation optimization
3. Propose sensor repositioning (may not need new hardware!)
4. Update ESP32 firmware for coordinated sensing
5. Test in one room, then deploy house-wide

## Related Home Assistant Entities
- Presence sensors (from LD2410)
- Room occupancy states
- Automation triggers (lights, HVAC)

## Notes
- RuView runs entirely local (no cloud)
- ESP32 mesh can be battery-powered
- Consider privacy implications (no cameras, just RF)
- Could enable advanced automations:
  - Room-level HVAC control
  - Predictive lighting (know which room you're heading to)
  - Fall detection for elderly care
