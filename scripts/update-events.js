import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const CONFIG = {
  location: 'San Diego',
  ageRange: '0-5',
  lookAheadDays: 60, // Look 60 days ahead
  maxEvents: 35,
  verificationSources: 2, // Verify each event with at least 2 sources
};

async function findAndVerifyEvents() {
  console.log('🔍 Starting event search...');
  
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + CONFIG.lookAheadDays);
  
  const prompt = `You are a San Diego kids event researcher. Find ${CONFIG.maxEvents} upcoming events for children ages ${CONFIG.ageRange} in ${CONFIG.location}.

Date range: ${today.toLocaleDateString()} to ${endDate.toLocaleDateString()}

CRITICAL VERIFICATION REQUIREMENTS:
1. For EACH event, search at least ${CONFIG.verificationSources} different sources
2. Cross-verify: venue name, exact dates, times, cost, location/address
3. If sources conflict, flag the event with "verification_status": "CONFLICT" and list conflicts
4. If you can only find 1 source, mark "verification_status": "SINGLE_SOURCE"
5. If 2+ sources agree, mark "verification_status": "VERIFIED"

Event categories to find:
- Easter/Holiday events (egg hunts, holiday celebrations)
- Library storytimes and programs
- Museum programs and activities
- Nature/outdoor activities (gardens, parks, hiking)
- Performances (puppet shows, children's theater, music)
- Arts, crafts, and maker activities
- Play activities and social events
- Educational programs

For each event, return JSON with this EXACT structure:
{
  "name": "Event Name",
  "category": "Easter/Holiday|Library/Storytime|Museum/Education|Nature/Outdoor|Performance/Show|Arts/Crafts|Play/Activities",
  "date": "YYYY-MM-DD" or "YYYY-MM-DD to YYYY-MM-DD" for multi-day,
  "time": "HH:MM AM/PM" or "HH:MM AM/PM - HH:MM AM/PM" or "Various times",
  "location": "Venue Name, City",
  "address": "Full street address",
  "ageRange": "Ages X-Y" or "All ages",
  "cost": "Free" or "$X" or "$X-$Y" or "Free with admission",
  "description": "Brief description (2-3 sentences max)",
  "sourceUrl": "URL of primary source (official event page preferred)",
  "verificationSources": ["source1.com", "source2.com"],
  "verification_status": "VERIFIED|SINGLE_SOURCE|CONFLICT",
  "conflicts": "Description of any conflicts found between sources (if applicable)"
}

IMPORTANT:
- Use web_search extensively - search for each event category separately
- Prioritize official venue websites (museums, libraries, parks)
- Check multiple event calendars (San Diego Moms, Kids Out and About SD, Eventbrite, venue sites)
- DO NOT make up events - only include events you can verify with real sources
- If you find a conflict (wrong venue, wrong date), flag it clearly
- Sort by date (earliest first)

Return ONLY a valid JSON array with no preamble or markdown.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search'
        }
      ],
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    // Extract JSON from response
    let jsonText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        jsonText += block.text;
      }
    }

    // Clean up the response - find the JSON array
    jsonText = jsonText.trim();
    
    // Remove markdown code fences if present
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    // Try to extract JSON array if Claude added preamble text
    const arrayMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      jsonText = arrayMatch[0];
    }
    
    // If still no valid JSON, try to find it after any preamble
    if (!jsonText.startsWith('[')) {
      const jsonStart = jsonText.indexOf('[');
      if (jsonStart !== -1) {
        jsonText = jsonText.substring(jsonStart);
      }
    }

    const events = JSON.parse(jsonText);
    
    console.log(`✅ Found ${events.length} events`);
    
    // Log verification status
    const verified = events.filter(e => e.verification_status === 'VERIFIED').length;
    const singleSource = events.filter(e => e.verification_status === 'SINGLE_SOURCE').length;
    const conflicts = events.filter(e => e.verification_status === 'CONFLICT').length;
    
    console.log(`   - ${verified} fully verified (2+ sources)`);
    console.log(`   - ${singleSource} single source`);
    console.log(`   - ${conflicts} conflicts detected`);
    
    if (conflicts > 0) {
      console.log('\n⚠️  CONFLICTS FOUND:');
      events.filter(e => e.verification_status === 'CONFLICT').forEach(e => {
        console.log(`   - ${e.name}: ${e.conflicts}`);
      });
    }

    return events;
    
  } catch (error) {
    console.error('❌ Error finding events:', error.message);
    throw error;
  }
}

async function validateEvents(events) {
  console.log('\n🔍 Validating events...');
  
  const errors = [];
  const warnings = [];
  
  events.forEach((event, index) => {
    // Required fields
    const required = ['name', 'category', 'date', 'location', 'cost', 'sourceUrl'];
    required.forEach(field => {
      if (!event[field]) {
        errors.push(`Event ${index + 1} (${event.name || 'unnamed'}): Missing ${field}`);
      }
    });
    
    // Date validation
    if (event.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}( to \d{4}-\d{2}-\d{2})?$/;
      if (!dateRegex.test(event.date)) {
        errors.push(`Event ${index + 1} (${event.name}): Invalid date format: ${event.date}`);
      } else {
        // Check if date is in the future
        const eventDate = new Date(event.date.split(' to ')[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          errors.push(`Event ${index + 1} (${event.name}): Date is in the past: ${event.date}`);
        }
      }
    }
    
    // Category validation
    const validCategories = [
      'Easter/Holiday',
      'Library/Storytime',
      'Museum/Education',
      'Nature/Outdoor',
      'Performance/Show',
      'Arts/Crafts',
      'Play/Activities'
    ];
    if (event.category && !validCategories.includes(event.category)) {
      warnings.push(`Event ${index + 1} (${event.name}): Invalid category: ${event.category}`);
    }
    
    // Verification warnings
    if (event.verification_status === 'CONFLICT') {
      warnings.push(`Event ${index + 1} (${event.name}): HAS CONFLICTS - ${event.conflicts}`);
    } else if (event.verification_status === 'SINGLE_SOURCE') {
      warnings.push(`Event ${index + 1} (${event.name}): Only verified from single source`);
    }
    
    // URL validation
    if (event.sourceUrl && !event.sourceUrl.startsWith('http')) {
      errors.push(`Event ${index + 1} (${event.name}): Invalid URL: ${event.sourceUrl}`);
    }
  });
  
  if (errors.length > 0) {
    console.log('\n❌ VALIDATION ERRORS:');
    errors.forEach(err => console.log(`   ${err}`));
    throw new Error(`Validation failed with ${errors.length} errors`);
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warn => console.log(`   ${warn}`));
  }
  
  console.log('✅ Validation passed');
  return true;
}

async function updateEventsFile(events) {
  const eventsPath = join(__dirname, '..', 'events.json');
  
  try {
    // Read existing events
    let existingEvents = [];
    try {
      const existingData = readFileSync(eventsPath, 'utf8');
      existingEvents = JSON.parse(existingData);
      console.log(`\n📄 Found ${existingEvents.length} existing events`);
    } catch (err) {
      console.log('\n📄 No existing events file found, creating new one');
    }
    
    // Compare and log changes
    const newEventNames = new Set(events.map(e => e.name));
    const oldEventNames = new Set(existingEvents.map(e => e.name));
    
    const added = events.filter(e => !oldEventNames.has(e.name));
    const removed = existingEvents.filter(e => !newEventNames.has(e.name));
    const updated = events.filter(e => {
      const old = existingEvents.find(ex => ex.name === e.name);
      return old && JSON.stringify(old) !== JSON.stringify(e);
    });
    
    console.log('\n📊 Changes:');
    console.log(`   + ${added.length} new events`);
    console.log(`   - ${removed.length} removed events`);
    console.log(`   ↻ ${updated.length} updated events`);
    
    if (added.length > 0) {
      console.log('\n✨ New events:');
      added.forEach(e => console.log(`   + ${e.name} (${e.date})`));
    }
    
    if (removed.length > 0) {
      console.log('\n🗑️  Removed events:');
      removed.forEach(e => console.log(`   - ${e.name} (${e.date})`));
    }
    
    // Write updated events
    writeFileSync(eventsPath, JSON.stringify(events, null, 2));
    console.log('\n✅ events.json updated successfully');
    
    // Create summary for commit message
    const summary = {
      timestamp: new Date().toISOString(),
      totalEvents: events.length,
      changes: {
        added: added.length,
        removed: removed.length,
        updated: updated.length
      },
      verificationStats: {
        verified: events.filter(e => e.verification_status === 'VERIFIED').length,
        singleSource: events.filter(e => e.verification_status === 'SINGLE_SOURCE').length,
        conflicts: events.filter(e => e.verification_status === 'CONFLICT').length
      }
    };
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error updating events file:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Happy Tired Event Automation');
  console.log('================================\n');
  
  try {
    // Step 1: Find and verify events
    const events = await findAndVerifyEvents();
    
    // Step 2: Validate events
    await validateEvents(events);
    
    // Step 3: Update events.json
    const summary = await updateEventsFile(events);
    
    console.log('\n✅ SUCCESS!');
    console.log(`📊 Summary: ${summary.totalEvents} events (${summary.changes.added} new, ${summary.changes.removed} removed, ${summary.changes.updated} updated)`);
    
    // Set GitHub Actions output for commit message
    if (process.env.GITHUB_OUTPUT) {
      const message = `🤖 Auto-update: ${summary.totalEvents} events (+${summary.changes.added} -${summary.changes.removed} ↻${summary.changes.updated})`;
      writeFileSync(process.env.GITHUB_OUTPUT, `commit_message=${message}\n`, { flag: 'a' });
    }
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  }
}

main();
