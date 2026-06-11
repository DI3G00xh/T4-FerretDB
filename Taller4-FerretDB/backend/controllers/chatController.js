import { getDb } from '../config/db.js';

// 1. GET /api/historial
export const getHistorial = async (req, res) => {
    try {
        const db = getDb();
        const historial = await db.collection('mensajes')
            .find({})
            .sort({ fechaHora: 1 }) 
            .toArray();
            
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ error: "No se pudo obtener el historial de mensajes." });
    }
};

// 2. POST /api/test-mensaje
export const testMensaje = async (req, res) => {
    try {
        const { rol, contenido } = req.body;

        if (!rol || !contenido) {
            return res.status(400).json({ error: "Faltan campos obligatorios: 'rol' o 'contenido'" });
        }

        const nuevoMensaje = {
            rol,
            contenido,
            fechaHora: new Date()
        };

        const db = getDb();
        const resultado = await db.collection('mensajes').insertOne(nuevoMensaje);

        res.status(201).json({ 
            mensaje: "Mensaje guardado con éxito", 
            id: resultado.insertedId 
        });
    } catch (error) {
        console.error("Error al guardar el mensaje de prueba:", error);
        res.status(500).json({ error: "Error interno al persistir el mensaje." });
    }
};

// 3. POST /api/chat 
export const handleChat = async (req, res) => {
    const { contenido } = req.body;

    if (!contenido || contenido.trim() === '') {
        return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    try {
        const db = getDb();

        const mensajeUsuario = {
            rol: "user",
            contenido: contenido,
            fechaHora: new Date()
        };
        await db.collection('mensajes').insertOne(mensajeUsuario);

        // Memoria conversacion
        const historialRaw = await db.collection('mensajes')
            .find({})
            .sort({ fechaHora: 1 })
            .toArray();

        const historialFiltrado = historialRaw
            .filter(msg => msg.contenido && msg.contenido.trim() !== "")
            .slice(-10);

        const mensajesParaIA = historialFiltrado.map(msg => ({
            role: msg.rol,
            content: msg.contenido
        }));

        mensajesParaIA.unshift({
            role: "system",
            content: "Eres un asistente de chat atento y preciso. Tienes acceso al historial de esta conversación. Responde siempre de forma coherente basándote estrictamente en los mensajes anteriores."
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const responseOllama = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Connection': 'close' 
            },
            body: JSON.stringify({
                model: 'phi3',
                messages: mensajesParaIA,
                stream: true
            })
        });

        if (!responseOllama.ok) throw new Error("Ollama no respondió correctamente");

        const reader = responseOllama.body.getReader();
        const decoder = new TextDecoder();
        let respuestaCompletaIA = "";
        let acumuladorLineas = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            acumuladorLineas += decoder.decode(value, { stream: true });
            const lineas = acumuladorLineas.split('\n');
            acumuladorLineas = lineas.pop() || "";

            for (const linea of lineas) {
                if (linea.trim() === '') continue;

                try {
                    const parsed = JSON.parse(linea);
                    const token = parsed.message?.content || "";
                    if (token) {
                        respuestaCompletaIA += token;
                        res.write(`data: ${JSON.stringify({ token })}\n\n`);
                    }
                } catch (e) {
                }
            }
        }

        if (!respuestaCompletaIA.trim()) {
            respuestaCompletaIA = "Disculpa, experimenté una breve interrupción en mi modelo local. ¿Podrías repetir tu consulta?";
            res.write(`data: ${JSON.stringify({ token: respuestaCompletaIA })}\n\n`);
        }

        const mensajeIA = {
            rol: "assistant",
            contenido: respuestaCompletaIA,
            fechaHora: new Date()
        };
        await db.collection('mensajes').insertOne(mensajeIA);

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error("❌ Error crítico en el chat:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error en el servidor de chat." });
        } else {
            res.write(`data: ${JSON.stringify({ token: " (Conexión interrumpida)" })}\n\n`);
            res.end();
        }
    }
};

// 4. DELETE /api/historial
export const deleteHistorial = async (req, res) => {
    try {
        const db = getDb();
        const resultado = await db.collection('mensajes').deleteMany({});
        
        res.json({ 
            mensaje: "Historial eliminado correctamente. Nueva conversación iniciada.",
            mensajesBorrados: resultado.deletedCount 
        });
    } catch (error) {
        console.error("❌ Error al vaciar el historial:", error);
        res.status(500).json({ error: "No se pudo reiniciar la conversación." });
    }
};