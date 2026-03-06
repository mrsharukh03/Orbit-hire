// src/services/profileService.ts
import { apiFetch } from "./authService";

/* ================= SEEKER PROFILE ROUTES ================= */

export async function getSeekerProfile() {
    return apiFetch(`/seeker/current-profile`, { method: "GET" });
}

export async function updateSeekerPersonalDetails(data: any) {
    return apiFetch(`/seeker/update/personal-details`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function updateSeekerProfessionalDetails(data: any) {
    return apiFetch(`/seeker/update-professional`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function addSkill(names: string[]) {
    // API expects: POST /seeker/skill with body: [{ skillName: "..." }, ...]
    return apiFetch(`/seeker/skill`, {
        method: "POST",
        body: JSON.stringify(names.map(skillName => ({ skillName }))),
    });
}

export async function removeSkill(id: number) {
    return apiFetch(`/seeker/skill/${id}`, { method: "DELETE" });
}

/* ================= RECRUITER PROFILE ROUTES ================= */

export async function getRecruiterProfile() {
    return apiFetch(`/recruiter/profile`, { method: "GET" });
}

export async function updateRecruiterProfile(data: any) {
    return apiFetch(`/recruiter/profile/update`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/* ================= SEEKER EXPERIENCE ROUTES ================= */

export async function addExperience(data: any) {
    return apiFetch(`/seeker/experience`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateExperience(id: number, data: any) {
    return apiFetch(`/seeker/experience/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteExperience(id: number) {
    return apiFetch(`/seeker/experience/${id}`, { method: "DELETE" });
}

/* ================= SEEKER EDUCATION ROUTES ================= */

export async function addEducation(data: any) {
    return apiFetch(`/seeker/educations`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateEducation(id: number, data: any) {
    return apiFetch(`/seeker/education/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteEducation(id: number) {
    return apiFetch(`/seeker/education/${id}`, { method: "DELETE" });
}

/* ================= SEEKER CERTIFICATION ROUTES ================= */

export async function addCertification(data: any) {
    // Strip 'id' so backend treats it as a new certification
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...payload } = data;
    return apiFetch(`/seeker/certification`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deleteCertification(id: number) {
    return apiFetch(`/seeker/certification/${id}`, { method: "DELETE" });
}

/* ================= SEEKER APPLICATIONS ROUTES ================= */

export async function getMyApplications() {
    return apiFetch(`/seeker/applications`, { method: "GET" });
}

export async function getApplicationById(id: number) {
    return apiFetch(`/seeker/application/${id}`, { method: "GET" });
}

/* ================= SAVED JOBS ROUTES ================= */

export async function getSavedJobs() {
    return apiFetch(`/saved-jobs/saved`, { method: "GET" });
}

export async function saveJob(jobId: number) {
    return apiFetch(`/saved-jobs/save?jobId=${jobId}`, { method: "POST" });
}

export async function unsaveJob(jobId: number) {
    return apiFetch(`/saved-jobs/unsave?jobId=${jobId}`, { method: "DELETE" });
}