import express from 'express';
import dotenv from 'dotenv';
import { 
  NetsCoreApp, 
  requestHandlerMiddleware, 
  RequestParam,
  authMiddleware,
  requireAuth,
  getAuthService,
  initializeAuthService,
  initializeEmailService,
  initializeFirebaseService,
  sendSuccessResponse,
  sendErrorResponse
} from 'nodejs-nets-core';

// Load environment variables
dotenv.config();

const app = express();

// Initialize Nets Core
const netsCore = new NetsCoreApp({
  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mydb',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    logging: false
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRE || '30d',
    refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE || '90d'
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    },
    from: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
    excludeDomains: (process.env.EMAIL_EXCLUDE_DOMAINS || '').split(',').filter(Boolean),
    debugEnabled: process.env.EMAIL_DEBUG_ENABLED === 'true'
  },
  firebase: {
    credentialsPath: process.env.FIREBASE_CONFIG
  },
  verificationCode: {
    expireSeconds: parseInt(process.env.VERIFICATION_CODE_EXPIRE_SECONDS || '900'),
    debugCode: process.env.VERIFICATION_CODE_DEBUG_CODE || '123456',
    testersEmails: (process.env.VERIFICATION_CODE_TESTERS_EMAILS || '').split(',').filter(Boolean),
    testersCode: process.env.VERIFICATION_CODE_TESTERS_CODE || '789654'
  },
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },
  templatesDir: process.env.TEMPLATES_DIR || './templates'
});

// Apply middleware
netsCore.applyMiddleware(app);

// Initialize services
initializeAuthService(netsCore.getConfig());
initializeEmailService(netsCore.getConfig());
initializeFirebaseService(netsCore.getConfig().firebase);

// Add authentication middleware
app.use(authMiddleware(netsCore.getConfig().jwt.secret));

// Register OAuth2 application
const authService = getAuthService();
authService.registerApplication({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  name: 'My Application'
});

// ========== AUTH ROUTES ==========

// Login - Request verification code
app.post('/auth/login',
  requestHandlerMiddleware({
    params: [
      new RequestParam('email', 'email'),
      new RequestParam('device', 'object', true)
    ],
    public: true
  }),
  async (req, res) => {
    const { email, device } = req.params;
    const result = await authService.login(email, device, req.ip);
    
    if (result.success) {
      return sendSuccessResponse(res, 'Verification code sent', {
        device_uuid: result.deviceUuid
      });
    } else {
      return sendErrorResponse(res, result.message, 400);
    }
  }
);

// Authenticate with verification code
app.post('/auth/authenticate',
  requestHandlerMiddleware({
    params: [
      new RequestParam('email', 'email'),
      new RequestParam('code', 'string'),
      new RequestParam('client_id', 'string'),
      new RequestParam('client_secret', 'string'),
      new RequestParam('device_uuid', 'string', true)
    ],
    public: true
  }),
  async (req, res) => {
    try {
      const { email, code, client_id, client_secret, device_uuid } = req.params;
      
      const tokens = await authService.authenticate(
        email,
        code,
        client_id,
        client_secret,
        device_uuid
      );
      
      return sendSuccessResponse(res, tokens);
    } catch (error: any) {
      return sendErrorResponse(res, error.message, 400);
    }
  }
);

// Logout
app.post('/auth/logout',
  requireAuth(),
  async (req, res) => {
    // Token is handled on client side
    return sendSuccessResponse(res, 'Logged out successfully');
  }
);

// Get user profile
app.get('/auth/profile',
  requireAuth(),
  async (req, res) => {
    return sendSuccessResponse(res, req.user.toJSON());
  }
);

// ========== EXAMPLE PROTECTED ROUTE ==========

app.post('/api/posts',
  requestHandlerMiddleware({
    params: [
      new RequestParam('title', 'string'),
      new RequestParam('content', 'string'),
      new RequestParam('published', 'bool', true, { default: false })
    ],
    public: false, // requires authentication
    // canDo: 'blog.create_post', // optional permission check
  }),
  async (req, res) => {
    const { title, content, published } = req.params;
    
    // Your logic here
    const post = {
      id: 1,
      title,
      content,
      published,
      author: req.user.id,
      createdAt: new Date()
    };
    
    return sendSuccessResponse(res, post);
  }
);

// ========== START SERVER ==========

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await netsCore.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await netsCore.close();
  process.exit(0);
});
