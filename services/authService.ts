const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-YOUR-LINK-HERE/pub?output=csv";
const DEV_URL = "http://192.168.1.13:8080/api/v1";

// Deploy karne se pehle isko 'false' kar dena
const USE_LOCAL_SERVER = true;

let cachedApiBaseUrl: string | null = null;

async function getApiBaseUrl(forceRefresh = false): Promise<string> {
    if (USE_LOCAL_SERVER) {
        return DEV_URL;
    }

    if (!forceRefresh && cachedApiBaseUrl) {
        return cachedApiBaseUrl;
    }

    try {
        const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error("Failed to fetch sheet");

        const rawText = await response.text();
        const cleanUrl = rawText.trim();

        if (!cleanUrl.startsWith("http")) {
            throw new Error("Invalid URL");
        }

        cachedApiBaseUrl = `${cleanUrl}/api/v1`;
        return cachedApiBaseUrl;
    } catch (error) {
        return cachedApiBaseUrl || DEV_URL;
    }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    const baseUrl = await getApiBaseUrl();

    const config: RequestInit = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        credentials: "include",
    };

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, config);

        if (response.status === 204) return null;

        const data = await response.json().catch(() => ({}));

        // 🟢 ADVANCED ERROR HANDLING LOGIC ADDED HERE
        if (!response.ok) {
            let errorMessage = `Error: ${response.status}`;

            if (data) {
                // 1. Agar backend ne Custom ErrorResponse bheja hai { message: "..." }
                if (data.message && typeof data.message === 'string') {
                    errorMessage = data.message;
                }
                // 2. Agar backend ne @Valid Map bheja hai { email: "Invalid", password: "Too short" }
                else if (typeof data === 'object' && !Array.isArray(data)) {
                    // Object ke saare values nikal lo aur pehla error dikha do
                    const values = Object.values(data);
                    if (values.length > 0 && typeof values[0] === 'string') {
                        errorMessage = values[0] as string;
                    }
                }
                // 3. Fallback for raw string errors
                else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }

            throw new Error(errorMessage);
        }

        return data;
    } catch (error: any) {
        if (!isRetry && (error.message.includes("Failed to fetch") || error.name === "TypeError")) {
            await getApiBaseUrl(true);
            return apiFetch(endpoint, options, true);
        }

        if (isRetry && (error.message.includes("Failed to fetch") || error.name === "TypeError")) {
            throw new Error("Server is currently offline or starting up. Please try again in a few minutes.");
        }

        // Ye line ensure karegi ki jo message upar parse hua, wahi UI me dikhe
        throw new Error(error.message || "Network error occurred");
    }
}

/* ================= AUTH ROUTES ================= */

export async function signupUser(data: { fullName: string; email: string; password: string }) {
    return apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function loginUser(data: { email: string; password: string }) {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function logoutUser() {
    return apiFetch("/auth/logout", { method: "POST" }).catch(() => null);
}

export async function verifyEmail(token: string) {
    return apiFetch("/auth/email/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
    });
}

export async function forgetPassword(email: string) {
    return apiFetch("/auth/password/forget", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export async function resetPassword(token: string, password: string) {
    return apiFetch("/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
    });
}

export async function changePassword(currentPassword: string, password: string) {
    return apiFetch("/user/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword, password }),
    });
}

export async function refreshToken() {
    return apiFetch("/auth/refresh", { method: "POST" });
}

export const checkAuth = async () => {
    try {
        return await apiFetch("/user/me", { method: "GET" });
    } catch (err) {
        return null;
    }
};

export async function getUserProfileStatus() {
    return apiFetch("/user/profileStatusAndRole", { method: "GET" });
}

export async function getUserAlerts() {
    return apiFetch("/user/alerts", { method: "GET" });
}

export async function getUserProfileUrl() {
    return apiFetch("/user/profileUrl", { method: "GET" });
}

export async function assignUserRole(role: 'USER' | 'SEEKER' | 'RECRUITER' | 'ADMIN' | 'SUPER_ADMIN') {
    return apiFetch(`/user/assign-role?role=${role}`, { method: "POST" });
}