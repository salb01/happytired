const { getSeedEvents } = require('../scrapers/seed-fallback');

let events = null;
const subscribers = [];

function getEvents() {
  if (!events) {
    events = getSeedEvents().map((e, i) => ({ id: i + 1, ...e }));
  }
  return events;
}

function queryEvents({ age_range, is_free, weekend }) {
  let results = getEvents();

  if (age_range) {
    const ages = age_range.split(',').filter(a => ['newborn', '1-2', '3-5'].includes(a));
    if (ages.length > 0) {
      results = results.filter(e => ages.includes(e.age_range));
    }
  }

  if (is_free === 'true') {
    results = results.filter(e => e.is_free === 1);
  }

  if (weekend === 'this' || weekend === 'next') {
    const { sat, sun } = getWeekendDates(weekend);
    const satStr = toDateStr(sat);
    const sunStr = toDateStr(sun);
    results = results.filter(e => e.event_date >= satStr && e.event_date <= sunStr);
  }

  results.sort((a, b) => (a.event_date + (a.event_time || '')).localeCompare(b.event_date + (b.event_time || '')));
  return results;
}

function addSubscriber({ email, name, age_preferences }) {
  const existing = subscribers.find(s => s.email === email);
  if (existing) {
    existing.name = name || existing.name;
    existing.age_preferences = age_preferences || existing.age_preferences;
  } else {
    subscribers.push({ email, name, age_preferences });
  }
}

function getWeekendDates(which) {
  const now = new Date();
  const day = now.getDay();
  let daysToSat = (6 - day + 7) % 7;
  if (daysToSat === 0 && day === 6) daysToSat = 0;
  if (day === 0) daysToSat = 6;
  if (which === 'next') daysToSat += 7;

  const sat = new Date(now);
  sat.setDate(now.getDate() + daysToSat);
  sat.setHours(0, 0, 0, 0);

  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  return { sat, sun };
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

module.exports = { queryEvents, addSubscriber };
