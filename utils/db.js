async function withTransaction(pool, fn) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await fn(connection);
        await connection.commit();
        return result;
    } catch (err) {
        try {
            await connection.rollback();
        } catch {
            // ignore rollback errors
        }
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = { withTransaction };
