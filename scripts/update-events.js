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
  maxEvents: 25,
  verificationSources: 2, // Verify each event with at least 2 sources
};

async function findAndVerifyEvents() {
  console.log('🔍 Starting event search...');
  
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + CONFIG.lookAheadDays);
  
  const prompt = `Find ${CONFIG.maxEvents} San Diego kids events (ages ${CONFIG.ageRange}) from ${today.toLocaleDateString()} to ${endDate.toLocaleDateString()}.

Categories: Easter/Holiday, Library/Storytime, Museum/Education, Nature/Outdoor, Performance/Show, Arts/Crafts, Play/Activities

Search event sites: San Diego Moms, Kids Out and About SD, Eventbrite, library/museum/park websites.

Return ONLY a JSON array (no text before/after). For each event:
{
  "name": "Event Name",
  "category": "Easter/Holiday|Library/Storytime|Museum/Education|Nature/Outdoor|Performance/Show|Arts/Crafts|Play/Activities",
  "date": "YYYY-MM-DD" or "YYYY-MM-DD to YYYY-MM-DD",
  "time": "HH:MM AM/PM" or "HH:MM AM/PM - HH:MM AM/PM" or "Various times",
  "location": "Venue Name, City",
  "address": "Full street address",
  "ageRange": "Ages X-Y" or "All ages",
  "cost": "Free" or "$X" or "$X-$Y",
  "description": "Brief 1-2 sentence description",
  "sourceUrl": "URL",
  "verificationSources": ["url1", "url2"],
  "verification_status": "VERIFIED" if 2+ sources agree, "SINGLE_SOURCE" if only 1 source, "CONFLICT" if sources disagree,
  "conflicts": "conflict description if any"
}

Verify each event with 2+ sources when possible. Flag conflicts. Sort by date.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: 'You are a JSON-only API. Return ONLY valid JSON arrays with no explanations, preambles, or markdown formatting. Never include any text before or after the JSON array.',
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

    // Extract JSON from response - ULTRA ROBUST VERSION
    let jsonText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        jsonText += block.text;
      }
    }

    console.log('Raw Claude response length:', jsonText.length);
    
    // Clean up the response - try multiple strategies
    jsonText = jsonText.trim();
    
    // Strategy 1: Remove markdown code fences
    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    
    // Strategy 2: Find the JSON array using regex (greedy match)
    let arrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonText = arrayMatch[0];
    }
    
    // Strategy 3: If still has preamble, find first [ and last ]
    const firstBracket = jsonText.indexOf('[');
    const lastBracket = jsonText.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
      jsonText = jsonText.substring(firstBracket, lastBracket + 1);
    }
    
    // Final cleanup: remove any remaining non-JSON text
    jsonText = jsonText.trim();
    
    console.log('Extracted JSON length:', jsonText.length);
    console.log('First 100 chars:', jsonText.substring(0, 100));

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
