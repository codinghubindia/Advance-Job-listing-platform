import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { jobService } from '@/services/job.service';
import { Job } from '@/types';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  Upload,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const JobDetailsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) return;
      try {
        setIsLoading(true);
        const data = await jobService.getJobById(jobId);
        setJob(data);
      } catch (error: any) {
        toast.error('Failed to load job details');
        navigate('/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [jobId, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleApply = async () => {
    if (!selectedFile || !jobId) return;

    setIsApplying(true);
    try {
      const result = await jobService.applyForJob(jobId, selectedFile);
      toast.success('Application submitted successfully!');
      navigate('/my-applications');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading job details..." />
      </Layout>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Job Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center text-lg text-gray-700">
                <Building className="w-5 h-5 mr-2" />
                {job.companyName || job.company_name || 'Company'}
              </div>
            </div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            {(job.location || job.location) && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                {job.location}
              </div>
            )}
            {(job.salaryRange || job.salary_range) && (
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gray-400" />
                {job.salaryRange || job.salary_range}
              </div>
            )}
            {(job.employmentType || job.employment_type) && (
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-gray-400" />
                {job.employmentType || job.employment_type}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-400" />
              Posted {formatDate(job.postedDate || job.created_at || new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
          </div>
        )}

        {/* Application Form */}
        {(job.status === 'active' || job.status === 'open') && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply for this Position</h2>
            
            <div className="mb-6">
              <label htmlFor="resume" className="label">
                Upload Your Resume *
              </label>
              <div className="mt-2">
                <label
                  htmlFor="resume"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {selectedFile ? (
                      <>
                        <FileText className="w-10 h-10 text-primary-600 mb-2" />
                        <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT (max. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    id="resume"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your resume will be automatically analyzed by our ATS system
                to match your skills and experience with the job requirements. You'll receive an
                instant score upon submission.
              </p>
            </div>

            <button
              onClick={handleApply}
              disabled={!selectedFile || isApplying}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};
