// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = "http://localhost:8080/api/v1";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    if (!res.ok) {
        if (res.status === 401) {
            window.location.href = "/login";
        }
        throw new Error(`API Error: ${res.status}`);
    }

    return res.json();
}