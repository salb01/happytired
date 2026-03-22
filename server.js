const express = require('express');
const path = require('path');
const eventsRouter = require('./routes/events');
const subscribeRouter = require('./routes/subscribe');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/events', eventsRouter);
app.use('/api/subscribe', subscribeRouter);

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

app.get('/', (req, res) => {
  res.redirect('/events');
});

app.get('/submit', (req, res) => {
  res.send('<html><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>Submit an Event</h1><p>Coming soon! Email <a href="mailto:happytired@polsia.app">happytired@polsia.app</a> to submit.</p></body></html>');
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`HappyTired running at http://localhost:${PORT}`));
}

module.exports = app;
