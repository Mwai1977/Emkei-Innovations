import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { projectsApi, curriculumApi } from '../api/client';
import { Project, CurriculumRecommendation } from '../types';

interface GapAnalysisData {
  summary: {
    totalParticipants: number;
    completedAssessments: number;
    areaStats: any[];
  };
  heatmap: any[];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisData | null>(null);
  const [recommendations, setRecommendations] = useState<CurriculumRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, participantsRes, gapRes, recsRes] = await Promise.all([
        projectsApi.getById(id!),
        projectsApi.getParticipants(id!),
        projectsApi.getGapAnalysis(id!).catch(() => ({ data: null })),
        curriculumApi.getRecommendations(id!).catch(() => ({ data: [] })),
      ]);
      setProject(projectRes.data);
      setParticipants(participantsRes.data);
      setGapAnalysis(gapRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      await curriculumApi.generateRecommendations(id!);
      const recsRes = await curriculumApi.getRecommendations(id!);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600">
              ← Projects
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">{project.name}</h1>
          <p className="text-gray-500">{project.organization?.name} • {project.domain?.name}</p>
        </div>
        <span className={`badge text-sm ${
          project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {project.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'participants', 'gap-analysis', 'curriculum'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Project Description</h3>
              <p className="text-gray-600">{project.description || 'No description provided.'}</p>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Competency Framework</h3>
              <div className="space-y-2">
                {project.domain?.competencyAreas?.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-primary-600">{area.code}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-700">{area.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Participants</span>
                  <span className="font-semibold">{participants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Baseline Complete</span>
                  <span className="font-semibold">
                    {participants.filter(p => p.assessments?.baseline?.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Post-Training Complete</span>
                  <span className="font-semibold">
                    {participants.filter(p => p.assessments?.postTraining?.status === 'COMPLETED').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/reports/institutional/${project.id}`} className="btn btn-outline w-full">
                  View Impact Report
                </Link>
                <button
                  onClick={handleGenerateRecommendations}
                  className="btn btn-secondary w-full"
                >
                  Generate Curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Participants ({participants.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Baseline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post-Training</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{p.user?.firstName} {p.user?.lastName}</p>
                        <p className="text-sm text-gray-500">{p.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.user?.participant?.currentRoleType?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        p.assessments?.baseline?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        p.assessments?.baseline?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.assessments?.baseline?.status || 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        p.assessments?.postTraining?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        p.assessments?.postTraining?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.assessments?.postTraining?.status || 'Not Started'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/reports/individual/${p.userId}/${project.id}`}
                        className="text-sm text-primary-500 hover:text-primary-600"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'gap-analysis' && gapAnalysis && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Cohort Gap Analysis</h3>
            <p className="text-gray-500 mb-6">
              Based on {gapAnalysis.summary.completedAssessments} completed baseline assessments
            </p>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={gapAnalysis.summary.areaStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="area.code" type="category" width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 shadow-lg rounded-lg border">
                          <p className="font-semibold">{data.area.name}</p>
                          <p className="text-sm">Avg Score: {data.averageScore}%</p>
                          <p className="text-sm">Gap Score: {data.avgGapScore}%</p>
                          <p className="text-sm">Participants: {data.participantCount}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="averageScore" name="Average Score">
                  {gapAnalysis.summary.areaStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.averageScore >= 70 ? '#22c55e' : entry.averageScore >= 50 ? '#eab308' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
              const total = gapAnalysis.summary.areaStats.reduce(
                (sum, area) => sum + (area.priorityCounts[priority] || 0),
                0
              );
              return (
                <div key={priority} className="card p-4">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: priorityColors[priority] }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{priority.toLowerCase()}</span>
                  </div>
                  <p className="text-2xl font-semibold mt-2">{total}</p>
                  <p className="text-xs text-gray-500">gaps identified</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Curriculum Recommendations</h3>
            <button onClick={handleGenerateRecommendations} className="btn btn-primary">
              Regenerate Recommendations
            </button>
          </div>

          {recommendations.length > 0 ? (
            <div className="card">
              <div className="divide-y divide-gray-200">
                {recommendations.map((rec, index) => (
                  <div key={rec.id} className="p-6 flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{rec.learningUnit?.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{rec.rationale}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span>{rec.learningUnit?.durationHours} hours</span>
                          <span>Level: {rec.learningUnit?.levelAppropriate?.name}</span>
                          <span className={`badge badge-${rec.status.toLowerCase()}`}>
                            {rec.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-500 mb-4">No curriculum recommendations generated yet.</p>
              <p className="text-sm text-gray-400 mb-6">
                Complete baseline assessments first, then generate recommendations based on gap analysis.
              </p>
              <button onClick={handleGenerateRecommendations} className="btn btn-primary">
                Generate Recommendations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
