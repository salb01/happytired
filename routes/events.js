const express = require('express');
const router = express.Router();
const { queryEvents } = require('../db/init');

router.get('/', (req, res) => {
  try {
    const events = queryEvents(req.query);
    res.json({ success: true, events });
  } catch (err) {
    console.error('Events query error:', err);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
});

module.exports = router;
