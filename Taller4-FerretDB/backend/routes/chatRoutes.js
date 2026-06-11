import { Router } from 'express';
import { 
    getHistorial, 
    testMensaje, 
    handleChat, 
    deleteHistorial 
} from '../controllers/chatController.js';

const router = Router();

router.get('/historial', getHistorial);
router.post('/test-mensaje', testMensaje);
router.post('/chat', handleChat);
router.delete('/historial', deleteHistorial);

export default router;