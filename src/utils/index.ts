import { NetsCoreRequest } from '../types';

export const getClientIp = (req: NetsCoreRequest): string | null => {
  const META_PRECEDENCE_ORDER = [
    'HTTP_X_FORWARDED_FOR',
    'X_FORWARDED_FOR',
    'HTTP_CLIENT_IP',
    'HTTP_X_REAL_IP',
    'HTTP_X_FORWARDED',
    'HTTP_X_CLUSTER_CLIENT_IP',
    'HTTP_FORWARDED_FOR',
    'HTTP_FORWARDED',
    'HTTP_VIA',
    'REMOTE_ADDR'
  ];

  for (const header of META_PRECEDENCE_ORDER) {
    const ip = req.headers[header.toLowerCase()] || req.headers[header];
    if (ip) {
      if (typeof ip === 'string' && ip.includes(',')) {
        return ip.split(',')[0].trim();
      }
      return Array.isArray(ip) ? ip[0] : ip;
    }
  }

  return req.ip || req.socket.remoteAddress || null;
};

export const generateIntUuid = (size: number = 6): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const combined = `${random}${timestamp}`;
  return combined.substring(0, size);
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(lowerValue);
  }
  return false;
};

export const parseInteger = (value: any): number => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to integer`);
  }
  return parsed;
};

export const parseFloat = (value: any): number => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to float`);
  }
  return parsed;
};

export const parseDate = (value: any): Date => {
  if (value instanceof Date) return value;
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  
  return date;
};

export const parseArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Try comma-separated values
      return value
        .replace(/[[\]'"]/g, '')
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
    }
  }
  
  throw new Error(`Cannot convert "${value}" to array`);
};

export const parseObject = (value: any): Record<string, any> => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      throw new Error(`Cannot parse object from string: ${value}`);
    }
  }
  
  throw new Error(`Cannot convert "${value}" to object`);
};
