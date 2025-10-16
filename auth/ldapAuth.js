const ldap = require("ldapjs");

/**
 * Helper: voert een LDAP-zoekopdracht uit en retourneert alle gevonden entries.
 * @param {ldap.Client} client - Een actieve LDAP-client
 * @param {string} base - Base DN (bijv. "ou=docenten,dc=ict,dc=lab,dc=locals")
 * @param {string} username - samaccountname van gebruiker
 * @returns {Promise<Array>} - Lijst met LDAP entries
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
 * LDAP authenticatie
 * @param {string} username
 * @param {string} password
 * @param {object} session - Express session object
 * @returns {Promise<object>} - Resultaatobject met message of error
 */
async function ldapAuthenticate(username, password, session) {
    // Testaccounts (bypass LDAP)
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

    // LDAP configuratie
    const ldapUrl = process.env.LDAP_URL || "ldap://ict.lab.locals";
    const client = ldap.createClient({ url: ldapUrl });
    const userPrincipal = `${username}@ict.lab.locals`;

    try {
        // Stap 1: binden met opgegeven gebruiker
        await new Promise((resolve, reject) =>
            client.bind(userPrincipal, password, (err) => (err ? reject(err) : resolve()))
        );

        // Stap 2: zoek in docenten
        let entries = await searchAsync(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            session.login = true;
            session.ingelogdAls = "DOCENT";
            session.inlogDocent = username;
            session.mail = entries[0].mail || "";
            return { message: "Docent ingelogd", session };
        }

        // Stap 3: zoek in studenten
        entries = await searchAsync(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username);
        if (entries.length === 1) {
            session.login = true;
            session.ingelogdAls = "STUDENT";
            session.inlogStudent = username;
            session.mail = entries[0].mail || "";
            session.info = entries;
            return { message: "Student ingelogd", session };
        }

        // Geen match gevonden
        session.inlogError = "error";
        return { error: "Geen docent of student van het GLR" };
    } catch (err) {
        console.error("LDAP authenticatie fout:", err);
        session.inlogError = "error";
        return { error: "LDAP binding of zoekfout", detail: err.message };
    } finally {
        // Sluit altijd de verbinding, ook bij fouten
        try {
            client.unbind();
        } catch (e) {
            console.warn("Kon LDAP-verbinding niet netjes sluiten:", e.message);
        }
    }
}

module.exports = ldapAuthenticate;
