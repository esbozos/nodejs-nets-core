# NODEJS NETS CORE

[![npm version](https://img.shields.io/npm/v/@meregy/nodejs-nets-core.svg)](https://www.npmjs.com/package/@meregy/nodejs-nets-core)
[![CI](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml/badge.svg)](https://github.com/esbozos/nodejs-nets-core/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@meregy/nodejs-nets-core.svg)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/@meregy/nodejs-nets-core.svg)](https://www.npmjs.com/package/@meregy/nodejs-nets-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive Express.js framework for Node.js applications providing lazy API request handlers, authentication with OTP verification codes, role-based access control (RBAC), email notifications, push notifications and common tasks.

**This is a port of [django-nets-core](https://github.com/esbozos/django-nets-core) for Node.js/Express applications.**

## Features

- 🔐 **Complete Authentication System**
  - OTP-based authentication with email verification codes
  - OAuth2 token management (access & refresh tokens)
  - Device management and tracking
  - Session management with Redis

- 👥 **Role-Based Access Control (RBAC)**
  - Flexible permission system
  - Multi-project support with project-level roles
  - Role inheritance and custom permissions
  - Middleware for route protection

- 📧 **Email System**
  - Template-based emails with Handlebars
  - Queue support for batch sending
  - Domain blacklist/whitelist
  - HTML and text alternatives
  - Customizable footers

- 📱 **Push Notifications**
  - Firebase Cloud Messaging integration
  - Device token management
  - Batch notifications to user devices
  - Error handling and token cleanup

- 🛡️ **Security**
  - JWT token authentication
  - CSRF protection
  - Rate limiting
  - Helmet security headers
  - IP tracking and validation

- 🔧 **Developer Experience**
  - TypeScript support
  - Request parameter validation
  - Automatic type conversion
  - Comprehensive error handling
  - Logging utilities

## Installation

```bash
npm install nodejs-nets-core
# or
yarn add nodejs-nets-core
```

## Quick Start

```typescript
import express from 'express';
import { NetsCoreApp, requestHandler, RequestParam } from 'nodejs-nets-core';

const app = express();

// Initialize nets-core
const netsCore = new NetsCoreApp({
  database: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    username: 'user',
    password: 'password'
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  jwt: {
    secret: 'your-secret-key',
    accessTokenExpire: '30d'
  }
});

// Apply middleware
netsCore.applyMiddleware(app);

// Define a protected route with parameter validation
app.post('/api/example',
  requestHandler({
    params: [
      new RequestParam('name', 'string'),
      new RequestParam('age', 'int', true) // optional
    ],
    public: false // requires authentication
  }),
  async (req, res) => {
    const { name, age } = req.params;
    res.json({ res: 1, data: { name, age } });
  }
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Authentication

### Login Flow

```typescript
// 1. Request verification code
app.post('/auth/login',
  requestHandler({
    params: [
      new RequestParam('email', 'email'),
      new RequestParam('device', 'object', true)
    ],
    public: true
  }),
  authController.login
);

// 2. Authenticate with code
app.post('/auth/authenticate',
  requestHandler({
    params: [
      new RequestParam('email', 'email'),
      new RequestParam('code', 'string'),
      new RequestParam('client_id', 'string'),
      new RequestParam('client_secret', 'string')
    ],
    public: true
  }),
  authController.authenticate
);
```

### Client Implementation

```javascript
// Step 1: Request verification code
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    device: {
      name: 'iPhone 14',
      os: 'iOS',
      os_version: '17.0',
      firebase_token: 'device-fcm-token'
    }
  })
});

const { device_uuid } = await response.json();

// Step 2: Authenticate with code (received via email)
const authResponse = await fetch('/auth/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '123456',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    device_uuid
  })
});

const { access_token, refresh_token, user } = await authResponse.json();

// Use access_token for authenticated requests
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## Request Handler & Validation

The `requestHandler` decorator provides automatic parameter validation and type conversion:

