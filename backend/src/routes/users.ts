import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/me - Get current user profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: true,
        participant: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const { passwordHash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/me - Update current user profile
router.put(
  '/me',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('profile').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, profile } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(profile && { profile }),
        },
        include: {
          organization: true,
          participant: true,
        },
      });

      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/me/participant-profile - Update participant profile
router.put(
  '/me/participant-profile',
  [
    body('jobTitle').optional().trim(),
    body('yearsExperience').optional().isInt({ min: 0 }),
    body('educationLevel').optional().isIn(['HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'OTHER']),
    body('currentRoleType').optional().isIn(['JUNIOR_INSPECTOR', 'INSPECTOR', 'SENIOR_INSPECTOR', 'UNIT_MANAGER', 'ANALYST', 'DIRECTOR', 'OTHER']),
    body('professionalBackground').optional().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { jobTitle, yearsExperience, educationLevel, currentRoleType, professionalBackground } = req.body;

      // Upsert participant profile
      const profile = await prisma.participantProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          ...(jobTitle !== undefined && { jobTitle }),
          ...(yearsExperience !== undefined && { yearsExperience }),
          ...(educationLevel && { educationLevel }),
          ...(currentRoleType && { currentRoleType }),
          ...(professionalBackground !== undefined && { professionalBackground }),
        },
        create: {
          userId: req.user!.id,
          jobTitle,
          yearsExperience,
          educationLevel,
          currentRoleType,
          professionalBackground,
        },
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users - List all users (admin only)
router.get(
  '/',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, role, page = '1', limit = '20' } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {};
      if (organizationId) where.organizationId = organizationId;
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            organization: {
              select: { id: true, name: true },
            },
            participant: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users: users.map(({ passwordHash, ...user }) => user),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/:id - Get user by ID (admin only)
router.get(
  '/:id',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          organization: true,
          participant: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: { message: 'User not found' } });
      }

      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
