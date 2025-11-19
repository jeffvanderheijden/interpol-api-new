const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const cors = require("cors");
const requireLogin = require("./middleware/authRequired");

// ------------------------------------------
// LOAD ENVIRONMENT VARIABLES
// ------------------------------------------
dotenv.config();

console.log("🌍 Loaded ENV:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS ? "SET" : "EMPTY",
  SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "EMPTY",
});

// ------------------------------------------
// EXPRESS INIT
// ------------------------------------------
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const PORT = process.env.PORT || 3000;

// ------------------------------------------
// DEBUG LOGGER
// ------------------------------------------
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

// ------------------------------------------
// CORS CONFIG
// ------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost:5173",
  "https://dashboard.heijden.sd-lab.nl",
  "https://api.heijden.sd-lab.nl"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ------------------------------------------
// SESSION CONFIG
// ------------------------------------------
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: process.env.SESSION_MAX_AGE || 1000 * 60 * 60 * 4,
      domain: ".heijden.sd-lab.nl",
      secure: true,
      sameSite: "none",
      path: "/",
    },
  })
);

// ------------------------------------------
// ROUTES
// ------------------------------------------
app.use("/health", require("./routes/health"));
app.use("/api", require("./routes/auth"));
app.use("/api/challenges", requireLogin, require("./routes/challenges"));
app.use("/api/groups", requireLogin, require("./routes/groups/groups"));
app.use("/api/students", requireLogin, require("./routes/students"));

// Root fallback
app.get("/", (req, res) => {
  res.send("API for Interpol intro weeks by GLR");
});

// ------------------------------------------
// GLOBAL ERROR HANDLER
// ------------------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR HANDLER:", err);
  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
});

// ------------------------------------------
// START SERVER
// ------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
