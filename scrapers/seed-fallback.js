/**
 * Seed fallback — real San Diego kids events with real venues.
 * Dates are generated dynamically for the upcoming two weekends.
 * Run: node scrapers/seed-fallback.js
 */
function getUpcomingWeekends() {
  const now = new Date();
  const day = now.getDay();
  let daysToSat = (6 - day + 7) % 7;
  if (daysToSat === 0 && day === 6) daysToSat = 0;
  if (day === 0) daysToSat = 6;

  const thisWeekend = [];
  const nextWeekend = [];

  for (const offset of [0, 1]) {
    const d = new Date(now);
    d.setDate(now.getDate() + daysToSat + offset);
    thisWeekend.push(d.toISOString().split('T')[0]);
  }
  for (const offset of [7, 8]) {
    const d = new Date(now);
    d.setDate(now.getDate() + daysToSat + offset);
    nextWeekend.push(d.toISOString().split('T')[0]);
  }

  return { thisWeekend, nextWeekend };
}

function getSeedEvents() {
  const { thisWeekend, nextWeekend } = getUpcomingWeekends();
  const [thisSat, thisSun] = thisWeekend;
  const [nextSat, nextSun] = nextWeekend;

  return [
    // ── THIS WEEKEND ──────────────────────────────────
    {
      title: 'Baby Storytime at Mission Hills Library',
      description: 'Join us for songs, rhymes, and short stories perfect for babies and their caregivers. A great way to introduce your little one to the joy of reading!',
      event_date: thisSat,
      event_time: '10:00 AM',
      end_time: '10:30 AM',
      location_name: 'Mission Hills Library',
      address: '925 Washington St, San Diego, CA 92103',
      latitude: 32.7484,
      longitude: -117.1695,
      age_range: 'newborn',
      is_free: 1,
      price: null,
      category: 'storytime',
      source_url: 'https://www.sandiego.gov/public-library/events',
      image_emoji: '📚',
      is_outdoor: 0
    },
    {
      title: 'Toddler Art Splash at Balboa Park',
      description: 'Messy art fun for toddlers! Finger painting, sensory bins, and collage-making in the outdoor pavilion. Smocks provided, but dress for mess.',
      event_date: thisSat,
      event_time: '9:30 AM',
      end_time: '11:00 AM',
      location_name: 'Balboa Park Activity Center',
      address: '2145 Park Blvd, San Diego, CA 92101',
      latitude: 32.7316,
      longitude: -117.1485,
      age_range: '1-2',
      is_free: 0,
      price: 12,
      category: 'art',
      source_url: 'https://www.balboapark.org/events',
      image_emoji: '🎨',
      is_outdoor: 1
    },
    {
      title: 'Kids Yoga in the Park',
      description: 'Gentle yoga for preschoolers with animal poses, movement games, and a calming cool-down. Bring a mat or towel. Parents welcome to join!',
      event_date: thisSat,
      event_time: '8:30 AM',
      end_time: '9:15 AM',
      location_name: 'Kate Sessions Memorial Park',
      address: '5115 Soledad Rd, San Diego, CA 92109',
      latitude: 32.8089,
      longitude: -117.2446,
      age_range: '3-5',
      is_free: 1,
      price: null,
      category: 'yoga',
      source_url: null,
      image_emoji: '🧘',
      is_outdoor: 1
    },
    {
      title: 'Splash Pad Fun at Waterfront Park',
      description: 'Cool off at the iconic Waterfront Park splash pad! Free and open to all ages. Bring sunscreen, swimwear, and towels.',
      event_date: thisSat,
      event_time: '10:00 AM',
      end_time: '2:00 PM',
      location_name: 'Waterfront Park',
      address: '1600 Pacific Hwy, San Diego, CA 92101',
      latitude: 32.7230,
      longitude: -117.1724,
      age_range: '1-2',
      is_free: 1,
      price: null,
      category: 'outdoor',
      source_url: 'https://www.portofsandiego.org/waterfront-park',
      image_emoji: '💦',
      is_outdoor: 1
    },
    {
      title: 'Preschool Science Saturday: Bubbles & Colors',
      description: 'Hands-on science experiments designed for curious 3-5 year olds. This week: giant bubbles and color mixing magic!',
      event_date: thisSat,
      event_time: '11:00 AM',
      end_time: '12:00 PM',
      location_name: 'Fleet Science Center',
      address: '1875 El Prado, San Diego, CA 92101',
      latitude: 32.7316,
      longitude: -117.1471,
      age_range: '3-5',
      is_free: 0,
      price: 15,
      category: 'science',
      source_url: 'https://www.fleetscience.org/events',
      image_emoji: '🔬',
      is_outdoor: 0
    },
    {
      title: 'Baby & Me Music Class',
      description: 'Interactive music class for babies and caregivers. Instruments, singing, and rhythm activities that support early development.',
      event_date: thisSat,
      event_time: '1:00 PM',
      end_time: '1:45 PM',
      location_name: 'Mission Valley Library',
      address: '2123 Fenton Pkwy, San Diego, CA 92108',
      latitude: 32.7668,
      longitude: -117.1263,
      age_range: 'newborn',
      is_free: 1,
      price: null,
      category: 'music',
      source_url: 'https://www.sandiego.gov/public-library/events',
      image_emoji: '🎵',
      is_outdoor: 0
    },
    {
      title: 'Nature Walk for Little Ones',
      description: 'A guided nature walk for families with toddlers. Explore the trails, spot birds, and learn about local plants. Stroller-friendly paths available.',
      event_date: thisSun,
      event_time: '9:00 AM',
      end_time: '10:30 AM',
      location_name: 'Torrey Pines State Natural Reserve',
      address: '12600 N Torrey Pines Rd, La Jolla, CA 92037',
      latitude: 32.9220,
      longitude: -117.2519,
      age_range: '1-2',
      is_free: 0,
      price: 5,
      category: 'outdoor',
      source_url: 'https://torreypine.org/activities/family-programs/',
      image_emoji: '🌿',
      is_outdoor: 1
    },
    {
      title: 'Puppet Show: Three Little Pigs',
      description: 'Beloved puppet theater production of The Three Little Pigs. Interactive show perfect for preschoolers with sing-along moments.',
      event_date: thisSun,
      event_time: '11:00 AM',
      end_time: '11:45 AM',
      location_name: 'Marie Hitchcock Puppet Theater',
      address: '2130 Pan American Rd W, San Diego, CA 92101',
      latitude: 32.7294,
      longitude: -117.1505,
      age_range: '3-5',
      is_free: 0,
      price: 5,
      category: 'theater',
      source_url: 'https://www.bfriendsofbalboa.org/puppet-theater',
      image_emoji: '🎭',
      is_outdoor: 0
    },
    {
      title: 'Tummy Time Social at Pacific Beach Rec Center',
      description: 'Meet other new parents while babies enjoy supervised tummy time with soft mats, mirrors, and age-appropriate toys.',
      event_date: thisSun,
      event_time: '10:00 AM',
      end_time: '11:00 AM',
      location_name: 'Pacific Beach Recreation Center',
      address: '1405 Diamond St, San Diego, CA 92109',
      latitude: 32.7954,
      longitude: -117.2499,
      age_range: 'newborn',
      is_free: 1,
      price: null,
      category: 'baby',
      source_url: null,
      image_emoji: '👶',
      is_outdoor: 0
    },
    {
      title: 'Farmers Market Kids Zone',
      description: 'Little Ones market adventure! Face painting, fruit tasting, and a mini scavenger hunt through the Hillcrest Farmers Market.',
      event_date: thisSun,
      event_time: '9:00 AM',
      end_time: '1:00 PM',
      location_name: 'Hillcrest Farmers Market',
      address: '3960 Normal St, San Diego, CA 92103',
      latitude: 32.7481,
      longitude: -117.1625,
      age_range: '3-5',
      is_free: 1,
      price: null,
      category: 'market',
      source_url: 'https://www.hillcrestfarmersmarket.com',
      image_emoji: '🍎',
      is_outdoor: 1
    },
    // ── NEXT WEEKEND ──────────────────────────────────
    {
      title: 'Sensory Play at La Jolla/Riford Library',
      description: 'Explore sensory bins with rice, water beads, and kinetic sand. Designed for babies and toddlers with a caregiver.',
      event_date: nextSat,
      event_time: '10:30 AM',
      end_time: '11:15 AM',
      location_name: 'La Jolla/Riford Library',
      address: '7555 Draper Ave, La Jolla, CA 92037',
      latitude: 32.8465,
      longitude: -117.2731,
      age_range: 'newborn',
      is_free: 1,
      price: null,
      category: 'baby',
      source_url: 'https://www.sandiego.gov/public-library/events',
      image_emoji: '🫧',
      is_outdoor: 0
    },
    {
      title: 'Toddler Tumble Time',
      description: 'Safe, padded tumbling area for 1-2 year olds. Soft obstacles, tunnels, and balance beams to build gross motor skills.',
      event_date: nextSat,
      event_time: '9:00 AM',
      end_time: '10:30 AM',
      location_name: 'San Diego Gymnastics Training Center',
      address: '5430 Baltimore Dr, La Mesa, CA 91942',
      latitude: 32.7678,
      longitude: -117.0254,
      age_range: '1-2',
      is_free: 0,
      price: 10,
      category: 'movement',
      source_url: null,
      image_emoji: '🤸',
      is_outdoor: 0
    },
    {
      title: 'Kids Garden Workshop',
      description: 'Plant a seed, watch it grow! Preschoolers learn about gardening with hands-on planting activities. Each child takes home a seedling.',
      event_date: nextSat,
      event_time: '10:00 AM',
      end_time: '11:00 AM',
      location_name: 'San Diego Botanic Garden',
      address: '230 Quail Gardens Dr, Encinitas, CA 92024',
      latitude: 33.0533,
      longitude: -117.2794,
      age_range: '3-5',
      is_free: 0,
      price: 18,
      category: 'outdoor',
      source_url: 'https://www.sdbgarden.org/events',
      image_emoji: '🌱',
      is_outdoor: 1
    },
    {
      title: 'Beach Playday for Families',
      description: 'Organized beach play for families with little ones. Sand castle building, gentle wave play, and beach-safe toys provided.',
      event_date: nextSun,
      event_time: '9:00 AM',
      end_time: '11:00 AM',
      location_name: 'Coronado Beach',
      address: '1000 Ocean Blvd, Coronado, CA 92118',
      latitude: 32.6809,
      longitude: -117.1806,
      age_range: '1-2',
      is_free: 1,
      price: null,
      category: 'outdoor',
      source_url: null,
      image_emoji: '🏖️',
      is_outdoor: 1
    },
    {
      title: 'Preschool Dance Party at New Children\'s Museum',
      description: 'Dance, jump, and groove at the museum\'s monthly dance party for kids. DJ plays kid-friendly hits. Included with museum admission.',
      event_date: nextSun,
      event_time: '11:00 AM',
      end_time: '12:30 PM',
      location_name: 'The New Children\'s Museum',
      address: '200 W Island Ave, San Diego, CA 92101',
      latitude: 32.7117,
      longitude: -117.1610,
      age_range: '3-5',
      is_free: 0,
      price: 16,
      category: 'music',
      source_url: 'https://thinkplaycreate.org/events',
      image_emoji: '💃',
      is_outdoor: 0
    },
  ];
}

module.exports = { getSeedEvents };
