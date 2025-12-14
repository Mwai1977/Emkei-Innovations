import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { assessmentsApi } from '../api/client';

interface AssessmentResults {
  assessment: any;
  participant: any;
  project: any;
  summary: {
    totalQuestions: number;
    totalScore: number;
    maxPossibleScore: number;
    percentageScore: number;
  };
  gapAnalysis: any[];
}

export default function AssessmentResults() {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await assessmentsApi.getResults(id!);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
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

  if (!results) {
    return <div className="text-center py-12">Results not found</div>;
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  const radarData = results.gapAnalysis.map((ga) => ({
    area: ga.area.code,
    score: ga.knowledgeScore || 0,
    fullMark: 100,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/assessments" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back to Assessments
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Assessment Results</h1>
          <p className="text-gray-500">
            {results.assessment.type === 'BASELINE' ? 'Baseline' : 'Post-Training'} Assessment
            {results.assessment.completedAt && (
              <span> • Completed {new Date(results.assessment.completedAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <p className="text-sm text-gray-500">Overall Score</p>
          <p className="text-3xl font-bold text-primary-600">{results.summary.percentageScore}%</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500">Questions</p>
          <p className="text-3xl font-bold text-gray-900">{results.summary.totalQuestions}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500">Time Taken</p>
          <p className="text-3xl font-bold text-gray-900">
            {results.assessment.timeTakenMinutes || '-'} min
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500">Areas Assessed</p>
          <p className="text-3xl font-bold text-gray-900">{results.gapAnalysis.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Competency Profile</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="area" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#0074B7"
                fill="#0074B7"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Score by Competency Area</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={results.gapAnalysis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="area.code" type="category" width={70} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 shadow-lg rounded-lg border">
                        <p className="font-semibold">{data.area.name}</p>
                        <p className="text-sm">Score: {Math.round(data.knowledgeScore || 0)}%</p>
                        <p className="text-sm">Gap: {Math.round(data.gapScore)}%</p>
                        <p className="text-sm">Priority: {data.priority}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="knowledgeScore" name="Score">
                {results.gapAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={priorityColors[entry.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed gap analysis */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Detailed Gap Analysis</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {results.gapAnalysis.map((ga) => (
            <div key={ga.area.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-primary-600">{ga.area.code}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-900">{ga.area.name}</span>
                    <span className={`ml-3 badge badge-${ga.priority.toLowerCase()}`}>
                      {ga.priority}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Self Rating</p>
                      <p className="font-medium">
                        {ga.selfRatingScore ? `${ga.selfRatingScore.toFixed(1)} / 5` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Knowledge Score</p>
                      <p className="font-medium">
                        {ga.knowledgeScore ? `${Math.round(ga.knowledgeScore)}%` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Level</p>
                      <p className="font-medium">{ga.currentLevel?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Target Level</p>
                      <p className="font-medium">{ga.targetLevel?.name || '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold" style={{ color: priorityColors[ga.priority] }}>
                    {Math.round(ga.gapScore)}%
                  </div>
                  <div className="text-xs text-gray-500">Gap Score</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to target</span>
                  <span>
                    {ga.currentLevel?.benchmarkScore || 0}% / {ga.targetLevel?.benchmarkScore || 70}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (ga.knowledgeScore || 0) / (ga.targetLevel?.benchmarkScore || 70) * 100)}%`,
                      backgroundColor: priorityColors[ga.priority],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
