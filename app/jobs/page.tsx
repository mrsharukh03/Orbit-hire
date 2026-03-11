'use client'

import { useAuth } from "@/context/AuthContext"
import { FiLoader } from "react-icons/fi"
import PublicJobBoard from "@/components/Jobs/PublicJobBoard"
import SeekerJobBoard from "@/components/Jobs/SeekerJobBoard"
import RecruiterJobBoard from "@/components/Jobs/RecruiterJobBoard"

export default function JobsPage() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <FiLoader className="text-blue-500 animate-spin text-4xl" />
            </div>
        )
    }

    // Guest User
    if (!user) {
        return <PublicJobBoard />
    }

    const roles = Array.isArray(user.role) ? user.role : [user.role]

    // Recruiter View
    if (roles.includes("RECRUITER")) {
        return <RecruiterJobBoard />
    }

    // Seeker View
    if (roles.includes("SEEKER")) {
        return <SeekerJobBoard />
    }

    // Default fallback agar role assign nahi hua hai
    return <PublicJobBoard />
}