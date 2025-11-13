# Migration Guide from django-nets-core to nodejs-nets-core

This guide will help you migrate your existing django-nets-core application to nodejs-nets-core.

## Core Concepts

Both frameworks share the same philosophy and similar APIs. The main differences are:

1. **Python → TypeScript**: Syntax changes from Python to TypeScript/JavaScript
2. **Django ORM → Sequelize**: Database interactions using Sequelize ORM
3. **Decorators → Middleware**: Request handlers use Express middleware pattern
4. **Django Settings → Config Object**: Configuration passed as object instead of settings.py

## Installation

```bash
npm install nodejs-nets-core
# or
yarn add nodejs-nets-core
```

## Configuration

### Django (settings.py)
```python
# Django
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'user',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

NETS_CORE_VERIFICATION_CODE_EXPIRE_SECONDS = 900
```

### Node.js (config object)
```typescript
// Node.js
const netsCore = new NetsCoreApp({
  database: {
    dialect: 'postgres',
    database: 'mydb',
    username: 'user',
    password: 'password',
    host: 'localhost',
    port: 5432
  },
  verificationCode: {
    expireSeconds: 900
  }
});
```

## Models

### Django
```python
from nets_core.models import OwnedModel

class MyModel(OwnedModel):
    name = models.CharField(max_length=255)
    enabled = models.BooleanField(default=True)
    
    JSON_DATA_FIELDS = ['id', 'name', 'enabled', 'user']
```

### Node.js
```typescript
import { OwnedModel, DataTypes } from 'nodejs-nets-core';

class MyModel extends OwnedModel {
  declare name: string;
  declare enabled: boolean;
  
  static JSON_DATA_FIELDS = ['id', 'name', 'enabled', 'userId'];
}

MyModel.init({
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { sequelize, tableName: 'my_model' });
```

## Request Handlers

### Django
```python
from nets_core.decorators import request_handler
from nets_core.params import RequestParam

@request_handler(
    params=[
        RequestParam('title', str),
        RequestParam('published', bool, True, default=False)
    ],
    public=False
)
def create_post(request):
    return JsonResponse({'res': 1, 'data': 'Created'})
```

### Node.js
```typescript
import { requestHandlerMiddleware, RequestParam } from 'nodejs-nets-core';

app.post('/posts',
  requestHandlerMiddleware({
    params: [
      new RequestParam('title', 'string'),
      new RequestParam('published', 'bool', true, { default: false })
    ],
    public: false
  }),
  async (req, res) => {
    return sendSuccessResponse(res, 'Created');
  }
);
```

## Authentication

### Django URLs
```python
# urls.py
from nets_core import auth_urls

urlpatterns = [
    path('', include('nets_core.auth_urls', namespace='auth')),
]
```

### Node.js Routes
```typescript
// auth-routes.ts
import { getAuthService, requestHandlerMiddleware } from 'nodejs-nets-core';

const authService = getAuthService();

app.post('/auth/login',
  requestHandlerMiddleware({
    params: [
      new RequestParam('email', 'email'),
      new RequestParam('device', 'object', true)
    ],
    public: true
  }),
  async (req, res) => {
    const result = await authService.login(req.params.email, req.params.device);
    return sendSuccessResponse(res, 'Code sent', { device_uuid: result.deviceUuid });
  }
);
```

## Email Sending

### Django
```python
from nets_core.mail import send_email

sent, reason, desc = send_email(
    subject='Welcome',
    email='user@example.com',
    template='emails/welcome.html',
    context={'name': 'John'},
    to_queued=True
)
```

### Node.js
```typescript
import { sendEmail } from 'nodejs-nets-core';

const [sent, reason, desc] = await sendEmail({
  subject: 'Welcome',
  email: 'user@example.com',
  template: 'emails/welcome.hbs',
  context: { name: 'John' },
  toQueued: true
});
```

## Firebase Notifications

### Django
```python
from nets_core.firebase_messages import send_user_device_notification

results = send_user_device_notification(
    user, 
    'Title', 
    'Message',
    {'key': 'value'}
)
```

### Node.js
```typescript
import { sendUserDeviceNotification } from 'nodejs-nets-core';

const results = await sendUserDeviceNotification(
  user,
  'Title',
  'Message',
  { key: 'value' }
);
```

## Permissions

### Django
```python
from nets_core.utils import check_perm

has_permission = check_perm(user, 'blog.create_post', project)
```

### Node.js
```typescript
// Built into request handler
app.post('/posts',
  requestHandlerMiddleware({
    canDo: 'blog.create_post',
    permRequired: true
  }),
  handler
);
```

## Key Differences

### 1. Async/Await
Node.js uses async/await extensively:

```typescript
// Node.js - always use await for database operations
const user = await User.findByPk(id);
await user.save();
```

### 2. Model Methods
```python
# Django
user = User.objects.get(id=1)
```

```typescript
// Node.js
const user = await User.findByPk(1);
```

### 3. JSON Responses
```python
# Django
return JsonResponse({'res': 1, 'data': data})
```

```typescript
// Node.js
return sendSuccessResponse(res, data);
```

### 4. Templates
- Django uses Django Template Language
- Node.js uses Handlebars

## Migration Checklist

- [ ] Convert models from Django ORM to Sequelize
- [ ] Update request handlers to use middleware pattern
- [ ] Convert templates to Handlebars format
- [ ] Update configuration from settings.py to config object
- [ ] Convert views/controllers to async functions
- [ ] Update authentication flow
- [ ] Migrate celery tasks to Bull/Bee-Queue (if needed)
- [ ] Test all endpoints
- [ ] Update documentation
- [ ] Deploy and monitor

## Common Pitfalls

1. **Forgetting await**: Always use `await` with database operations
2. **Type mismatches**: TypeScript is stricter than Python
3. **Middleware order**: Express middleware order matters
4. **Error handling**: Use try-catch blocks for async operations

## Getting Help

- Documentation: [Link to docs]
- GitHub Issues: [Link to repo]
- Examples: Check the `/examples` directory

## Next Steps

1. Review the complete example in `/examples/basic-app.ts`
2. Set up your database and Redis
3. Configure environment variables
4. Start migrating your endpoints one by one
5. Test thoroughly before deploying
