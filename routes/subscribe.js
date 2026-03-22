const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { email, name, age_preferences } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO subscribers (email, name, age_preferences) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET name = COALESCE(excluded.name, name), age_preferences = COALESCE(excluded.age_preferences, age_preferences)'
    );
    stmt.run(email.toLowerCase().trim(), name || null, age_preferences ? JSON.stringify(age_preferences) : null);
    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
