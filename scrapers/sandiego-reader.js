/**
 * Scraper for San Diego Reader kids events
 * Source: https://www.sandiegoreader.com/events/for-kids/
 */
const cheerio = require('cheerio');

const BASE_URL = 'https://www.sandiegoreader.com/events/for-kids/';

async function scrape() {
  console.log('[SD Reader] Fetching events...');
  const events = [];

  try {
    const res = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HappyTired/1.0; kids-events-aggregator)',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) {
      console.warn(`[SD Reader] HTTP ${res.status} — skipping`);
      return events;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // SD Reader uses event-list items with date/title/venue info
    $('div.event-list-item, div.event-item, article.event, .event-row').each((i, el) => {
      try {
        const title = $(el).find('h3 a, h2 a, .event-title a, .title a').first().text().trim();
        const venue = $(el).find('.venue, .event-venue, .location').first().text().trim();
        const dateText = $(el).find('.date, .event-date, time').first().text().trim();
        const timeText = $(el).find('.time, .event-time').first().text().trim();
        const link = $(el).find('h3 a, h2 a, .event-title a, .title a').first().attr('href');
        const priceText = $(el).find('.price, .event-price, .cost').first().text().trim();

        if (!title) return;

        // Parse date
        const eventDate = parseDate(dateText);
        if (!eventDate) return;

        // Infer age range from title/description
        const ageRange = inferAgeRange(title + ' ' + venue);

        // Parse price
        const { isFree, price } = parsePrice(priceText);

        const sourceUrl = link
          ? (link.startsWith('http') ? link : `https://www.sandiegoreader.com${link}`)
          : BASE_URL;

        events.push({
          title,
          description: null,
          event_date: eventDate,
          event_time: timeText || null,
          end_time: null,
          location_name: venue || 'San Diego',
          address: null,
          latitude: null,
          longitude: null,
          age_range: ageRange,
          is_free: isFree ? 1 : 0,
          price: price,
          category: inferCategory(title),
          source_url: sourceUrl,
          image_emoji: null,
          is_outdoor: null,
        });
      } catch (err) {
        // Skip malformed entries
      }
    });

    console.log(`[SD Reader] Found ${events.length} events`);
  } catch (err) {
    console.error('[SD Reader] Scrape failed:', err.message);
  }

  return events;
}

function parseDate(text) {
  if (!text) return null;
  try {
    const d = new Date(text);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}

  // Try extracting "March 22" style
  const monthMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})/i);
  if (monthMatch) {
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const month = months[monthMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(monthMatch[2]);
    const year = new Date().getFullYear();
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  }

  return null;
}

function inferAgeRange(text) {
  const t = text.toLowerCase();
  if (/baby|infant|newborn|0-12|0-1\s*year|lap\s*sit|tummy\s*time/.test(t)) return 'newborn';
  if (/toddler|1-2|ages?\s*1|ages?\s*2|little\s*ones/.test(t)) return '1-2';
  if (/preschool|3-5|pre-k|kindergart/.test(t)) return '3-5';
  // Default to 3-5 as most general kids events target this range
  return '3-5';
}

function inferCategory(title) {
  const t = title.toLowerCase();
  if (/story|book|read/.test(t)) return 'storytime';
  if (/music|sing|concert/.test(t)) return 'music';
  if (/art|craft|paint/.test(t)) return 'art';
  if (/science|stem/.test(t)) return 'science';
  if (/yoga|dance|gym/.test(t)) return 'movement';
  if (/puppet|theater|show/.test(t)) return 'theater';
  if (/swim|splash|water/.test(t)) return 'outdoor';
  return null;
}

function parsePrice(text) {
  if (!text) return { isFree: false, price: null };
  const t = text.toLowerCase();
  if (/free|no\s*cost|\$0/.test(t)) return { isFree: true, price: null };
  const match = t.match(/\$(\d+(?:\.\d{2})?)/);
  if (match) return { isFree: false, price: parseFloat(match[1]) };
  return { isFree: false, price: null };
}

module.exports = { scrape };
