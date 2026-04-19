import { apiFetch } from "./authService";

/*
 * seekerService.ts
 * -----------------------------------------------------------------
 * Contains seeker-SPECIFIC mutations not covered by profileService.
 * profileService.ts handles READ operations (getSeekerProfile, etc.)
 * to avoid duplication.
 * -----------------------------------------------------------------
 */

/* ================= TYPES ================= */

export interface PersonalDetailDTO {
    phone: string
    gender: string
    dob: string
    marriageStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
    currentLocation: string
}

export interface ProfessionalDetailsDTO {
    bio?: string
    linkedinProfile?: string
    githubProfile?: string
    portfolioUrl?: string
    expectedSalary?: number
    noticePeriod?: string
    languages?: string[]
    preferredLocations?: string[]
    skills?: { id?: number; name: string }[]
}

export interface ExperienceDTO {
    jobTitle: string
    companyName: string
    startDate: string
    endDate?: string
    description?: string
}

export interface EducationDTO {
    degree: string
    fieldOfStudy: string
    collegeName: string
    startYear: number
    endYear?: number
    country?: string
    gradeType: string
    gradeValue: string
}

export interface CertificationDTO {
    name?: string
    issuingOrganization?: string
    issueDate?: string
    expiryDate?: string
    credentialUrl?: string
}

export interface AddSkillDTO {
    skillName: string
}

/* ================= JOB ACTIONS ================= */

/** POST /api/v1/seeker/job/{jobId}/apply */
export async function applyForJob(jobId: number) {
    return apiFetch(`/seeker/job/${jobId}/apply`, { method: "POST" });
}

/* ================= PERSONAL DETAILS ================= */

/** PATCH /api/v1/seeker/update/personal-details */
export async function updatePersonalDetails(data: PersonalDetailDTO) {
    return apiFetch(`/seeker/update/personal-details`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

/** GET /api/v1/seeker/personal-details */
export async function getPersonalDetails() {
    return apiFetch(`/seeker/personal-details`, { method: "GET" });
}

/** PATCH /api/v1/seeker/update-professional */
export async function updateProfessionalDetails(data: ProfessionalDetailsDTO) {
    return apiFetch(`/seeker/update-professional`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

/** GET /api/v1/seeker/professional */
export async function getProfessionalDetails() {
    return apiFetch(`/seeker/professional`, { method: "GET" });
}

/* ================= SKILLS ================= */

/** POST /api/v1/seeker/skill */
export async function addSkills(skills: AddSkillDTO[]) {
    return apiFetch(`/seeker/skill`, {
        method: "POST",
        body: JSON.stringify(skills),
    });
}

/** DELETE /api/v1/seeker/skill/{skillId} */
export async function removeSkill(skillId: number) {
    return apiFetch(`/seeker/skill/${skillId}`, { method: "DELETE" });
}

/* ================= EXPERIENCE ================= */

/** GET /api/v1/seeker/experience */
export async function getExperiences() {
    return apiFetch(`/seeker/experience`, { method: "GET" });
}

/** POST /api/v1/seeker/experience */
export async function addExperience(data: ExperienceDTO) {
    return apiFetch(`/seeker/experience`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** PUT /api/v1/seeker/experience/{experienceId} */
export async function updateExperience(experienceId: number, data: ExperienceDTO) {
    return apiFetch(`/seeker/experience/${experienceId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/** DELETE /api/v1/seeker/experience/{experienceId} */
export async function deleteExperience(experienceId: number) {
    return apiFetch(`/seeker/experience/${experienceId}`, { method: "DELETE" });
}

/* ================= EDUCATION ================= */

/** GET /api/v1/seeker/education */
export async function getEducations() {
    return apiFetch(`/seeker/education`, { method: "GET" });
}

/** POST /api/v1/seeker/educations */
export async function addEducation(data: EducationDTO) {
    return apiFetch(`/seeker/educations`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** PUT /api/v1/seeker/education/{educationId} */
export async function updateEducation(educationId: number, data: EducationDTO) {
    return apiFetch(`/seeker/education/${educationId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/** DELETE /api/v1/seeker/education/{educationId} */
export async function deleteEducation(educationId: number) {
    return apiFetch(`/seeker/education/${educationId}`, { method: "DELETE" });
}

/* ================= CERTIFICATIONS ================= */

/** GET /api/v1/seeker/certification */
export async function getCertifications() {
    return apiFetch(`/seeker/certification`, { method: "GET" });
}

/** POST /api/v1/seeker/certification */
export async function addCertification(data: CertificationDTO) {
    return apiFetch(`/seeker/certification`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** DELETE /api/v1/seeker/certification/{certificationId} */
export async function deleteCertification(certificationId: number) {
    return apiFetch(`/seeker/certification/${certificationId}`, { method: "DELETE" });
}

/* ================= DOCUMENTS ================= */

/** POST /api/v1/seeker/upload-documents (multipart/form-data)
 *  NOTE: Do NOT set Content-Type here — browser will auto-set with multipart boundary.
 */
export async function uploadDocuments(formData: FormData) {
    return apiFetch(`/seeker/upload-documents`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "__MULTIPART__" }, // Signal to apiFetch to skip JSON header
    });
}