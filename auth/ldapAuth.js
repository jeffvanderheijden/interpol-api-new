const ldap = require("ldapjs");

/**
 * Performs an LDAP search and resolves with all found entries.
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

        client.search(base, opts, (err, res) => {
            if (err) return reject(err);

            res.on("searchEntry", (entry) => entries.push(entry.object));
            res.on("error", (err) => reject(err));
            res.on("end", () => resolve(entries));
        });
    });
}

/**
 * Authenticates a user against the GLR LDAP server and updates the Express session.
 */
async function ldapAuthenticate(username, password, session) {
    // Local test accounts (bypass LDAP)
    const testAccounts = [
        { u: "docent123", p: "docent123", type: "DOCENT", mail: "docent@glr.nl" },
        { u: "student123", p: "student123", type: "STUDENT", mail: "student@glr.nl" },
    ];

    const test = testAccounts.find((acc) => acc.u === username && acc.p === password);
    if (test) {
        session.login = true;
        session.ingelogdAls = test.type;
        session.mail = test.mail;
        if (test.type === "DOCENT") session.inlogDocent = username;
        if (test.type === "STUDENT") session.inlogStudent = username;
        return { message: `${test.type} ingelogd`, session };
    }

    // --- LDAP configuration (hard-coded IP) ---
    const ldapUrl = "ldap://145.118.4.6"; // same as in PHP version
    const client = ldap.createClient({ url: ldapUrl });
    const userPrincipal = `${username}@ict.lab.locals`;

    try {
        // Step 1: bind (authenticate)
        await new Promise((resolve, reject) =>
            client.bind(userPrincipal, password, (err) => (err ? reject(err) : resolve()))
        );
        console.log(`LDAP bind succeeded for ${username}`);

        // Step 2: search for teachers
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = entries[0].mail || "";
            return { message: "Docent ingelogd", session };
        }

        // Step 3: search for students
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = entries[0].mail || "";
            session.info = entries;
            return { message: "Student ingelogd", session };
        }

        // Step 4: no match found
        session.inlogError = "error";
        console.warn(`LDAP: no matching user found for ${username}`);
        return { error: "Geen docent of student van het GLR" };

    } catch (err) {
        // LDAP bind or search failure
        console.error("LDAP authentication error:", err);
        session.inlogError = "error";
        return { error: "LDAP binding of zoekfout", detail: err.message };

    } finally {
        // Always close the LDAP connection
        try {
            client.unbind();
        } catch (e) {
            console.warn("Kon LDAP-verbinding niet netjes sluiten:", e.message);
        }
    }
}

module.exports = ldapAuthenticate;
