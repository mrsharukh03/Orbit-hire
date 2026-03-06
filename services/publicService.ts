import { apiFetch } from "./authService";
import type { SearchBarFilters } from "@/components/ui/SearchBar";

/* ─── Types (matching OpenAPI JobSearchFilterDTO) ──────────────────────────── */
export type JobSearchFilterDTO = SearchBarFilters & {
    status?: 'OPEN' | 'CLOSED' | 'EXPIRED' | 'DELETED'
    featured?: boolean
}

/* ─── Public Endpoints ───────────────────────────────────────────────────────── */

export async function getPopularJobs(page = 0, size = 10) {
    return apiFetch(`/public/popular-jobs?page=${page}&size=${size}`, {
        method: "GET",
    });
}

/** POST /api/v1/public/search  — body is JobSearchFilterDTO */
export async function searchJobs(filters: JobSearchFilterDTO) {
    // Strip undefined values so JSON.stringify doesn't send null fields
    const clean = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    return apiFetch(`/public/search`, {
        method: "POST",
        body: JSON.stringify(clean),
    });
}

/** GET /api/v1/public/job/:id */
export async function getJobById(id: number) {
    return apiFetch(`/public/job/${id}`, {
        method: "GET",
    });
}

/** GET /api/v1/public/jobs/:category */
export async function getJobsByCategory(category: string) {
    return apiFetch(`/public/jobs/${encodeURIComponent(category)}`, {
        method: "GET",
    });
}