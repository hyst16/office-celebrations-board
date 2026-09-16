import "./styles.css";

const WEEKDAY = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long" });
const DATE = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric" });
const app = document.querySelector("#app");
const DISPLAY_RELOAD_MS = 6 * 60 * 60 * 1000;

function chicagoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function displayDate(iso) {
  return DATE.format(new Date(`${iso}T12:00:00Z`));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
function pathOffice() {
  const match = location.pathname.match(/\/display\/([^/]+)/);
  return match?.[1] || location.hash.match(/^#\/display\/([^/]+)/)?.[1] || null;
}
function combined(events) {
  const grouped = new Map();
  for (const event of events) {
    const key = `${event.person}|${event.date}`;
    grouped.set(key, [...(grouped.get(key) || []), event]);
  }
  return [...grouped.values()];
}
function occasion(group) {
  const birthday = group.some(({ type }) => type === "birthday");
  const anniversary = group.find(({ type }) => type === "anniversary");
  if (birthday && anniversary) return `Happy Birthday & ${anniversary.serviceYears ? `${anniversary.serviceYears}-Year Work Anniversary` : "Work Anniversary"}!`;
  if (birthday) return "Happy Birthday!";
  return anniversary.serviceYears ? `Happy ${anniversary.serviceYears}-Year Work Anniversary!` : "Happy Work Anniversary!";
}
function hero(group, preview) {
  const anniversary = group.find(({ type }) => type === "anniversary");
  return `<section class="screen hero" aria-label="${preview ? "Upcoming " : ""}celebration for ${group[0].person}">
    <p class="eyebrow">${preview ? `COMING UP ${WEEKDAY.format(new Date(`${group[0].date}T12:00:00Z`)).toUpperCase()}` : "TODAY'S CELEBRATION"}</p>
    <h1>${escapeHtml(group[0].person)}</h1><p class="occasion">${occasion(group)}</p>
    <p class="date">${preview ? `Celebrating on ${WEEKDAY.format(new Date(`${group[0].date}T12:00:00Z`))}, ${displayDate(group[0].date)}` : displayDate(group[0].date)}</p>
    ${anniversary?.serviceYears ? `<p class="years">${anniversary.serviceYears} years of service</p>` : ""}
  </section>`;
}
function weekly(events, officeName, weekStart) {
  const grouped = events.reduce((byDate, event) => {
    (byDate[event.date] ||= []).push(event);
    return byDate;
  }, {});
  const mondayDate = new Date(`${weekStart}T12:00:00Z`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(mondayDate.getTime() + index * 86400000).toISOString().slice(0, 10);
    const entries = grouped[date] || [];
    return `<article><h2>${WEEKDAY.format(new Date(`${date}T12:00:00Z`))}<small>${displayDate(date)}</small></h2>${entries.length ? entries.map((event) => `<p><strong>${escapeHtml(event.person)}</strong><span>${event.type}${event.serviceYears ? ` · ${event.serviceYears} years` : ""}</span></p>`).join("") : "<p class=\"empty\">No celebrations</p>"}</article>`;
  }).join("");
  return `<section class="screen week" aria-label="Weekly celebrations for ${officeName}"><p class="eyebrow">${officeName}</p><h1>This Week's Celebrations</h1><div class="days">${days}</div></section>`;
}
function noCelebrations(officeName) {
  return `<section class="screen empty-state" aria-live="polite"><p class="eyebrow">${officeName}</p><h1>No celebrations this week</h1><p>Check back next week!</p></section>`;
}
function rotate(slides) {
  let current = 0;
  app.innerHTML = slides[current];
  if (slides.length > 1) setInterval(() => { current = (current + 1) % slides.length; app.innerHTML = slides[current]; }, 12000);
}
async function start() {
  const data = await fetch(`./data/celebrations.json?updated=${Date.now()}`, { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("Celebration data is unavailable.");
    return response.json();
  });
  const slug = pathOffice() || data.offices[0]?.slug;
  const office = data.offices.find((item) => item.slug === slug);
  if (!office) throw new Error("This office display is not configured.");
  const events = data.events.filter((event) => event.office === slug);
  if (!events.length) return rotate([noCelebrations(office.name)]);
  const today = chicagoDate();
  const todayEvents = combined(events.filter((event) => event.date === today));
  const fridayPreviews = new Date(`${today}T12:00:00Z`).getUTCDay() === 5
    ? combined(events.filter((event) => ["6", "0"].includes(String(new Date(`${event.date}T12:00:00Z`).getUTCDay()))))
    : [];
  rotate([...todayEvents.map((event) => hero(event, false)), ...fridayPreviews.map((event) => hero(event, true)), weekly(events, office.name, data.weekStart)]);
}
start().catch((error) => { app.innerHTML = `<section class="screen empty-state"><h1>Display unavailable</h1><p>${error.message}</p></section>`; });
window.setTimeout(() => window.location.reload(), DISPLAY_RELOAD_MS);
