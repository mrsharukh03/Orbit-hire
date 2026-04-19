// services/recruiterService.ts
import { apiFetch } from "./authService";

/*
 * recruiterService.ts
 * -----------------------------------------------------------------
 * Recruiter-specific API calls.
 * Job CRUD (postJob, updateJob, deleteJob) lives in jobService.ts.
 * This file owns: profile, dashboard, posted-jobs listing,
 *                 application listing & status management.
 * -----------------------------------------------------------------
 */

/* ================= TYPES ================= */

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

export interface RecruiterProfileDTO {
    phone: string
    profileImageUrl?: string
    companyLogoUrl?: string
    linkedInProfile?: string
    companyWebsite?: string
    companyName: string
    designation: string
    location: string
    industry: string
    companySize?: string
    companyDescription?: string
    yearsOfExperience?: number
    about?: string
    hiringSkills?: string[]
}

/* ================= JOB MANAGEMENT ================= */

/** POST /api/v1/job/ */
export async function postJob(data: JobPostDTO) {
    return apiFetch(`/job/`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** GET /api/v1/job/recruiter/ */
export async function getPostedJobs(page = 0, size = 10) {
    return apiFetch(`/job/recruiter/?page=${page}&size=${size}`, { method: "GET" });
}

/** GET /api/v1/job/{jobId}/applications */
export async function getJobApplications(jobId: number, page = 0, size = 10) {
    return apiFetch(`/job/${jobId}/applications?page=${page}&size=${size}`, { method: "GET" });
}

/** GET /api/v1/job/applications/{id} */
export async function getJobApplicationById(id: number) {
    return apiFetch(`/job/applications/${id}`, { method: "GET" });
}

/* ================= APPLICATION STATUS ================= */

/** PUT /api/v1/recruiter/applications/{applicationId}/status */
export async function updateApplicationStatus(applicationId: number, data: {
    status: string; recruiterNotes?: string; interviewDate?: string
}) {
    return apiFetch(`/recruiter/applications/${applicationId}/status`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/** PUT /api/v1/recruiter/applications/status/bulk */
export async function bulkUpdateApplicationStatus(data: {
    status: string; recruiterNotes?: string; interviewDate?: string; applicationIds: number[]
}) {
    return apiFetch(`/recruiter/applications/status/bulk`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/* ================= RECRUITER PROFILE ================= */

/** GET /api/v1/recruiter/profile */
export async function getRecruiterProfile() {
    return apiFetch(`/recruiter/profile`, { method: "GET" });
}

/** POST /api/v1/recruiter/profile/update */
export async function updateRecruiterProfile(data: RecruiterProfileDTO) {
    return apiFetch(`/recruiter/profile/update`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/* ================= RECRUITER DASHBOARD ================= */

/** GET /api/v1/recruiter/dashboard/overview */
export async function getRecruiterDashboard() {
    return apiFetch(`/recruiter/dashboard/overview`, { method: "GET" });
}
