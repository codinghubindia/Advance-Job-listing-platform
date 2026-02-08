import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { jobService } from '@/services/job.service';
import { ATSScore } from '@/types';
import { FileText, Calendar, Briefcase, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ATSScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const data = await jobService.getMyApplications();
      setApplications(data);
    } catch (error: any) {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">Track your job applications and ATS scores</p>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <LoadingSpinner message="Loading applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-gray-400" />}
            title="No applications yet"
            description="You haven't applied to any jobs yet. Browse available positions and submit your resume!"
            action={{
              label: 'Browse Jobs',
              onClick: () => window.location.href = '/jobs',
            }}
          />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
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

  const jobTitle = application.job?.title || 'Job Application';
  const companyName = application.job?.company_name || application.job?.companyName || 'Company';
  const matchScore = application.match_score || 0;
  const resumeUrl = application.resumes?.cloudinary_url || '';

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">{jobTitle}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{companyName}</p>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Applied on {formatDate(application.created_at)}
          </div>
        </div>
        <ScoreBadge score={matchScore} size="lg" />
      </div>

      {/* Score Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            ATS Analysis
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
            {/* Recommendation */}
            {application.recommendation && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1">Recommendation</h5>
                <p className="text-sm text-gray-600">{application.recommendation}</p>
              </div>
            )}

            {/* Strong Skills */}
            {application.strong_skills && application.strong_skills.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Strong Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {application.strong_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {application.missing_skills && application.missing_skills.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Areas to Improve</h5>
                <div className="flex flex-wrap gap-2">
                  {application.missing_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Highlights */}
            {application.key_highlights && application.key_highlights.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Highlights</h5>
                <ul className="list-disc list-inside space-y-1">
                  {application.key_highlights.map((highlight, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estimated Salary Range */}
            {application.salary_range && (application.salary_range.min > 0 || application.salary_range.max > 0) && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-1">Estimated Salary Range</h5>
                <p className="text-sm text-gray-600">
                  ${application.salary_range.min.toLocaleString()} - ${application.salary_range.max.toLocaleString()}
                </p>
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

      {/* Resume Link */}
      {resumeUrl && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Resume
          </a>
          {application.resumes?.uploaded_at && (
            <span className="text-xs text-gray-500">
              Uploaded on {formatDate(application.resumes.uploaded_at)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
