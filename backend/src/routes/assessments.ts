import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/assessments - List assessments for current user or all (admin)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, status, type } = req.query;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (type) where.assessmentType = type;

    // Participants can only see their own assessments
    if (req.user!.role === 'PARTICIPANT') {
      where.participantId = req.user!.id;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true },
        },
        instrument: {
          select: { id: true, name: true, type: true },
        },
        participant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { responses: true, gapAnalyses: true },
        },
      },
    });

    res.json(assessments);
  } catch (error) {
    next(error);
  }
});

// POST /api/assessments/start - Start a new assessment
router.post(
  '/start',
  [
    body('projectId').isUUID(),
    body('assessmentType').isIn(['BASELINE', 'POST_TRAINING']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, assessmentType } = req.body;
      const participantId = req.user!.id;

      // Check if participant is enrolled in project
      const enrollment = await prisma.projectParticipant.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: participantId,
          },
        },
      });

      if (!enrollment && req.user!.role === 'PARTICIPANT') {
        return res.status(403).json({ error: { message: 'Not enrolled in this project' } });
      }

      // Get project and its instrument
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          domain: {
            include: {
              assessmentInstruments: {
                where: { isActive: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: { message: 'Project not found' } });
      }

      const instrument = project.domain.assessmentInstruments[0];
      if (!instrument) {
        return res.status(400).json({ error: { message: 'No active assessment instrument found' } });
      }

      // Check for existing assessment of same type
      const existingAssessment = await prisma.assessment.findFirst({
        where: {
          participantId,
          projectId,
          assessmentType,
        },
      });

      if (existingAssessment) {
        if (existingAssessment.status === 'COMPLETED') {
          return res.status(400).json({ error: { message: 'Assessment already completed' } });
        }
        // Return existing in-progress assessment
        return res.json(existingAssessment);
      }

      // Create new assessment
      const assessment = await prisma.assessment.create({
        data: {
          participantId,
          projectId,
          instrumentId: instrument.id,
          assessmentType,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          instrument: {
            include: {
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
          },
        },
      });

      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/assessments/:id - Get assessment details with questions
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        instrument: {
          include: {
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
        },
        responses: true,
        participant: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found' } });
    }

    // Check access
    if (req.user!.role === 'PARTICIPANT' && assessment.participantId !== req.user!.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // For participants, hide correct answers during assessment
    if (req.user!.role === 'PARTICIPANT' && assessment.status !== 'COMPLETED') {
      const sanitizedAssessment = {
        ...assessment,
        instrument: {
          ...assessment.instrument,
          questions: assessment.instrument.questions.map(q => ({
            ...q,
            correctAnswer: undefined,
            rationale: undefined,
          })),
        },
      };
      return res.json(sanitizedAssessment);
    }

    res.json(assessment);
  } catch (error) {
    next(error);
  }
});

// POST /api/assessments/:id/responses - Submit assessment responses
router.post(
  '/:id/responses',
  [
    body('responses').isArray().notEmpty(),
    body('responses.*.questionId').isUUID(),
    body('responses.*.responseValue').exists(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assessmentId = req.params.id;
      const { responses } = req.body;

      // Get assessment
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          instrument: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!assessment) {
        return res.status(404).json({ error: { message: 'Assessment not found' } });
      }

      // Check ownership
      if (assessment.participantId !== req.user!.id) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }

      if (assessment.status === 'COMPLETED') {
        return res.status(400).json({ error: { message: 'Assessment already completed' } });
      }

      // Process responses
      const responseData = responses.map((r: any) => {
        const question = assessment.instrument.questions.find(q => q.id === r.questionId);
        let score = 0;

        if (question) {
          if (question.questionType === 'SELF_RATING') {
            // Self-rating: score is the rating value (1-5)
            score = parseInt(r.responseValue) || 0;
          } else if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'SCENARIO') {
            // Check if answer is correct
            const correctAnswer = question.correctAnswer as any;
            if (correctAnswer) {
              const isCorrect = Array.isArray(correctAnswer)
                ? correctAnswer.includes(r.responseValue)
                : correctAnswer === r.responseValue;
              score = isCorrect ? question.points : 0;
            }
          } else if (question.questionType === 'TRUE_FALSE') {
            const isCorrect = question.correctAnswer === r.responseValue;
            score = isCorrect ? question.points : 0;
          }
        }

        return {
          assessmentId,
          questionId: r.questionId,
          responseValue: r.responseValue,
          score,
          timeSpentSeconds: r.timeSpentSeconds || null,
        };
      });

      // Upsert responses
      for (const response of responseData) {
        await prisma.assessmentResponse.upsert({
          where: {
            assessmentId_questionId: {
              assessmentId: response.assessmentId,
              questionId: response.questionId,
            },
          },
          update: {
            responseValue: response.responseValue,
            score: response.score,
            timeSpentSeconds: response.timeSpentSeconds,
            answeredAt: new Date(),
          },
          create: response,
        });
      }

      res.json({ message: 'Responses saved', count: responseData.length });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/assessments/:id/complete - Complete assessment and trigger gap analysis
