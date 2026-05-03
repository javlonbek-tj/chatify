import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ENV } from '../config/env';
import logger from '../utils/logger';

const sendErrorDev = (err: AppError, res: Response) => {
  if (err.statusCode >= 500) {
    logger.error(err.message, { stack: err.stack, statusCode: err.statusCode });
  }
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error('Unexpected error', { error: err.message, stack: err.stack });
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (ENV.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
