const requests = new Map();

export const journalLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 100;

  const ipRequests = requests.get(ip) || [];
  const valid = ipRequests.filter(time => now - time < windowMs);
  valid.push(now);

  if (valid.length > max) {
    return res.status(429).json({ error: 'Too many journal requests, slow down.' });
  }

  requests.set(ip, valid);
  // Cleanup old
  if (requests.size > 1000) requests.clear();

  next();
};

