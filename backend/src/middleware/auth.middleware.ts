import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../modules/auth/auth.service';
import User from '../modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ status: 'fail', message: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({ status: 'fail', message: 'User not found' });
      return;
    }

    // Reject token if password was changed after it was issued
    if (
      user.passwordChangedAt &&
      decoded.iat != null &&
      decoded.iat < user.passwordChangedAt.getTime() / 1000
    ) {
      res.status(401).json({ status: 'fail', message: 'Password recently changed. Please log in again.' });
      return;
    }

    req.user = { userId: user._id.toString(), email: user.email };

    next();
  } catch {
    res.status(401).json({ status: 'fail', message: 'Invalid or expired token' });
  }
}
