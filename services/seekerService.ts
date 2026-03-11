import { apiFetch } from "./authService";

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

/** GET /api/v1/seeker/applications */
export async function getSeekerApplications() {
    return apiFetch(`/seeker/applications`, { method: "GET" });
}

/** GET /api/v1/seeker/application/{id} */
export async function getSeekerApplication(id: number) {
    return apiFetch(`/seeker/application/${id}`, { method: "GET" });
}

/* ================= PROFILE ================= */

/** GET /api/v1/seeker/current-profile */
export async function getSeekerProfile() {
    return apiFetch(`/seeker/current-profile`, { method: "GET" });
}

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

/** POST /api/v1/seeker/upload-documents (multipart/form-data) */
export async function uploadDocuments(formData: FormData) {
    return apiFetch(`/seeker/upload-documents`, {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
    });
}

/* ================= SAVED JOBS ================= */

/** POST /api/v1/saved-jobs/save */
export async function saveJob(jobId: number) {
    return apiFetch(`/saved-jobs/save?jobId=${jobId}`, { method: "POST" });
}

/** DELETE /api/v1/saved-jobs/unsave */
export async function unsaveJob(jobId: number) {
    return apiFetch(`/saved-jobs/unsave?jobId=${jobId}`, { method: "DELETE" });
}

/** GET /api/v1/saved-jobs/saved */
export async function getSavedJobs() {
    return apiFetch(`/saved-jobs/saved`, { method: "GET" });
}

export async function getMyApplications() {
    return apiFetch(`/seeker/applications`, { method: "GET" });
}

export async function getApplicationById(id: number) {
    return apiFetch(`/seeker/application/${id}`, { method: "GET" });
}