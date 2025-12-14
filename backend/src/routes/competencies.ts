import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/competencies/domains - List competency domains
router.get('/domains', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domains = await prisma.competencyDomain.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            competencyAreas: true,
            learningUnits: true,
            projects: true,
          },
        },
      },
    });

    res.json(domains);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/domains/:id - Get domain with full structure
router.get('/domains/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = await prisma.competencyDomain.findUnique({
      where: { id: req.params.id },
      include: {
        competencyAreas: {
          orderBy: { sortOrder: 'asc' },
          include: {
            competencyItems: {
              orderBy: { sortOrder: 'asc' },
              include: {
                level: true,
              },
            },
          },
        },
        assessmentInstruments: {
          where: { isActive: true },
        },
        learningUnits: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!domain) {
      return res.status(404).json({ error: { message: 'Domain not found' } });
    }

    res.json(domain);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/levels - List competency levels
router.get('/levels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levels = await prisma.competencyLevel.findMany({
      orderBy: { levelNumber: 'asc' },
    });

    res.json(levels);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/areas - List competency areas
router.get('/areas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domainId } = req.query;

    const where: any = {};
    if (domainId) where.domainId = domainId;

    const areas = await prisma.competencyArea.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        domain: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { competencyItems: true },
        },
      },
    });

    res.json(areas);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/areas/:id - Get area with items
router.get('/areas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await prisma.competencyArea.findUnique({
      where: { id: req.params.id },
      include: {
        domain: true,
        competencyItems: {
          orderBy: { sortOrder: 'asc' },
          include: {
            level: true,
          },
        },
      },
    });

    if (!area) {
      return res.status(404).json({ error: { message: 'Competency area not found' } });
    }

    res.json(area);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/instruments - List assessment instruments
router.get('/instruments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domainId, active } = req.query;

    const where: any = {};
    if (domainId) where.domainId = domainId;
    if (active === 'true') where.isActive = true;

    const instruments = await prisma.assessmentInstrument.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        domain: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    res.json(instruments);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/instruments/:id - Get instrument with questions
router.get('/instruments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instrument = await prisma.assessmentInstrument.findUnique({
      where: { id: req.params.id },
      include: {
        domain: true,
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            competencyItem: {
              include: {
                area: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!instrument) {
      return res.status(404).json({ error: { message: 'Assessment instrument not found' } });
    }

    res.json(instrument);
  } catch (error) {
    next(error);
  }
});

// GET /api/competencies/role-targets - Get target levels by role
router.get('/role-targets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleType } = req.query;

    const where: any = {};
    if (roleType) where.roleType = roleType;

    const targets = await prisma.roleTargetLevel.findMany({
      where,
      include: {
        level: true,
      },
      orderBy: { areaCode: 'asc' },
    });

    res.json(targets);
  } catch (error) {
    next(error);
  }
});

// Admin routes for managing competencies

// POST /api/competencies/domains - Create domain (admin only)
router.post(
  '/domains',
  authorize('SYSTEM_ADMIN'),
  [
    body('code').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('frameworkAlignment').optional().isArray(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code, name, description, frameworkAlignment } = req.body;

      const domain = await prisma.competencyDomain.create({
        data: {
          code,
          name,
          description,
          frameworkAlignment: frameworkAlignment || [],
        },
      });

      res.status(201).json(domain);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/competencies/areas - Create competency area (admin only)
router.post(
  '/areas',
  authorize('SYSTEM_ADMIN'),
  [
    body('domainId').isUUID(),
    body('code').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('weight').optional().isFloat({ min: 0 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { domainId, code, name, description, sortOrder, weight } = req.body;

      const area = await prisma.competencyArea.create({
        data: {
          domainId,
          code,
          name,
          description,
          sortOrder: sortOrder || 0,
          weight: weight || 1.0,
        },
      });

      res.status(201).json(area);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/competencies/items - Create competency item (admin only)
router.post(
  '/items',
  authorize('SYSTEM_ADMIN'),
  [
    body('areaId').isUUID(),
    body('levelId').isUUID(),
    body('code').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('learningOutcomes').optional().isArray(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { areaId, levelId, code, description, sortOrder, learningOutcomes } = req.body;

      const item = await prisma.competencyItem.create({
        data: {
          areaId,
          levelId,
          code,
          description,
          sortOrder: sortOrder || 0,
          learningOutcomes: learningOutcomes || [],
        },
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
