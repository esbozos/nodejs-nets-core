import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { NetsCoreRequest } from '../types';
import { User } from '../models';

export const authMiddleware = (secret: string) => {
  return async (req: NetsCoreRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        req.user = null;
        return next();
      }

      const parts = authHeader.split(' ');

      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        req.user = null;
        return next();
      }

      const token = parts[1];

      try {
        const decoded = jwt.verify(token, secret) as any;

        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
          req.user = null;
          return next();
        }

        req.user = user;
        next();
      } catch (error) {
        req.user = null;
        next();
      }
    } catch (error) {
      req.user = null;
      next();
    }
  };
};

export const requireAuth = () => {
  return (req: NetsCoreRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        res: 0,
        message: 'Authentication required',
      });
    }
    next();
  };
};

export const checkPermission = (permission: string) => {
  return async (req: NetsCoreRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        res: 0,
        message: 'Authentication required',
      });
    }

    // Check permission logic here
    // This is simplified - implement full permission checking
    const hasPermission = req.user.isSuperuser; // Simplified

    if (!hasPermission) {
      return res.status(403).json({
        res: 0,
        message: 'Permission denied',
      });
    }

    next();
  };
};
