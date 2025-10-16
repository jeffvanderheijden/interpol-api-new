// server.js
// Interpol Intro Weeks API Server
const fs = require("fs");
const path = require("path");
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const authRequired = require('./middleware/authRequired');

dotenv.config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Debugger
const logStream = fs.createWriteStream(path.join(process.cwd(), "ldap-debug-node.log"), { flags: "a" });
function nodeLog(line) {
  const msg = `[${new Date().toISOString()}] ${line}\n`;
  process.stdout.write(msg);
  logStream.write(msg);
}
global.nodeLog = nodeLog;

// ------------------------------------------------------------
// CORS-configuratie
// ------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'https://dashboard.heijden.sd-lab.nl',
  'https://api.heijden.sd-lab.nl'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Pas CORS toe op alle routes en preflight-verzoeken
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// ------------------------------------------------------------
// Session-configuratie
// ------------------------------------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 uur
      domain: '.heijden.sd-lab.nl', // geldig voor alle subdomeinen
      secure: true,       // vereist HTTPS
      sameSite: 'none',   // nodig voor cross-domain cookies
    },
  })
);

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
const health = require('./routes/health');
const authRoutes = require('./routes/auth');
const challenges = require('./routes/challenges');
const groups = require('./routes/groups');
const students = require('./routes/students');

app.use('/health', health);
app.use('/api', authRoutes);
app.use('/api/challenges', authRequired, challenges);
app.use('/api/groups', authRequired, groups);
app.use('/api/students', authRequired, students);

// Fallback route
app.get('/', (req, res) => {
  res.send('API for Interpol intro weeks by GLR');
});

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
