import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { ChatService } from './chat.service';
import { chatRequestSchema } from './chat.schema';

const router = Router();
const chatService = new ChatService();

/**
 * POST /chat
 * Protected endpoint to generate an action plan from user message
 */
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate request body
      const validationResult = chatRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validationResult.error.errors,
        });
      }

      const { message } = validationResult.data;

      // Generate action plan
      const plan = await chatService.generateActionPlan(message);

      res.json({ plan });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;

