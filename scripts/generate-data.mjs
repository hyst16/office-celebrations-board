import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chicagoDate, normalizeEvents, weekDates } from "./ical.mjs";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "public", "data", "celebrations.json");
const offices = JSON.parse(await readFile(resolve(root, "config", "offices.json"), "utf8"));
const week = weekDates(chicagoDate());
const events = [];

for (const office of offices) {
  for (const [type, secret] of [["birthday", office.birthdaySecret], ["anniversary", office.anniversarySecret]]) {
    const url = process.env[secret];
    if (!url) throw new Error(`Missing required environment variable: ${secret}`);
    let response;
    try {
      response = await fetch(url, { headers: { Accept: "text/calendar" } });
    } catch (error) {
      throw new Error(`Unable to fetch ${type} feed for ${office.slug}: ${error.message}`);
    }
    if (!response.ok) throw new Error(`Unable to fetch ${type} feed for ${office.slug}: HTTP ${response.status}`);
    const source = await response.text();
    const normalized = normalizeEvents(source, type, office.slug, week);
    if (!source.includes("BEGIN:VCALENDAR")) throw new Error(`Invalid iCalendar data in ${type} feed for ${office.slug}`);
    events.push(...normalized);
  }
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  timeZone: "America/Chicago",
  weekStart: week[0],
  weekEnd: week.at(-1),
  offices: offices.map(({ slug, name }) => ({ slug, name })),
  events
}, null, 2)}\n`);
console.log(`Wrote ${events.length} public event(s) for ${offices.length} office(s).`);
