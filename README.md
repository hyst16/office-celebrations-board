# Office Celebrations Board

A full-screen, public GitHub Pages display for office birthdays and work anniversaries. The browser receives only a generated weekly data file containing a person's name, occasion type, celebration date, service years when provided, and office slug. It never receives source calendar URLs, calendar descriptions, birth years, photos, or raw HR calendar data.

## Display URLs

The deployed app supports `https://<owner>.github.io/<repo>/#/display/chicago`. Hash routing is intentionally used because GitHub Pages does not rewrite `/display/<office-slug>` to `index.html`. On a host that provides a rewrite fallback, `/display/chicago` also works.

The dashboard uses **America/Chicago** for current-day and Friday-preview decisions. It rotates each applicable hero and then the Monday–Sunday list every 12 seconds. Friday adds preview heroes for Saturday/Sunday celebrations, explicitly labeled with their actual day; those events appear again as standard heroes on their actual dates. Birthday and anniversary on the same date/person combine into one hero.

## First deployment

1. In **Settings → Pages**, set Source to **GitHub Actions**.
2. Add Actions secrets for every configured office. The default Chicago office requires `CHICAGO_BIRTHDAY_ICAL_URL` and `CHICAGO_ANNIVERSARY_ICAL_URL`. Their values are the respective private iCalendar URLs; do not add them to repository files or browser configuration.
3. Run **Build and deploy celebration displays** from the Actions tab once, or wait for the daily schedule.

The scheduled workflow runs at `12:00 UTC`, which is 06:00 Central Standard Time and 07:00 Central Daylight Time. GitHub Actions cron is UTC-only and does not shift with DST. Adjust the cron expression if a different UTC execution time is required.

## Adding an office

Add an object to `config/offices.json` with a lowercase URL-safe `slug`, public display `name`, and the names of two Actions secrets:

```json
{
  "slug": "austin",
  "name": "Austin Office",
  "birthdaySecret": "AUSTIN_BIRTHDAY_ICAL_URL",
  "anniversarySecret": "AUSTIN_ANNIVERSARY_ICAL_URL"
}
```

Then create both corresponding repository secrets and deploy. Each feed must be a valid iCalendar document with `VEVENT` entries, a `SUMMARY` person name, and a `DTSTART` date. Anniversary entries may include `X-SERVICE-YEARS:5`. Invalid/missing feeds or secrets fail the workflow before the artifact is uploaded or deployed; errors identify the office and source in Actions logs. The generator intentionally emits no data from a failed source.

## Local development

`public/data/celebrations.json` is checked in only as clearly synthetic, public sample data. Run:

```bash
npm install
npm test
npm run dev
```

Use `#/display/chicago` locally. `npm run generate:data` requires the configured environment variables and is designed for CI; never place actual feed URLs in `.env` files that may be committed.
