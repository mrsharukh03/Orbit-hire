'use client'

import { useAuth } from "@/context/AuthContext"
import { FiLoader } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SeekerApplications from "@/components/applications/seekerApplications"
import RecruiterApplications from "@/components/applications/RecruiterApplications"

export default function ApplicationsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Agar guest user /applications access karne ki koshish kare, toh login pe bhejo
        if (!loading && !user) {
            router.push('/login?redirect=/applications')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20 bg-zinc-50 dark:bg-zinc-950">
                <FiLoader className="text-blue-500 animate-spin text-4xl" />
            </div>
        )
    }

    const roles = Array.isArray(user.role) ? user.role : [user.role]

    // Recruiter View
    if (roles.includes("RECRUITER")) {
        return <RecruiterApplications />
    }

    // Seeker View (Default fallback for logged-in users)
    return <SeekerApplications />
}