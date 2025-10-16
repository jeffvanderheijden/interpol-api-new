const fs = require("fs");
const path = require("path");
const ldap = require("ldapjs");

// --- File-based logger ---
const logFile = path.join(process.cwd(), "ldap-debug-node.log");
function nodeLog(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, line);
    } catch (err) {
        // fallback to console if file write fails
        console.log("Log write failed:", err.message);
    }
    process.stdout.write(line);
}

/**
 * Helper: perform an LDAP search and return all entries.
 */
function searchAsync(client, base, username) {
    return new Promise((resolve, reject) => {
        const filter = `(samaccountname=${username})`;
        const opts = {
            filter,
            scope: "sub",
            attributes: ["mail", "samaccountname"],
        };

        const entries = [];
        nodeLog(`[LDAP] Searching in base: ${base} with filter: ${filter}`);

        client.search(base, opts, (err, res) => {
            if (err) {
                nodeLog(`[LDAP] Search error: ${err.message}`);
                return reject(err);
            }

            res.on("searchEntry", (entry) => entries.push(entry.object));
            res.on("error", (err) => {
                nodeLog(`[LDAP] Search stream error: ${err.message}`);
                reject(err);
            });
            res.on("end", () => {
                nodeLog(`[LDAP] Search completed in ${base}, entries found: ${entries.length}`);
                resolve(entries);
            });
        });
    });
}

/**
 * Authenticate a user against the GLR LDAP directory and update the Express session.
 */
async function ldapAuthenticate(username, password, session) {
    nodeLog("--------------------------------------------------");
    nodeLog(`[LOGIN] Attempt for user: ${username}`);

    // Skip LDAP for local test accounts
    const testAccounts = [
        { u: "docent123", p: "docent123", type: "DOCENT", mail: "docent@glr.nl" },
        { u: "student1", p: "student1", type: "STUDENT", mail: "student@glr.nl" },
        { u: "student2", p: "student2", type: "STUDENT", mail: "student2@glr.nl" },
    ];
    const test = testAccounts.find((acc) => acc.u === username && acc.p === password);
    if (test) {
        nodeLog(`[LOGIN] Matched local test account: ${test.u}`);
        session.login = true;
        session.ingelogdAls = test.type;
        session.mail = test.mail;
        if (test.type === "DOCENT") session.inlogDocent = username;
        if (test.type === "STUDENT") session.inlogStudent = username;
        nodeLog(`[LOGIN] ${test.type} login success (test account)`);
        return { message: `${test.type} ingelogd (test account)`, session };
    }

    // --- LDAP configuration ---
    const ldapUrl = "ldap://145.118.4.6";
    const userPrincipal = `${username}@ict.lab.locals`;
    nodeLog(`[LDAP] Connecting to: ${ldapUrl}`);
    nodeLog(`[LDAP] Using userPrincipal: ${userPrincipal}`);

    const client = ldap.createClient({
        url: ldapUrl,
        reconnect: true,
        timeout: 5000,
        connectTimeout: 10000,
        idleTimeout: 30000,
        tlsOptions: { rejectUnauthorized: false },
    });

    client.controls = [
        new ldap.Control({
            type: "1.2.840.113556.1.4.319", // PagedResultsControl
            criticality: false,
        }),
    ];

    try {
        // Step 1: bind (authenticate)
        await new Promise((resolve, reject) =>
            client.bind(userPrincipal, password, (err) => {
                if (err) {
                    nodeLog(`[LDAP] Bind failed: ${err.name} - ${err.message}`);
                    reject(err);
                } else {
                    nodeLog(`[LDAP] Bind successful for: ${userPrincipal}`);
                    resolve();
                }
            })
        );

        // Step 2: search in OU=docenten
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            const entry = entries[0];
            nodeLog(`[LDAP] User found in OU=docenten`);
            nodeLog(`[LDAP] Entry attributes available: ${Object.keys(entry).join(", ")}`);

            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = entry.mail || entry["userPrincipalName"] || "";

            nodeLog("[LOGIN] DOCENT login success");
            return { message: "Docent ingelogd", session };
        }

        // Step 3: search in OU=glr_studenten
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            nodeLog("[LDAP] User found in OU=glr_studenten");
            nodeLog(`[LDAP] Entry attributes available: ${Object.keys(entry).join(", ")}`);

            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = entry.mail || entry["userPrincipalName"] || "";

            nodeLog("[LOGIN] STUDENT login success");
            return { message: "Student ingelogd", session };
        }

        // Step 4: no match
        nodeLog("[LDAP] Bind OK but no user found in docenten or studenten OUs");
        session.inlogError = "error";
        return { error: "Geen docent of student van het GLR" };
    } catch (err) {
        nodeLog(`[LDAP] Error during authentication: ${err.message}`);
        session.inlogError = "error";
        return { error: "LDAP binding of zoekfout", detail: err.message };
    } finally {
        try {
            client.unbind();
            nodeLog("[LDAP] Connection closed");
        } catch (e) {
            nodeLog(`[LDAP] Could not close connection: ${e.message}`);
        }
        nodeLog("--------------------------------------------------\n");
    }
}

module.exports = ldapAuthenticate;
