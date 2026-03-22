const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { age_range, is_free, weekend } = req.query;

  let sql = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  // Age range filter (comma-separated: "newborn,1-2")
  if (age_range) {
    const ages = age_range.split(',').filter(a => ['newborn', '1-2', '3-5'].includes(a));
    if (ages.length > 0) {
      const placeholders = ages.map(() => '?').join(',');
      sql += ` AND age_range IN (${placeholders})`;
      params.push(...ages);
    }
  }

  // Free filter
  if (is_free === 'true') {
    sql += ' AND is_free = 1';
  }

  // Weekend filter
  if (weekend === 'this' || weekend === 'next') {
    const { sat, sun } = getWeekendDates(weekend);
    const satStr = toDateStr(sat);
    const sunStr = toDateStr(sun);
    sql += ' AND event_date >= ? AND event_date <= ?';
    params.push(satStr, sunStr);
  }

  sql += ' ORDER BY event_date ASC, event_time ASC';

  try {
    const events = db.prepare(sql).all(...params);
    res.json({ success: true, events });
  } catch (err) {
    console.error('Events query error:', err);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
});

function getWeekendDates(which) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  let daysToSat = (6 - day + 7) % 7;
  if (daysToSat === 0 && day === 6) daysToSat = 0;
  if (day === 0) daysToSat = 6; // Sunday → next Saturday
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

module.exports = router;
