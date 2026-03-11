import { apiFetch } from "./authService";

/* ================= TYPES ================= */

export interface SkillResponse {
    id?: number
    name: string
}

export type JobPostDTO = {
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
    status?: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'DELETED'
    lastDateToApply?: string
    requiredSkills: SkillResponse[]
    featured?: boolean
    priorityScore?: number
    active?: boolean
}

/* ================= JOB CRUD ================= */

/** POST /api/v1/job/ */
export async function postNewJob(jobData: JobPostDTO) {
    return apiFetch(`/job/`, {
        method: "POST",
        body: JSON.stringify(jobData),
    });
}

/** PUT /api/v1/job/{postId} */
export async function updateJob(postId: number, jobData: JobPostDTO) {
    return apiFetch(`/job/${postId}`, {
        method: "PUT",
        body: JSON.stringify(jobData),
    });
}

/** DELETE /api/v1/job/{postId} */
export async function deleteJob(postId: number) {
    return apiFetch(`/job/${postId}`, { method: "DELETE" });
}

/** GET /api/v1/job/recruiter/ (Get jobs posted by the logged-in recruiter) */
export async function getRecruiterPostedJobs(page = 0, size = 10) {
    return apiFetch(`/job/recruiter/?page=${page}&size=${size}`, {
        method: "GET",
    });
}

/** GET /api/v1/job/{jobId}/applications (Get candidates who applied to a specific job) */
export async function getJobApplicationsList(jobId: number, page = 0, size = 10) {
    return apiFetch(`/job/${jobId}/applications?page=${page}&size=${size}`, {
        method: "GET",
    });
}

/** GET /api/v1/job/applications/{id} (Get single application detail) */
export async function getJobApplicationById(id: number) {
    return apiFetch(`/job/applications/${id}`, { method: "GET" });
}