// services/recruiterService.ts
import { apiFetch } from "./authService";

/* ================= JOB MANAGEMENT ================= */

export interface SkillInput {
    id?: number
    name: string
}

export interface JobPostDTO {
    title: string
    description: string
    location: string
    type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'REMOTE'
    category: string
    minSalary?: number
    maxSalary?: number
    experienceRequired: string
    companyName: string
    companyLogoUrl?: string
    status: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'DELETED'
    lastDateToApply?: string
    requiredSkills: SkillInput[]
    featured?: boolean
    priorityScore?: number
    active?: boolean
}

export async function postJob(data: JobPostDTO) {
    return apiFetch(`/job/`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateJob(postId: number, data: JobPostDTO) {
    return apiFetch(`/job/${postId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteJob(postId: number) {
    return apiFetch(`/job/${postId}`, { method: "DELETE" });
}

export async function getPostedJobs(page = 0, size = 10) {
    return apiFetch(`/job/recruiter/?page=${page}&size=${size}`, { method: "GET" });
}

export async function getJobApplications(jobId: number, page = 0, size = 10) {
    return apiFetch(`/job/${jobId}/applications?page=${page}&size=${size}`, { method: "GET" });
}

export async function getJobApplicationById(id: number) {
    return apiFetch(`/job/applications/${id}`, { method: "GET" });
}

/* ================= APPLICATION STATUS ================= */

export async function updateApplicationStatus(applicationId: number, data: {
    status: string; recruiterNotes?: string; interviewDate?: string
}) {
    return apiFetch(`/recruiter/applications/${applicationId}/status`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function bulkUpdateApplicationStatus(data: {
    status: string; recruiterNotes?: string; interviewDate?: string; applicationIds: number[]
}) {
    return apiFetch(`/recruiter/applications/status/bulk`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/* ================= RECRUITER DASHBOARD ================= */

export async function getRecruiterDashboard() {
    return apiFetch(`/recruiter/dashboard/overview`, { method: "GET" });
}
