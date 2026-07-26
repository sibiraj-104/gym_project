import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { chatWithAICoach, getChatHistory } from '../controllers/aiController';

const router = Router();

router.post('/chat', authenticateUser, chatWithAICoach);
router.get('/chat/history', authenticateUser, getChatHistory);

export default router;
