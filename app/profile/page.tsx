// src/app/profile/page.tsx
'use client'

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FiLoader, FiUser, FiBriefcase } from "react-icons/fi"
import SeekerProfile from "@/components/ui/SeekerProfile"
import RecruiterProfile from "@/components/ui/RecruiterProfile"
import { assignUserRole } from "@/services/authService"

export default function ProfilePage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <FiLoader className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        )
    }

    const roles = Array.isArray(user.role) ? user.role : [user.role]
    const isSeeker = roles.includes("SEEKER")
    const isRecruiter = roles.includes("RECRUITER")

    // Agar user ke paas dono me se koi role nahi hai, matlab wo fresh USER hai
    const isJustUser = !isSeeker && !isRecruiter

    const handleRoleSelect = async (selectedRole: 'USER' | 'SEEKER' | 'RECRUITER' | 'ADMIN' | 'SUPER_ADMIN') => {
        setAssigning(true)
        try {
            await assignUserRole(selectedRole)
            // Hard reload taaki naya JWT token aur role update ho jaye
            window.location.reload()
        } catch (error: any) {
            alert(error.message || "Failed to assign role")
            setAssigning(false)
        }
    }

    // 🟢 ROLE SELECTION UI
    if (isJustUser) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-28 pb-12 flex flex-col items-center justify-center px-4">
                <div className="max-w-2xl w-full text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">Welcome to OrbitHire!</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg">To get started, please tell us how you want to use the platform.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
                    {/* Seeker Card */}
                    <button
                        disabled={assigning}
                        onClick={() => handleRoleSelect("SEEKER")}
                        className="group relative bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 p-8 rounded-3xl text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <FiUser />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">I'm looking for a job</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">Create your profile, upload resume, and apply to top tech companies.</p>
                    </button>

                    {/* Recruiter Card */}
                    <button
                        disabled={assigning}
                        onClick={() => handleRoleSelect("RECRUITER")}
                        className="group relative bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-purple-500 p-8 rounded-3xl text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <FiBriefcase />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">I'm hiring talent</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">Post jobs, review AI-matched candidates, and manage your hiring pipeline.</p>
                    </button>
                </div>
                {assigning && <p className="mt-8 text-blue-500 font-medium animate-pulse">Setting up your workspace...</p>}
            </div>
        )
    }

    // 🟢 MAIN PROFILE UI
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-28 pb-12">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">My Profile</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your {isRecruiter ? 'company & hiring' : 'personal & professional'} details.</p>
                </div>

                {isRecruiter ? <RecruiterProfile /> : <SeekerProfile />}
            </div>
        </div>
    )
}