const express = require('express');
const router = express.Router();
const { addSubscriber } = require('../db/init');

router.post('/', (req, res) => {
  const { email, name, age_preferences } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
    addSubscriber({
      email: email.toLowerCase().trim(),
      name: name || null,
      age_preferences: age_preferences ? JSON.stringify(age_preferences) : null
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
