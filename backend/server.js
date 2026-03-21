require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

const journalRoutes = require('./routes/journal');
const journalLimiter = require('./middleware/rateLimit');
app.use('/api/journal', journalLimiter);
app.use('/api', journalRoutes);

// Serve frontend in prod? Later
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
