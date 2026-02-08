import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { jobService } from '@/services/job.service';
import { Job } from '@/types';
import { Briefcase, Users, TrendingUp, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const HRDashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobService.getAllJobs();
      setJobs(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = {
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === 'open').length,
    closedJobs: jobs.filter((j) => j.status === 'closed').length,
    pausedJobs: jobs.filter((j) => j.status === 'paused').length,
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
          </div>
          <Link to="/hr/jobs/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon={<Briefcase className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Open Positions"
            value={stats.openJobs}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Closed"
            value={stats.closedJobs}
            icon={<Briefcase className="w-6 h-6" />}
            color="red"
          />
          <StatsCard
            title="Paused"
            value={stats.pausedJobs}
            icon={<Briefcase className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Job Postings</h2>
            <Link to="/hr/jobs" className="text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No job postings yet</p>
              <Link to="/hr/jobs/new" className="btn btn-primary mt-4">
                Create Your First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/hr/jobs/${job.job_id || job.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.location || 'Remote'} • {job.employmentType || 'Full-time'}
                      </p>
                    </div>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
