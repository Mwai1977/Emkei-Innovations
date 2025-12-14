import { PrismaClient, QuestionType, DeliveryMethod, RoleType } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Competency Levels
  console.log('Creating competency levels...');
  const levels = await Promise.all([
    prisma.competencyLevel.upsert({
      where: { levelNumber: 1 },
      update: {},
      create: {
        levelNumber: 1,
        name: 'Foundation',
        description: 'Understands core concepts; can perform tasks with guidance',
        benchmarkScore: 50,
      },
    }),
    prisma.competencyLevel.upsert({
      where: { levelNumber: 2 },
      update: {},
      create: {
        levelNumber: 2,
        name: 'Advanced',
        description: 'Applies knowledge independently; handles standard situations',
        benchmarkScore: 70,
      },
    }),
    prisma.competencyLevel.upsert({
      where: { levelNumber: 3 },
      update: {},
      create: {
        levelNumber: 3,
        name: 'Expert',
        description: 'Leads others; handles complex scenarios; shapes policy',
        benchmarkScore: 85,
      },
    }),
  ]);

  const [level1, level2, level3] = levels;

  // 2. Create VLR Domain
  console.log('Creating VLR competency domain...');
  const vlrDomain = await prisma.competencyDomain.upsert({
    where: { code: 'VLR' },
    update: {},
    create: {
      code: 'VLR',
      name: 'Vaccine Lot Release Regulation',
      description: 'Competencies for regulatory assessment and lot release of vaccines',
      frameworkAlignment: ['WHO TRS 978 Annex 2', 'SAHPGL-PEM-BIO-01', 'ICH Q9', 'PIC/S'],
      isActive: true,
    },
  });

  // 3. Create Competency Areas
  console.log('Creating competency areas...');
  const areasData = [
    { code: 'VLR-01', name: 'Vaccine Platforms & Technologies', description: 'Understanding of vaccine platform types and manufacturing principles' },
    { code: 'VLR-02', name: 'Upstream Processing', description: 'Cell culture, fermentation, and upstream manufacturing processes' },
    { code: 'VLR-03', name: 'Downstream Processing', description: 'Purification, clarification, and viral clearance processes' },
    { code: 'VLR-04', name: 'Formulation & Fill-Finish', description: 'Aseptic processing, fill-finish operations, and contamination control' },
    { code: 'VLR-05', name: 'Critical Quality Attributes (CQAs)', description: 'Assessment of product quality attributes and specifications' },
    { code: 'VLR-06', name: 'Critical Process Parameters (CPPs)', description: 'Process control, monitoring, and deviation management' },
    { code: 'VLR-07', name: 'Lot Summary Protocol (LSP) Review', description: 'Review and evaluation of manufacturing documentation' },
    { code: 'VLR-08', name: 'Regulatory Decision-Making', description: 'Risk-based decision frameworks and regulatory actions' },
    { code: 'VLR-09', name: 'Quality by Design (QbD)', description: 'QbD principles, design space, and lifecycle management' },
    { code: 'VLR-10', name: 'International Regulatory Harmonization', description: 'Global regulatory frameworks and reliance pathways' },
  ];

  const areas: any[] = [];
  for (let i = 0; i < areasData.length; i++) {
    const area = await prisma.competencyArea.upsert({
      where: { code: areasData[i].code },
      update: {},
      create: {
        domainId: vlrDomain.id,
        code: areasData[i].code,
        name: areasData[i].name,
        description: areasData[i].description,
        sortOrder: i + 1,
        weight: 1.0,
      },
    });
    areas.push(area);
  }

  // 4. Create Competency Items for each area
  console.log('Creating competency items...');
  const competencyItemsData = [
    // VLR-01: Vaccine Platforms & Technologies
    { areaCode: 'VLR-01', level: 1, code: 'VLR-01-L1-01', description: 'Identify traditional vaccine platform types (live attenuated, inactivated, subunit, conjugate)' },
    { areaCode: 'VLR-01', level: 1, code: 'VLR-01-L1-02', description: 'Describe basic manufacturing principles per platform' },
    { areaCode: 'VLR-01', level: 2, code: 'VLR-01-L2-01', description: 'Compare manufacturing processes across platforms' },
    { areaCode: 'VLR-01', level: 2, code: 'VLR-01-L2-02', description: 'Evaluate platform-specific quality considerations' },
    { areaCode: 'VLR-01', level: 3, code: 'VLR-01-L3-01', description: 'Assess emerging technology regulatory implications (mRNA, viral vector)' },
    { areaCode: 'VLR-01', level: 3, code: 'VLR-01-L3-02', description: 'Design platform-specific regulatory strategies' },

    // VLR-02: Upstream Processing
    { areaCode: 'VLR-02', level: 1, code: 'VLR-02-L1-01', description: 'Describe cell culture and fermentation fundamentals' },
    { areaCode: 'VLR-02', level: 1, code: 'VLR-02-L1-02', description: 'Identify critical upstream parameters (temperature, pH, DO, agitation)' },
    { areaCode: 'VLR-02', level: 2, code: 'VLR-02-L2-01', description: 'Analyze bioreactor data for compliance' },
    { areaCode: 'VLR-02', level: 2, code: 'VLR-02-L2-02', description: 'Evaluate cell line qualification documentation' },
    { areaCode: 'VLR-02', level: 3, code: 'VLR-02-L3-01', description: 'Assess upstream deviation impact on product quality' },
    { areaCode: 'VLR-02', level: 3, code: 'VLR-02-L3-02', description: 'Design risk-based upstream monitoring strategies' },

    // VLR-03: Downstream Processing
    { areaCode: 'VLR-03', level: 1, code: 'VLR-03-L1-01', description: 'Describe purification and clarification methods' },
    { areaCode: 'VLR-03', level: 1, code: 'VLR-03-L1-02', description: 'Identify downstream critical process parameters' },
    { areaCode: 'VLR-03', level: 2, code: 'VLR-03-L2-01', description: 'Analyze chromatography and filtration data' },
    { areaCode: 'VLR-03', level: 2, code: 'VLR-03-L2-02', description: 'Evaluate viral clearance validation studies' },
    { areaCode: 'VLR-03', level: 3, code: 'VLR-03-L3-01', description: 'Assess downstream process changes and comparability' },
    { areaCode: 'VLR-03', level: 3, code: 'VLR-03-L3-02', description: 'Design process validation strategies' },

    // VLR-04: Formulation & Fill-Finish
    { areaCode: 'VLR-04', level: 1, code: 'VLR-04-L1-01', description: 'Describe aseptic processing requirements' },
    { areaCode: 'VLR-04', level: 1, code: 'VLR-04-L1-02', description: 'Identify fill-finish critical parameters' },
    { areaCode: 'VLR-04', level: 2, code: 'VLR-04-L2-01', description: 'Evaluate environmental monitoring data' },
    { areaCode: 'VLR-04', level: 2, code: 'VLR-04-L2-02', description: 'Analyze container closure integrity data' },
    { areaCode: 'VLR-04', level: 3, code: 'VLR-04-L3-01', description: 'Assess facility and equipment qualification' },
    { areaCode: 'VLR-04', level: 3, code: 'VLR-04-L3-02', description: 'Design contamination control strategies' },

    // VLR-05: Critical Quality Attributes (CQAs)
    { areaCode: 'VLR-05', level: 1, code: 'VLR-05-L1-01', description: 'Define CQA tiers and their significance' },
    { areaCode: 'VLR-05', level: 1, code: 'VLR-05-L1-02', description: 'Identify Tier 1 safety-critical CQAs' },
    { areaCode: 'VLR-05', level: 2, code: 'VLR-05-L2-01', description: 'Interpret CQA test results and specifications' },
    { areaCode: 'VLR-05', level: 2, code: 'VLR-05-L2-02', description: 'Evaluate OOS results and their implications' },
    { areaCode: 'VLR-05', level: 3, code: 'VLR-05-L3-01', description: 'Assess CQA-CPP relationships' },
    { areaCode: 'VLR-05', level: 3, code: 'VLR-05-L3-02', description: 'Design risk-based CQA assessment strategies' },

    // VLR-06: Critical Process Parameters (CPPs)
    { areaCode: 'VLR-06', level: 1, code: 'VLR-06-L1-01', description: 'Define CPPs and their relationship to CQAs' },
    { areaCode: 'VLR-06', level: 1, code: 'VLR-06-L1-02', description: 'Identify stage-specific CPPs' },
    { areaCode: 'VLR-06', level: 2, code: 'VLR-06-L2-01', description: 'Analyze CPP trends and control charts' },
    { areaCode: 'VLR-06', level: 2, code: 'VLR-06-L2-02', description: 'Evaluate process deviation impact' },
    { areaCode: 'VLR-06', level: 3, code: 'VLR-06-L3-01', description: 'Assess design space and process robustness' },
    { areaCode: 'VLR-06', level: 3, code: 'VLR-06-L3-02', description: 'Design CPP monitoring strategies' },

    // VLR-07: Lot Summary Protocol (LSP) Review
    { areaCode: 'VLR-07', level: 1, code: 'VLR-07-L1-01', description: 'Identify LSP components (WHO TRS 978 Annex 2)' },
    { areaCode: 'VLR-07', level: 1, code: 'VLR-07-L1-02', description: 'Navigate LSP documentation structure' },
    { areaCode: 'VLR-07', level: 2, code: 'VLR-07-L2-01', description: 'Evaluate manufacturing summary data' },
    { areaCode: 'VLR-07', level: 2, code: 'VLR-07-L2-02', description: 'Assess quality control test results' },
    { areaCode: 'VLR-07', level: 3, code: 'VLR-07-L3-01', description: 'Integrate LSP review with risk assessment' },
    { areaCode: 'VLR-07', level: 3, code: 'VLR-07-L3-02', description: 'Make evidence-based lot release decisions' },

    // VLR-08: Regulatory Decision-Making
    { areaCode: 'VLR-08', level: 1, code: 'VLR-08-L1-01', description: 'Describe lot release decision categories' },
    { areaCode: 'VLR-08', level: 1, code: 'VLR-08-L1-02', description: 'Identify documentation requirements' },
    { areaCode: 'VLR-08', level: 2, code: 'VLR-08-L2-01', description: 'Apply risk-based decision frameworks' },
    { areaCode: 'VLR-08', level: 2, code: 'VLR-08-L2-02', description: 'Evaluate conditional release scenarios' },
    { areaCode: 'VLR-08', level: 3, code: 'VLR-08-L3-01', description: 'Balance public health needs with quality assurance' },
    { areaCode: 'VLR-08', level: 3, code: 'VLR-08-L3-02', description: 'Design decision escalation procedures' },

    // VLR-09: Quality by Design (QbD)
    { areaCode: 'VLR-09', level: 1, code: 'VLR-09-L1-01', description: 'Define QbD core principles' },
    { areaCode: 'VLR-09', level: 1, code: 'VLR-09-L1-02', description: 'Describe TPQP and design space concepts' },
    { areaCode: 'VLR-09', level: 2, code: 'VLR-09-L2-01', description: 'Evaluate QbD implementation in submissions' },
    { areaCode: 'VLR-09', level: 2, code: 'VLR-09-L2-02', description: 'Assess PAT applications in manufacturing' },
    { areaCode: 'VLR-09', level: 3, code: 'VLR-09-L3-01', description: 'Apply QbD principles to lot release assessment' },
    { areaCode: 'VLR-09', level: 3, code: 'VLR-09-L3-02', description: 'Design lifecycle management approaches' },

    // VLR-10: International Regulatory Harmonization
    { areaCode: 'VLR-10', level: 1, code: 'VLR-10-L1-01', description: 'Identify major regulatory frameworks (WHO, ICH, PIC/S)' },
    { areaCode: 'VLR-10', level: 1, code: 'VLR-10-L1-02', description: 'Describe AMQF and regional harmonization initiatives' },
    { areaCode: 'VLR-10', level: 2, code: 'VLR-10-L2-01', description: 'Compare requirements across jurisdictions' },
    { areaCode: 'VLR-10', level: 2, code: 'VLR-10-L2-02', description: 'Apply reliance pathways appropriately' },
    { areaCode: 'VLR-10', level: 3, code: 'VLR-10-L3-01', description: 'Navigate complex multi-jurisdiction scenarios' },
    { areaCode: 'VLR-10', level: 3, code: 'VLR-10-L3-02', description: 'Contribute to harmonization initiatives' },
  ];

  const competencyItems: any[] = [];
  for (const item of competencyItemsData) {
    const area = areas.find(a => a.code === item.areaCode);
    const level = levels.find(l => l.levelNumber === item.level);

    if (area && level) {
      const created = await prisma.competencyItem.upsert({
        where: { code: item.code },
        update: {},
        create: {
          areaId: area.id,
          levelId: level.id,
          code: item.code,
          description: item.description,
          sortOrder: parseInt(item.code.split('-').pop()?.replace('0', '') || '1'),
        },
      });
      competencyItems.push(created);
    }
  }

  // 5. Create Assessment Instrument
  console.log('Creating assessment instrument...');
  const instrument = await prisma.assessmentInstrument.upsert({
    where: { id: 'vlr-combined-v1' },
    update: {},
    create: {
      id: 'vlr-combined-v1',
      domainId: vlrDomain.id,
      name: 'VLR Competency Assessment v1.0',
      type: 'COMBINED',
      version: '1.0',
      isActive: true,
    },
  });

  // 6. Create Assessment Questions
  console.log('Creating assessment questions...');

  // Self-rating questions for each competency area
  let questionOrder = 1;
  for (const area of areas) {
    const areaItems = competencyItems.filter(i => i.code.startsWith(area.code));

    for (const item of areaItems.slice(0, 2)) {
      await prisma.assessmentQuestion.upsert({
        where: { id: `sr-${item.code}` },
        update: {},
        create: {
          id: `sr-${item.code}`,
          instrumentId: instrument.id,
          competencyItemId: item.id,
          questionType: 'SELF_RATING',
          questionText: `Rate your current proficiency in: ${item.description}`,
          options: [
            { value: 1, label: 'No knowledge' },
            { value: 2, label: 'Basic awareness' },
            { value: 3, label: 'Can apply with guidance' },
            { value: 4, label: 'Can apply independently' },
            { value: 5, label: 'Can teach others' },
          ],
          points: 5,
          difficultyLevel: 1,
          sortOrder: questionOrder++,
        },
      });
    }
  }

  // Knowledge questions - sample from specification
  const knowledgeQuestions = [
    {
      competencyCode: 'VLR-05-L1-01',
      questionText: 'Which of the following is classified as a Tier 1 Critical Quality Attribute that should NEVER be abbreviated during lot release assessment?',
      options: [
        { label: 'A', text: 'Appearance', isCorrect: false },
        { label: 'B', text: 'Osmolality', isCorrect: false },
        { label: 'C', text: 'Sterility', isCorrect: true },
        { label: 'D', text: 'Extended stability data', isCorrect: false },
      ],
      correctAnswer: 'C',
      points: 1,
      difficulty: 1,
      rationale: 'Sterility is a Tier 1 CQA directly impacting patient safety and must always be verified regardless of timeline pressures.',
    },
    {
      competencyCode: 'VLR-05-L2-01',
      questionText: 'A vaccine lot shows a potency result of 4.8 log TCID50/dose against a specification of ≥5.0 log TCID50/dose. The manufacturer\'s investigation indicates the assay was performed correctly and the result is valid. What is the appropriate regulatory action?',
      options: [
        { label: 'A', text: 'Approve the lot as the result is close to specification', isCorrect: false },
        { label: 'B', text: 'Reject the lot as it fails to meet the potency specification', isCorrect: true },
        { label: 'C', text: 'Request additional testing with a different method', isCorrect: false },
        { label: 'D', text: 'Approve with condition of enhanced stability monitoring', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 2,
      difficulty: 2,
      rationale: 'A confirmed OOS result for a Tier 1 CQA (potency) requires rejection regardless of proximity to specification.',
    },
    {
      competencyCode: 'VLR-07-L3-01',
      questionText: 'You are reviewing an LSP for an mRNA COVID-19 vaccine lot. The manufacturing summary shows a temperature excursion during lipid nanoparticle formulation (4 hours at 28°C instead of the specified 15-25°C range). The manufacturer has provided an impact assessment stating that accelerated stability data shows no significant degradation. All CQA results meet specification. How would you approach this lot release decision?',
      options: [
        { label: 'A', text: 'Approve - all CQAs meet specification and stability data supports no impact', isCorrect: false },
        { label: 'B', text: 'Reject - any process deviation requires automatic rejection', isCorrect: false },
        { label: 'C', text: 'Request additional information on specific LNP stability data and conduct enhanced review', isCorrect: true },
        { label: 'D', text: 'Conditionally approve with requirement for enhanced post-release stability monitoring', isCorrect: false },
      ],
      correctAnswer: 'C',
      points: 3,
      difficulty: 3,
      rationale: 'Expert-level assessment requires balancing multiple factors. While CQAs meet specification, a significant CPP deviation for a relatively new technology warrants enhanced scrutiny.',
    },
    {
      competencyCode: 'VLR-01-L1-01',
      questionText: 'Which vaccine platform uses weakened but live pathogens that can still replicate?',
      options: [
        { label: 'A', text: 'Inactivated vaccines', isCorrect: false },
        { label: 'B', text: 'Live attenuated vaccines', isCorrect: true },
        { label: 'C', text: 'Subunit vaccines', isCorrect: false },
        { label: 'D', text: 'Conjugate vaccines', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 1,
      difficulty: 1,
      rationale: 'Live attenuated vaccines contain weakened forms of the pathogen that can replicate but typically do not cause disease in healthy individuals.',
    },
    {
      competencyCode: 'VLR-02-L1-02',
      questionText: 'Which of the following is NOT typically a critical upstream process parameter in cell culture?',
      options: [
        { label: 'A', text: 'Temperature', isCorrect: false },
        { label: 'B', text: 'Dissolved oxygen', isCorrect: false },
        { label: 'C', text: 'Container closure integrity', isCorrect: true },
        { label: 'D', text: 'pH', isCorrect: false },
      ],
      correctAnswer: 'C',
      points: 1,
      difficulty: 1,
      rationale: 'Container closure integrity is a fill-finish parameter, not an upstream cell culture parameter.',
    },
    {
      competencyCode: 'VLR-03-L2-01',
      questionText: 'A chromatography column shows a 15% reduction in dynamic binding capacity compared to the qualified range. What is the most appropriate initial action?',
      options: [
        { label: 'A', text: 'Continue processing as the reduction is within acceptable limits', isCorrect: false },
        { label: 'B', text: 'Immediately replace the column', isCorrect: false },
        { label: 'C', text: 'Investigate root cause and assess impact on product quality', isCorrect: true },
        { label: 'D', text: 'Extend processing time to compensate', isCorrect: false },
      ],
      correctAnswer: 'C',
      points: 2,
      difficulty: 2,
      rationale: 'A reduction in binding capacity requires investigation to understand the cause and potential impact before deciding on corrective action.',
    },
    {
      competencyCode: 'VLR-04-L2-01',
      questionText: 'Environmental monitoring during fill-finish shows elevated particle counts in a Grade A zone. What should be the immediate action?',
      options: [
        { label: 'A', text: 'Continue operations and document the excursion', isCorrect: false },
        { label: 'B', text: 'Stop filling operations and investigate', isCorrect: true },
        { label: 'C', text: 'Increase air changes per hour and continue', isCorrect: false },
        { label: 'D', text: 'Reduce personnel in the area', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 2,
      difficulty: 2,
      rationale: 'Elevated particles in Grade A zones represent a potential contamination risk and require immediate cessation of activities.',
    },
    {
      competencyCode: 'VLR-06-L2-02',
      questionText: 'A process deviation occurred where the hold time between purification steps exceeded the validated maximum by 2 hours. Which information is MOST critical for the impact assessment?',
      options: [
        { label: 'A', text: 'Historical data on extended hold times', isCorrect: false },
        { label: 'B', text: 'Product stability data at the hold conditions', isCorrect: true },
        { label: 'C', text: 'Number of previous similar deviations', isCorrect: false },
        { label: 'D', text: 'Operator training records', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 2,
      difficulty: 2,
      rationale: 'Product stability data at the actual hold conditions directly informs whether product quality was maintained.',
    },
    {
      competencyCode: 'VLR-08-L2-01',
      questionText: 'Under what circumstances might conditional lot release be appropriate?',
      options: [
        { label: 'A', text: 'When any CQA fails specification', isCorrect: false },
        { label: 'B', text: 'During a public health emergency with benefit-risk justification', isCorrect: true },
        { label: 'C', text: 'When manufacturing documentation is incomplete', isCorrect: false },
        { label: 'D', text: 'When stability data is pending', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 2,
      difficulty: 2,
      rationale: 'Conditional release may be considered in public health emergencies when the benefit-risk assessment supports it and critical safety tests pass.',
    },
    {
      competencyCode: 'VLR-09-L1-01',
      questionText: 'What is the Target Product Quality Profile (TPQP) in Quality by Design?',
      options: [
        { label: 'A', text: 'The manufacturing process specifications', isCorrect: false },
        { label: 'B', text: 'A prospective summary of quality characteristics for the product', isCorrect: true },
        { label: 'C', text: 'The final release testing protocol', isCorrect: false },
        { label: 'D', text: 'The stability testing requirements', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 1,
      difficulty: 1,
      rationale: 'TPQP is a prospective summary of the quality characteristics of a drug product that ideally will be achieved.',
    },
    {
      competencyCode: 'VLR-10-L2-02',
      questionText: 'When using a WHO prequalification decision as a basis for national registration, this is an example of:',
      options: [
        { label: 'A', text: 'Mutual recognition', isCorrect: false },
        { label: 'B', text: 'Reliance pathway', isCorrect: true },
        { label: 'C', text: 'Harmonization', isCorrect: false },
        { label: 'D', text: 'Regulatory convergence', isCorrect: false },
      ],
      correctAnswer: 'B',
      points: 2,
      difficulty: 2,
      rationale: 'Reliance refers to taking into account and giving significant weight to assessments by other regulatory authorities or trusted organizations.',
    },
  ];

  for (let i = 0; i < knowledgeQuestions.length; i++) {
    const q = knowledgeQuestions[i];
    const item = competencyItems.find(ci => ci.code === q.competencyCode);

    if (item) {
      await prisma.assessmentQuestion.upsert({
        where: { id: `kq-${i + 1}` },
        update: {},
        create: {
          id: `kq-${i + 1}`,
          instrumentId: instrument.id,
          competencyItemId: item.id,
          questionType: 'MULTIPLE_CHOICE',
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          difficultyLevel: q.difficulty,
          sortOrder: questionOrder++,
          rationale: q.rationale,
        },
      });
    }
  }

  // 7. Create Learning Units
  console.log('Creating learning units...');
  const learningUnitsData = [
    {
      code: 'LU-VLR-01',
      name: 'Vaccine Platform Technologies Overview',
      description: 'Comprehensive introduction to vaccine platform types and their manufacturing characteristics',
      durationHours: 4,
      deliveryMethods: ['LECTURE', 'CASE_STUDY'] as DeliveryMethod[],
      learningOutcomes: [
        'Classify vaccines by platform type',
        'Describe manufacturing approach for each platform',
        'Identify platform-specific quality considerations',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-01'],
    },
    {
      code: 'LU-VLR-02',
      name: 'mRNA and Viral Vector Vaccines',
      description: 'Advanced module on emerging vaccine technologies and their regulatory considerations',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Explain mRNA vaccine mechanism and manufacturing',
        'Describe viral vector vaccine platforms',
        'Identify unique regulatory challenges for novel platforms',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-01'],
    },
    {
      code: 'LU-VLR-03',
      name: 'Upstream Processing Principles',
      description: 'Fundamentals of cell culture and fermentation in vaccine manufacturing',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'PRACTICAL', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Explain cell culture and fermentation fundamentals',
        'Identify critical upstream parameters',
        'Interpret basic bioreactor data',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-02'],
    },
    {
      code: 'LU-VLR-04',
      name: 'Advanced Upstream Assessment',
      description: 'Critical evaluation of upstream manufacturing data for regulatory review',
      durationHours: 8,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Analyze complex bioreactor trending data',
        'Evaluate cell line qualification packages',
        'Assess upstream deviation impact',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-02'],
    },
    {
      code: 'LU-VLR-05',
      name: 'Downstream Processing Fundamentals',
      description: 'Introduction to purification and clarification processes',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'PRACTICAL'] as DeliveryMethod[],
      learningOutcomes: [
        'Describe common purification methods',
        'Identify critical downstream parameters',
        'Understand viral clearance principles',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-03'],
    },
    {
      code: 'LU-VLR-06',
      name: 'Viral Clearance Assessment',
      description: 'Evaluation of viral safety and clearance validation',
      durationHours: 8,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Evaluate viral clearance study design',
        'Interpret clearance factor calculations',
        'Assess adequacy of viral safety package',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-03'],
    },
    {
      code: 'LU-VLR-07',
      name: 'Aseptic Processing and Fill-Finish',
      description: 'Fundamentals of aseptic manufacturing and contamination control',
      durationHours: 8,
      deliveryMethods: ['LECTURE', 'PRACTICAL', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Describe aseptic processing requirements',
        'Evaluate environmental monitoring data',
        'Understand container closure integrity testing',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-04'],
    },
    {
      code: 'LU-VLR-08',
      name: 'CQA Fundamentals',
      description: 'Understanding critical quality attributes and their assessment',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'CASE_STUDY'] as DeliveryMethod[],
      learningOutcomes: [
        'Define and categorize CQAs by tier',
        'Identify Tier 1 safety-critical attributes',
        'Interpret basic CQA test results',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-05'],
    },
    {
      code: 'LU-VLR-09',
      name: 'CQA Assessment and OOS Investigation',
      description: 'Advanced evaluation of CQAs and out-of-specification results',
      durationHours: 8,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Apply CQA tier classification in decisions',
        'Evaluate OOS investigation reports',
        'Determine regulatory responses to OOS',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-05', 'VLR-08'],
    },
    {
      code: 'LU-VLR-10',
      name: 'CPP Monitoring and Deviation Management',
      description: 'Critical process parameters and their control',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'WORKSHOP'] as DeliveryMethod[],
      learningOutcomes: [
        'Define CPPs and their CQA relationships',
        'Analyze CPP trending data',
        'Evaluate process deviation impact',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-06'],
    },
    {
      code: 'LU-VLR-11',
      name: 'LSP Review Fundamentals',
      description: 'Introduction to Lot Summary Protocol review per WHO guidelines',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'CASE_STUDY'] as DeliveryMethod[],
      learningOutcomes: [
        'Navigate LSP structure (WHO TRS 978 Annex 2)',
        'Identify key documentation components',
        'Review manufacturing summary data',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-07'],
    },
    {
      code: 'LU-VLR-12',
      name: 'LSP Review and Lot Release Decision Making',
      description: 'Advanced LSP review and regulatory decision frameworks',
      durationHours: 12,
      deliveryMethods: ['LECTURE', 'CASE_STUDY', 'PRACTICAL', 'PEER_REVIEW'] as DeliveryMethod[],
      learningOutcomes: [
        'Integrate manufacturing, QC, and deviation data',
        'Apply risk-based decision frameworks',
        'Document and justify regulatory decisions',
      ],
      levelNumber: 2,
      areaCodes: ['VLR-07', 'VLR-08'],
    },
    {
      code: 'LU-VLR-13',
      name: 'QbD Principles for Assessors',
      description: 'Quality by Design concepts for regulatory assessment',
      durationHours: 6,
      deliveryMethods: ['LECTURE', 'CASE_STUDY'] as DeliveryMethod[],
      learningOutcomes: [
        'Define QbD core principles',
        'Understand design space concepts',
        'Evaluate QbD elements in submissions',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-09'],
    },
    {
      code: 'LU-VLR-14',
      name: 'International Regulatory Frameworks',
      description: 'Overview of global regulatory harmonization and reliance',
      durationHours: 4,
      deliveryMethods: ['LECTURE', 'CASE_STUDY'] as DeliveryMethod[],
      learningOutcomes: [
        'Identify major regulatory frameworks',
        'Understand regional harmonization initiatives',
        'Apply reliance pathways',
      ],
      levelNumber: 1,
      areaCodes: ['VLR-10'],
    },
    {
      code: 'LU-VLR-15',
      name: 'Practical LSP Review Workshop',
      description: 'Hands-on workshop reviewing real LSP documents',
      durationHours: 16,
      deliveryMethods: ['WORKSHOP', 'PRACTICAL', 'PEER_REVIEW'] as DeliveryMethod[],
      learningOutcomes: [
        'Complete full LSP review independently',
        'Identify compliance issues and quality concerns',
        'Make justified lot release recommendations',
      ],
      levelNumber: 3,
      areaCodes: ['VLR-07', 'VLR-08', 'VLR-05'],
    },
  ];

  const learningUnits: any[] = [];
  for (const lu of learningUnitsData) {
    const level = levels.find(l => l.levelNumber === lu.levelNumber);

    const unit = await prisma.learningUnit.upsert({
      where: { code: lu.code },
      update: {},
      create: {
        domainId: vlrDomain.id,
        code: lu.code,
        name: lu.name,
        description: lu.description,
        durationHours: lu.durationHours,
        deliveryMethods: lu.deliveryMethods,
        learningOutcomes: lu.learningOutcomes,
        levelAppropriateId: level?.id,
      },
    });

    learningUnits.push({ ...unit, areaCodes: lu.areaCodes });
  }

  // Link learning units to competency areas
  for (const lu of learningUnits) {
    for (const areaCode of lu.areaCodes) {
      const area = areas.find(a => a.code === areaCode);
      if (area) {
        await prisma.learningUnitCompetency.upsert({
          where: {
            learningUnitId_competencyAreaId: {
              learningUnitId: lu.id,
              competencyAreaId: area.id,
            },
          },
          update: {},
          create: {
            learningUnitId: lu.id,
            competencyAreaId: area.id,
          },
        });
      }
    }
  }

  // 8. Create Role Target Levels
  console.log('Creating role target levels...');
  const roleTargets: { role: RoleType; targets: { [key: string]: number } }[] = [
    {
      role: 'JUNIOR_INSPECTOR',
      targets: { 'VLR-01': 1, 'VLR-02': 1, 'VLR-03': 1, 'VLR-04': 1, 'VLR-05': 1, 'VLR-06': 1, 'VLR-07': 1, 'VLR-08': 1, 'VLR-09': 1, 'VLR-10': 1 },
    },
    {
      role: 'INSPECTOR',
      targets: { 'VLR-01': 2, 'VLR-02': 2, 'VLR-03': 2, 'VLR-04': 2, 'VLR-05': 2, 'VLR-06': 2, 'VLR-07': 2, 'VLR-08': 2, 'VLR-09': 1, 'VLR-10': 2 },
    },
    {
      role: 'SENIOR_INSPECTOR',
      targets: { 'VLR-01': 2, 'VLR-02': 2, 'VLR-03': 2, 'VLR-04': 2, 'VLR-05': 3, 'VLR-06': 2, 'VLR-07': 3, 'VLR-08': 3, 'VLR-09': 2, 'VLR-10': 2 },
    },
    {
      role: 'UNIT_MANAGER',
      targets: { 'VLR-01': 2, 'VLR-02': 2, 'VLR-03': 2, 'VLR-04': 2, 'VLR-05': 3, 'VLR-06': 2, 'VLR-07': 3, 'VLR-08': 3, 'VLR-09': 3, 'VLR-10': 3 },
    },
  ];

  for (const roleTarget of roleTargets) {
    for (const [areaCode, levelNum] of Object.entries(roleTarget.targets)) {
      const level = levels.find(l => l.levelNumber === levelNum);
      if (level) {
        await prisma.roleTargetLevel.upsert({
          where: {
            roleType_areaCode: {
              roleType: roleTarget.role,
              areaCode,
            },
          },
          update: {},
          create: {
            roleType: roleTarget.role,
            areaCode,
            levelId: level.id,
          },
        });
      }
    }
  }

  // 9. Create Sample Organization and Users
  console.log('Creating sample organization and users...');

  const emkei = await prisma.organization.upsert({
    where: { id: 'emkei-innovations' },
    update: {},
    create: {
      id: 'emkei-innovations',
      name: 'EMKEI Innovations',
      type: 'DEVELOPMENT_PARTNER',
      country: 'Kenya',
    },
  });

  const sahpra = await prisma.organization.upsert({
    where: { id: 'sahpra-demo' },
    update: {},
    create: {
      id: 'sahpra-demo',
      name: 'SAHPRA (Demo)',
      type: 'NRA',
      country: 'South Africa',
    },
  });

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  await prisma.user.upsert({
    where: { email: 'admin@emkei.co.ke' },
    update: {},
    create: {
      email: 'admin@emkei.co.ke',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SYSTEM_ADMIN',
      organizationId: emkei.id,
    },
  });

  // Create facilitator
  const facilitatorPassword = await hashPassword('Facilitator123!');
  await prisma.user.upsert({
    where: { email: 'facilitator@emkei.co.ke' },
    update: {},
    create: {
      email: 'facilitator@emkei.co.ke',
      passwordHash: facilitatorPassword,
      firstName: 'Demo',
      lastName: 'Facilitator',
      role: 'FACILITATOR',
      organizationId: emkei.id,
    },
  });

  // Create sample participant
  const participantPassword = await hashPassword('Participant123!');
  const participant = await prisma.user.upsert({
    where: { email: 'participant@sahpra.org.za' },
    update: {},
    create: {
      email: 'participant@sahpra.org.za',
      passwordHash: participantPassword,
      firstName: 'Demo',
      lastName: 'Participant',
      role: 'PARTICIPANT',
      organizationId: sahpra.id,
    },
  });

  await prisma.participantProfile.upsert({
    where: { userId: participant.id },
    update: {},
    create: {
      userId: participant.id,
      jobTitle: 'Vaccine Inspector',
      yearsExperience: 3,
      educationLevel: 'MASTERS',
      currentRoleType: 'INSPECTOR',
      professionalBackground: 'Background in pharmaceutical sciences with 3 years experience in vaccine regulatory assessment.',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('\nSample login credentials:');
  console.log('Admin: admin@emkei.co.ke / Admin123!');
  console.log('Facilitator: facilitator@emkei.co.ke / Facilitator123!');
  console.log('Participant: participant@sahpra.org.za / Participant123!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
