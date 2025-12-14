import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/projects - List projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, status, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;

    // Non-admin/facilitator users can only see their organization's projects
    if (!['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user!.role)) {
      where.organizationId = req.user!.organizationId;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true },
          },
          domain: {
            select: { id: true, code: true, name: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: {
              projectParticipants: true,
              assessments: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
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
});

// POST /api/projects - Create project
router.post(
  '/',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('organizationId').isUUID(),
    body('domainId').isUUID(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('settings').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, organizationId, domainId, startDate, endDate, settings } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          organizationId,
          domainId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          settings: settings || {},
          createdById: req.user!.id,
        },
        include: {
          organization: true,
          domain: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:id - Get project details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        organization: true,
        domain: {
          include: {
            competencyAreas: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        projectParticipants: {
          include: {
            project: false,
          },
        },
        _count: {
          select: {
            assessments: true,
            curriculums: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Check access
    if (!['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user!.role) && project.organizationId !== req.user!.organizationId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
router.put(
  '/:id',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['SETUP', 'ACTIVE', 'DELIVERY', 'EVALUATION', 'COMPLETED']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('settings').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, status, startDate, endDate, settings } = req.body;

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(settings && { settings }),
        },
        include: {
          organization: true,
          domain: true,
        },
      });

      res.json(project);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/projects/:id/invite - Invite participants to project
router.post(
  '/:id/invite',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('userIds').isArray().notEmpty(),
    body('userIds.*').isUUID(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userIds } = req.body;
      const projectId = req.params.id;

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: { message: 'Project not found' } });
      }

      // Create participant records
      const participants = await prisma.projectParticipant.createMany({
        data: userIds.map((userId: string) => ({
          projectId,
          userId,
        })),
        skipDuplicates: true,
      });

      res.json({
        message: `${participants.count} participant(s) invited`,
        count: participants.count,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:id/participants - Get project participants
router.get('/:id/participants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;

    const participants = await prisma.projectParticipant.findMany({
      where: { projectId },
      include: {
        project: false,
      },
    });

    // Get user details for participants
    const userIds = participants.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        participant: true,
      },
    });

    // Get assessment status for each participant
    const assessments = await prisma.assessment.findMany({
      where: {
        projectId,
        participantId: { in: userIds },
      },
      select: {
        participantId: true,
        assessmentType: true,
        status: true,
        completedAt: true,
      },
    });

    // Combine data
    const participantData = participants.map(p => {
      const user = users.find(u => u.id === p.userId);
      const userAssessments = assessments.filter(a => a.participantId === p.userId);

      return {
        ...p,
        user,
        assessments: {
          baseline: userAssessments.find(a => a.assessmentType === 'BASELINE'),
          postTraining: userAssessments.find(a => a.assessmentType === 'POST_TRAINING'),
        },
      };
    });

    res.json(participantData);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/gap-analysis - Get project gap analysis summary
router.get('/:id/gap-analysis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;

    // Get all baseline assessments for this project
    const assessments = await prisma.assessment.findMany({
      where: {
        projectId,
        assessmentType: 'BASELINE',
        status: 'COMPLETED',
      },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        gapAnalyses: {
          include: {
            competencyArea: true,
            currentLevel: true,
            targetLevel: true,
          },
        },
      },
    });

    // Get competency areas for the project's domain
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        domain: {
          include: {
            competencyAreas: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Calculate cohort statistics by competency area
    const areaStats = project.domain.competencyAreas.map(area => {
      const areaGaps = assessments.flatMap(a =>
        a.gapAnalyses.filter(g => g.competencyAreaId === area.id)
      );

      const scores = areaGaps.map(g => g.knowledgeScore || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const priorityCounts = {
        CRITICAL: areaGaps.filter(g => g.priority === 'CRITICAL').length,
        HIGH: areaGaps.filter(g => g.priority === 'HIGH').length,
        MEDIUM: areaGaps.filter(g => g.priority === 'MEDIUM').length,
        LOW: areaGaps.filter(g => g.priority === 'LOW').length,
      };

      return {
        area: {
          id: area.id,
          code: area.code,
          name: area.name,
        },
        participantCount: areaGaps.length,
        averageScore: Math.round(avgScore * 100) / 100,
        priorityCounts,
        avgGapScore: areaGaps.length > 0
          ? Math.round((areaGaps.reduce((sum, g) => sum + g.gapScore, 0) / areaGaps.length) * 100) / 100
          : 0,
      };
    });

    // Heatmap data: participants × areas
    const heatmapData = assessments.map(assessment => ({
      participant: assessment.participant,
      scores: project.domain.competencyAreas.map(area => {
        const gap = assessment.gapAnalyses.find(g => g.competencyAreaId === area.id);
        return {
          areaCode: area.code,
          score: gap?.knowledgeScore || null,
          priority: gap?.priority || null,
        };
      }),
    }));

    res.json({
      project: {
        id: project.id,
        name: project.name,
      },
      summary: {
        totalParticipants: assessments.length,
        completedAssessments: assessments.length,
        areaStats,
      },
      heatmap: heatmapData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
