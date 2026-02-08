import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { jobService } from '@/services/job.service';
import { Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const isEditMode = !!jobId;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    employmentType: 'Full-time',
    closingDate: '',
  });

  const loadJobData = async () => {
    try {
      setIsLoadingJob(true);
      const job = await jobService.getJobById(jobId!);
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: job.requirements || '',
        location: job.location || '',
        salaryRange: job.salaryRange || '',
        employmentType: job.employmentType || 'Full-time',
        closingDate: job.closingDate || '',
      });
    } catch (error: any) {
      toast.error('Failed to load job details');
      navigate('/hr/jobs');
    } finally {
      setIsLoadingJob(false);
    }
  };

  useEffect(() => {
    if (isEditMode && jobId) {
      loadJobData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, jobId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const jobData = {
        ...formData,
        location: formData.location || undefined,
        salaryRange: formData.salaryRange || undefined,
        closingDate: formData.closingDate || undefined,
      };

      if (isEditMode && jobId) {
        await jobService.updateJob(jobId, jobData);
        toast.success('Job updated successfully!');
      } else {
        await jobService.createJob(jobData);
        toast.success('Job posted successfully!');
      }
      
      navigate('/hr/jobs');
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} job`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingJob) {
    return (
      <Layout>
        <LoadingSpinner message="Loading job details..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Job' : 'Post New Job'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEditMode ? 'Update job posting details' : 'Create a new job posting to attract candidates'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="label">
                  Job Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  className="input"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Job Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  className="input"
                  placeholder="Describe the role, responsibilities, and what makes this position unique..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="requirements" className="label">
                  Requirements *
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  required
                  rows={6}
                  className="input"
                  placeholder="List the required skills, qualifications, and experience..."
                  value={formData.requirements}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="label">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="input"
                  placeholder="e.g., New York, NY or Remote"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="employmentType" className="label">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  className="input"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label htmlFor="salaryRange" className="label">
                  Salary Range
                </label>
                <input
                  id="salaryRange"
                  name="salaryRange"
                  type="text"
                  className="input"
                  placeholder="e.g., $80,000 - $120,000"
                  value={formData.salaryRange}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="closingDate" className="label">
                  Closing Date
                </label>
                <input
                  id="closingDate"
                  name="closingDate"
                  type="date"
                  className="input"
                  value={formData.closingDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {isLoading ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Job' : 'Post Job')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr/jobs')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
