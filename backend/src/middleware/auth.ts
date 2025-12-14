import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../index';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
        organizationId?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'No token provided' } });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);

      // Fetch user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          organizationId: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: { message: 'User not found or inactive' } });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId || undefined,
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Insufficient permissions' } });
    }

    next();
  };
};

// Middleware to check if user belongs to the specified organization
export const authorizeOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    // System admins and facilitators can access all organizations
    if (['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user.role)) {
      return next();
    }

    const organizationId = req.params.organizationId || req.body.organizationId;

    if (organizationId && req.user.organizationId !== organizationId) {
      return res.status(403).json({ error: { message: 'Access denied to this organization' } });
    }

    next();
  } catch (error) {
    next(error);
  }
};
