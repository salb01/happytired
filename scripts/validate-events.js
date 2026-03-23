import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function validateEvents() {
  console.log('🔍 Validating events.json...\n');
  
  const eventsPath = join(__dirname, '..', 'events.json');
  
  try {
    const data = readFileSync(eventsPath, 'utf8');
    const events = JSON.parse(data);
    
    console.log(`📊 Total events: ${events.length}\n`);
    
    const errors = [];
    const warnings = [];
    
    events.forEach((event, index) => {
      // Required fields
      const required = ['name', 'category', 'date', 'location', 'cost'];
      required.forEach(field => {
        if (!event[field]) {
          errors.push(`Event ${index + 1}: Missing required field '${field}'`);
        }
      });
      
      // Date validation
      if (event.date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}( to \d{4}-\d{2}-\d{2})?$/;
        if (!dateRegex.test(event.date)) {
          errors.push(`Event ${index + 1} (${event.name}): Invalid date format: ${event.date}`);
        } else {
          // Check if date is in the past
          const eventDate = new Date(event.date.split(' to ')[0]);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (eventDate < today) {
            warnings.push(`Event ${index + 1} (${event.name}): Date is in the past: ${event.date}`);
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
        errors.push(`Event ${index + 1} (${event.name}): Invalid category: ${event.category}`);
      }
      
      // URL validation
      if (event.sourceUrl && !event.sourceUrl.startsWith('http')) {
        errors.push(`Event ${index + 1} (${event.name}): Invalid URL: ${event.sourceUrl}`);
      }
      
      // Duplicate name check
      const duplicates = events.filter(e => e.name === event.name);
      if (duplicates.length > 1) {
        warnings.push(`Event ${index + 1} (${event.name}): Duplicate name found`);
      }
    });
    
    // Summary by category
    console.log('📋 Events by category:');
    const categories = {};
    events.forEach(event => {
      categories[event.category] = (categories[event.category] || 0) + 1;
    });
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    // Verification status
    if (events.some(e => e.verification_status)) {
      console.log('\n🔍 Verification status:');
      const verified = events.filter(e => e.verification_status === 'VERIFIED').length;
      const singleSource = events.filter(e => e.verification_status === 'SINGLE_SOURCE').length;
      const conflicts = events.filter(e => e.verification_status === 'CONFLICT').length;
      console.log(`   ✓ Verified (2+ sources): ${verified}`);
      console.log(`   ⚠ Single source: ${singleSource}`);
      console.log(`   ⚠ Conflicts: ${conflicts}`);
    }
    
    console.log('\n');
    
    if (errors.length > 0) {
      console.log('❌ ERRORS:');
      errors.forEach(err => console.log(`   ${err}`));
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      warnings.forEach(warn => console.log(`   ${warn}`));
      console.log('');
    }
    
    if (errors.length > 0) {
      console.log(`❌ Validation FAILED with ${errors.length} errors\n`);
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log(`⚠️  Validation PASSED with ${warnings.length} warnings\n`);
    } else {
      console.log('✅ Validation PASSED - No errors or warnings!\n');
    }
    
  } catch (error) {
    console.error('❌ Error reading or parsing events.json:', error.message);
    process.exit(1);
  }
}

validateEvents();
