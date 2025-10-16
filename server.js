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
  'https://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 4, // 4 uur
    domain: ".interpol.sd-lab.nl", // werkt op alle subdomeinen
    secure: false // zet op true als je HTTPS gebruikt
  }
}));

// Routes
const authRoutes = require('./routes/auth');
const challenges = require('./routes/challenges');
const groups = require('./routes/groups');
const students = require('./routes/students');

app.use('/api', authRoutes);
app.use('/api/challenges', authRequired, challenges);
app.use('/api/groups', authRequired, groups);
app.use('/api/students', authRequired, students);

// Root
app.get('/', (req, res) => {
  res.send('API for interpol intro weeks by GLR');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
