import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/organizations - List organizations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, country } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (country) where.country = country;

    // Non-admin users can only see their own organization
    if (!['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user!.role)) {
      where.id = req.user!.organizationId;
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, projects: true },
        },
      },
    });

    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

// POST /api/organizations - Create organization (admin only)
router.post(
  '/',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['NRA', 'MANUFACTURER', 'ACADEMIC', 'DEVELOPMENT_PARTNER', 'OTHER']),
    body('country').trim().notEmpty(),
    body('settings').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, country, settings } = req.body;

      const organization = await prisma.organization.create({
        data: {
          name,
          type,
          country,
          settings: settings || {},
        },
      });

      res.status(201).json(organization);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/organizations/:id - Get organization details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check access
    if (!['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user!.role) && req.user!.organizationId !== req.params.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: { message: 'Organization not found' } });
    }

    res.json(organization);
  } catch (error) {
    next(error);
  }
});

// PUT /api/organizations/:id - Update organization
router.put(
  '/:id',
  authorize('SYSTEM_ADMIN', 'FACILITATOR', 'CLIENT_ADMIN'),
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().isIn(['NRA', 'MANUFACTURER', 'ACADEMIC', 'DEVELOPMENT_PARTNER', 'OTHER']),
    body('country').optional().trim().notEmpty(),
    body('settings').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Client admins can only update their own organization
      if (req.user!.role === 'CLIENT_ADMIN' && req.user!.organizationId !== req.params.id) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }

      const { name, type, country, settings } = req.body;

      const organization = await prisma.organization.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(country && { country }),
          ...(settings && { settings }),
        },
      });

      res.json(organization);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
