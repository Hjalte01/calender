# Printable Photo Calendar

A small static scaffold for making a cheap-to-print A4 monthly calendar with a photo at the top.

## Run

Open `index.html` in a browser. No build step is required.

## Current Features

- One month per A4 page.
- Upload a photo for the top of the page.
- Change title, accent color, photo height, and week numbers.
- Optionally hide dates from previous and next months.
- Add family members and color-code their events.
- Add events with separate fields for year, month, day, name, family member, and flag.
- Flagged old dates are treated as birthday-style annual events. For example, entering year `2001`, month `5`, day `13`, name `Grandma`, and `/flag_dk` renders as `Grandma (25)` when printing May 2026.
- Supported flag tokens: `/flag_dk`, `/flag_no`, `/flag_se`.
- Import basic `.ics` files or try a public calendar URL. Imported events currently get `/flag_dk` by default because this scaffold is birthday-oriented.
- Saves events, family members, and settings in browser `localStorage`; no database is required.
- Print using the browser print dialog.

## Existing Services I Found

- `kalendersiden.dk`: close to the inspiration site and supports printable calendars with extra options.
- `icalendar.com`: has photo calendar products, but it is more of a finished printing service than a custom local builder.
- `ezcalendars.com` and `printablecal.com`: support printable calendars and calendar data import, but are not the same as this exact slash-token, photo-first, self-hosted flow.

## Project Shape

The first version should stay static and cheap:

1. Browser-only editor for printable A4/PDF output.
2. Local storage for saved calendars.
3. More flag tokens and custom icon tokens.
4. Better `.ics` birthday import, including yearly recurrence handling.
5. Optional batch mode for producing 12 separate monthly pages.
6. Optional server later only if you need account sync, shared calendars, or cloud image storage.

## iPhone Birthday Import Path

The practical path is:

1. Share the iPhone birthdays calendar as a public calendar link and paste it into the calendar link field, or export/download it as an `.ics` file.
2. Import the link or `.ics` file into this tool.
3. Map imported birthday entries to visual tokens like `/flag_dk`, cake icons, or family-specific colors.

Some providers block direct browser reads of calendar links. If link import fails, downloading the `.ics` file and importing it locally is the static-site fallback.
