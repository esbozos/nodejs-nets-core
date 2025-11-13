# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-12

### Added
- Initial release of nodejs-nets-core
- Complete port of django-nets-core to Node.js/Express
- TypeScript support with full type definitions
- Sequelize ORM integration for database operations
- Redis integration for caching and sessions
- Authentication system with OTP verification codes
- OAuth2-like token management (access & refresh tokens)
- Device management and tracking
- Role-Based Access Control (RBAC) system
- Multi-project support with project-level permissions
- Email service with Handlebars templates
- Firebase Cloud Messaging integration
- Request parameter validation system
- Middleware for authentication and permission checking
- Comprehensive error handling
- Rate limiting support
- CORS and security headers (Helmet)
- Example application
- Migration guide from django-nets-core
- Complete API documentation

### Models
- NetsCoreBaseModel - Base model with timestamps and JSON serialization
- OwnedModel - Base model with user ownership
- User - User management
- VerificationCode - OTP verification codes
- UserDevice - Device registration and tracking
- Permission - Permission definitions
- Role - Role definitions with permissions
- RolePermission - Role-permission associations
- UserRole - User-role assignments

### Services
- EmailService - Email sending with templates
- FirebaseService - Push notifications
- AuthService - Authentication and token management

### Utilities
- Request parameter validation
- Response helpers
- IP detection
- Type conversion utilities
- Secure caching

### Security
- JWT-based authentication
- Password hashing with bcrypt
- CSRF protection ready
- Rate limiting
- Protected field filtering
- Secure cache with encryption

### Documentation
- Comprehensive README
- API documentation
- Migration guide
- Contributing guidelines
- Examples and templates

## [Unreleased]

### Planned
- Queue system for background jobs (Bull/BeeQueue)
- SMS service integration
- OAuth2 provider implementation
- WebSocket support for real-time features
- Advanced logging system
- Metrics and monitoring
- CLI tools for common tasks
- More examples and tutorials
- GraphQL support
