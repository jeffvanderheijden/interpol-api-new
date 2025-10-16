const fs = require("fs");
const path = require("path");
const ldap = require("ldapjs");

// --- Simple file logger ---
const logFile = path.join(process.cwd(), "ldap-debug-node.log");
function nodeLog(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, line);
    } catch {
        // fallback to stdout if file write fails
    }
    process.stdout.write(line);
}

/**
 * Search helper — fetch entries from LDAP and normalize structure
 */
function searchAsync(client, base, username) {
    return new Promise((resolve, reject) => {
        const filter = `(samaccountname=${username})`;
        const opts = {
            filter,
            scope: "sub",
            attributes: ["mail", "samaccountname", "userPrincipalName", "distinguishedName"],
        };

        const entries = [];
        nodeLog(`[LDAP] Searching in base: ${base} with filter: ${filter}`);

        client.search(base, opts, (err, res) => {
            if (err) {
                nodeLog(`[LDAP] Search error: ${err.message}`);
                return reject(err);
            }

            res.on("searchEntry", (entry) => {
                const data =
                    entry.object ||
                    entry.attributes?.reduce?.((acc, attr) => {
                        acc[attr.type] = attr.vals?.[0] || null;
                        return acc;
                    }, {}) ||
                    {};
                entries.push(data);
            });

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
 * Authenticate user via LDAP and update session
 */
async function ldapAuthenticate(username, password, session) {
    nodeLog("--------------------------------------------------");
    nodeLog(`[LOGIN] Attempt for user: ${username}`);

    // Local test accounts
    const testAccounts = [
        { u: "docent123", p: "docent123", type: "DOCENT", mail: "docent@glr.nl" },
        { u: "student1", p: "student1", type: "STUDENT", mail: "student@glr.nl" },
        { u: "student2", p: "student2", type: "STUDENT", mail: "student2@glr.nl" },
    ];
    const test = testAccounts.find((acc) => acc.u === username && acc.p === password);
    if (test) {
        session.login = true;
        session.ingelogdAls = test.type;
        session.mail = test.mail;
        if (test.type === "DOCENT") session.inlogDocent = username;
        if (test.type === "STUDENT") session.inlogStudent = username;
        nodeLog(`[LOGIN] ${test.type} login success (test account)`);
        return { message: `${test.type} ingelogd (test account)`, session };
    }

    // LDAP setup
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

    try {
        // Bind
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

        // Search docenten
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            const entry = entries[0];
            const mail = entry.mail || entry.userPrincipalName || "";
            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = mail;
            nodeLog(`[LOGIN] DOCENT login success, mail=${mail}`);
            return { message: "Docent ingelogd", session };
        }

        // Search studenten
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            const entry = entries[0];
            const mail = entry.mail || entry.userPrincipalName || "";
            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = mail;
            nodeLog(`[LOGIN] STUDENT login success, mail=${mail}`);
            return { message: "Student ingelogd", session };
        }

        // No match
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
