# Office Celebrations Board

A full-screen, public GitHub Pages display for office birthdays and work anniversaries. The browser receives only generated weekly data: a person's name, event type, date, service years when supplied, and office. It never receives private BambooHR calendar URLs, raw calendars, birth years, photos, or other HR data.

## Configured offices and TV URLs

Bookmark the matching URL below in the office TV or PosterBooking. Office slugs and display URLs are public; calendar URLs are never public.

<!-- CONFIGURED_OFFICES:START -->

| Office | TV display URL | Birthday secret | Anniversary secret |
| --- | --- | --- | --- |
| Yanka Office | `https://hyst16.github.io/office-celebrations-board/#/display/yanka` | `YANKA_BIRTHDAY_ICAL_URL` | `YANKA_ANNIVERSARY_ICAL_URL` |
| Lincoln Admin Office | `https://hyst16.github.io/office-celebrations-board/#/display/lincolnadmin` | `LINCOLNADMIN_BIRTHDAY_ICAL_URL` | `LINCOLNADMIN_ANNIVERSARY_ICAL_URL` |

### Required workflow YAML

Keep these entries under `jobs.build.steps` -> **Generate public celebration data** -> `env:` in `.github/workflows/deploy-pages.yml`:

```yaml
YANKA_BIRTHDAY_ICAL_URL: ${{ secrets.YANKA_BIRTHDAY_ICAL_URL }}
YANKA_ANNIVERSARY_ICAL_URL: ${{ secrets.YANKA_ANNIVERSARY_ICAL_URL }}
LINCOLNADMIN_BIRTHDAY_ICAL_URL: ${{ secrets.LINCOLNADMIN_BIRTHDAY_ICAL_URL }}
LINCOLNADMIN_ANNIVERSARY_ICAL_URL: ${{ secrets.LINCOLNADMIN_ANNIVERSARY_ICAL_URL }}
```

<!-- CONFIGURED_OFFICES:END -->

Hash routing is intentional because GitHub Pages does not rewrite `/display/<office-slug>` to `index.html`. Do not remove `#/display/` from the saved URL.

## Adding or changing an office

Every office change has four required parts. Complete them together before running the workflow:

1. **Edit `config/offices.json`.** Add one object inside the `[` and `]`, with a comma after every object except the last. `slug` must be lowercase, URL-safe, and unique. Use a public display name and two secret *names*, never the actual BambooHR URLs.
   ```json
   {
     "slug": "austin",
     "name": "Austin Office",
     "birthdaySecret": "AUSTIN_BIRTHDAY_ICAL_URL",
     "anniversarySecret": "AUSTIN_ANNIVERSARY_ICAL_URL"
   }
   ```
2. **Create the two GitHub Actions repository secrets.** Go to **Settings -> Secrets and variables -> Actions -> New repository secret**. Create the exact secret names from the configuration, then paste each private BambooHR iCalendar URL as its value. Secret values are write-only by design, so GitHub shows an empty value field when later editing them.
3. **Add both YAML entries to the workflow.** In `.github/workflows/deploy-pages.yml`, add the birthday and anniversary mappings to the `env:` block shown above. The names must match the config and the repository secrets exactly. A configured secret is not available to the workflow until its YAML mapping exists.
4. **Refresh this README's managed office section.** Run `npm run sync:offices`, commit the resulting README change with the config/workflow change, and run `npm test`. The test fails if the configured office URLs, secret names, or YAML examples in this README become stale.

Then run **Build and deploy celebration displays** manually from the Actions tab. A successful **Generate public celebration data** step confirms the workflow can read and parse every configured feed. Its private Actions log reports each office/feed's total calendar-event count, current-week count, and emitted count, but never logs names, dates, feed URLs, or raw calendar contents. Missing secrets, inaccessible URLs, or invalid calendar data fail the job before anything is deployed.

Each feed must be a valid iCalendar document with `VEVENT` entries, a `SUMMARY` person name, and a `DTSTART` date. Anniversary entries may include `X-SERVICE-YEARS:5`.

## First deployment and refresh schedule

1. In **Settings -> Pages**, set Source to **GitHub Actions**.
2. Configure the secrets and YAML mappings above.
3. Run **Build and deploy celebration displays** once.

The workflow runs daily at `12:00 UTC`: 06:00 Central Standard Time or 07:00 Central Daylight Time. GitHub Actions cron uses UTC and does not adjust for daylight saving time. The display requests fresh generated data without using its browser cache and automatically reloads every six hours, so a continuously open TV will receive a daily deployment without manual intervention. After a deployment that predates this behavior, use a one-time hard refresh (`Ctrl+Shift+R`) or restart the PosterBooking item.

The dashboard uses **America/Chicago** for current-day and Friday-preview decisions. Each screen is visible for 12 seconds: today's celebration heroes, Friday previews for Saturday/Sunday celebrations, then the Monday-Sunday weekly list. A birthday and anniversary for the same person/date share a hero. If no event is in the current week, the display stays on its branded “No celebrations this week / Check back next week!” screen.

## PosterBooking recommendation

Set each PosterBooking office URL to **60 seconds** initially. At the dashboard's 12-second rotation, this gives five display screens per playlist turn: up to four celebration heroes plus the weekly list. On days with fewer events, the display naturally repeats and remains readable.

For offices that regularly have more than four same-day or Friday-preview heroes, use **120 seconds** instead. That gives up to nine heroes plus the weekly list at least one appearance. PosterBooking cannot adapt duration to the day's event count, so choose a fixed duration based on the busiest day you want to guarantee. The formula is:

```text
PosterBooking duration in seconds = 12 x (maximum celebration heroes to guarantee + 1 weekly list)
```

## Local development

`public/data/celebrations.json` is checked in only as clearly synthetic, public sample data. Run:

```bash
npm install
npm test
npm run dev
```

Use `#/display/yanka` locally. `npm run generate:data` requires the configured environment variables and is designed for CI; never place actual feed URLs in files that may be committed.