router.post('/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessmentId = req.params.id;

    // Get assessment with responses
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        responses: {
          include: {
            question: {
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
        },
        participant: {
          include: {
            participant: true,
          },
        },
        project: {
          include: {
            domain: {
              include: {
                competencyAreas: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found' } });
    }

    if (assessment.participantId !== req.user!.id && !['SYSTEM_ADMIN', 'FACILITATOR'].includes(req.user!.role)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    if (assessment.status === 'COMPLETED') {
      return res.status(400).json({ error: { message: 'Assessment already completed' } });
    }

    // Calculate time taken
    const timeTakenMinutes = assessment.startedAt
      ? Math.round((Date.now() - assessment.startedAt.getTime()) / 60000)
      : null;

    // Update assessment status
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        timeTakenMinutes,
      },
    });

    // Generate gap analysis for each competency area
    const competencyAreas = assessment.project.domain.competencyAreas;
    const participantRole = assessment.participant.participant?.currentRoleType || 'INSPECTOR';

    for (const area of competencyAreas) {
      // Get responses for this area
      const areaResponses = assessment.responses.filter(
        r => r.question.competencyItem.area.id === area.id
      );

      // Calculate self-rating score (average of self-rating responses)
      const selfRatingResponses = areaResponses.filter(r => r.question.questionType === 'SELF_RATING');
      const selfRatingScore = selfRatingResponses.length > 0
        ? selfRatingResponses.reduce((sum, r) => sum + (r.score || 0), 0) / selfRatingResponses.length
        : null;

      // Calculate knowledge score (percentage of correct answers)
      const knowledgeResponses = areaResponses.filter(r => r.question.questionType !== 'SELF_RATING');
      const maxKnowledgePoints = knowledgeResponses.reduce((sum, r) => sum + r.question.points, 0);
      const earnedPoints = knowledgeResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      const knowledgeScore = maxKnowledgePoints > 0
        ? (earnedPoints / maxKnowledgePoints) * 100
        : null;

      // Get target level for this role and area
      const roleTarget = await prisma.roleTargetLevel.findUnique({
        where: {
          roleType_areaCode: {
            roleType: participantRole,
            areaCode: area.code,
          },
        },
        include: { level: true },
      });

      const targetBenchmark = roleTarget?.level.benchmarkScore || 70;

      // Determine current level based on knowledge score
      let currentLevel = await prisma.competencyLevel.findFirst({
        where: {
          benchmarkScore: { lte: knowledgeScore || 0 },
        },
        orderBy: { benchmarkScore: 'desc' },
      });

      // Calculate gap score
      const gapScore = targetBenchmark - (knowledgeScore || 0);

      // Determine priority
      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (gapScore > 40) {
        priority = 'CRITICAL';
      } else if (gapScore > 30) {
        priority = 'HIGH';
      } else if (gapScore > 15) {
        priority = 'MEDIUM';
      }

      // Create gap analysis record
      await prisma.gapAnalysis.create({
        data: {
          assessmentId,
          competencyAreaId: area.id,
          selfRatingScore,
          knowledgeScore,
          gapScore: Math.max(0, gapScore),
          priority,
          currentLevelId: currentLevel?.id,
          targetLevelId: roleTarget?.levelId,
        },
      });
    }

    // Return completed assessment with gap analysis
    const completedAssessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        gapAnalyses: {
          include: {
            competencyArea: true,
            currentLevel: true,
            targetLevel: true,
          },
        },
      },
    });

    res.json({
      message: 'Assessment completed',
      assessment: completedAssessment,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/assessments/:id/results - Get assessment results with gap analysis
router.get('/:id/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        participant: {
          select: { id: true, firstName: true, lastName: true },
        },
        responses: {
          include: {
            question: {
              include: {
                competencyItem: {
                  include: {
                    area: true,
                  },
                },
              },
            },
          },
        },
        gapAnalyses: {
          include: {
            competencyArea: true,
            currentLevel: true,
            targetLevel: true,
          },
          orderBy: {
            competencyArea: {
              sortOrder: 'asc',
            },
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: { message: 'Assessment not found' } });
    }

    // Check access
    if (req.user!.role === 'PARTICIPANT' && assessment.participantId !== req.user!.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Calculate overall statistics
    const totalQuestions = assessment.responses.length;
    const totalScore = assessment.responses.reduce((sum, r) => sum + (r.score || 0), 0);
    const maxPossibleScore = assessment.responses.reduce((sum, r) => {
      const question = r.question;
      return sum + (question.questionType === 'SELF_RATING' ? 5 : question.points);
    }, 0);

    res.json({
      assessment: {
        id: assessment.id,
        type: assessment.assessmentType,
        status: assessment.status,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        timeTakenMinutes: assessment.timeTakenMinutes,
      },
      participant: assessment.participant,
      project: assessment.project,
      summary: {
        totalQuestions,
        totalScore,
        maxPossibleScore,
        percentageScore: maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0,
      },
      gapAnalysis: assessment.gapAnalyses.map(ga => ({
        area: ga.competencyArea,
        selfRatingScore: ga.selfRatingScore,
        knowledgeScore: ga.knowledgeScore,
        gapScore: ga.gapScore,
        priority: ga.priority,
        currentLevel: ga.currentLevel,
        targetLevel: ga.targetLevel,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
