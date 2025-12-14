import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { reportsApi } from '../api/client';

interface InstitutionalReportData {
  project: any;
  organization: any;
  domain: any;
  summary: {
    totalParticipants: number;
    baselineCompleted: number;
    postCompleted: number;
    completionRate: { baseline: number; post: number };
    overallScores: { baseline: number; post: number };
    overallImprovement: number | null;
  };
  priorityDistribution: { [key: string]: number };
  areaStats: any[];
  topImprovements: any[];
  areasNeedingAttention: any[];
  generatedAt: string;
}

export default function InstitutionalReport() {
  const { projectId } = useParams<{ projectId: string }>();
  const [report, setReport] = useState<InstitutionalReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) fetchReport();
  }, [projectId]);

  const fetchReport = async () => {
    try {
      const response = await reportsApi.getInstitutional(projectId!);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
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

  if (!report) {
    return <div className="text-center py-12">Report not found</div>;
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  const comparisonData = report.areaStats.map((stat) => ({
    name: stat.area.code,
    baseline: stat.baseline.avgScore,
    post: stat.post.avgScore,
    improvement: stat.improvement,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/reports" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to Reports
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Institutional Impact Report</h1>
          <p className="text-gray-500">
            {report.project.name} • {report.organization.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Generated</p>
          <p className="text-sm font-medium">{new Date(report.generatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <h2 className="text-lg font-semibold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-primary-100 text-sm">Total Participants</p>
            <p className="text-3xl font-bold">{report.summary.totalParticipants}</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Baseline Completed</p>
            <p className="text-3xl font-bold">{report.summary.completionRate.baseline}%</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Post-Training Completed</p>
            <p className="text-3xl font-bold">{report.summary.completionRate.post}%</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Overall Improvement</p>
            <p className="text-3xl font-bold">
              {report.summary.overallImprovement !== null
                ? `${report.summary.overallImprovement > 0 ? '+' : ''}${report.summary.overallImprovement}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Priority distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
          <div key={priority} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 capitalize">{priority.toLowerCase()} Priority</p>
                <p className="text-2xl font-bold">{report.priorityDistribution[priority] || 0}</p>
              </div>
              <div
                className="w-12 h-12 rounded-full opacity-20"
                style={{ backgroundColor: priorityColors[priority] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pre/Post comparison */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Baseline vs Post-Training Scores</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" />
              <Bar dataKey="post" name="Post-Training" fill="#0074B7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Improvement by area */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Improvement by Competency Area</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonData.filter(d => d.improvement !== null)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={70} />
              <Tooltip />
              <Bar dataKey="improvement" name="Improvement %">
                {comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry.improvement || 0) >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Competency Area Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Baseline Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Improvement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.areaStats.map((stat) => (
                <tr key={stat.area.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{stat.area.code}</p>
                    <p className="text-sm text-gray-500">{stat.area.name}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{stat.baseline.avgScore}%</td>
                  <td className="px-6 py-4 text-gray-600">{stat.post.avgScore}%</td>
                  <td className="px-6 py-4">
                    {stat.improvement !== null ? (
                      <span className={stat.improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {stat.improvement >= 0 ? '+' : ''}{stat.improvement}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        L1: {stat.levelDistribution?.baseline?.level1 || 0} → {stat.levelDistribution?.post?.level1 || 0}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        L2: {stat.levelDistribution?.baseline?.level2 || 0} → {stat.levelDistribution?.post?.level2 || 0}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        L3: {stat.levelDistribution?.baseline?.level3 || 0} → {stat.levelDistribution?.post?.level3 || 0}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top improvements */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Top Improvements
          </h3>
          {report.topImprovements.length > 0 ? (
            <div className="space-y-3">
              {report.topImprovements.map((item) => (
                <div key={item.area.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.area.name}</p>
                    <p className="text-sm text-gray-500">{item.area.code}</p>
                  </div>
                  <span className="text-green-600 font-semibold">+{item.improvement}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Complete post-training assessments to see improvements.</p>
          )}
        </div>

        {/* Areas needing attention */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
            Areas Needing Attention
          </h3>
          {report.areasNeedingAttention.length > 0 ? (
            <div className="space-y-3">
              {report.areasNeedingAttention.map((item) => (
                <div key={item.area.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.area.name}</p>
                    <p className="text-sm text-gray-500">{item.area.code}</p>
                  </div>
                  <span className="text-orange-600 font-semibold">{item.post.avgScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">All areas meeting targets!</p>
          )}
        </div>
      </div>

      {/* Print button */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}
