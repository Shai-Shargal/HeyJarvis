import app from './app';
import { env } from './config/env';
import { connectMongo } from './db/mongo';

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectMongo();

    // Start Express server
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📝 Health check: http://localhost:${env.PORT}/health`);
      console.log(`🔐 Auth start: http://localhost:${env.PORT}/auth/google/start`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

