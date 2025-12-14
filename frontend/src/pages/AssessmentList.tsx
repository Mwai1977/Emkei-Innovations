import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assessmentsApi } from '../api/client';
import { Assessment } from '../types';
import { useAuthStore } from '../store/authStore';

export default function AssessmentList() {
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await assessmentsApi.list();
      setAssessments(response.data);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
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

  const pendingAssessments = assessments.filter(a => a.status !== 'COMPLETED');
  const completedAssessments = assessments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Assessments</h1>
        <p className="text-gray-500">Complete competency assessments to track your development</p>
      </div>

      {/* Pending Assessments */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Assessments</h2>
        {pendingAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingAssessments.map((assessment) => (
              <div key={assessment.id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {assessment.instrument?.name || 'Competency Assessment'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {assessment.assessmentType === 'BASELINE' ? 'Baseline Assessment' : 'Post-Training Assessment'}
                    </p>
                  </div>
                  <span className={`badge ${
                    assessment.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {assessment.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {assessment.status === 'IN_PROGRESS' && assessment.startedAt && (
                      <span>Started {new Date(assessment.startedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <Link
                    to={`/assessments/${assessment.id}`}
                    className="btn btn-primary"
                  >
                    {assessment.status === 'IN_PROGRESS' ? 'Continue' : 'Start Assessment'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No pending assessments</p>
            {user?.role === 'PARTICIPANT' && (
              <p className="text-sm text-gray-400 mt-2">
                You'll see assessments here when enrolled in a training program.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Completed Assessments */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Completed Assessments</h2>
        {completedAssessments.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {completedAssessments.map((assessment) => (
                    <tr key={assessment.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {assessment.instrument?.name || 'Competency Assessment'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          assessment.assessmentType === 'BASELINE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {assessment.assessmentType === 'BASELINE' ? 'Baseline' : 'Post-Training'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {assessment.timeTakenMinutes ? `${assessment.timeTakenMinutes} min` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/assessments/${assessment.id}/results`}
                          className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                        >
                          View Results
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No completed assessments yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
