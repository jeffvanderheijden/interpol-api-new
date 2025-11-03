// auth/ldapAuth.js
const fs = require("fs");
const path = require("path");
const ldap = require("ldapjs");

const logFile = path.join(process.cwd(), "ldap-debug-node.log");
function nodeLog(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, line);
    } catch { }
    process.stdout.write(line);
}

function searchAsync(client, base, username) {
    return new Promise((resolve, reject) => {
        const filter = `(samaccountname=${username})`;
        const opts = {
            filter,
            scope: "sub",
            attributes: ["mail", "samaccountname", "userPrincipalName", "distinguishedName"],
        };

        const entries = [];
        nodeLog(`[LDAP] Searching base="${base}" filter="${filter}"`);

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

            res.once("error", (err) => {
                nodeLog(`[LDAP] Search stream error: ${err.message}`);
                reject(err);
            });

            res.once("end", () => {
                nodeLog(`[LDAP] Search completed (${entries.length} entries)`);
                resolve(entries);
            });
        });
    });
}

async function ldapAuthenticate(username, password, session) {
    nodeLog("--------------------------------------------------");
    nodeLog(`[LOGIN] Attempt for user: ${username}`);

    // Local test accounts (always succeed)
    const testAccounts = [
        { u: "docent123", p: "docent123", type: "DOCENT", mail: "docent@glr.nl" },
        { u: "student123", p: "student123", type: "STUDENT", mail: "student@glr.nl" },
    ];
    const test = testAccounts.find((a) => a.u === username && a.p === password);
    if (test) {
        session.login = true;
        session.ingelogdAls = test.type;
        session.mail = test.mail;
        if (test.type === "DOCENT") session.inlogDocent = username;
        if (test.type === "STUDENT") session.inlogStudent = username;
        nodeLog(`[LOGIN] ${test.type} login success (test account)`);
        return { message: `${test.type} ingelogd (test account)`, session };
    }

    const ldapUrl = "ldap://145.118.4.6";
    const userPrincipal = `${username}@ict.lab.locals`;

    nodeLog(`[LDAP] Connecting to: ${ldapUrl}`);
    nodeLog(`[LDAP] Using userPrincipal: ${userPrincipal}`);

    let client;
    try {
        client = ldap.createClient({
            url: ldapUrl,
            reconnect: false,
            timeout: 5000,
            connectTimeout: 5000,
            idleTimeout: 15000,
            tlsOptions: { rejectUnauthorized: false },
        });

        // ensure socket errors never crash the process
        client.on("error", (e) => {
            nodeLog(`[LDAP] Client socket error: ${e.code || e.message}`);
        });

        // Bind (authenticate)
        await new Promise((resolve, reject) => {
            client.bind(userPrincipal, password, (err) => {
                if (err) {
                    nodeLog(`[LDAP] Bind failed: ${err.name} - ${err.message}`);
                    return reject(err);
                }
                nodeLog(`[LDAP] Bind successful`);
                resolve();
            });
        });

        // Search Docenten
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            const entry = entries[0];
            const mail = entry.mail || entry.userPrincipalName || "";
            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = mail;
            nodeLog(`[LOGIN] DOCENT login success`);
            return { message: "Docent ingelogd", session };
        }

        // Search Studenten
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            const entry = entries[0];
            const mail = entry.mail || entry.userPrincipalName || "";
            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = mail;
            nodeLog(`[LOGIN] STUDENT login success`);
            return { message: "Student ingelogd", session };
        }

        nodeLog("[LDAP] Bind OK but user not found in OUs");
        session.inlogError = "error";
        return { error: "Geen docent of student van het GLR" };
    } catch (err) {
        nodeLog(`[LDAP] Exception: ${err.message}`);
        session.inlogError = "error";
        return { error: "Er is iets fout gegaan", detail: err.message };
    } finally {
        try {
            if (client) {
                client.unbind(() => nodeLog("[LDAP] Connection closed"));
            }
        } catch (e) {
            nodeLog(`[LDAP] Unbind failed: ${e.message}`);
        }
        nodeLog("--------------------------------------------------\n");
    }
}

module.exports = ldapAuthenticate;