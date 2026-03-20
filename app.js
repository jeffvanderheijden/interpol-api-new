const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { config } = require("./config");
const { registerRoutes } = require("./routes");
const { logError } = require("./utils/log");

function createCorsOptions() {
    return {
        origin(origin, callback) {
            if (!origin || config.corsAllowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    };
}

function applyCoreMiddleware(app) {
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use("/uploads", express.static(config.uploadsDir));
}

function applyCorsMiddleware(app) {
    const corsOptions = createCorsOptions();

    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));
}

function applySessionMiddleware(app) {
    app.set("trust proxy", 1);
    app.use(
        session({
            secret: config.sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 4,
                domain: config.sessionCookieDomain,
                secure: true,
                sameSite: "none",
                path: "/",
            },
        })
    );
}

function applyErrorHandler(app) {
    app.use((err, req, res, next) => {
        logError("GLOBAL ERROR HANDLER", err);
        res.status(500).json({
            error: "Server error",
        });
    });
}

function createApp() {
    const app = express();

    applyCoreMiddleware(app);
    applyCorsMiddleware(app);
    applySessionMiddleware(app);
    registerRoutes(app);

    app.get("/", (req, res) => {
        res.send("API for Interpol intro weeks by GLR");
    });

    applyErrorHandler(app);

    return app;
}

module.exports = { createApp };
