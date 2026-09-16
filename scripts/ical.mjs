const DAY_MS = 24 * 60 * 60 * 1000;

export function chicagoDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function weekDates(today) {
  const [year, month, day] = today.split("-").map(Number);
  const noonUtc = Date.UTC(year, month - 1, day, 12);
  const offset = (new Date(noonUtc).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) =>
    new Date(noonUtc + (index - offset) * DAY_MS).toISOString().slice(0, 10)
  );
}

export function parseICalendar(text) {
  const lines = text.replace(/\r\n[ \t]/g, "").replace(/\r/g, "").split("\n");
  const events = [];
  let event = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      event = {};
    } else if (line === "END:VEVENT" && event) {
      events.push(event);
      event = null;
    } else if (event) {
      const separator = line.indexOf(":");
      if (separator > 0) {
        const key = line.slice(0, separator).split(";")[0].toUpperCase();
        event[key] = line.slice(separator + 1).trim();
      }
    }
  }
  return events;
}

export function eventDate(value, week) {
  const compact = String(value || "").match(/^(\d{4})(\d{2})(\d{2})/);
  if (!compact) return null;
  const [, , month, day] = compact;
  return week.find((date) => date.slice(5) === `${month}-${day}`) || null;
}

export function normalizeEvents(icalText, type, office, week) {
  return parseICalendar(icalText).flatMap((item) => {
    const date = eventDate(item.DTSTART, week);
    const name = item.SUMMARY?.replace(/\\[,;nN]/g, " ").trim();
    if (!date || !name) return [];
    const years = item["X-SERVICE-YEARS"] || item["X-YEARS-OF-SERVICE"];
    return [{
      person: name,
      type,
      date,
      ...(type === "anniversary" && /^\d{1,2}$/.test(years || "") ? { serviceYears: Number(years) } : {}),
      office
    }];
  });
}
