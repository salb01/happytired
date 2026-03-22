/**
 * Main scraper runner — combines all sources and seeds the database.
 * Run: npm run scrape
 */
const { getDb } = require('../db/init');
const { scrape: scrapeSdReader } = require('./sandiego-reader');
const { scrape: scrapeKidsOutAndAbout } = require('./kidsoutandabout');
const { getSeedEvents } = require('./seed-fallback');

async function run() {
  const db = getDb();

  console.log('=== HappyTired Event Scraper ===\n');

  // Collect events from all sources
  let allEvents = [];

  // 1. Try web scrapers
  try {
    const sdReaderEvents = await scrapeSdReader();
    allEvents.push(...sdReaderEvents);
    await delay(2000); // Be polite between requests
  } catch (err) {
    console.error('SD Reader scraper error:', err.message);
  }

  try {
    const koaaEvents = await scrapeKidsOutAndAbout();
    allEvents.push(...koaaEvents);
  } catch (err) {
    console.error('KidsOutAndAbout scraper error:', err.message);
  }

  console.log(`\n[Total] Scraped ${allEvents.length} events from web sources`);

  // 2. Always include seed data as a reliable baseline
  const seedEvents = getSeedEvents();
  allEvents.push(...seedEvents);
  console.log(`[Seed] Added ${seedEvents.length} seed events`);

  // 3. Deduplicate by title + date (prefer scraped over seed)
  const seen = new Map();
  for (const ev of allEvents) {
    const key = `${ev.title.toLowerCase().trim()}|${ev.event_date}`;
    if (!seen.has(key)) {
      seen.set(key, ev);
    }
  }
  const uniqueEvents = Array.from(seen.values());
  console.log(`[Dedup] ${uniqueEvents.length} unique events after deduplication`);

  // 4. Insert into database
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO events
    (title, description, event_date, event_time, end_time, location_name, address,
     latitude, longitude, age_range, is_free, price, category, source_url, image_emoji, is_outdoor)
    VALUES
    (@title, @description, @event_date, @event_time, @end_time, @location_name, @address,
     @latitude, @longitude, @age_range, @is_free, @price, @category, @source_url, @image_emoji, @is_outdoor)
  `);

  let inserted = 0;
  const insertMany = db.transaction((events) => {
    for (const ev of events) {
      const result = stmt.run(ev);
      if (result.changes > 0) inserted++;
    }
  });

  insertMany(uniqueEvents);
  console.log(`\n✅ Inserted ${inserted} new events (${uniqueEvents.length - inserted} already existed)`);

  // 5. Cleanup: remove past events
  const today = new Date().toISOString().split('T')[0];
  const cleaned = db.prepare('DELETE FROM events WHERE event_date < ?').run(today);
  if (cleaned.changes > 0) {
    console.log(`🧹 Cleaned ${cleaned.changes} past events`);
  }

  const total = db.prepare('SELECT COUNT(*) as count FROM events').get();
  console.log(`📊 Total events in database: ${total.count}`);

  db.close();
  console.log('\nDone!');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run().catch(err => {
  console.error('Scraper failed:', err);
  process.exit(1);
});
