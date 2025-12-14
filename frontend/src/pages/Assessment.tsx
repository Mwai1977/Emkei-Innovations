import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentsApi } from '../api/client';
import { Assessment as AssessmentType, AssessmentQuestion } from '../types';

export default function Assessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await assessmentsApi.getById(id!);
      setAssessment(response.data);

      // Load existing responses
      if (response.data.responses) {
        const existingResponses = new Map();
        response.data.responses.forEach((r: any) => {
          existingResponses.set(r.questionId, r.responseValue);
        });
        setResponses(existingResponses);
      }
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const questions = assessment?.instrument?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleResponse = (questionId: string, value: any) => {
    const newResponses = new Map(responses);
    newResponses.set(questionId, value);
    setResponses(newResponses);
  };

  const handleSaveAndContinue = async () => {
    if (!currentQuestion) return;

    try {
      await assessmentsApi.submitResponses(id!, [
        {
          questionId: currentQuestion.id,
          responseValue: responses.get(currentQuestion.id),
        },
      ]);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      // Save final response
      if (currentQuestion && responses.has(currentQuestion.id)) {
        await assessmentsApi.submitResponses(id!, [
          {
            questionId: currentQuestion.id,
            responseValue: responses.get(currentQuestion.id),
          },
        ]);
      }

      // Complete the assessment
      await assessmentsApi.complete(id!);
      navigate(`/assessments/${id}/results`);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return <div className="text-center py-12">Assessment not found or has no questions.</div>;
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasCurrentResponse = responses.has(currentQuestion?.id);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">{assessment.instrument?.name}</h1>
        <p className="text-gray-500">
          {assessment.assessmentType === 'BASELINE' ? 'Baseline Assessment' : 'Post-Training Assessment'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card p-8">
        {/* Competency context */}
        {currentQuestion?.competencyItem && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <span className="text-sm font-medium text-primary-600">
              {currentQuestion.competencyItem.area?.code}
            </span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              {currentQuestion.competencyItem.area?.name}
            </span>
          </div>
        )}

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {currentQuestion?.questionText}
          </h2>
          {currentQuestion?.questionType === 'SELF_RATING' && (
            <p className="text-sm text-gray-500">
              Rate your current proficiency level
            </p>
          )}
        </div>

        {/* Response options */}
        <div className="space-y-3">
          {currentQuestion?.questionType === 'SELF_RATING' ? (
            // Self-rating scale
            <div className="flex flex-wrap gap-3">
              {(currentQuestion.options as any[])?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(currentQuestion.id, option.value)}
                  className={`flex-1 min-w-[100px] p-4 rounded-lg border-2 transition-colors ${
                    responses.get(currentQuestion.id) === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-semibold text-center mb-1">{option.value}</div>
                  <div className="text-xs text-gray-500 text-center">{option.label}</div>
                </button>
              ))}
            </div>
          ) : (
            // Multiple choice
            (currentQuestion?.options as any[])?.map((option) => (
              <button
                key={option.label}
                onClick={() => handleResponse(currentQuestion.id, option.label)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  responses.get(currentQuestion.id) === option.label
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium mr-3 ${
                    responses.get(currentQuestion.id) === option.label
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="btn btn-ghost disabled:opacity-50"
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleComplete}
            disabled={!hasCurrentResponse || submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? 'Completing...' : 'Complete Assessment'}
          </button>
        ) : (
          <button
            onClick={handleSaveAndContinue}
            disabled={!hasCurrentResponse}
            className="btn btn-primary disabled:opacity-50"
          >
            Save & Continue →
          </button>
        )}
      </div>

      {/* Question navigator */}
      <div className="mt-8 card p-4">
        <p className="text-sm text-gray-500 mb-3">Jump to question:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-primary-500 text-white'
                  : responses.has(q.id)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
