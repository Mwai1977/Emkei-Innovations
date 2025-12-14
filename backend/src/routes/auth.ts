import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['PARTICIPANT', 'FACILITATOR', 'CLIENT_ADMIN', 'SYSTEM_ADMIN']),
    body('organizationId').optional().isUUID(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role, organizationId } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: { message: 'Email already registered' } });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: role || 'PARTICIPANT',
          organizationId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
      });

      // If participant, create profile
      if (role === 'PARTICIPANT' || !role) {
        await prisma.participantProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: 'Registration successful',
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          participant: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: { message: 'Invalid email or password' } });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: { message: 'Account is deactivated' } });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: { message: 'Invalid email or password' } });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: user.organization,
          profile: user.participant,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const token = generateToken({
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Not authenticated' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true,
          },
        },
        participant: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
      profile: user.participant,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
