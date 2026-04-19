'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    FiBriefcase, FiUsers, FiCheckCircle, FiClock,
    FiTrendingUp, FiPlus, FiArrowRight, FiLoader,
    FiXCircle, FiCalendar, FiEye, FiTarget, FiBarChart2,
    FiAward, FiAlertCircle,
} from 'react-icons/fi'
import { BsBuilding, BsStars, BsPersonBadge } from 'react-icons/bs'
import { getRecruiterDashboard, getPostedJobs } from '@/services/recruiterService'
import { getMyApplications, getSeekerProfile } from '@/services/profileService'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/ui/StatusBadge'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecruiterDashboard {
    totalJobs: number; activeJobs: number; closedJobs: number; expiredJobs: number
    deletedJobs: number; totalApplications: number; pendingApplications: number
    shortlisted: number; interviewScheduled: number; selected: number; rejected: number
    selectionRate: number; interviewRate: number; rejectionRate: number
    totalViews: number; avgApplicationsPerJob: number; avgAiMatchScore: number; totalHires: number
}

interface SeekerApplication {
    applicationId: number; jobTitle: string; companyName: string
    status: 'PENDING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'REJECTED'
    appliedAt: string; aiMatchScore: number
}

interface PostedJob {
    id: number; title: string; status: string; companyName: string
    lastDateToApply?: string; active?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
    PENDING: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    SHORTLISTED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    INTERVIEW_SCHEDULED: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    SELECTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    REJECTED: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending', SHORTLISTED: 'Shortlisted',
    INTERVIEW_SCHEDULED: 'Interview Scheduled', SELECTED: 'Selected', REJECTED: 'Rejected',
}

function fmt(n?: number) {
    if (!n && n !== 0) return '—'
    return n.toLocaleString()
}

function pct(n?: number) {
    if (!n && n !== 0) return '—'
    return `${(n * 100).toFixed(1)}%`
}

