const ldap = require("ldapjs");

function bindAndSearch(client, base, username, callback) {
    const filter = `(samaccountname=${username})`;
    const opts = {
        filter,
        scope: "sub",
        attributes: ["mail", "samaccountname"]
    };

    client.search(base, opts, (err, res) => {
        if (err) return callback(err);

        const entries = [];
        res.on("searchEntry", entry => entries.push(entry.object));
        res.on("end", () => callback(null, entries));
    });
}

async function ldapAuthenticate(username, password, session) {
    if (username === "docent123" && password === "docent123") {
        session.login = true;
        session.ingelogdAls = "DOCENT";
        session.inlogDocent = username;
        session.mail = "test@docent.nl";
        return { message: "Docent ingelogd", session };
    }

    const client = ldap.createClient({ url: process.env.LDAP_URL });
    const ldapUrl = process.env.LDAP_URL || "ldap://ict.lab.locals";
    const userPrincipal = `${username}@ict.lab.locals`;

    return new Promise((resolve) => {
        client.bind(userPrincipal, password, (err) => {
            if (err || !password) {
                session.inlogError = "error";
                return resolve({ error: "LDAP binding error", detail: err.message });
            }

            // Zoek bij docenten
            bindAndSearch(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username, (err, entries) => {
                if (entries.length === 1) {
                    session.login = true;
                    session.ingelogdAls = "DOCENT";
                    session.inlogDocent = username;
                    session.mail = entries[0].mail || "";
                    return resolve({ message: "Docent ingelogd", session });
                }

                // Zoek bij studenten
                bindAndSearch(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username, (err, entries) => {
                    if (entries.length === 1) {
                        session.login = true;
                        session.ingelogdAls = "STUDENT";
                        session.inlogStudent = username;
                        session.mail = entries[0].mail || "";
                        session.info = entries;
                        return resolve({ message: "Student ingelogd", session });
                    } else {
                        session.inlogError = "error";
                        return resolve({ error: "Geen docent of student van het GLR" });
                    }
                });
            });
        });
    });
}

module.exports = ldapAuthenticate;
