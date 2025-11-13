import { Response } from 'express';
import { SuccessResponseData, ErrorResponseData } from '../types';

export const successResponse = (data: any, extra?: any): SuccessResponseData => {
  const response: SuccessResponseData = {
    res: 1,
    data,
  };

  if (extra) {
    response.extra = extra;
  }

  return response;
};

export const errorResponse = (
  message: string = 'Bad request',
  statusCode: number = 400,
  data?: any
): { response: ErrorResponseData; statusCode: number } => {
  return {
    response: {
      res: 0,
      message,
      data,
    },
    statusCode,
  };
};

export const notFoundResponse = (): { response: ErrorResponseData; statusCode: number } => {
  return errorResponse('Not found', 404);
};

export const permissionDeniedResponse = (): { response: ErrorResponseData; statusCode: number } => {
  return errorResponse('Permission denied', 403);
};

export const sendSuccessResponse = (res: Response, data: any, extra?: any): Response => {
  return res.json(successResponse(data, extra));
};

export const sendErrorResponse = (
  res: Response,
  message: string = 'Bad request',
  statusCode: number = 400,
  data?: any
): Response => {
  return res.status(statusCode).json({
    res: 0,
    message,
    data,
  });
};

export const sendNotFoundResponse = (res: Response): Response => {
  return sendErrorResponse(res, 'Not found', 404);
};

export const sendPermissionDeniedResponse = (res: Response): Response => {
  return sendErrorResponse(res, 'Permission denied', 403);
};
