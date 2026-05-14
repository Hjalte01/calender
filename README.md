# Printable Photo Calendar

A small static scaffold for making a cheap-to-print A4 monthly calendar with a photo at the top.

## Run

For manual entry and `.ics` file import, open `index.html` in a browser.

For iPhone calendar links, run the local server so the app can fetch calendars that block browser-only requests:

```bash
node server.js
```

Then open:

```text
http://localhost:8000
```

## Current Features

- One month per A4 page.
- Navigate months with previous/next controls.
- Switch to year overview to see all 12 months at once and select the month you want to edit.
- Upload a separate photo for each month.
- Print a selected month range as one A4 page per month.
- Manage photos from an image drawer with month images and extra images. Bulk-added photos fill empty months in the print range first; overflow goes to Extra.
- Use `Use photo` in the drawer, then click a month photo area or year tile plus target to place it.
- Use top control tabs for Main, Style, Family, and Events instead of one long sidebar.
- Change title, accent color, photo height, and week numbers.
- Optionally hide dates from previous and next months.
- Add family members and color-code their events.
- Add events with separate fields for year, month, day, name, family member, and flag.
- Flagged old dates are treated as birthday-style annual events. For example, entering year `2001`, month `5`, day `13`, name `Grandma`, and `/flag_dk` renders as `Grandma (25)` when printing May 2026.
- Supported flag tokens: `/flag_dk`, `/flag_no`, `/flag_se`.
- Import basic `.ics` files or public calendar URLs. Calendar links work best through `node server.js`; the server only proxies the `.ics` response and does not store it.
- Configure import cleanup with a JavaScript regex that uses named groups: `(?<name>...)` for the displayed name and optional `(?<year>...)` for age calculation.
- Saves events, family members, and settings in browser `localStorage`; no database is required.
- Print using the browser print dialog.

## Existing Services I Found

- `kalendersiden.dk`: close to the inspiration site and supports printable calendars with extra options.
- `icalendar.com`: has photo calendar products, but it is more of a finished printing service than a custom local builder.
- `ezcalendars.com` and `printablecal.com`: support printable calendars and calendar data import, but are not the same as this exact slash-token, photo-first, self-hosted flow.

## Project Shape

The first version should stay cheap and local-first:

1. Browser editor for printable A4/PDF output.
2. Local storage for saved calendars.
3. More flag tokens and custom icon tokens.
4. Better `.ics` birthday import, including yearly recurrence handling.
5. Optional batch mode for producing 12 separate monthly pages.
6. Optional backend later only if you need account sync, shared calendars, or cloud image storage.

## iPhone Birthday Import Path

The practical path is:

1. Share the iPhone birthdays calendar as a public calendar link and paste it into the calendar link field, or export/download it as an `.ics` file.
2. Import the link or `.ics` file into this tool.
3. Map imported birthday entries to visual tokens like `/flag_dk`, cake icons, or family-specific colors.

Some providers block direct browser reads of calendar links. If link import fails from `index.html`, run `node server.js` and use the same link at `http://localhost:8000`.
