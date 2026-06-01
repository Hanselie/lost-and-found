const cron = require('node-cron');
const itemService = require('../services/itemService');

/**
 * Initialise the daily expiry cron job.
 * Runs every day at midnight (00:00) to mark overdue AVAILABLE items as EXPIRED.
 */
const initExpiryJob = () => {
  cron.schedule('0 0 * * *', async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ⏰ Running expiry cron job...`);

    try {
      const count = await itemService.expireItems();
      console.log(`[${timestamp}] ✅ Expiry job done — ${count} item(s) marked as EXPIRED.`);
    } catch (error) {
      console.error(`[${timestamp}] ❌ Expiry job error:`, error.message);
    }
  });

  console.log('📅 Expiry cron job scheduled (daily at midnight).');
};

module.exports = { initExpiryJob };
