import {
  DataTypes,
  Sequelize,
  ModelAttributes,
  CreationOptional
} from 'sequelize';
import { OwnedModel, OwnedModelAttributes } from './base';
import { getRedis } from '../config/redis';
import bcrypt from 'bcrypt';

export interface VerificationCodeAttributes {
  id: number;
  userId: number;
  token: string;
  deviceId?: number;
  verified: boolean;
  ip?: string;
  created: Date;
  updated: Date;
}

export class VerificationCode extends OwnedModel<VerificationCodeAttributes> {
  declare id: CreationOptional<number>;
  declare token: string;
  declare deviceId: CreationOptional<number>;
  declare verified: CreationOptional<boolean>;
  declare ip: CreationOptional<string>;

  static VERIFICATION_CODE_EXPIRE_SECONDS = 15 * 60; // 15 minutes
  static VERIFICATION_CODE_CACHE_KEY = 'NC_T';
  static DEBUG_VERIFICATION_CODE = '123456';
  static TESTERS_EMAILS: string[] = ['google_tester*'];
  static TESTERS_VERIFICATION_CODE = '789654';

  private getTokenCacheKey(): string {
    return `${VerificationCode.VERIFICATION_CODE_CACHE_KEY}${this.userId}`;
  }

  private static generateIntUuid(size: number = 6): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const combined = `${random}${timestamp}`;
    return combined.substring(0, size);
  }

  private static isTesterEmail(email: string): boolean {
    for (const testerEmail of this.TESTERS_EMAILS) {
      if (testerEmail.endsWith('*')) {
        if (email.startsWith(testerEmail.replace('*', ''))) {
          return true;
        }
      } else if (email === testerEmail) {
        return true;
      }
    }
    return false;
  }

  async generateAndSaveToken(userEmail: string, isDebug: boolean = false, emailDebugEnabled: boolean = false): Promise<string> {
    const redis = getRedis();
    const cacheKey = this.getTokenCacheKey();
    
    let token: string;
    const isTester = VerificationCode.isTesterEmail(userEmail);

    if (isTester) {
      token = VerificationCode.TESTERS_VERIFICATION_CODE;
    } else if (isDebug && !emailDebugEnabled) {
      token = VerificationCode.DEBUG_VERIFICATION_CODE;
    } else {
      // Check if token exists in cache
      const cachedToken = await redis.get(cacheKey);
      if (cachedToken) {
        token = cachedToken;
      } else {
        token = VerificationCode.generateIntUuid(6);
      }
    }

    // Save to cache
    await redis.setex(cacheKey, VerificationCode.VERIFICATION_CODE_EXPIRE_SECONDS, token);

    // Hash and save to database
    this.token = await bcrypt.hash(token, 10);
    await this.save();

    return token; // Return plain token for email sending
  }

  async verifyCode(code: string, deviceUuid?: string): Promise<boolean> {
    if (!code || !this.token) {
      return false;
    }

    // Check device if provided
    if (this.deviceId && deviceUuid) {
      // Will be validated by comparing with UserDevice
      // This is handled in the authentication flow
    }

    // Check expiration
    const now = new Date();
    const created = new Date(this.created);
    const elapsedSeconds = (now.getTime() - created.getTime()) / 1000;

    if (elapsedSeconds > VerificationCode.VERIFICATION_CODE_EXPIRE_SECONDS) {
      await this.destroy();
      return false;
    }

    // Validate token
    return await bcrypt.compare(code, this.token);
  }
}

export const VerificationCodeModelAttributes: ModelAttributes = {
  ...OwnedModelAttributes,
  token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'nets_core_user_device',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ip: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
};

export const initVerificationCodeModel = (sequelize: Sequelize): typeof VerificationCode => {
  VerificationCode.init(VerificationCodeModelAttributes, {
    sequelize,
    tableName: 'nets_core_verification_code',
    modelName: 'VerificationCode',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated'
  });

  return VerificationCode;
};
