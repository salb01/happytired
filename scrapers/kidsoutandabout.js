/**
 * Scraper for Kids Out and About — San Diego
 * Source: https://sandiego.kidsoutandabout.com/
 */
const cheerio = require('cheerio');

const BASE_URL = 'https://sandiego.kidsoutandabout.com/content/things-do-kids-san-diego-weekend';

async function scrape() {
  console.log('[KidsOutAndAbout] Fetching events...');
  const events = [];

  try {
    const res = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HappyTired/1.0; kids-events-aggregator)',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) {
      console.warn(`[KidsOutAndAbout] HTTP ${res.status} — skipping`);
      return events;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // KidsOutAndAbout uses various list formats for events
    $('div.views-row, .node-event, article, .event-listing, li.leaf').each((i, el) => {
      try {
        const titleEl = $(el).find('h2 a, h3 a, .field-name-title a, .title a').first();
        const title = titleEl.text().trim();
        if (!title || title.length < 5) return;

        const link = titleEl.attr('href');
        const dateText = $(el).find('.date-display-single, .field-name-field-date, .event-date, time').first().text().trim();
        const venue = $(el).find('.field-name-field-venue, .venue, .location').first().text().trim();
        const desc = $(el).find('.field-name-body, .description, .summary, p').first().text().trim();
        const priceText = $(el).find('.field-name-field-price, .price').first().text().trim();

        const eventDate = parseDate(dateText);
        if (!eventDate) return;

        const ageRange = inferAgeRange(title + ' ' + desc);
        const { isFree, price } = parsePrice(priceText + ' ' + desc);

        const sourceUrl = link
          ? (link.startsWith('http') ? link : `https://sandiego.kidsoutandabout.com${link}`)
          : BASE_URL;

        events.push({
          title,
          description: desc ? desc.slice(0, 500) : null,
          event_date: eventDate,
          event_time: extractTime(dateText + ' ' + desc),
          end_time: null,
          location_name: venue || 'San Diego',
          address: null,
          latitude: null,
          longitude: null,
          age_range: ageRange,
          is_free: isFree ? 1 : 0,
          price: price,
          category: inferCategory(title + ' ' + desc),
          source_url: sourceUrl,
          image_emoji: null,
          is_outdoor: null,
        });
      } catch (err) {
        // Skip malformed
      }
    });

    console.log(`[KidsOutAndAbout] Found ${events.length} events`);
  } catch (err) {
    console.error('[KidsOutAndAbout] Scrape failed:', err.message);
  }

  return events;
}

function parseDate(text) {
  if (!text) return null;
  try {
    const d = new Date(text);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch (e) {}

  const monthMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})/i);
  if (monthMatch) {
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const month = months[monthMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(monthMatch[2]);
    const year = new Date().getFullYear();
    return new Date(year, month, day).toISOString().split('T')[0];
  }

  return null;
}

function extractTime(text) {
  const match = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
  return match ? match[1] : null;
}

function inferAgeRange(text) {
  const t = text.toLowerCase();
  if (/baby|infant|newborn|0-12|lap\s*sit/.test(t)) return 'newborn';
  if (/toddler|1-2|ages?\s*1|ages?\s*2/.test(t)) return '1-2';
  return '3-5';
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/story|book|read|library/.test(t)) return 'storytime';
  if (/music|sing|concert/.test(t)) return 'music';
  if (/art|craft|paint|draw/.test(t)) return 'art';
  if (/science|stem|experiment/.test(t)) return 'science';
  if (/yoga|dance|gym|tumble/.test(t)) return 'movement';
  if (/puppet|theater|show/.test(t)) return 'theater';
  if (/park|outdoor|garden|hike|beach/.test(t)) return 'outdoor';
  if (/swim|splash|water|pool/.test(t)) return 'outdoor';
  if (/market|fair|festival/.test(t)) return 'festival';
  return null;
}

function parsePrice(text) {
  if (!text) return { isFree: false, price: null };
  const t = text.toLowerCase();
  if (/free|no\s*cost|no\s*charge|\$0/.test(t)) return { isFree: true, price: null };
  const match = t.match(/\$(\d+(?:\.\d{2})?)/);
  if (match) return { isFree: false, price: parseFloat(match[1]) };
  return { isFree: false, price: null };
}

module.exports = { scrape };
