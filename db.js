const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flotacontrol',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

async function initDB() {
    try {
        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida con éxito.');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(schema);
            console.log('✅ Base de datos inicializada con el esquema de schema.sql.');
        }
        
        connection.release();
    } catch (err) {
        console.error('❌ Error al conectar o inicializar la base de datos MySQL:', err.message);
        console.error('Por favor asegúrate de que MySQL está corriendo y que la base de datos configurada en .env existe.');
    }
}

module.exports = {
    pool,
    initDB
};
