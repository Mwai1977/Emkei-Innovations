import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, organizationsApi, competenciesApi } from '../api/client';
import { Project, Organization, CompetencyDomain } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [domains, setDomains] = useState<CompetencyDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    organizationId: '',
    domainId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, orgsRes, domainsRes] = await Promise.all([
        projectsApi.list(),
        organizationsApi.list(),
        competenciesApi.getDomains(),
      ]);
      setProjects(projectsRes.data.projects);
      setOrganizations(orgsRes.data);
      setDomains(domainsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectsApi.create(newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', organizationId: '', domainId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create project:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="text-gray-500">Manage training engagements</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          Create Project
        </button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.organization?.name}</p>
                </div>
                <span className={`badge ${
                  project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                  project.status === 'SETUP' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {project._count?.projectParticipants || 0} participants
                </span>
                <span>{project.domain?.code}</span>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-primary-500">
              View Details →
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 card">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">No projects yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4">
            Create your first project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Create New Project</h2>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="input"
                  placeholder="e.g., SAHPRA VLR Training 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Brief description of the training engagement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <select
                  required
                  value={newProject.organizationId}
                  onChange={(e) => setNewProject({ ...newProject, organizationId: e.target.value })}
                  className="input"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competency Domain</label>
                <select
                  required
                  value={newProject.domainId}
                  onChange={(e) => setNewProject({ ...newProject, domainId: e.target.value })}
                  className="input"
                >
                  <option value="">Select domain...</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.code} - {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
