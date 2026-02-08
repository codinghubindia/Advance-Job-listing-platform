import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { jobService } from '@/services/job.service';
import { Job } from '@/types';
import { Briefcase, MapPin, DollarSign, Calendar, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export const JobsListPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Open Positions</h1>
          <p className="text-gray-600 mt-2">Find your next opportunity</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active Jobs
          </button>
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === ''
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Jobs
          </button>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <LoadingSpinner message="Loading jobs..." />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-gray-400" />}
            title="No jobs found"
            description="There are no job openings available at the moment. Check back later!"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const jobId = job.job_id || job.id;

  return (
    <Link to={`/jobs/${jobId}`} className="block">
      <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Building className="w-4 h-4 mr-1" />
              {job.companyName || job.company_name || 'Company'}
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
              job.status === 'active' || job.status === 'open'
                ? 'bg-green-100 text-green-800'
                : job.status === 'closed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {job.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {job.description}
        </p>

        <div className="space-y-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
          {(job.location || job.location) && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              {job.location}
            </div>
          )}
          {(job.salaryRange || job.salary_range) && (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
              {job.salaryRange || job.salary_range}
            </div>
          )}
          {(job.employmentType || job.employment_type) && (
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
              {job.employmentType || job.employment_type}
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            Posted {formatDate(job.postedDate || job.created_at)}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="btn btn-primary w-full">
            View Details & Apply
          </button>
        </div>
      </div>
    </Link>
  );
};
