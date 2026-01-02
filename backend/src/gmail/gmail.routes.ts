import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  getGoogleAccessToken,
  buildTodayQuery,
  buildNewestQuery,
  listMessages,
  getMessageMetadata,
  moveMessagesToTrash,
  GmailMessage,
} from './gmail.service';

const router = Router();

/**
 * POST /gmail/delete-today
 * Protected endpoint to delete (move to trash) today's emails
 * Query param: dryRun=true to simulate without actually trashing
 */
router.post(
  '/delete-today',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check for dry-run mode
      const dryRun = String(req.query.dryRun) === 'true';
      
      // Check if user wants to delete newest email instead of today's emails
      const deleteNewest = String(req.query.newest) === 'true';

      // Get access token using refresh token
      const accessToken = await getGoogleAccessToken(req.userId);

      // Build query - either newest email or today's emails
      const query = deleteNewest ? buildNewestQuery() : buildTodayQuery();

      // List messages matching the query
      // If deleting newest, only get 1 message, otherwise limit to 50
      const maxResults = deleteNewest ? 1 : 50;
      const messageIds = await listMessages(accessToken, query, maxResults);

      if (messageIds.length === 0) {
        return res.json({
          trashedCount: 0,
          queryUsed: query,
          dryRun,
          sample: [],
        });
      }

      // Get metadata for first 3 messages as sample
      const sampleCount = Math.min(3, messageIds.length);
      const samplePromises = messageIds
        .slice(0, sampleCount)
        .map((id) => getMessageMetadata(accessToken, id));

      const sample: GmailMessage[] = await Promise.all(samplePromises);

      // Only trash if not in dry-run mode
      if (!dryRun) {
        await moveMessagesToTrash(accessToken, messageIds);
      }

      res.json({
        trashedCount: messageIds.length,
        queryUsed: query,
        dryRun,
        sample,
      });
    } catch (error) {
      console.error('Error in delete-today endpoint:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;

