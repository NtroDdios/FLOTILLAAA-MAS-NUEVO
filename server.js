const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, initDB } = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists in the host machine working directory (outside snapshot)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve Frontend PWA static files
app.use(express.static(__dirname));

// Multer Config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size
});

// SSE Clients for real-time chat
let sseClients = [];

function sendSSEMessage(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => client.write(payload));
}

// ── API ENDPOINTS ────────────────────────────────────────────────────────

// SSE Stream for chats
app.get('/api/chats/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);

    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

// GET endpoints (unified routing like Google Apps Script)
app.get('/api', async (req, res) => {
    const { accion, mes, anio, usuario, clave } = req.query;

    try {
        if (accion === 'unidades') {
            const [rows] = await pool.query('SELECT * FROM unidades');
            return res.json(rows);
        }

        if (accion === 'reporte_mensual') {
            if (!mes || !anio) {
                return res.status(400).json({ ok: false, error: 'Mes y año requeridos' });
            }
            const [rows] = await pool.query(
                `SELECT id_unidad, tipo, DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') as fecha, tecnico, km 
                 FROM servicios 
                 WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
                 ORDER BY fecha DESC`,
                [parseInt(mes), parseInt(anio)]
            );
            return res.json({ ok: true, total: rows.length, servicios: rows });
        }

        if (accion === 'login') {
            // Note: Frontend has USERS local checks, this is a fallback / backend validation helper
            // We can return ok: true if credentials match or simulate Apps Script success
            return res.json({ ok: true, usuario, rol: 'Tecnico', nombre: usuario });
        }

        // Fetch recent chats (historical backlog)
        if (accion === 'chats') {
            const [rows] = await pool.query('SELECT * FROM chats ORDER BY timestamp ASC LIMIT 80');
            return res.json(rows);
        }

        return res.status(400).json({ ok: false, error: 'Accion no valida' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// POST endpoints (unified routing like Google Apps Script)
app.post('/api', async (req, res) => {
    const body = req.body;
    const { accion } = body;

    try {
        if (accion === 'registrar_servicio') {
            const { id_unidad, tipo, km, tecnico, costo, notas, consumibles } = body;
            
            const [servResult] = await pool.query(
                'INSERT INTO servicios (id_unidad, tipo, km, tecnico, costo, notas) VALUES (?, ?, ?, ?, ?, ?)',
                [id_unidad, tipo, km, tecnico, costo || 0, notas || '']
            );
            const id_servicio = servResult.insertId;

            if (consumibles && Array.isArray(consumibles)) {
                for (const item of consumibles) {
                    if (item.producto) {
                        await pool.query(
                            'INSERT INTO consumibles (id_servicio, producto, cantidad, costo_unitario) VALUES (?, ?, ?, ?)',
                            [id_servicio, item.producto, item.cantidad || 1, item.costo_unitario || 0]
                        );
                    }
                }
            }

            // Update unit mileage in units table
            await updateUnitMileage(id_unidad, km);

            return res.json({ ok: true, id_servicio });
        }

        if (accion === 'actualizar_km') {
            const { id_unidad, km } = body;
            await updateUnitMileage(id_unidad, km);
            return res.json({ ok: true });
        }

        if (accion === 'registrar_afinacion') {
            const { id_unidad, km, fecha } = body;

            await pool.query(
                'INSERT INTO afinaciones (id_unidad, km, fecha) VALUES (?, ?, ?)',
                [id_unidad, km, fecha]
            );

            // Reset unit mileage run since this tuning restart
            await pool.query(
                `UPDATE unidades 
                 SET km_actual = ?, recorridos = 0, alerta = 'AL_DIA' 
                 WHERE id = ?`,
                [km, id_unidad]
            );

            return res.json({ ok: true });
        }

        if (accion === 'ajustar_intervalo') {
            const { nuevo_intervalo } = body;

            // Save interval in configuration table
            await pool.query(
                'INSERT INTO configuracion (clave, valor) ON DUPLICATE KEY UPDATE valor = ?',
                ['intervalo_mantenimiento', String(nuevo_intervalo)]
            );

            // Update all units interval
            await pool.query('UPDATE unidades SET intervalo = ?', [nuevo_intervalo]);

            // Recalculate alerts for all units
            await pool.query(`
                UPDATE unidades 
                SET alerta = CASE 
                    WHEN (recorridos / intervalo) * 100 > 100 THEN 'URGENTE'
                    WHEN (recorridos / intervalo) * 100 > 60 THEN 'PROXIMO'
                    ELSE 'AL_DIA'
                END
            `);

            return res.json({ ok: true });
        }

        if (accion === 'enviar_pdf_checklist') {
            // Replaces Google Apps Script Gmail notification
            console.log('📄 Simulación: Enviando checklist por correo...');
            console.log('Destinatarios:', body.destinatarios);
            console.log('Asunto:', body.subject);
            return res.json({ ok: true });
        }

        if (accion === 'reporte_demanda') {
            console.log('📧 Simulación: Enviando reporte ejecutivo a todo el equipo...');
            return res.json({ ok: true });
        }

        return res.status(400).json({ ok: false, error: 'Accion no valida' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// Helper: Calculate unit mileage run based on last tuning
async function updateUnitMileage(unitId, newKM) {
    // 1. Get last tuning mileage
    const [tuningRows] = await pool.query(
        'SELECT km FROM afinaciones WHERE id_unidad = ? ORDER BY fecha_registro DESC LIMIT 1',
        [unitId]
    );

    let recorridos = 0;
    if (tuningRows.length > 0) {
        const lastTuningKM = tuningRows[0].km;
        recorridos = Math.max(0, newKM - lastTuningKM);
    } else {
        // If no tuning, use current km_actual and recorrer logic
        const [unitRows] = await pool.query('SELECT km_actual, recorridos FROM unidades WHERE id = ?', [unitId]);
        if (unitRows.length > 0) {
            const prevKM = unitRows[0].km_actual || 0;
            const prevRec = unitRows[0].recorridos || 0;
            const lastServiceKM = prevKM > 0 ? (prevKM - prevRec) : newKM;
            recorridos = Math.max(0, newKM - lastServiceKM);
        }
    }

    // Get interval config
    const [configRows] = await pool.query('SELECT valor FROM configuracion WHERE clave = ?', ['intervalo_mantenimiento']);
    const interval = configRows.length > 0 ? parseInt(configRows[0].valor) : 5000;

    const pct = (recorridos / interval) * 100;
    let alerta = 'AL_DIA';
    if (pct > 100) alerta = 'URGENTE';
    else if (pct > 60) alerta = 'PROXIMO';

    await pool.query(
        'UPDATE unidades SET km_actual = ?, recorridos = ?, alerta = ? WHERE id = ?',
        [newKM, recorridos, alerta, unitId]
    );
}

// Upload file endpoint (Images/Audios/Docs)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, error: 'Archivo no enviado' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.json({ ok: true, url: fileUrl });
});

// Chat REST APIs (Save and notify)
app.post('/api/chats', async (req, res) => {
    const { texto, fotoUrl, audioUrl, docUrl, docName, usuario, nombre, rol } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO chats (texto, fotoUrl, audioUrl, docUrl, docName, usuario, nombre, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [texto || '', fotoUrl || '', audioUrl || '', docUrl || '', docName || '', usuario, nombre, rol]
        );

        const newMsg = {
            id: result.insertId,
            texto: texto || '',
            fotoUrl: fotoUrl || '',
            audioUrl: audioUrl || '',
            docUrl: docUrl || '',
            docName: docName || '',
            usuario,
            nombre,
            rol,
            timestamp: new Date()
        };

        // Notify all SSE clients
        sendSSEMessage({ type: 'add', message: newMsg });

        return res.json({ ok: true, message: newMsg });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// Delete chat message
app.delete('/api/chats/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM chats WHERE id = ?', [id]);
        
        // Notify all SSE clients
        sendSSEMessage({ type: 'delete', id: parseInt(id) });
        
        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

// Fallback to serve index.html for React/PWA router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Servidor flotilla corriendo en http://localhost:${PORT}`);
});
