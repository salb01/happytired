const express = require('express');
const path = require('path');
const { getDb } = require('./db/init');
const eventsRouter = require('./routes/events');
const subscribeRouter = require('./routes/subscribe');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = getDb();
app.locals.db = db;

// Middleware
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/subscribe', subscribeRouter);

// Serve events page at /events
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

// Redirect root to /events
app.get('/', (req, res) => {
  res.redirect('/events');
});

// Submit event page placeholder
app.get('/submit', (req, res) => {
  res.send('<html><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>Submit an Event</h1><p>Coming soon! Email <a href="mailto:happytired@polsia.app">happytired@polsia.app</a> to submit.</p></body></html>');
});

app.listen(PORT, () => {
  console.log(`HappyTired running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
