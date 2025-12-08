const fs = require("fs");
const path = require("path");
const { pool } = require("./../../../database/database.js");

module.exports = async function putHandler(req, res) {
    const { id } = req.params;
    const { name, className, image_url } = req.body;

    const fields = [];
    const values = [];

    // ------------------------------------------
    // 1. TEAMNAAM & KLAS (partial update)
    // ------------------------------------------
    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({ error: "Teamnaam mag niet leeg zijn." });
        }
        fields.push("name = ?");
        values.push(name);
    }

    if (className !== undefined) {
        if (!className.trim()) {
            return res.status(400).json({ error: "Klas mag niet leeg zijn." });
        }
        fields.push("class = ?");
        values.push(className);
    }

    // ------------------------------------------
    // 2. FOTO UPDATE?
    //    image_url bevat base64 of null
    // ------------------------------------------
    if (image_url !== undefined) {
        if (image_url === null) {
            // Foto verwijderd → leegmaken
            fields.push("image_url = NULL");
        } else if (image_url.startsWith("data:image/")) {
            // Base64 binnengekregen → opslaan als bestand
            const base64 = image_url.replace(/^data:image\/\w+;base64,/, "");
            const fileName = `group_${Date.now()}.png`;

            const uploadRoot = path.join(__dirname, "uploads/groups");
            if (!fs.existsSync(uploadRoot)) {
                fs.mkdirSync(uploadRoot, { recursive: true });
            }

            const fullPath = path.join(uploadRoot, fileName);
            fs.writeFileSync(fullPath, base64, "base64");

            const baseUrl = process.env.API_BASE_URL || "https://api.heijden.sd-lab.nl";
            const publicUrl = `${baseUrl}/uploads/groups/${fileName}`;

            fields.push("image_url = ?");
            values.push(publicUrl);
        } else {
            // Normale URL → direct opslaan
            fields.push("image_url = ?");
            values.push(image_url);
        }
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "Geen wijzigingen ontvangen." });
    }

    try {
        values.push(id);

        await pool.execute(
            `UPDATE groups SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        res.json({ success: true });

    } catch (err) {
        console.error("Admin PUT group error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
