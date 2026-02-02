const fs = require("fs");
const path = require("path");
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const requireLogin = require('./middleware/authRequired');
const requireTeacher = require('./middleware/teacherRequired');

// ------------------------------------------------------------
// Load environment variables 
// ------------------------------------------------------------
dotenv.config({ path: path.join(__dirname, '.env') });

// ------------------------------------------------------------
// Init Express
// ------------------------------------------------------------
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
const PORT = process.env.PORT || 3000;

// Use uploads folder for static files
const UPLOADS_PATH = path.join(__dirname, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

// ------------------------------------------------------------
// Debug Logger
// ------------------------------------------------------------
const logStream = fs.createWriteStream(
  path.join(process.cwd(), "ldap-debug-node.log"),
  { flags: "a" }
);

function nodeLog(line) {
  const msg = `[${new Date().toISOString()}] ${line}\n`;
  process.stdout.write(msg);
  logStream.write(msg);
}
global.nodeLog = nodeLog;

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'https://localhost:5174',
  'https://dashboard.heijden.sd-lab.nl',
  'https://api.heijden.sd-lab.nl'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ------------------------------------------------------------
// Session
// ------------------------------------------------------------
app.set('trust proxy', 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4,
      domain: '.heijden.sd-lab.nl',
      secure: true,
      sameSite: 'none',
      path: '/',
    },
  })
);

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
const health = require('./routes/health');
const authRoutes = require('./routes/auth');
const challenges = require('./routes/challenges/challenges');
const groups = require('./routes/groups/groups');
const adminGroups = require('./routes/admin/groups/groups');
const adminChallenges = require('./routes/admin/challenges/challenges');
const adminMessages = require("./routes/admin/messages/messages");
const messages = require("./routes/messages/messages");

// Public routes
app.use('/health', health);
app.use('/api', authRoutes);

// Student routes
app.use('/api/challenges', requireLogin, challenges);
app.use('/api/groups', requireLogin, groups);
app.use("/api/messages", requireLogin, messages);

// Admin routes
app.use('/api/admin/groups', requireLogin, requireTeacher, adminGroups);
app.use('/api/admin/challenges', requireLogin, requireTeacher, adminChallenges);
app.use("/api/admin/messages", requireLogin, requireTeacher, adminMessages);

// ------------------------------------------------------------
// Root fallback
// ------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('API for Interpol intro weeks by GLR');
});

// ------------------------------------------------------------
// Global error handler
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR HANDLER:", err);
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
});

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
