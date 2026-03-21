const rateLimit = require('express-rate-limit');

const journalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 100, // 100 requests/min
  message: 'Too many journal requests, slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = journalLimiter;

