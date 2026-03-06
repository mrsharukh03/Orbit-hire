import { apiFetch } from "../lib/api";

// Assign role API
export async function assignRole(role: string) {
    return apiFetch(`/user/assign-role?role=${role}`, {
        method: "POST"
    });
}

// Get profile status and role
export async function getProfileStatusAndRole() {
    return apiFetch("/user/profileStatusAndRole");
}