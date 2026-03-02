import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { dbService } from '../services/dbService';

const router = Router();

/**
 * @route POST /sync/upload
 * @desc Upload encrypted backup
 * @access Private
 */
router.post('/upload', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { encryptedBlob } = req.body;
  const userId = req.user?.wallet;

  if (!userId || !encryptedBlob) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing encrypted blob' });
  }

  try {
    const data = dbService.saveSyncData(userId, encryptedBlob);
    return res.json({ success: true, updatedAt: data.updatedAt, deviceCount: data.deviceCount });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to upload' });
  }
});

/**
 * @route GET /sync/download
 * @desc Download encrypted backup
 * @access Private
 */
router.get('/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.wallet;

  if (!userId) {
    return res.status(400).json({ error: 'Bad Request', message: 'User identifier missing' });
  }

  try {
    const data = dbService.getSyncData(userId);

    if (!data) {
      return res.status(404).json({ error: 'Not Found', message: 'No backup found' });
    }

    return res.json({ encryptedBlob: data.encryptedBlob, updatedAt: data.updatedAt });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to download' });
  }
});

/**
 * @route DELETE /sync/delete
 * @desc Delete cloud backup
 * @access Private
 */
router.delete('/delete', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.wallet;

  if (!userId) {
    return res.status(400).json({ error: 'Bad Request', message: 'User identifier missing' });
  }

  try {
    const deleted = dbService.deleteSyncData(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'No backup found to delete' });
    }
    return res.json({ success: true, message: 'Backup permanently removed' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete' });
  }
});

export default router;
