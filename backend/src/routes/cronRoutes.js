const express = require('express');
const router = express.Router();
const itemService = require('../services/itemService');

/**
 * GET /api/cron/expire
 * Triggered by Vercel Cron daily at midnight (or manually for testing).
 * Secures the endpoint in production using the Vercel-provided CRON_SECRET.
 */
router.get('/expire', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify that the request is authorized by Vercel Cron
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.warn(`[${new Date().toISOString()}] ⚠️ Unauthorized cron trigger attempt from ${ip}`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ⏰ Running expiry cron job via HTTP request...`);

  try {
    const count = await itemService.expireItems();
    console.log(`[${timestamp}] ✅ Expiry job done — ${count} item(s) marked as EXPIRED.`);
    return res.status(200).json({
      success: true,
      message: 'Expiry job executed successfully.',
      expired_count: count
    });
  } catch (error) {
    console.error(`[${timestamp}] ❌ Expiry job error:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to run expiry job.',
      error: error.message
    });
  }
});

module.exports = router;
