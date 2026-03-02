"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTheme = isValidTheme;
exports.findByTheme = findByTheme;
exports.findById = findById;
const db_1 = require("../../db");
const constants_1 = require("../../config/constants");
function isValidTheme(theme) {
    return constants_1.ALLOWED_THEMES.includes(theme);
}
async function findByTheme(theme) {
    const client = await db_1.pool.connect();
    try {
        let query = `
      SELECT id, title, theme, latitude, longitude, address, practical_info as "practicalInfo"
      FROM gems WHERE is_active = true
    `;
        const params = [];
        if (theme) {
            query += ` AND theme = $1`;
            params.push(theme);
        }
        query += ` ORDER BY title`;
        const { rows } = await client.query(query, params);
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            theme: r.theme,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            address: r.address,
            practicalInfo: r.practicalInfo ?? {},
        }));
    }
    finally {
        client.release();
    }
}
async function findById(id) {
    const client = await db_1.pool.connect();
    try {
        const { rows } = await client.query(`SELECT id, title, theme, description_short as "descriptionShort", address, latitude, longitude, practical_info as "practicalInfo", source_type as "sourceType"
       FROM gems WHERE id = $1 AND is_active = true`, [id]);
        if (rows.length === 0)
            return null;
        const r = rows[0];
        return {
            id: r.id,
            title: r.title,
            theme: r.theme,
            descriptionShort: r.descriptionShort,
            address: r.address,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            practicalInfo: r.practicalInfo ?? {},
            sourceType: r.sourceType,
        };
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=gems.repo.js.map