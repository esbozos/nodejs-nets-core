import jwt from 'jsonwebtoken';
import { User, VerificationCode, UserDevice } from '../models';
import { NetsCoreConfig } from '../types';
import { getEmailService } from './email';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpire: Date;
  user: any;
}

export interface OAuth2Application {
  clientId: string;
  clientSecret: string;
  name: string;
}

export class AuthService {
  private jwtSecret: string;
  private accessTokenExpire: string;
  private refreshTokenExpire: string;
  private applications: Map<string, OAuth2Application> = new Map();

  constructor(config: NetsCoreConfig) {
    this.jwtSecret = config.jwt.secret;
    this.accessTokenExpire = config.jwt.accessTokenExpire || '30d';
    this.refreshTokenExpire = config.jwt.refreshTokenExpire || '90d';
  }

  registerApplication(app: OAuth2Application): void {
    this.applications.set(app.clientId, app);
  }

  private validateApplication(clientId: string, clientSecret: string): boolean {
    const app = this.applications.get(clientId);
    if (!app) return false;
    return app.clientSecret === clientSecret;
  }

  private generateAccessToken(userId: number): string {
    return jwt.sign({ userId, type: 'access' }, this.jwtSecret, {
      expiresIn: this.accessTokenExpire as string | number
    } as jwt.SignOptions);
  }

  private generateRefreshToken(userId: number): string {
    return jwt.sign({ userId, type: 'refresh' }, this.jwtSecret, {
      expiresIn: this.refreshTokenExpire as string | number
    } as jwt.SignOptions);
  }

  private calculateTokenExpiry(): Date {
    // Parse expiry string (e.g., '30d', '24h', '60m')
    const match = this.accessTokenExpire.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 30 days if format is invalid
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const [, amount, unit] = match;
    const value = parseInt(amount, 10);

    const multipliers: Record<string, number> = {
      d: 24 * 60 * 60 * 1000,  // days
      h: 60 * 60 * 1000,        // hours
      m: 60 * 1000,             // minutes
      s: 1000                   // seconds
    };

    const expiry = new Date(Date.now() + value * multipliers[unit]);
    return expiry;
  }

  async login(
    emailOrUsername: string,
    deviceData?: any,
    ip?: string
  ): Promise<{ success: boolean; deviceUuid?: string; message: string }> {
    try {
      // Find or create user
      let user = await User.findByEmail(emailOrUsername);
      
      if (!user) {
        user = await User.findByUsername(emailOrUsername);
      }

      if (!user) {
        // Create new user
        const isEmail = emailOrUsername.includes('@');
        user = await User.create({
          email: isEmail ? emailOrUsername : `${emailOrUsername}@placeholder.com`,
          username: isEmail ? undefined : emailOrUsername,
          isActive: true
        } as any);
      }

      // Handle device registration
      let device: UserDevice | null = null;
      if (deviceData) {
        device = await UserDevice.validateAndCreateOrUpdate(user.id, deviceData);
      }

      // Create verification code
      const verificationCode = await VerificationCode.create({
        userId: user.id,
        token: '',  // Will be set in generateAndSaveToken
        deviceId: device?.id,
        verified: false,
        ip
      } as any);

      // Generate and save token
      const plainCode = await verificationCode.generateAndSaveToken(
        user.email,
        process.env.NODE_ENV === 'development',
        false
      );

      // Send verification email
      try {
        const emailService = getEmailService();
        await emailService.sendVerificationCodeEmail(
          user.email,
          plainCode,
          user.firstName || user.username
        );
      } catch (error: any) {
        console.error('Failed to send verification email:', error.message);
        // Continue even if email fails - user might be using debug code
      }

      return {
        success: true,
        deviceUuid: device?.uuid,
        message: 'Verification code sent'
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  async authenticate(
    emailOrUsername: string,
    code: string,
    clientId: string,
    clientSecret: string,
    deviceUuid?: string
  ): Promise<AuthTokens> {
    // Validate OAuth2 application
    if (!this.validateApplication(clientId, clientSecret)) {
      throw new Error('Invalid client credentials');
    }

    // Find user
    let user = await User.findByEmail(emailOrUsername);
    if (!user) {
      user = await User.findByUsername(emailOrUsername);
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Find latest verification code
    const verificationCode = await VerificationCode.findOne({
      where: { userId: user.id, verified: false },
      order: [['created', 'DESC']]
    } as any);

    if (!verificationCode) {
      throw new Error('No verification code found. Please request a new one.');
    }

    // Validate code
    const isValid = await verificationCode.verifyCode(code, deviceUuid);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Update device last login if device provided
    if (deviceUuid) {
      const device = await UserDevice.findOne({
        where: { uuid: deviceUuid, userId: user.id }
      } as any);

      if (device) {
        device.lastLogin = new Date();
        await device.save();
      }
    }

    // Mark code as verified
    (verificationCode as any).verified = true;
    await verificationCode.save();

    // Update user
    if (!user.emailVerified) {
      user.emailVerified = true;
    }
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);
    const tokenExpire = this.calculateTokenExpiry();

    return {
      accessToken,
      refreshToken,
      tokenExpire,
      user: user.toJSON()
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; tokenExpire: Date }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const accessToken = this.generateAccessToken(user.id);
      const tokenExpire = this.calculateTokenExpiry();

      return { accessToken, tokenExpire };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async logout(accessToken: string): Promise<void> {
    // Implement token blacklisting if needed
    // For now, we rely on client-side token removal
    // In production, consider using Redis to blacklist tokens
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

// Global auth service instance
let authService: AuthService | null = null;

export const initializeAuthService = (config: NetsCoreConfig): AuthService => {
  authService = new AuthService(config);
  return authService;
};

export const getAuthService = (): AuthService => {
  if (!authService) {
    throw new Error('Auth service not initialized. Call initializeAuthService first.');
  }
  return authService;
};
