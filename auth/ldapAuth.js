const ldap = require("ldapjs");

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
        console.log(`[LDAP] Searching in base: ${base} with filter: ${filter}`);

        client.search(base, opts, (err, res) => {
            if (err) {
                console.error("[LDAP] Search error:", err.message);
                return reject(err);
            }

            res.on("searchEntry", (entry) => entries.push(entry.object));
            res.on("error", (err) => {
                console.error("[LDAP] Search stream error:", err.message);
                reject(err);
            });
            res.on("end", () => {
                console.log(
                    `[LDAP] Search completed in ${base}, entries found: ${entries.length}`
                );
                resolve(entries);
            });
        });
    });
}

/**
 * Authenticate a user against the GLR LDAP directory and update the Express session.
 */
async function ldapAuthenticate(username, password, session) {
    console.log("--------------------------------------------------");
    console.log(`[LOGIN] Attempt for user: ${username}`);

    // Skip LDAP for local test accounts
    const testAccounts = [
        { u: "docent123", p: "docent123", type: "DOCENT", mail: "docent@glr.nl" },
        { u: "student1", p: "student1", type: "STUDENT", mail: "student@glr.nl" },
        { u: "student2", p: "student2", type: "STUDENT", mail: "student2@glr.nl" },
    ];
    const test = testAccounts.find((acc) => acc.u === username && acc.p === password);
    if (test) {
        console.log("[LOGIN] Matched local test account:", test.u);
        session.login = true;
        session.ingelogdAls = test.type;
        session.mail = test.mail;
        if (test.type === "DOCENT") session.inlogDocent = username;
        if (test.type === "STUDENT") session.inlogStudent = username;
        return { message: `${test.type} ingelogd (test account)`, session };
    }

    // --- LDAP configuration ---
    const ldapUrl = "ldap://145.118.4.6";
    const userPrincipal = `${username}@ict.lab.locals`;
    console.log("[LDAP] Connecting to:", ldapUrl);
    console.log("[LDAP] Using userPrincipal:", userPrincipal);

    // Create LDAP client with options similar to PHP defaults
    const client = ldap.createClient({
        url: ldapUrl,
        reconnect: true,
        timeout: 5000,
        connectTimeout: 10000,
        idleTimeout: 30000,
        tlsOptions: { rejectUnauthorized: false },
    });

    // Optional: handle referrals and paged results (Active Directory friendly)
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
                    console.error("[LDAP] Bind failed:", err.name, err.message);
                    reject(err);
                } else {
                    console.log("[LDAP] Bind successful for:", userPrincipal);
                    resolve();
                }
            })
        );

        // Step 2: search in OU=docenten
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            console.log("[LDAP] User found in OU=docenten");
            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = entries[0].mail || "";
            return { message: "Docent ingelogd", session };
        }

        // Step 3: search in OU=glr_studenten
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            console.log("[LDAP] User found in OU=glr_studenten");
            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = entries[0].mail || "";
            session.info = entries;
            return { message: "Student ingelogd", session };
        }

        // Step 4: no match
        console.warn("[LDAP] Bind OK but no user found in docenten or studenten OUs");
        session.inlogError = "error";
        return { error: "Geen docent of student van het GLR" };
    } catch (err) {
        console.error("[LDAP] Error during authentication:", err);
        session.inlogError = "error";
        return { error: "LDAP binding of zoekfout", detail: err.message };
    } finally {
        try {
            client.unbind();
            console.log("[LDAP] Connection closed");
        } catch (e) {
            console.warn("[LDAP] Could not close connection:", e.message);
        }
        console.log("--------------------------------------------------\n");
    }
}

module.exports = ldapAuthenticate;