```typescript
import { requestHandler, RequestParam } from 'nodejs-nets-core';

app.post('/api/create-post',
  requestHandler({
    params: [
      new RequestParam('title', 'string'),
      new RequestParam('content', 'string'),
      new RequestParam('published', 'bool', true, { default: false }),
      new RequestParam('publish_date', 'datetime', true),
      new RequestParam('tags', 'list', true)
    ],
    public: false, // requires authentication
    canDo: 'blog.create_post' // permission check
  }),
  async (req, res) => {
    // All parameters are validated and available in req.params
    const { title, content, published, publish_date, tags } = req.params;
    
    // req.user is automatically populated
    // req.perm indicates if user has the required permission
    
    res.json({ res: 1, data: 'Post created' });
  }
);
```

### Available Parameter Types

- `string` / `str`
- `int` / `integer`
- `float` / `number`
- `bool` / `boolean`
- `date`
- `datetime`
- `email`
- `list` / `array`
- `object` / `dict`
- `file`

## Permissions & Roles

### Define Permissions

```typescript
import { Permission, Role } from 'nodejs-nets-core/models';

// Create permissions
const createPostPerm = await Permission.create({
  codename: 'blog.create_post',
  name: 'Can create blog posts',
  description: 'Allows user to create new blog posts'
});

// Create role
const editorRole = await Role.create({
  codename: 'editor',
  name: 'Editor',
  description: 'Blog editor role'
});

// Assign permission to role
await editorRole.addPermission(createPostPerm);
```

### Protect Routes

```typescript
// Method 1: Using canDo parameter
app.post('/api/posts',
  requestHandler({
    canDo: 'blog.create_post',
    permRequired: true // deny access if permission not granted
  }),
  createPostHandler
);

// Method 2: Using middleware
import { checkPermission } from 'nodejs-nets-core/middleware';

app.delete('/api/posts/:id',
  checkPermission('blog.delete_post'),
  deletePostHandler
);

// Method 3: Role-based check
app.get('/api/admin',
  requestHandler({
    canDo: 'role:admin' // check if user has admin role
  }),
  adminHandler
);
```

### Multi-Project Support

```typescript
// Configure project models
netsCore.configure({
  projectModel: 'Project',
  projectMemberModel: 'ProjectMember'
});

// Routes automatically check project membership
app.post('/api/projects/:projectId/data',
  requestHandler({
    projectRequired: true,
    canDo: 'project.edit_data'
  }),
  async (req, res) => {
    // req.project - current project instance
    // req.projectMembership - user's membership in project
    // req.perm - permission check result
  }
);
```

## Email System

### Send Email

```typescript
import { sendEmail } from 'nodejs-nets-core/mail';

const [sent, reason, description] = await sendEmail({
  subject: 'Welcome to our platform',
  email: 'user@example.com', // or array of emails
  template: 'emails/welcome.hbs',
  context: {
    username: 'John Doe',
    activation_link: 'https://...'
  },
  toQueued: true // queue for batch sending
});

if (!sent) {
  console.error(`Email not sent: ${reason} - ${description}`);
}
```

### Email Templates

Create Handlebars templates in your templates directory:

```handlebars
<!-- templates/emails/welcome.hbs -->
<!DOCTYPE html>
<html>
<head>
  <title>Welcome</title>
</head>
<body>
  <h1>Welcome {{username}}!</h1>
  <p>Click <a href="{{activation_link}}">here</a> to activate your account.</p>
</body>
</html>
```

### Configuration

```typescript
netsCore.configure({
  email: {
    from: 'noreply@example.com',
    excludeDomains: [
      'tempmail*',
      'guerrillamail.com',
      '10minutemail.com'
    ],
    footer: '<p>© 2024 MyCompany</p>',
    debugEnabled: false // don't send emails in development
  }
});
```

## Push Notifications

### Setup Firebase

```typescript
netsCore.configure({
  firebase: {
    credentialsPath: './firebase-credentials.json'
  }
});
```

### Send Notifications

```typescript
import { sendUserDeviceNotification } from 'nodejs-nets-core/firebase';

// Send to all user's devices
const results = await sendUserDeviceNotification(
  user,
  'New Message',
  'You have a new message from John',
  {
    type: 'message',
    messageId: '12345'
  },
  'messages' // notification channel
);

// Check results
Object.entries(results).forEach(([deviceId, result]) => {
  if (result.success) {
    console.log(`Sent to device ${deviceId}: ${result.message_id}`);
  } else {
    console.error(`Failed to send to device ${deviceId}: ${result.error}`);
  }
});
```

