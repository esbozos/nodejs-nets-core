import { Request, Response, NextFunction } from 'express';
import { NetsCoreRequest, RequestHandlerOptions } from '../types';
import { RequestParam } from './params';
import { sendErrorResponse, sendPermissionDeniedResponse } from '../utils/responses';
import { getClientIp } from '../utils';

export const requestHandler = (options: RequestHandlerOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(req: NetsCoreRequest, res: Response, next: NextFunction) {
      try {
        // Check authentication
        if (!options.public && !req.user) {
          return sendPermissionDeniedResponse(res);
        }

        // Initialize request properties
        req.project = null;
        req.projectMembership = null;
        req.projectRequired = options.projectRequired || false;
        req.public = options.public || false;
        req.indexField = options.indexField || 'id';

        // Parse and validate parameters
        try {
          req.params = await parseRequestParams(req, options.params || [], req.project);
        } catch (error: any) {
          return sendErrorResponse(res, error.message, 400);
        }

        // Check permissions
        if (options.canDo) {
          const hasPerm = await checkPermission(req.user, options.canDo, req.project);
          req.perm = hasPerm;
          req.canDo = hasPerm;

          if (!hasPerm && options.permRequired) {
            return sendPermissionDeniedResponse(res);
          }
        } else {
          req.perm = options.public || false;
          req.canDo = options.public || false;
        }

        // Load object if model is specified
        if (options.model) {
          try {
            req.obj = await getRequestObject(req, options.model);
          } catch (error: any) {
            return sendErrorResponse(res, error.message, error.statusCode || 404);
          }
        }

        // Set IP address
        req.ip = getClientIp(req) || '';

        // Call original method
        return await originalMethod.call(this, req, res, next);
      } catch (error: any) {
        console.error('Request handler error:', error);
        return sendErrorResponse(res, error.message || 'Internal server error', 500);
      }
    };

    return descriptor;
  };
};

// Middleware version for non-decorator use
export const requestHandlerMiddleware = (options: RequestHandlerOptions = {}) => {
  return async (req: NetsCoreRequest, res: Response, next: NextFunction) => {
    try {
      // Check authentication
      if (!options.public && !req.user) {
        return sendPermissionDeniedResponse(res);
      }

      // Initialize request properties
      req.project = null;
      req.projectMembership = null;
      req.projectRequired = options.projectRequired || false;
      req.public = options.public || false;
      req.indexField = options.indexField || 'id';

      // Parse and validate parameters
      try {
        req.params = await parseRequestParams(req, options.params || [], req.project);
      } catch (error: any) {
        return sendErrorResponse(res, error.message, 400);
      }

      // Check permissions
      if (options.canDo) {
        const hasPerm = await checkPermission(req.user, options.canDo, req.project);
        req.perm = hasPerm;
        req.canDo = hasPerm;

        if (!hasPerm && options.permRequired) {
          return sendPermissionDeniedResponse(res);
        }
      } else {
        req.perm = options.public || false;
        req.canDo = options.public || false;
      }

      // Load object if model is specified
      if (options.model) {
        try {
          req.obj = await getRequestObject(req, options.model);
        } catch (error: any) {
          return sendErrorResponse(res, error.message, error.statusCode || 404);
        }
      }

      // Set IP address
      req.ip = getClientIp(req) || '';

      next();
    } catch (error: any) {
      console.error('Request handler error:', error);
      return sendErrorResponse(res, error.message || 'Internal server error', 500);
    }
  };
};

async function parseRequestParams(
  req: NetsCoreRequest,
  params: RequestParam[],
  project?: any
): Promise<Record<string, any>> {
  const data = extractRequestData(req);
  const parsedData: Record<string, any> = {};

  // Convert params array to map for easier access
  const paramsMap: Record<string, RequestParam> = {};
  for (const param of params) {
    paramsMap[param.key] = param;
  }

  // Parse all data from request
  for (const [key, value] of Object.entries(data)) {
    if (paramsMap[key]) {
      parsedData[key] = paramsMap[key].getValue(data, project);
    } else {
      parsedData[key] = value;
    }
  }

  // Handle files
  if (req.files) {
    for (const [key, file] of Object.entries(req.files as any)) {
      if (paramsMap[key] && paramsMap[key].type === 'file') {
        parsedData[key] = file;
      }
    }
  }

  // Check for missing required parameters
  const missingParams: string[] = [];
  for (const param of params) {
    if (!param.optional && !(param.key in parsedData)) {
      if (param.options.default !== undefined) {
        parsedData[param.key] = param.options.default;
      } else {
        missingParams.push(param.key);
      }
    }
  }

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  return parsedData;
}

function extractRequestData(req: Request): Record<string, any> {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    return req.body || {};
  }

  if (req.method === 'GET') {
    return req.query as Record<string, any>;
  }

  return { ...(req.body || {}), ...(req.query || {}) };
}

async function getRequestObject(req: NetsCoreRequest, model: any): Promise<any> {
  const indexField = req.indexField || 'id';
  
  if (!req.params[indexField]) {
    throw new Error(`Index field "${indexField}" not provided`);
  }

  const indexValue = req.params[indexField];
  
  const query: any = {};
  query[indexField] = indexValue;

  const obj = await model.findOne({ where: query });

  if (!obj) {
    const error: any = new Error('Not found');
    error.statusCode = 404;
    throw error;
  }

  // Check ownership
  req.isOwner = false;
  req.hasOwner = false;

  if (obj.userId) {
    req.hasOwner = true;
    req.isOwner = req.user && obj.userId === req.user.id;
  }

  // If not public and user doesn't have permission and is not owner, deny access
  if (!req.public && !req.perm && req.hasOwner && !req.isOwner) {
    const error: any = new Error('Not found');
    error.statusCode = 404;
    throw error;
  }

  return obj;
}

async function checkPermission(user: any, action: string, project?: any): Promise<boolean> {
  if (!user) return false;
  
  // Superusers have all permissions
  if (user.isSuperuser) return true;

  // Import Permission model dynamically to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Permission } = require('../models');

  // Check if it's a role check
  if (action.startsWith('role:')) {
    // const roleName = action.substring(5).toLowerCase();
    
    if (project) {
      // Check project membership role
      // This would need to be implemented based on your project structure
      // For now, return false
      return false;
    }
    
    return false;
  }

  // Ensure permission exists
  const [permission] = await Permission.getOrCreate(action.toLowerCase());

  if (project) {
    // Check project-level permissions
    // This would need project membership logic
    return false;
  }

  // Check user's roles and permissions
  const userRoles = await user.getRoles?.();
  
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  for (const userRole of userRoles) {
    const role = userRole.role || userRole;
    if (!role.enabled) continue;

    const hasPermission = await role.hasPermission(permission.codename);
    if (hasPermission) {
      return true;
    }
  }

  return false;
}

export { RequestParam } from './params';
