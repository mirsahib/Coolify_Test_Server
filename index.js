const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;
const logFile = path.join(__dirname, 'visitors.log');

// 1. Trust proxy (Required for Coolify/Tailscale/Nginx deployments)
// This ensures the rate limiter and our IP tracking uses the real client IP, not the proxy IP.
app.set('trust proxy', 1);

// 2. Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Apply rate limiter to all requests
app.use(limiter);

// 3. Initialize Stats from Log File
let stats = { totalVisits: 0, ipVisits: {} };
if (fs.existsSync(logFile)) {
  try {
    const fileData = fs.readFileSync(logFile, 'utf8');
    const lines = fileData.split('\n').filter(line => line.trim() !== '');
    stats.totalVisits = lines.length;
    lines.forEach(ip => {
      stats.ipVisits[ip] = (stats.ipVisits[ip] || 0) + 1;
    });
  } catch (err) {
    console.error('Error reading log file on startup:', err);
  }
}

// 4. API Route
app.get('/', (req, res) => {
  const ip = req.ip; // Express handles 'trust proxy' automatically
  
  stats.totalVisits++;
  stats.ipVisits[ip] = (stats.ipVisits[ip] || 0) + 1;
  
  // Append-only write
  fs.appendFile(logFile, ip + '\n', (err) => {
    if (err) console.error('Failed to append to log', err);
  });
  
  // Generate Table
  let table = `| IP Address      | Visits |\n`;
  table += `|-----------------|--------|\n`;
  for (const [ipKey, count] of Object.entries(stats.ipVisits)) {
    table += `| ${ipKey.padEnd(15)} | ${count.toString().padEnd(6)} |\n`;
  }
  table += `|-----------------|--------|\n`;
  table += `| TOTAL (All IPs) | ${stats.totalVisits.toString().padEnd(6)} |\n`;

  console.log(`Request from IP: ${ip} | Total visits: ${stats.totalVisits}`);

  res.type('text/plain');
  res.send(`Visitor Statistics:\n\n${table}\n`);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
