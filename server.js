const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const authRequired = require('./middleware/authRequired');

dotenv.config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'https://dashboard.heijden.sd-lab.nl',
  'https://api.heijden.sd-lab.nl'
];

// ✅ CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Handle preflight
app.options('*', cors());

app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      domain: '.heijden.sd-lab.nl', // applies to all subdomains
      secure: true, // required for HTTPS
      sameSite: 'none', // required for cross-site cookies
    },
  })
);

// Routes
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

app.get('/', (req, res) => {
  res.send('API for Interpol intro weeks by GLR');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
