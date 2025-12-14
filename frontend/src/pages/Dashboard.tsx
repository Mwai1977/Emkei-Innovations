import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectsApi, assessmentsApi } from '../api/client';
import { Project, Assessment } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, assessmentsRes] = await Promise.all([
          user?.role !== 'PARTICIPANT' ? projectsApi.list({ limit: 5 }) : Promise.resolve({ data: { projects: [] } }),
          assessmentsApi.list(),
        ]);
        setProjects(projectsRes.data.projects || []);
        setAssessments(assessmentsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const pendingAssessments = assessments.filter(a => a.status !== 'COMPLETED');
  const completedAssessments = assessments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-semibold">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-primary-100">
          {user?.role === 'PARTICIPANT'
            ? 'Continue your competency development journey.'
            : 'Manage training programs and track participant progress.'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user?.role !== 'PARTICIPANT' && (
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-primary-100">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingAssessments.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-accent-100">
              <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Completed Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">{completedAssessments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending assessments */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Assessments</h2>
          </div>
          <div className="p-6">
            {pendingAssessments.length > 0 ? (
              <div className="space-y-4">
                {pendingAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{assessment.instrument?.name || 'Assessment'}</p>
                      <p className="text-sm text-gray-500">
                        {assessment.assessmentType === 'BASELINE' ? 'Baseline' : 'Post-Training'} •
                        {assessment.status === 'IN_PROGRESS' ? ' In Progress' : ' Not Started'}
                      </p>
                    </div>
                    <Link
                      to={`/assessments/${assessment.id}`}
                      className="btn btn-primary text-sm"
                    >
                      {assessment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No pending assessments</p>
                {user?.role === 'PARTICIPANT' && (
                  <p className="text-sm mt-2">Check back when you're enrolled in a training program.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent projects (for facilitators/admins) or Completed assessments (for participants) */}
        {user?.role !== 'PARTICIPANT' ? (
          <div className="card">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
              <Link to="/projects" className="text-sm text-primary-500 hover:text-primary-600">
                View all
              </Link>
            </div>
            <div className="p-6">
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.organization?.name}</p>
                        </div>
                        <span className={`badge ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>{project._count?.projectParticipants || 0} participants</span>
                        <span className="mx-2">•</span>
                        <span>{project._count?.assessments || 0} assessments</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No projects yet</p>
                  <Link to="/projects/new" className="btn btn-primary mt-4">
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Completed Assessments</h2>
            </div>
            <div className="p-6">
              {completedAssessments.length > 0 ? (
                <div className="space-y-4">
                  {completedAssessments.map((assessment) => (
                    <div key={assessment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{assessment.instrument?.name || 'Assessment'}</p>
                          <p className="text-sm text-gray-500">
                            {assessment.assessmentType === 'BASELINE' ? 'Baseline' : 'Post-Training'}
                          </p>
                        </div>
                        <Link
                          to={`/assessments/${assessment.id}/results`}
                          className="text-sm text-primary-500 hover:text-primary-600"
                        >
                          View Results
                        </Link>
                      </div>
                      {assessment.completedAt && (
                        <p className="mt-2 text-xs text-gray-400">
                          Completed on {new Date(assessment.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No completed assessments yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
