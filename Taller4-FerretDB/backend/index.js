import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import chatRouter from './routes/chatRoutes.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', chatRouter);

app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(` Servidor backend corriendo en http://localhost:${PORT}`);
    } catch (error) {
        console.error(" Apagando el servidor por fallo crítico en la base de datos.");
        process.exit(1);
    }
});