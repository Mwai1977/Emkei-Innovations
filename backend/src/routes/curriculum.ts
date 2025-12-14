import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/curriculum/learning-units - List learning units
router.get('/learning-units', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domainId, levelId } = req.query;

    const where: any = {};
    if (domainId) where.domainId = domainId;
    if (levelId) where.levelAppropriateId = levelId;

    const units = await prisma.learningUnit.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        domain: {
          select: { id: true, code: true, name: true },
        },
        levelAppropriate: true,
        competencyAreas: {
          include: {
            competencyArea: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    res.json(units);
  } catch (error) {
    next(error);
  }
});

// GET /api/curriculum/learning-units/:id - Get learning unit details
router.get('/learning-units/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unit = await prisma.learningUnit.findUnique({
      where: { id: req.params.id },
      include: {
        domain: true,
        levelAppropriate: true,
        competencyAreas: {
          include: {
            competencyArea: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        prerequisiteFor: {
          include: {
            unit: true,
          },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({ error: { message: 'Learning unit not found' } });
    }

    res.json(unit);
  } catch (error) {
    next(error);
  }
});

// GET /api/curriculum/recommendations/:projectId - Get curriculum recommendations for a project
router.get('/recommendations/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { participantId, status } = req.query;

    const where: any = { projectId };
    if (participantId) where.participantId = participantId;
    if (status) where.status = status;

    const recommendations = await prisma.curriculumRecommendation.findMany({
      where,
      orderBy: { priorityRank: 'asc' },
      include: {
        learningUnit: {
          include: {
            levelAppropriate: true,
            competencyAreas: {
              include: {
                competencyArea: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
        participant: {
          select: { id: true, firstName: true, lastName: true },
        },
        gapAnalyses: {
          include: {
            gapAnalysis: {
              include: {
                competencyArea: true,
              },
            },
          },
        },
      },
    });

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// POST /api/curriculum/generate-recommendations/:projectId - Generate curriculum recommendations
router.post(
  '/generate-recommendations/:projectId',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      const { forParticipantId } = req.body;

      // Get project with domain
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          domain: {
            include: {
              competencyAreas: true,
              learningUnits: {
                include: {
                  competencyAreas: {
                    include: {
                      competencyArea: true,
                    },
                  },
                  levelAppropriate: true,
                  prerequisites: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: { message: 'Project not found' } });
      }

      // Get gap analyses
      const gapQuery: any = {
        assessment: {
          projectId,
          assessmentType: 'BASELINE',
          status: 'COMPLETED',
        },
      };
      if (forParticipantId) {
        gapQuery.assessment.participantId = forParticipantId;
      }

      const gapAnalyses = await prisma.gapAnalysis.findMany({
        where: gapQuery,
        include: {
          competencyArea: true,
          currentLevel: true,
          targetLevel: true,
          assessment: {
            select: { participantId: true },
          },
        },
      });

      if (gapAnalyses.length === 0) {
        return res.status(400).json({ error: { message: 'No gap analyses found. Complete baseline assessments first.' } });
      }

      // Delete existing recommendations for this scope
      const deleteWhere: any = { projectId };
      if (forParticipantId) {
        deleteWhere.participantId = forParticipantId;
      } else {
        deleteWhere.participantId = null;
      }
      await prisma.curriculumRecommendation.deleteMany({ where: deleteWhere });

      // Aggregate gaps by competency area
      const areaGaps = new Map<string, {
        area: any;
        gaps: any[];
        avgGapScore: number;
        participantCount: number;
        maxPriority: string;
      }>();

      for (const gap of gapAnalyses) {
        const existing = areaGaps.get(gap.competencyAreaId);
        if (existing) {
          existing.gaps.push(gap);
          existing.avgGapScore = (existing.avgGapScore * (existing.participantCount) + gap.gapScore) / (existing.participantCount + 1);
          existing.participantCount++;
          // Track highest priority
          const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
          if (priorityOrder.indexOf(gap.priority) < priorityOrder.indexOf(existing.maxPriority)) {
            existing.maxPriority = gap.priority;
          }
        } else {
          areaGaps.set(gap.competencyAreaId, {
            area: gap.competencyArea,
            gaps: [gap],
            avgGapScore: gap.gapScore,
            participantCount: 1,
            maxPriority: gap.priority,
          });
        }
      }

      // Sort areas by priority and gap score
      const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      const sortedAreas = Array.from(areaGaps.values()).sort((a, b) => {
        const priorityDiff = priorityOrder.indexOf(a.maxPriority) - priorityOrder.indexOf(b.maxPriority);
        if (priorityDiff !== 0) return priorityDiff;
        return b.avgGapScore - a.avgGapScore;
      });

      // Find learning units that address each area
      const recommendations: any[] = [];
      let priorityRank = 1;

      for (const areaData of sortedAreas) {
        // Find learning units addressing this area
        const relevantUnits = project.domain.learningUnits.filter(unit =>
          unit.competencyAreas.some(ca => ca.competencyAreaId === areaData.area.id)
        );

        // Rank units by how well they match the current level + 1
        const avgCurrentLevel = areaData.gaps
          .filter(g => g.currentLevel)
          .reduce((sum, g) => sum + (g.currentLevel?.levelNumber || 1), 0) / Math.max(areaData.participantCount, 1);

        const targetLevelNumber = Math.ceil(avgCurrentLevel) + 1;

        // Sort units by level appropriateness
        const sortedUnits = relevantUnits.sort((a, b) => {
          const aLevel = a.levelAppropriate?.levelNumber || 1;
          const bLevel = b.levelAppropriate?.levelNumber || 1;
          const aDiff = Math.abs(aLevel - targetLevelNumber);
          const bDiff = Math.abs(bLevel - targetLevelNumber);
          return aDiff - bDiff;
        });

        // Add top unit as recommendation (if not already added)
        for (const unit of sortedUnits.slice(0, 2)) {
          const existing = recommendations.find(r => r.learningUnitId === unit.id);
          if (!existing) {
            recommendations.push({
              projectId,
              participantId: forParticipantId || null,
              learningUnitId: unit.id,
              priorityRank: priorityRank++,
              rationale: `Addresses ${areaData.area.name} gap (${areaData.maxPriority} priority, avg gap: ${Math.round(areaData.avgGapScore)}%). ${areaData.participantCount} participant(s) have gaps in this area.`,
              status: 'RECOMMENDED',
              gapAnalysisIds: areaData.gaps.map(g => g.id),
            });
          }
        }
      }

      // Create recommendations
      for (const rec of recommendations) {
        const { gapAnalysisIds, ...recData } = rec;
        const created = await prisma.curriculumRecommendation.create({
          data: recData,
        });

        // Link gap analyses
        for (const gapId of gapAnalysisIds) {
          await prisma.curriculumRecommendationGap.create({
            data: {
              recommendationId: created.id,
              gapAnalysisId: gapId,
            },
          });
        }
      }

      res.json({
        message: `Generated ${recommendations.length} recommendations`,
        count: recommendations.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/curriculum/recommendations/:id - Update recommendation status
router.put(
  '/recommendations/:id',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('status').isIn(['RECOMMENDED', 'ACCEPTED', 'REJECTED', 'DELIVERED']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;

      const recommendation = await prisma.curriculumRecommendation.update({
        where: { id: req.params.id },
        data: { status },
        include: {
          learningUnit: true,
        },
      });

      res.json(recommendation);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/curriculum - Create curriculum from recommendations
router.post(
  '/',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('projectId').isUUID(),
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('learningUnitIds').isArray().notEmpty(),
    body('learningUnitIds.*').isUUID(),
    body('deliverySchedule').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, name, description, learningUnitIds, deliverySchedule } = req.body;

      // Get learning units to calculate total hours
      const units = await prisma.learningUnit.findMany({
        where: { id: { in: learningUnitIds } },
      });

      const totalHours = units.reduce((sum, u) => sum + u.durationHours, 0);

      // Create curriculum
      const curriculum = await prisma.curriculum.create({
        data: {
          projectId,
          name,
          description,
          totalHours,
          deliverySchedule: deliverySchedule || {},
          createdById: req.user!.id,
          status: 'DRAFT',
        },
      });

      // Add learning units in order
      for (let i = 0; i < learningUnitIds.length; i++) {
        await prisma.curriculumLearningUnit.create({
          data: {
            curriculumId: curriculum.id,
            learningUnitId: learningUnitIds[i],
            sortOrder: i,
          },
        });
      }

      // Mark recommendations as accepted
      await prisma.curriculumRecommendation.updateMany({
        where: {
          projectId,
          learningUnitId: { in: learningUnitIds },
        },
        data: { status: 'ACCEPTED' },
      });

      // Fetch complete curriculum
      const completeCurriculum = await prisma.curriculum.findUnique({
        where: { id: curriculum.id },
        include: {
          learningUnits: {
            orderBy: { sortOrder: 'asc' },
            include: {
              learningUnit: {
                include: {
                  levelAppropriate: true,
                  competencyAreas: {
                    include: {
                      competencyArea: true,
                    },
                  },
                },
              },
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      res.status(201).json(completeCurriculum);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/curriculum/:id - Get curriculum details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, organizationId: true },
        },
        learningUnits: {
          orderBy: { sortOrder: 'asc' },
          include: {
            learningUnit: {
              include: {
                levelAppropriate: true,
                competencyAreas: {
                  include: {
                    competencyArea: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!curriculum) {
      return res.status(404).json({ error: { message: 'Curriculum not found' } });
    }

    res.json(curriculum);
  } catch (error) {
    next(error);
  }
});

// PUT /api/curriculum/:id - Update curriculum
router.put(
  '/:id',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['DRAFT', 'APPROVED', 'DELIVERED']),
    body('deliverySchedule').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, status, deliverySchedule } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (deliverySchedule) updateData.deliverySchedule = deliverySchedule;

      // If approving, set approver
      if (status === 'APPROVED') {
        updateData.approvedById = req.user!.id;
      }

      const curriculum = await prisma.curriculum.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          learningUnits: {
            orderBy: { sortOrder: 'asc' },
            include: {
              learningUnit: true,
            },
          },
        },
      });

      res.json(curriculum);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/curriculum/project/:projectId - Get curriculums for a project
router.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const curriculums = await prisma.curriculum.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        learningUnits: {
          orderBy: { sortOrder: 'asc' },
          include: {
            learningUnit: {
              select: { id: true, code: true, name: true, durationHours: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json(curriculums);
  } catch (error) {
    next(error);
  }
});

export default router;
