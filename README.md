# EMKEI Capacity Building Platform

A web-based capacity building platform for EMKEI Innovations that enables competency assessment, bespoke curriculum design, and impact evaluation for regulatory and biomanufacturing workforce development programs across Africa.

## Overview

The platform is deployed initially for **Vaccine Lot Release (VLR) regulatory training**, with architecture designed for expansion to other competency domains. It follows the EMKEI Capacity Building Methodology:

- **Phase 1: Discovery & Assessment** - Baseline competency assessment with gap analysis
- **Phase 2: Bespoke Curriculum Design** - AI-driven curriculum recommendations based on gaps
- **Phase 4: Impact Evaluation** - Pre/post comparison and institutional reporting

## Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with role management

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Charts:** Recharts
- **Routing:** React Router v6

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with VLR competency data
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000` and will proxy API requests to the backend at `http://localhost:3001`.

## Demo Credentials

After seeding the database, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| System Admin | admin@emkei.co.ke | Admin123! |
| Facilitator | facilitator@emkei.co.ke | Facilitator123! |
| Participant | participant@sahpra.org.za | Participant123! |

## Features

### For Participants
- Complete competency self-assessments and knowledge tests
- View gap analysis results with competency radar charts
- Track progress across competency areas
- Access individual development reports

### For Facilitators
- Create and manage training projects
- Invite and track participant progress
- View cohort-level gap analysis heatmaps
- Generate AI-driven curriculum recommendations
- Create customized training curriculums
- Generate institutional impact reports

### For Client Admins
- View organization-level dashboards
- Access aggregated impact reports
- Track training program outcomes

## Competency Domain: Vaccine Lot Release (VLR)

The initial deployment includes the VLR competency framework based on:
- WHO TRS 978 Annex 2
- SAHPGL-PEM-BIO-01
- ICH Q9
- PIC/S Guidelines

### Competency Areas
1. VLR-01: Vaccine Platforms & Technologies
2. VLR-02: Upstream Processing
3. VLR-03: Downstream Processing
4. VLR-04: Formulation & Fill-Finish
5. VLR-05: Critical Quality Attributes (CQAs)
6. VLR-06: Critical Process Parameters (CPPs)
7. VLR-07: Lot Summary Protocol (LSP) Review
8. VLR-08: Regulatory Decision-Making
9. VLR-09: Quality by Design (QbD)
10. VLR-10: International Regulatory Harmonization

### Competency Levels
- **Level 1 (Foundation):** Benchmark 50% - Understands core concepts
- **Level 2 (Advanced):** Benchmark 70% - Applies knowledge independently
- **Level 3 (Expert):** Benchmark 85% - Leads others, handles complex scenarios

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/:id/participants` - Get participants
- `GET /api/projects/:id/gap-analysis` - Get cohort gap analysis

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments/start` - Start assessment
- `POST /api/assessments/:id/responses` - Submit responses
- `POST /api/assessments/:id/complete` - Complete assessment
- `GET /api/assessments/:id/results` - Get results with gap analysis

### Curriculum
- `GET /api/curriculum/learning-units` - List learning units
- `POST /api/curriculum/generate-recommendations/:projectId` - Generate recommendations
- `GET /api/curriculum/recommendations/:projectId` - Get recommendations
- `POST /api/curriculum` - Create curriculum

### Reports
- `GET /api/reports/individual/:participantId/:projectId` - Individual report
- `GET /api/reports/institutional/:projectId` - Institutional report

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data (VLR competencies)
│   └── src/
│       ├── routes/          # API routes
│       ├── middleware/      # Auth middleware
│       ├── utils/           # JWT, password utilities
│       └── index.ts         # Express server
├── frontend/
│   └── src/
│       ├── api/             # API client
│       ├── components/      # React components
│       ├── pages/           # Page components
│       ├── store/           # Zustand store
│       └── types/           # TypeScript types
└── README.md
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/emkei_capacity"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

## License

Proprietary - EMKEI Innovations

## Contact

EMKEI Innovations - [https://emkei.co.ke](https://emkei.co.ke)
