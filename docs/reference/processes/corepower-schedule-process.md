# CorePower Yoga Schedule - Auto-Load Process

## Overview
This document describes the automated process for loading Mat's preferred CorePower Yoga schedule using the "Main" favorites filter.

## Process Steps

1. **Navigate to CorePower homepage**
   - URL: https://www.corepoweryoga.com/

2. **Click "BOOK" tab**
   - Located in top navigation bar
   - URL after click: https://www.corepoweryoga.com/yoga-schedules

3. **Click Favorites dropdown**
   - Shows heart icon + "Main" + chevron down
   - Dropdown reveals: "Main" and "Edit favorites" options

4. **Select "Main" from dropdown**
   - This applies the preferred filter
   - Page reloads with "Main" highlighted

5. **Result: Filter (2) active**
   - Studios: Encino + Sherman Oaks
   - Class types: Yoga Sculpt, C2, etc. (based on favorites)

## Current Schedule (Example - Tue Mar 17)
- 4:30pm: YS - Yoga Sculpt @ Sherman Oaks (Ling C)
- 5:30pm: YS - Yoga Sculpt @ Encino (Gabriella D - SUB)
- 7:00pm: C2 @ Encino (CANCELLED)
- 7:00pm: YS @ Sherman Oaks (John S)
- 7:30pm: YS @ Encino (Chloe B)

## MCP Commands
```bash
# Navigate to CorePower
mcporter call chrome-devtools.navigate_page url="https://www.corepoweryoga.com/"

# Click BOOK tab (uid may vary, use snapshot to find)
mcporter call chrome-devtools.click uid="15_19"

# Click favorites dropdown chevron
mcporter call chrome-devtools.click uid="16_37"

# Select Main
mcporter call chrome-devtools.click uid="18_1"

# Get schedule
mcporter call chrome-devtools.take_snapshot
```

## Notes
- Process verified working: 2026-03-17
- Requires shared browser coworking session
- "Main" filter = Encino + Sherman Oaks studios
