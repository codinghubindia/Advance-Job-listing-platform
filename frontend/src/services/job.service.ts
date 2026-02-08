import api from './api';
import { Job, CreateJobDto, ATSScore } from '@/types';

export const jobService = {
  // Get all jobs
  async getAllJobs(status?: string): Promise<Job[]> {
    const params = status ? { status } : {};
    const response = await api.get('/api/ats/jobs', { params });
    return response.data.data; // Backend: { success, data: [...] }
  },

  // Get job by ID
  async getJobById(jobId: string): Promise<Job> {
    const response = await api.get(`/api/ats/jobs/${jobId}`);
    return response.data.data; // Backend: { success, data: {...} }
  },

  // Create new job (HR/Admin only)
  async createJob(data: CreateJobDto): Promise<Job> {
    const response = await api.post('/api/ats/jobs', data);
    return response.data.data; // Backend: { success, data: {...} }
  },

  // Update job (HR/Admin only)
  async updateJob(jobId: string, data: Partial<CreateJobDto>): Promise<Job> {
    const response = await api.put(`/api/ats/jobs/${jobId}`, data);
    return response.data.data; // Backend: { success, data: {...} }
  },

  // Delete job (Admin only)
  async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/api/ats/jobs/${jobId}`);
  },

  // Apply for job
  async applyForJob(jobId: string, resume: File): Promise<ATSScore> {
    const formData = new FormData();
    formData.append('resume', resume);
    
    const response = await api.post(
      `/api/ats/jobs/${jobId}/apply`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data; // Backend: { success, data: {...} }
  },

  // Get applications for a job (HR/Admin only)
  async getJobApplications(jobId: string): Promise<ATSScore[]> {
    const response = await api.get(`/api/ats/jobs/${jobId}/applications`);
    return response.data.data.applications; // Backend: { success, data: { jobId, count, applications } }
  },

  // Get candidate's own applications
  async getMyApplications(): Promise<ATSScore[]> {
    const response = await api.get('/api/ats/my-applications');
    return response.data.data; // Backend: { success, data: [...] }
  },

  // Get specific score details
  async getScoreById(scoreId: string): Promise<ATSScore> {
    const response = await api.get(`/api/ats/scores/${scoreId}`);
    return response.data.data; // Backend: { success, data: {...} }
  },
};
