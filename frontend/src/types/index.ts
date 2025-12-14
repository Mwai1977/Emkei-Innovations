export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PARTICIPANT' | 'FACILITATOR' | 'CLIENT_ADMIN' | 'SYSTEM_ADMIN';
  organizationId?: string;
  organization?: Organization;
  profile?: ParticipantProfile;
}

export interface ParticipantProfile {
  id: string;
  userId: string;
  jobTitle?: string;
  yearsExperience?: number;
  educationLevel?: string;
  currentRoleType?: string;
  professionalBackground?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  country: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organization?: Organization;
  domainId: string;
  domain?: CompetencyDomain;
  status: 'SETUP' | 'ACTIVE' | 'DELIVERY' | 'EVALUATION' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  createdBy?: User;
  _count?: {
    projectParticipants: number;
    assessments: number;
  };
}

export interface CompetencyDomain {
  id: string;
  code: string;
  name: string;
  description?: string;
  frameworkAlignment: string[];
  competencyAreas?: CompetencyArea[];
}

export interface CompetencyArea {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface CompetencyLevel {
  id: string;
  levelNumber: number;
  name: string;
  description?: string;
  benchmarkScore: number;
}

export interface Assessment {
  id: string;
  participantId: string;
  projectId: string;
  instrumentId: string;
  assessmentType: 'BASELINE' | 'POST_TRAINING';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
  timeTakenMinutes?: number;
  instrument?: AssessmentInstrument;
  responses?: AssessmentResponse[];
  gapAnalyses?: GapAnalysis[];
}

export interface AssessmentInstrument {
  id: string;
  name: string;
  type: string;
  questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  questionType: 'SELF_RATING' | 'MULTIPLE_CHOICE' | 'SCENARIO' | 'TRUE_FALSE';
  questionText: string;
  options?: any[];
  points: number;
  difficultyLevel: number;
  sortOrder: number;
  competencyItem?: {
    area: CompetencyArea;
    level: CompetencyLevel;
  };
}

export interface AssessmentResponse {
  id: string;
  questionId: string;
  responseValue: any;
  score?: number;
}

export interface GapAnalysis {
  id: string;
  assessmentId: string;
  competencyAreaId: string;
  competencyArea?: CompetencyArea;
  selfRatingScore?: number;
  knowledgeScore?: number;
  gapScore: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  currentLevel?: CompetencyLevel;
  targetLevel?: CompetencyLevel;
}

export interface LearningUnit {
  id: string;
  code: string;
  name: string;
  description?: string;
  durationHours: number;
  deliveryMethods: string[];
  learningOutcomes: string[];
  levelAppropriate?: CompetencyLevel;
  competencyAreas?: { competencyArea: CompetencyArea }[];
}

export interface CurriculumRecommendation {
  id: string;
  projectId: string;
  participantId?: string;
  learningUnitId: string;
  learningUnit?: LearningUnit;
  priorityRank: number;
  rationale?: string;
  status: 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED' | 'DELIVERED';
}

export interface Curriculum {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  totalHours: number;
  status: 'DRAFT' | 'APPROVED' | 'DELIVERED';
  learningUnits?: { learningUnit: LearningUnit; sortOrder: number }[];
}
