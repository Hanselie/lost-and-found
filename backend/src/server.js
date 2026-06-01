const app = require('./app');
const { initExpiryJob } = require('./cron/expiryJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  // Initialize the daily expiry cron job
  initExpiryJob();

  console.log('');
  console.log('✅ Backend is ready!\n');
});
