import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { jobService } from '@/services/job.service';
import { ATSScore, Job } from '@/types';
import { Users, FileText, Calendar, TrendingUp, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const JobApplicationsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ATSScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const loadData = async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      const [jobData, applicationsData] = await Promise.all([
        jobService.getJobById(jobId),
        jobService.getJobApplications(jobId),
      ]);
      setJob(jobData);
      setApplications(applicationsData);
    } catch (error: any) {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.match_score || 0) - (a.match_score || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const avgScore = applications.length
    ? applications.reduce((sum, app) => sum + (app.match_score || 0), 0) / applications.length
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading applications..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{job?.title}</h1>
          <p className="text-gray-600 mt-2">Review and manage applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
              </div>
              <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(avgScore)}%
                </p>
              </div>
              <div className="p-4 bg-green-100 text-green-600 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Scorers (80%+)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {applications.filter((app) => (app.match_score || 0) >= 80).length}
                </p>
              </div>
              <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('score')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'score'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sort by Score
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'date'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sort by Date
            </button>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="No applications yet"
            description="No candidates have applied to this position yet. Share the job posting to attract more candidates!"
          />
        ) : (
          <div className="space-y-4">
            {sortedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const ApplicationCard: React.FC<{ application: ATSScore }> = ({ application }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const candidateName = application.resumes?.parsed_data?.personalInfo?.name || 'Candidate';
  const candidateEmail = application.resumes?.parsed_data?.personalInfo?.email || '';
  const resumeUrl = application.resumes?.cloudinary_url || '';
  const matchScore = application.match_score || 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {candidateName}
            </h3>
            {candidateEmail && (
              <a
                href={`mailto:${candidateEmail}`}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-1" />
                {candidateEmail}
              </a>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Applied on {formatDate(application.created_at)}
          </div>
        </div>
        <ScoreBadge score={Math.round(matchScore)} size="lg" />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Score Breakdown
          </h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show Details'}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* Strong Skills */}
            {application.strong_skills && application.strong_skills.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Strong Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {application.strong_skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {application.missing_skills && application.missing_skills.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Missing Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {application.missing_skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {application.recommendation && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1">Recommendation</h5>
                <p className="text-sm text-gray-600">{application.recommendation}</p>
              </div>
            )}

            {/* Shortlist Probability */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 mb-1">Shortlist Probability</h5>
              <ProgressBar
                label=""
                value={Math.round((application.shortlist_probability || 0) * 100)}
                color="blue"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Resume</span>
          </a>
        )}
        {candidateEmail && (
          <a
            href={`mailto:${candidateEmail}`}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Candidate</span>
          </a>
        )}
      </div>
    </div>
  );
};
