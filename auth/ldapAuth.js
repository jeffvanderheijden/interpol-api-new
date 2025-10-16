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

        res.on("searchEntry", (entry) => entries.push(entry.object));
        res.on("error", (err) => callback(err));
        res.on("end", (result) => {
            callback(null, entries);
        });
    });
}

async function ldapAuthenticate(username, password, session) {
    // Testaccount
    if (username === "docent123" && password === "docent123") {
        session.login = true;
        session.ingelogdAls = "DOCENT";
        session.inlogDocent = username;
        session.mail = "test@docent.nl";
        return { message: "Docent ingelogd", session };
    }

    const ldapUrl = process.env.LDAP_URL || "ldap://ict.lab.locals";
    const client = ldap.createClient({ url: ldapUrl });
    const userPrincipal = `${username}@ict.lab.locals`;

    return new Promise((resolve) => {
        client.bind(userPrincipal, password, (err) => {
            if (err || !password) {
                session.inlogError = "error";
                client.unbind();
                return resolve({ error: "LDAP binding error", detail: err?.message });
            }

            // Zoek eerst bij docenten
            bindAndSearch(client, "ou=docenten,dc=ict,dc=lab,dc=locals", username, (err, entries) => {
                if (err) {
                    client.unbind();
                    return resolve({ error: "Zoekfout bij docenten", detail: err.message });
                }

                if (entries.length === 1) {
                    session.login = true;
                    session.ingelogdAls = "DOCENT";
                    session.inlogDocent = username;
                    session.mail = entries[0].mail || "";
                    client.unbind();
                    return resolve({ message: "Docent ingelogd", session });
                }

                // Anders bij studenten
                bindAndSearch(client, "ou=glr_studenten,dc=ict,dc=lab,dc=locals", username, (err, entries) => {
                    if (err) {
                        client.unbind();
                        return resolve({ error: "Zoekfout bij studenten", detail: err.message });
                    }

                    if (entries.length === 1) {
                        session.login = true;
                        session.ingelogdAls = "STUDENT";
                        session.inlogStudent = username;
                        session.mail = entries[0].mail || "";
                        session.info = entries;
                        client.unbind();
                        return resolve({ message: "Student ingelogd", session });
                    } else {
                        session.inlogError = "error";
                        client.unbind();
                        return resolve({ error: "Geen docent of student van het GLR" });
                    }
                });
            });
        });
    });
}

module.exports = ldapAuthenticate;
