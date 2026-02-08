import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { jobService } from '@/services/job.service';
import { Job } from '@/types';
import { Briefcase, Plus, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ManageJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [, setRefreshTrigger] = useState(0);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobService.getAllJobs(filter);
      setJobs(data);
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await jobService.deleteJob(jobId);
      toast.success('Job deleted successfully');
      setRefreshTrigger(prev => prev + 1);
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete job');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-600 mt-2">Create and manage your job postings</p>
          </div>
          <Link to="/hr/jobs/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === ''
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'open'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'closed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'paused'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Paused
          </button>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <LoadingSpinner message="Loading jobs..." />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-gray-400" />}
            title="No jobs found"
            description="You haven't created any job postings yet. Start by posting your first job!"
            action={{
              label: 'Post New Job',
              onClick: () => (window.location.href = '/hr/jobs/new'),
            }}
          />
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDeleteJob} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const JobCard: React.FC<{ job: Job; onDelete: (jobId: string) => void }> = ({ job, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const jobId = job.job_id || job.id; // Use job_id if available, fallback to id

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                job.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : job.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {job.status}
            </span>
          </div>
          
          <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {job.location}
              </div>
            )}
            {job.employmentType && (
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {job.employmentType}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Posted {formatDate(job.postedDate)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <Link
          to={`/hr/jobs/${jobId}/applications`}
          className="btn btn-primary flex-1"
        >
          View Applications
        </Link>
        <Link
          to={`/hr/jobs/${jobId}/edit`}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </Link>
        <button
          onClick={() => onDelete(jobId)}
          className="btn btn-danger flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
