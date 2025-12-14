import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/reports/individual/:participantId/:projectId - Get individual competency development report
router.get('/individual/:participantId/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { participantId, projectId } = req.params;

    // Check access
    if (req.user!.role === 'PARTICIPANT' && req.user!.id !== participantId) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Get participant
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      include: {
        participant: true,
        organization: true,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: { message: 'Participant not found' } });
    }

    // Get project
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
        organization: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }

    // Get assessments
    const [baselineAssessment, postAssessment] = await Promise.all([
      prisma.assessment.findFirst({
        where: {
          participantId,
          projectId,
          assessmentType: 'BASELINE',
          status: 'COMPLETED',
        },
        include: {
          gapAnalyses: {
            include: {
              competencyArea: true,
              currentLevel: true,
              targetLevel: true,
            },
          },
        },
      }),
      prisma.assessment.findFirst({
        where: {
          participantId,
          projectId,
          assessmentType: 'POST_TRAINING',
          status: 'COMPLETED',
        },
        include: {
          gapAnalyses: {
            include: {
              competencyArea: true,
              currentLevel: true,
              targetLevel: true,
            },
          },
        },
      }),
    ]);

    // Calculate improvements if both assessments exist
    let improvements = null;
    if (baselineAssessment && postAssessment) {
      improvements = project.domain.competencyAreas.map(area => {
        const baselineGap = baselineAssessment.gapAnalyses.find(g => g.competencyAreaId === area.id);
        const postGap = postAssessment.gapAnalyses.find(g => g.competencyAreaId === area.id);

        return {
          area: {
            id: area.id,
            code: area.code,
            name: area.name,
          },
          baseline: {
            score: baselineGap?.knowledgeScore || 0,
            level: baselineGap?.currentLevel?.name || 'N/A',
          },
          post: {
            score: postGap?.knowledgeScore || 0,
            level: postGap?.currentLevel?.name || 'N/A',
          },
          improvement: postGap && baselineGap
            ? Math.round((postGap.knowledgeScore || 0) - (baselineGap.knowledgeScore || 0))
            : null,
          levelChange: postGap?.currentLevel?.levelNumber !== baselineGap?.currentLevel?.levelNumber,
        };
      });
    }

    // Calculate overall improvement
    let overallImprovement = null;
    if (improvements) {
      const validImprovements = improvements.filter(i => i.improvement !== null);
      if (validImprovements.length > 0) {
        overallImprovement = Math.round(
          validImprovements.reduce((sum, i) => sum + (i.improvement || 0), 0) / validImprovements.length
        );
      }
    }

    // Identify strengths and areas for development
    const latestGapAnalysis = postAssessment?.gapAnalyses || baselineAssessment?.gapAnalyses || [];
    const strengths = latestGapAnalysis
      .filter(g => g.priority === 'LOW' || (g.knowledgeScore || 0) >= 70)
      .map(g => ({
        area: g.competencyArea.name,
        score: g.knowledgeScore,
        level: g.currentLevel?.name,
      }));

    const developmentAreas = latestGapAnalysis
      .filter(g => g.priority === 'CRITICAL' || g.priority === 'HIGH')
      .map(g => ({
        area: g.competencyArea.name,
        score: g.knowledgeScore,
        gapScore: g.gapScore,
        priority: g.priority,
      }));

    res.json({
      participant: {
        id: participant.id,
        name: `${participant.firstName} ${participant.lastName}`,
        email: participant.email,
        organization: participant.organization?.name,
        role: participant.participant?.currentRoleType,
        jobTitle: participant.participant?.jobTitle,
      },
      project: {
        id: project.id,
        name: project.name,
        organization: project.organization.name,
        domain: project.domain.name,
      },
      assessments: {
        baseline: baselineAssessment ? {
          completedAt: baselineAssessment.completedAt,
          timeTaken: baselineAssessment.timeTakenMinutes,
        } : null,
        post: postAssessment ? {
          completedAt: postAssessment.completedAt,
          timeTaken: postAssessment.timeTakenMinutes,
        } : null,
      },
      competencyAnalysis: latestGapAnalysis.map(g => ({
        area: {
          id: g.competencyArea.id,
          code: g.competencyArea.code,
          name: g.competencyArea.name,
        },
        selfRating: g.selfRatingScore,
        knowledgeScore: g.knowledgeScore,
        gapScore: g.gapScore,
        priority: g.priority,
        currentLevel: g.currentLevel,
        targetLevel: g.targetLevel,
      })),
      improvements,
      overallImprovement,
      strengths,
      developmentAreas,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/institutional/:projectId - Get institutional/cohort impact report
router.get(
  '/institutional/:projectId',
  authorize('SYSTEM_ADMIN', 'FACILITATOR', 'CLIENT_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;

      // Get project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organization: true,
          domain: {
            include: {
              competencyAreas: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          projectParticipants: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: { message: 'Project not found' } });
      }

      // Check organization access for client admin
      if (req.user!.role === 'CLIENT_ADMIN' && project.organizationId !== req.user!.organizationId) {
        return res.status(403).json({ error: { message: 'Access denied' } });
      }

      // Get all assessments
      const assessments = await prisma.assessment.findMany({
        where: {
          projectId,
          status: 'COMPLETED',
        },
        include: {
          participant: {
            select: { id: true, firstName: true, lastName: true },
          },
          gapAnalyses: {
            include: {
              competencyArea: true,
              currentLevel: true,
            },
          },
        },
      });

      const baselineAssessments = assessments.filter(a => a.assessmentType === 'BASELINE');
      const postAssessments = assessments.filter(a => a.assessmentType === 'POST_TRAINING');

      // Calculate aggregate statistics
      const participantCount = project.projectParticipants.length;
      const baselineCompleted = baselineAssessments.length;
      const postCompleted = postAssessments.length;

      // Area-level statistics
      const areaStats = project.domain.competencyAreas.map(area => {
        const baselineGaps = baselineAssessments.flatMap(a =>
          a.gapAnalyses.filter(g => g.competencyAreaId === area.id)
        );
        const postGaps = postAssessments.flatMap(a =>
          a.gapAnalyses.filter(g => g.competencyAreaId === area.id)
        );

        const baselineAvg = baselineGaps.length > 0
          ? baselineGaps.reduce((sum, g) => sum + (g.knowledgeScore || 0), 0) / baselineGaps.length
          : 0;

        const postAvg = postGaps.length > 0
          ? postGaps.reduce((sum, g) => sum + (g.knowledgeScore || 0), 0) / postGaps.length
          : 0;

        const improvement = postGaps.length > 0 ? postAvg - baselineAvg : null;

        // Level distribution
        const levelDistribution = {
          baseline: {
            level1: baselineGaps.filter(g => g.currentLevel?.levelNumber === 1).length,
            level2: baselineGaps.filter(g => g.currentLevel?.levelNumber === 2).length,
            level3: baselineGaps.filter(g => g.currentLevel?.levelNumber === 3).length,
          },
          post: {
            level1: postGaps.filter(g => g.currentLevel?.levelNumber === 1).length,
            level2: postGaps.filter(g => g.currentLevel?.levelNumber === 2).length,
            level3: postGaps.filter(g => g.currentLevel?.levelNumber === 3).length,
          },
        };

        return {
          area: {
            id: area.id,
            code: area.code,
            name: area.name,
          },
          baseline: {
            avgScore: Math.round(baselineAvg * 10) / 10,
            participantCount: baselineGaps.length,
          },
          post: {
            avgScore: Math.round(postAvg * 10) / 10,
            participantCount: postGaps.length,
          },
          improvement: improvement !== null ? Math.round(improvement * 10) / 10 : null,
          levelDistribution,
        };
      });

      // Overall improvement
      const overallBaseline = areaStats.reduce((sum, a) => sum + a.baseline.avgScore, 0) / Math.max(areaStats.length, 1);
      const overallPost = areaStats.reduce((sum, a) => sum + a.post.avgScore, 0) / Math.max(areaStats.length, 1);
      const overallImprovement = postCompleted > 0 ? overallPost - overallBaseline : null;

      // Priority distribution
      const allGaps = baselineAssessments.flatMap(a => a.gapAnalyses);
      const priorityDistribution = {
        CRITICAL: allGaps.filter(g => g.priority === 'CRITICAL').length,
        HIGH: allGaps.filter(g => g.priority === 'HIGH').length,
        MEDIUM: allGaps.filter(g => g.priority === 'MEDIUM').length,
        LOW: allGaps.filter(g => g.priority === 'LOW').length,
      };

      // Top improvement areas
      const topImprovements = areaStats
        .filter(a => a.improvement !== null && a.improvement > 0)
        .sort((a, b) => (b.improvement || 0) - (a.improvement || 0))
        .slice(0, 5);

      // Areas needing attention
      const areasNeedingAttention = areaStats
        .filter(a => a.post.avgScore < 70 || (a.improvement !== null && a.improvement < 0))
        .sort((a, b) => a.post.avgScore - b.post.avgScore)
        .slice(0, 5);

      res.json({
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
        },
        organization: {
          id: project.organization.id,
          name: project.organization.name,
          type: project.organization.type,
          country: project.organization.country,
        },
        domain: {
          id: project.domain.id,
          code: project.domain.code,
          name: project.domain.name,
        },
        summary: {
          totalParticipants: participantCount,
          baselineCompleted,
          postCompleted,
          completionRate: {
            baseline: participantCount > 0 ? Math.round((baselineCompleted / participantCount) * 100) : 0,
            post: participantCount > 0 ? Math.round((postCompleted / participantCount) * 100) : 0,
          },
          overallScores: {
            baseline: Math.round(overallBaseline * 10) / 10,
            post: Math.round(overallPost * 10) / 10,
          },
          overallImprovement: overallImprovement !== null ? Math.round(overallImprovement * 10) / 10 : null,
        },
        priorityDistribution,
        areaStats,
        topImprovements,
        areasNeedingAttention,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/reports/save - Save/generate impact report record
router.post(
  '/save',
  authorize('SYSTEM_ADMIN', 'FACILITATOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, participantId, reportData } = req.body;

      // Get assessment IDs
      const [baseline, post] = await Promise.all([
        prisma.assessment.findFirst({
          where: {
            projectId,
            participantId: participantId || undefined,
            assessmentType: 'BASELINE',
            status: 'COMPLETED',
          },
        }),
        prisma.assessment.findFirst({
          where: {
            projectId,
            participantId: participantId || undefined,
            assessmentType: 'POST_TRAINING',
            status: 'COMPLETED',
          },
        }),
      ]);

      // Calculate overall improvement
      let overallImprovement = null;
      if (reportData.overallImprovement !== undefined) {
        overallImprovement = reportData.overallImprovement;
      }

      const report = await prisma.impactReport.create({
        data: {
          projectId,
          participantId: participantId || null,
          baselineAssessmentId: baseline?.id || null,
          postAssessmentId: post?.id || null,
          overallImprovementPercent: overallImprovement,
          areaImprovements: reportData.areaImprovements || {},
          levelChanges: reportData.levelChanges || {},
          recommendations: reportData.recommendations || null,
          reportData: reportData,
        },
      });

      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/download/:reportId - Get report for PDF generation
router.get('/download/:reportId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.impactReport.findUnique({
      where: { id: req.params.reportId },
      include: {
        project: {
          include: {
            organization: true,
            domain: true,
          },
        },
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        baselineAssessment: {
          select: {
            completedAt: true,
            timeTakenMinutes: true,
          },
        },
        postAssessment: {
          select: {
            completedAt: true,
            timeTakenMinutes: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: { message: 'Report not found' } });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/benchmarks/:domainId - Get EMKEI benchmarks for comparison
router.get('/benchmarks/:domainId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { domainId } = req.params;

    // Get all completed assessments for this domain to establish benchmarks
    const assessments = await prisma.assessment.findMany({
      where: {
        project: {
          domainId,
        },
        status: 'COMPLETED',
        assessmentType: 'BASELINE',
      },
      include: {
        gapAnalyses: {
          include: {
            competencyArea: true,
          },
        },
      },
    });

    const domain = await prisma.competencyDomain.findUnique({
      where: { id: domainId },
      include: {
        competencyAreas: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!domain) {
      return res.status(404).json({ error: { message: 'Domain not found' } });
    }

    // Calculate benchmarks by area
    const benchmarks = domain.competencyAreas.map(area => {
      const areaGaps = assessments.flatMap(a =>
        a.gapAnalyses.filter(g => g.competencyAreaId === area.id)
      );

      const scores = areaGaps.map(g => g.knowledgeScore || 0);
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      // Calculate percentiles
      const sortedScores = [...scores].sort((a, b) => a - b);
      const p25 = sortedScores[Math.floor(sortedScores.length * 0.25)] || 0;
      const p50 = sortedScores[Math.floor(sortedScores.length * 0.5)] || 0;
      const p75 = sortedScores[Math.floor(sortedScores.length * 0.75)] || 0;

      return {
        area: {
          id: area.id,
          code: area.code,
          name: area.name,
        },
        sampleSize: areaGaps.length,
        average: Math.round(avgScore * 10) / 10,
        percentiles: {
          p25: Math.round(p25 * 10) / 10,
          p50: Math.round(p50 * 10) / 10,
          p75: Math.round(p75 * 10) / 10,
        },
      };
    });

    res.json({
      domain: {
        id: domain.id,
        code: domain.code,
        name: domain.name,
      },
      totalAssessments: assessments.length,
      benchmarks,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
