import { Application } from 'express';
import { NetsCoreConfig } from './types';
import { initializeDatabase, getDatabase, closeDatabase } from './config/database';
import { initializeRedis, getRedis, closeRedis } from './config/redis';
import { initializeModels } from './models';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import rateLimit from 'express-rate-limit';

export class NetsCoreApp {
  private config: NetsCoreConfig;
  private initialized: boolean = false;

  constructor(config: NetsCoreConfig) {
    this.config = config;
    this.initialize();
  }

  private async initialize() {
    // Initialize database
    const sequelize = initializeDatabase(this.config.database);

    // Initialize models
    initializeModels(sequelize);

    // Initialize Redis if configured
    if (this.config.redis) {
      initializeRedis(this.config.redis);
    }

    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
    }

    this.initialized = true;
  }

  public applyMiddleware(app: Application) {
    // Security middleware
    app.use(helmet());

    // CORS
    app.use(
      cors({
        credentials: true,
        origin: true,
      })
    );

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    if (this.config.security?.rateLimitWindowMs && this.config.security?.rateLimitMax) {
      const limiter = rateLimit({
        windowMs: this.config.security.rateLimitWindowMs,
        max: this.config.security.rateLimitMax,
        message: 'Too many requests from this IP, please try again later.',
      });
      app.use(limiter);
    }
  }

  public getConfig(): NetsCoreConfig {
    return this.config;
  }

  public async close() {
    await closeDatabase();
    await closeRedis();
  }
}

// Export all modules
export * from './types';
export * from './models';
export * from './decorators';
export * from './middleware';
export * from './utils';
export * from './utils/responses';
export * from './services/email';
export * from './services/firebase';
export * from './services/auth';
export * from './config/database';
export * from './config/redis';
