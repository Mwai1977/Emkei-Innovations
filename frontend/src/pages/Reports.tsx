import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { Project } from '../types';

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-gray-500">Generate and view impact reports for training projects</p>
      </div>

      {/* Report types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Individual Reports</h3>
          <p className="text-sm text-gray-500 mb-4">
            Competency development reports for individual participants showing baseline vs post-training progress.
          </p>
          <p className="text-xs text-gray-400">Access via project participant list</p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Institutional Reports</h3>
          <p className="text-sm text-gray-500 mb-4">
            Aggregate impact reports for client leadership showing cohort progress and ROI indicators.
          </p>
          <p className="text-xs text-gray-400">Select project below to generate</p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">M&E Reports</h3>
          <p className="text-sm text-gray-500 mb-4">
            Structured monitoring and evaluation reports for development partners and donors.
          </p>
          <p className="text-xs text-gray-400">Select project below to generate</p>
        </div>
      </div>

      {/* Projects table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Select Project for Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.domain?.code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {project.organization?.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {project._count?.projectParticipants || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <Link
                        to={`/reports/institutional/${project.id}`}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        Institutional
                      </Link>
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-gray-500 hover:text-gray-600 text-sm"
                      >
                        View Project
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No projects available for reports.
          </div>
        )}
      </div>
    </div>
  );
}