## Models

All models extend `NetsCoreBaseModel` which provides:

- Automatic timestamps (`created`, `updated`)
- Change tracking (`updated_fields`)
- JSON serialization (`toJSON()` method)
- Field protection (sensitive fields excluded from JSON)

### Base Models

```typescript
import { NetsCoreBaseModel, OwnedModel } from 'nodejs-nets-core/models';

// NetsCoreBaseModel - timestamps only
class MyModel extends NetsCoreBaseModel {
  // your fields
}

// OwnedModel - timestamps + user ownership
class MyOwnedModel extends OwnedModel {
  // automatically has userId field
}
```

### Built-in Models

- **User** - Base user model
- **VerificationCode** - OTP codes for authentication
- **UserDevice** - Device registration and tracking
- **Permission** - Permission definitions
- **Role** - Role definitions
- **RolePermission** - Role-permission associations
- **UserRole** - User-role assignments
- **EmailTemplate** - Reusable email templates
- **CustomEmail** - Queued emails
- **EmailNotification** - Email sending queue
- **UserFirebaseNotification** - Push notification history

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=user
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@example.com

# Firebase
FIREBASE_CONFIG=./firebase-credentials.json

# App
NODE_ENV=development
PORT=3000
```

### Full Configuration

```typescript
const netsCore = new NetsCoreApp({
  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRE || '30d'
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    from: process.env.DEFAULT_FROM_EMAIL,
    excludeDomains: ['tempmail*'],
    debugEnabled: false
  },
  firebase: {
    credentialsPath: process.env.FIREBASE_CONFIG
  },
  verificationCode: {
    expireSeconds: 15 * 60, // 15 minutes
    debugCode: '123456',
    testersEmails: ['google_tester*'],
    testersCode: '789654'
  },
  security: {
    globalProtectedFields: ['password', 'token', 'secret'],
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 100
  },
  projectModel: 'Project', // optional for multi-project support
  projectMemberModel: 'ProjectMember' // optional
});
```

## API Reference

### Request Handler Options

```typescript
interface RequestHandlerOptions {
  // Model to load based on index field
  model?: any;
  
  // Field to use as identifier (default: 'id')
  indexField?: string;
  
  // Permission to check
  canDo?: string;
  
  // Require permission (deny if not granted)
  permRequired?: boolean;
  
  // Request parameters to validate
  params?: RequestParam[];
  
  // Allow unauthenticated access
  public?: boolean;
  
  // Require project context
  projectRequired?: boolean;
}
```

### RequestParam

```typescript
class RequestParam {
  constructor(
    key: string,           // Parameter name
    type: ParamType,       // Data type
    optional?: boolean,    // Is optional?
    options?: {
      default?: any,       // Default value
      validate?: Function, // Custom validator
      filetypes?: string[] // For file uploads
    }
  )
}
```

### Response Helpers

```typescript
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  permissionDenied
} from 'nodejs-nets-core/responses';

// Success with data
return successResponse({ user: userData });

// Success with extra data
return successResponse(userData, { token: 'abc123' });

// Error
return errorResponse('Invalid input', 400);

// Not found
return notFoundResponse();

// Permission denied
return permissionDenied();
```

## Testing

### Tester Accounts

Configure tester emails that bypass OTP verification:

```typescript
netsCore.configure({
  verificationCode: {
    testersEmails: ['google_tester*', 'test@example.com'],
    testersCode: '475638' // static code for testers
  }
});
```

Emails matching tester patterns will always use the configured code instead of generating random ones.

## Migration from Django

If you're migrating from django-nets-core:

1. **Models**: Sequelize models map directly to Django models
2. **Decorators**: `@request_handler` becomes `requestHandler()`
3. **Permissions**: Same codename system
4. **Email**: Similar API with template support
5. **Firebase**: Same Firebase Admin SDK

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide.

## Examples

Check the `/examples` directory for:

- Basic authentication setup
- Role-based access control
- Email notifications
- Push notifications
- Multi-project applications

## License

MIT

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Support

- GitHub Issues: https://github.com/yourusername/nodejs-nets-core/issues
- Documentation: https://nodejs-nets-core.readthedocs.io

## Credits

Port of [django-nets-core](https://github.com/esbozos/django-nets-core) by esbozos.