function timeAgo(dateStr?: string) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return `${Math.floor(days / 7)}w ago`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'blue', trend }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string
    color?: 'blue' | 'violet' | 'emerald' | 'amber' | 'red' | 'zinc'; trend?: string
}) {
    const COLORS = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
        zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    }
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${COLORS[color]}`}>
                    {icon}
                </div>
                {trend && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>}
            </div>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-0.5">{value}</p>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
            {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
        </div>
    )
}

// ─── Recruiter Dashboard ──────────────────────────────────────────────────────
function RecruiterDashboardView() {
    const [data, setData] = useState<RecruiterDashboard | null>(null)
    const [jobs, setJobs] = useState<PostedJob[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([getRecruiterDashboard(), getPostedJobs(0, 5)])
            .then(([dash, jobsRes]) => {
                setData(dash)
                setJobs(jobsRes?.content || jobsRes || [])
            })
            .catch(e => setError(e.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <FiLoader className="text-blue-500 animate-spin text-4xl" />
        </div>
    )
    if (error) return (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
            <FiAlertCircle /> {error}
        </div>
    )

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link href="/post-job"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <FiPlus /> Post a Job
                </Link>
                <Link href="/applications"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 transition-all">
                    <FiUsers /> View Applications
                </Link>
            </div>

            {/* Primary Stats */}
            <section>
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Job Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<FiBriefcase />} label="Total Jobs" value={fmt(data?.totalJobs)} color="blue" />
                    <StatCard icon={<FiCheckCircle />} label="Active Jobs" value={fmt(data?.activeJobs)} color="emerald" />
                    <StatCard icon={<FiXCircle />} label="Closed Jobs" value={fmt(data?.closedJobs)} color="zinc" />
                    <StatCard icon={<FiClock />} label="Expired Jobs" value={fmt(data?.expiredJobs)} color="amber" />
                </div>
            </section>

            {/* Application Stats */}
            <section>
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Application Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<FiUsers />} label="Total Applications" value={fmt(data?.totalApplications)} color="blue" />
                    <StatCard icon={<FiClock />} label="Pending" value={fmt(data?.pendingApplications)} color="amber" />
                    <StatCard icon={<FiBarChart2 />} label="Shortlisted" value={fmt(data?.shortlisted)} color="violet" />
                    <StatCard icon={<FiCalendar />} label="Interviews" value={fmt(data?.interviewScheduled)} color="violet" />
                </div>
            </section>

            {/* Performance Metrics */}
            <section>
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<FiAward />} label="Total Hires" value={fmt(data?.totalHires)} color="emerald" />
                    <StatCard icon={<FiTarget />} label="Selection Rate" value={pct(data?.selectionRate)} color="emerald" sub="Hired / Total Apps" />
                    <StatCard icon={<FiEye />} label="Total Views" value={fmt(data?.totalViews)} color="blue" />
                    <StatCard icon={<BsStars />} label="Avg AI Match" value={data?.avgAiMatchScore ? `${data.avgAiMatchScore.toFixed(0)}%` : '—'} color="violet" sub="Across all applicants" />
                </div>
            </section>

            {/* Rate bars */}
            <section>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-5">Funnel Rates</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Interview Rate', value: data?.interviewRate || 0, color: 'bg-violet-500' },
                            { label: 'Selection Rate', value: data?.selectionRate || 0, color: 'bg-emerald-500' },
                            { label: 'Rejection Rate', value: data?.rejectionRate || 0, color: 'bg-red-400' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{pct(item.value)}</span>
                                </div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                        style={{ width: `${Math.min((item.value || 0) * 100, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Jobs */}
            {jobs.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Recent Job Posts</h2>
                        <Link href="/jobs" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">View All <FiArrowRight size={12} /></Link>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        {jobs.map((job, i) => (
                            <div key={job.id} className={`flex items-center justify-between p-4 ${i < jobs.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
                                <div>
                                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{job.title}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{job.companyName}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

// ─── Seeker Dashboard ─────────────────────────────────────────────────────────
function SeekerDashboardView() {
    const [applications, setApplications] = useState<SeekerApplication[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([getMyApplications(), getSeekerProfile()])
            .then(([apps, prof]) => {
                setApplications(Array.isArray(apps) ? apps : [])
                setProfile(prof)
            })
            .catch(e => setError(e.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <FiLoader className="text-blue-500 animate-spin text-4xl" />
        </div>
    )
    if (error) return (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-3">
            <FiAlertCircle /> {error}
        </div>
    )

    const statusCounts = applications.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const completion = profile?.profileCompletion || 0

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link href="/jobs"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <FiBriefcase /> Browse Jobs
                </Link>
                <Link href="/profile"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 transition-all">
                    <BsPersonBadge /> My Profile
                </Link>
                <Link href="/saved-jobs"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 transition-all">
                    <FiBriefcase /> Saved Jobs
                </Link>
            </div>

            {/* Profile Completion */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-extrabold text-zinc-900 dark:text-white">Profile Completion</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {completion < 100 ? 'Complete your profile to get better matches' : '🎉 Profile is 100% complete!'}
                        </p>
                    </div>
                    <span className={`text-2xl font-extrabold ${completion >= 80 ? 'text-emerald-600' : completion >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {completion}%
                    </span>
                </div>
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${completion}%` }} />
                </div>
                {completion < 100 && (
                    <Link href="/profile" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-blue-600 hover:underline">
                        Complete Profile <FiArrowRight size={11} />
                    </Link>
                )}
            </div>

            {/* Application Stats */}
            <section>
                <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Application Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<FiBriefcase />} label="Total Applied" value={fmt(applications.length)} color="blue" />
                    <StatCard icon={<FiClock />} label="Pending" value={fmt(statusCounts['PENDING'])} color="amber" />
                    <StatCard icon={<FiCalendar />} label="Interviews" value={fmt(statusCounts['INTERVIEW_SCHEDULED'])} color="violet" />
                    <StatCard icon={<FiCheckCircle />} label="Selected" value={fmt(statusCounts['SELECTED'])} color="emerald" />
                </div>
            </section>

            {/* Recent Applications */}
            {applications.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Recent Applications</h2>
                        <Link href="/applications" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            View All <FiArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        {applications.slice(0, 5).map((app, i) => (
                            <div key={app.applicationId}
                                className={`flex items-center justify-between p-4 ${i < Math.min(applications.length, 5) - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{app.jobTitle}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{app.companyName}</p>
                                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                        <span className="text-xs text-zinc-400">{timeAgo(app.appliedAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                    {app.aiMatchScore > 0 && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                                            <BsStars size={11} /> {app.aiMatchScore}%
                                        </span>
                                    )}
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${STATUS_BADGE[app.status] || ''}`}>
                                        {STATUS_LABEL[app.status] || app.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {applications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                        <FiBriefcase className="text-4xl text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No applications yet</h3>
                    <p className="text-sm text-zinc-400 max-w-xs mb-5">Start applying to your dream jobs right now!</p>
                    <Link href="/jobs"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 transition-all active:scale-95">
                        Browse Jobs <FiArrowRight size={14} />
                    </Link>
                </div>
            )}
        </div>
    )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user, loading } = useAuth()

    const isRecruiter = user?.role?.includes('RECRUITER')
    const greeting = (() => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    })()

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
            {/* Ambient */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px]
                bg-gradient-to-r from-blue-500/8 via-violet-500/8 to-emerald-500/8
                rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[1100px]">
                {/* Header */}
                <div className="pt-8 pb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{greeting} 👋</p>
                            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                {loading ? '...' : user?.fullName || 'Dashboard'}
                            </h1>
                            {!loading && (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                    {isRecruiter
                                        ? 'Manage your job postings and applications'
                                        : 'Track your applications and find your next opportunity'
                                    }
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            {isRecruiter
                                ? <><BsBuilding className="text-blue-500" /> Recruiter</>
                                : <><BsPersonBadge className="text-violet-500" /> Job Seeker</>
                            }
                        </div>
                    </div>
                </div>

                {/* Conditional Dashboard View */}
                {loading
                    ? <div className="flex items-center justify-center h-64">
                        <FiLoader className="text-blue-500 animate-spin text-4xl" />
                    </div>
                    : isRecruiter
                        ? <RecruiterDashboardView />
                        : <SeekerDashboardView />
                }
            </div>
        </div>
    )
}