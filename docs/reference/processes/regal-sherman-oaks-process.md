# Regal Sherman Oaks Galleria - Movie Showtimes Process

## Overview
Process to view movie showtimes at Regal Sherman Oaks Galleria theater.

## Theater Info
- **Name:** Regal Sherman Oaks Galleria
- **Address:** 15301 Ventura Blvd, Bldg A, 3rd Floor, Suite 300, Sherman Oaks CA 91403
- **Features:** IMAX with laser, RPX, Recliner Seating

## Process Steps

1. **Navigate to Regal Theaters page**
   - URL: https://www.regmovies.com/theatres

2. **Find Sherman Oaks Galleria**
   - Scroll to California section OR search
   - Link text: "SHERMAN OAKS - REGAL SHERMAN OAKS GALLERIA"
   - URL: https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483

3. **View showtimes**
   - Page loads with all movies and times
   - Formats: Standard, RPX, IMAX

## Sample Showtimes (Tue Mar 17)

| Movie | Runtime | Showtimes |
|-------|---------|-----------|
| Reminders of Him | 1hr 54min | 3:00pm, 3:30pm (RPX), 4:15pm, 6:00pm, 6:30pm (RPX), 7:15pm, 9:00pm, 9:30pm (RPX), 10:15pm |
| Hoppers | 1hr 45min | 1:40pm, 2:15pm, 3:15pm, 3:45pm, 4:00pm (IMAX), 4:40pm (RPX), 6:15pm, 7:00pm (IMAX), 9:00pm |
| Scream 7 | 1hr 54min | 3:45pm, 7:40pm, 8:00pm, 8:30pm, 11:00pm |
| Undertone | 1hr 34min | 1:45pm, 4:30pm, 7:20pm, 10:10pm, 10:50pm |
| Slanted | 1hr 44min | 1:50pm, 4:45pm, 6:40pm, 7:40pm, 10:30pm |
| GOAT | 1hr 40min | 2:40pm, 5:20pm, 7:50pm, 9:30pm |
| The Revenant (10th Anniversary) | 2hr 36min | 3:00pm, 6:40pm, 9:50pm |
| Send Help | 1hr 53min | 3:05pm, 6:45pm, 10:40pm |
| The Bride! | 2hr 6min | 3:10pm, 6:50pm, 9:55pm, 10:00pm |
| Wuthering Heights | 2hr 16min | 4:05pm, 6:20pm, 9:50pm |
| Ready or Not 2 | 1hr 48min | 5:30pm |
| Crime 101 | 2hr 20min | 10:20pm |

## MCP Commands
```bash
# Navigate to theaters list
mcporter call chrome-devtools.navigate_page url="https://www.regmovies.com/theatres"

# Click Sherman Oaks Galleria (uid varies, use snapshot)
mcporter call chrome-devtools.click uid="22_141"

# Get showtimes
mcporter call chrome-devtools.take_snapshot
```

## Notes
- Process verified working: 2026-03-17
- Features IMAX with laser projection
- All theaters have recliner seating
- Some shows marked "NO PASSES"
