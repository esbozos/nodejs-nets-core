import { Request } from 'express';
import { Model, ModelStatic } from 'sequelize';

export type ParamType =
  | 'str'
  | 'string'
  | 'int'
  | 'integer'
  | 'number'
  | 'float'
  | 'bool'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'list'
  | 'array'
  | 'object'
  | 'dict'
  | 'file';

export interface NetsCoreRequest extends Request {
  user?: any;
  params: any;
  parsedData?: any;
  obj?: any;
  project?: any;
  projectId?: number;
  projectMembership?: any;
  projectRequired?: boolean;
  public?: boolean;
  indexField?: string;
  perm?: boolean;
  canDo?: boolean;
  isOwner?: boolean;
  hasOwner?: boolean;
  ip: string;
  parsedParams?: Record<string, any>;
  loadedObject?: any;
  files?: any;
}

export interface RequestParamOptions {
  default?: any;
  validate?: (value: any, project?: any) => boolean;
  filetypes?: string[];
}

export interface RequestHandlerOptions {
  model?: any;
  indexField?: string;
  canDo?: string;
  permRequired?: boolean;
  params?: any[];
  public?: boolean;
  projectRequired?: boolean;
  allowAnonymous?: boolean;
}

export interface NetsCoreConfig {
  database: {
    dialect: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql';
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    storage?: string;
    logging?: boolean | ((sql: string) => void);
  };
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  jwt: {
    secret: string;
    accessTokenExpire?: string;
    refreshTokenExpire?: string;
  };
  email?: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    from?: string;
    excludeDomains?: string[];
    footer?: string;
    footerTemplate?: string;
    debugEnabled?: boolean;
  };
  firebase?: {
    credentialsPath?: string;
    credentials?: any;
  };
  verificationCode?: {
    expireSeconds?: number;
    cacheKey?: string;
    debugCode?: string;
    testersEmails?: string[];
    testersCode?: string;
  };
  security?: {
    globalProtectedFields?: string[];
    userProhibitedFields?: string[];
    rateLimitWindowMs?: number;
    rateLimitMax?: number;
  };
  projectModel?: string;
  projectMemberModel?: string;
  templatesDir?: string;
}

export interface EmailOptions {
  subject: string;
  email: string | string[];
  template?: string;
  context?: Record<string, any>;
  txtTemplate?: string;
  toQueued?: boolean;
  force?: boolean;
  html?: string;
}

export interface FirebaseMessageData {
  [key: string]: string;
}

export interface DeviceNotificationResult {
  [deviceId: string]: {
    success: boolean;
    message_id?: string;
    error?: string;
  };
}

export interface SuccessResponseData {
  res: 1;
  data: any;
  extra?: any;
}

export interface ErrorResponseData {
  res: 0;
  message: string;
  data?: any;
}
