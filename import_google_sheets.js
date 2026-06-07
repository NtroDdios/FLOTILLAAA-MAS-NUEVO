const mysql = require('mysql2/promise');
require('dotenv').config();

const API_URL = "https://script.google.com/macros/s/AKfycbw376Tltkg4bE11VfCtyG6HQ3AhFsgKc6mmvaUUKD_XgJcZ0MfAVLp_N4J-ii_de9U/exec?accion=unidades";

async function importData() {
    console.log('⏳ Conectando a MySQL...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'flotacontrol',
        port: parseInt(process.env.DB_PORT) || 3306,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    console.log('⏳ Descargando datos desde Google Sheets / Apps Script...');
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('La respuesta de Google Sheets no es un arreglo de unidades.');
        }

        console.log(`✅ Descargadas ${data.length} unidades. Limpiando base de datos local...`);
        // Desactivar temporalmente llaves foráneas para limpiar sin errores
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE unidades');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('⏳ Insertando unidades en MySQL...');
        const query = `
            INSERT INTO unidades (id, descripcion, responsable, km_actual, recorridos, intervalo, operador, eco, alerta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const unit of data) {
            const eco = unit.id.replace('U-', '').replace(/^0+/, ''); // Extrae el número eco de forma limpia
            await connection.execute(query, [
                unit.id,
                unit.descripcion || 'Sin descripción',
                unit.responsable || 'Sin asignar',
                unit.km_actual || 0,
                unit.recorridos || 0,
                unit.intervalo || 5000,
                unit.responsable || 'Sin asignar', // Operador por defecto es el responsable
                eco,
                unit.alerta || 'SIN_KM'
            ]);
        }

        console.log('🎉 ¡Importación completada con éxito!');
    } catch (error) {
        console.error('❌ Error al importar los datos:', error.message);
    } finally {
        await connection.end();
    }
}

importData();
