import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvents, parseICalendar, weekDates } from "../scripts/ical.mjs";

test("parses folded VEVENT properties", () => {
  const events = parseICalendar("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Avery Sample\r\nDTSTART;VALUE=DATE:20260109\r\nEND:VEVENT\r\nEND:VCALENDAR");
  assert.equal(events[0].SUMMARY, "Avery Sample");
});
test("normalizes only weekly public fields", () => {
  const result = normalizeEvents("BEGIN:VEVENT\nSUMMARY:Jordan Example\nDTSTART:20200109T090000Z\nX-SERVICE-YEARS:5\nEND:VEVENT", "anniversary", "chicago", weekDates("2026-01-05"));
  assert.deepEqual(result, [{ person: "Jordan Example", type: "anniversary", date: "2026-01-09", serviceYears: 5, office: "chicago" }]);
});
