'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getMyApplications, getApplicationById } from '@/services/seekerService'
import Link from 'next/link'
import {
    FiBriefcase, FiClock, FiCheckCircle, FiXCircle,
    FiAlertCircle, FiLoader, FiX, FiExternalLink, FiCalendar,
    FiFileText, FiMapPin, FiChevronRight, FiArrowLeft,
    FiSearch, FiRefreshCw, FiZap, FiStar, FiUser,
    FiMessageSquare,
} from 'react-icons/fi'
import { BsBuilding, BsRobot, BsStars } from 'react-icons/bs'

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'REJECTED'

interface ApplicationListItem {
    applicationId: number
    jobTitle: string
    companyName: string
    status: AppStatus
    appliedAt: string
    aiMatchScore?: number
}

interface ApplicationDetail {
    applicationId: number
    jobTitle: string
    companyName: string
    location?: string
    jobType?: string
    lastDateToApply?: string
    status: AppStatus
    appliedAt: string
    lastUpdatedAt?: string
    resumeUrl?: string
    coverLetter?: string
    aiSummary?: string
    aiMatchScore?: number
    interviewDate?: string
    interviewFeedback?: string
    rejectionReason?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<AppStatus, {
    label: string; color: string; bg: string; border: string
    icon: React.ReactNode; dot: string; glow: string
}> = {
    PENDING: {
        label: 'Pending', dot: 'bg-amber-400',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/20',
        icon: <FiClock />,
        glow: 'shadow-amber-500/20',
    },
    SHORTLISTED: {
        label: 'Shortlisted', dot: 'bg-blue-500',
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/20',
        icon: <FiStar />,
        glow: 'shadow-blue-500/20',
    },
    INTERVIEW_SCHEDULED: {
        label: 'Interview', dot: 'bg-violet-500',
        color: 'text-violet-700 dark:text-violet-300',
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        border: 'border-violet-200 dark:border-violet-500/20',
        icon: <FiCalendar />,
        glow: 'shadow-violet-500/20',
    },
    SELECTED: {
        label: 'Selected 🎉', dot: 'bg-emerald-500',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/20',
        icon: <FiCheckCircle />,
        glow: 'shadow-emerald-500/20',
    },
    REJECTED: {
        label: 'Rejected', dot: 'bg-red-500',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-500/10',
        border: 'border-red-200 dark:border-red-500/20',
        icon: <FiXCircle />,
        glow: 'shadow-red-500/20',
    },
}

const ALL_STATUSES: (AppStatus | 'ALL')[] = [
    'ALL', 'PENDING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

function formatDateTime(dateStr?: string) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
}

function timeAgo(dateStr?: string) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return formatDate(dateStr)
}

function ScoreRing({ score }: { score: number }) {
    const r = 20, c = 2 * Math.PI * r
    const fill = (score / 100) * c
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'
    return (
        <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56">
                <circle cx="28" cy="28" r={r} fill="none"
                    stroke="currentColor" strokeWidth="4"
                    className="text-zinc-200 dark:text-zinc-700" />
                <circle cx="28" cy="28" r={r} fill="none"
                    stroke={color} strokeWidth="4"
                    strokeDasharray={`${fill} ${c - fill}`}
                    strokeLinecap="round" />
            </svg>
            <span className="text-xs font-black" style={{ color }}>{score}%</span>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SeekerApplications() {
    const [applications, setApplications] = useState<ApplicationListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeFilter, setActiveFilter] = useState<AppStatus | 'ALL'>('ALL')
    const [searchQ, setSearchQ] = useState('')
    const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const detailRef = useRef<HTMLDivElement>(null)

    // ── Fetch list ─────────────────────────────────────────────────────────────
    const fetchApplications = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data: any = await getMyApplications()
            setApplications(data || [])
        } catch (err: any) {
            setError(err?.message || 'Failed to load applications')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchApplications() }, [fetchApplications])

    // ── Select + Fetch Detail ──────────────────────────────────────────────────
    const handleSelect = async (app: ApplicationListItem) => {
        // Optimistic: show list data immediately
        setSelectedApp({
            applicationId: app.applicationId,
            jobTitle: app.jobTitle,
            companyName: app.companyName,
            status: app.status,
            appliedAt: app.appliedAt,
            aiMatchScore: app.aiMatchScore,
        })
        setDetailLoading(true)
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        try {
            const full: ApplicationDetail = await getApplicationById(app.applicationId)
            if (full) setSelectedApp(full)
        } catch { /* keep optimistic data */ }
        finally { setDetailLoading(false) }
    }

    // ── Derived ────────────────────────────────────────────────────────────────
    const filtered = applications.filter(a => {
        const matchesStatus = activeFilter === 'ALL' || a.status === activeFilter
        const matchesSearch = !searchQ.trim() ||
            a.jobTitle.toLowerCase().includes(searchQ.toLowerCase()) ||
            a.companyName.toLowerCase().includes(searchQ.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const statusCounts = applications.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const stats = {
        total: applications.length,
        shortlisted: statusCounts['SHORTLISTED'] || 0,
        interviews: statusCounts['INTERVIEW_SCHEDULED'] || 0,
        selected: statusCounts['SELECTED'] || 0,
        rejected: statusCounts['REJECTED'] || 0,
    }

    const avgScore = applications.length > 0 && applications.some(a => a.aiMatchScore)
        ? Math.round(applications.reduce((s, a) => s + (a.aiMatchScore || 0), 0) / applications.filter(a => a.aiMatchScore).length)
        : null

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
            {/* Ambient BG */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]
                bg-gradient-to-r from-blue-500/8 via-violet-500/8 to-emerald-500/8
                rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[1300px]">

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard"
                                className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
                                <FiArrowLeft size={12} /> Dashboard
                            </Link>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            My <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Applications</span>
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                            Track the status of all your job applications in one place
                        </p>
                    </div>
                    <button onClick={fetchApplications}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 transition-all self-start md:self-auto">
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* ── Error ──────────────────────────────────────────────── */}
                {error && (
                    <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        <FiAlertCircle className="shrink-0" /> {error}
                        <button onClick={fetchApplications} className="ml-auto underline hover:no-underline">Retry</button>
                    </div>
                )}

                {/* ── Stats Cards ─────────────────────────────────────────── */}
                {!loading && applications.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                        {[
                            { label: 'Total Applied', value: stats.total, icon: <FiBriefcase />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                            { label: 'Shortlisted', value: stats.shortlisted, icon: <FiStar />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                            { label: 'Interviews', value: stats.interviews, icon: <FiCalendar />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                            { label: 'Selected', value: stats.selected, icon: <FiCheckCircle />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                            { label: 'Avg AI Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: <BsStars />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                                <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-base mb-3`}>
                                    {stat.icon}
                                </div>
                                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Two-Column Layout ────────────────────────────────────── */}
                <div className="flex gap-5 items-start">

                    {/* ── LEFT: List ──────────────────────────────────────── */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">

                        {/* Search + Filter Bar */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 mb-4 space-y-3 shadow-sm">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 transition-all">
                                <FiSearch className="text-zinc-400 shrink-0" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search by job or company..."
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                                />
                                {searchQ && (
                                    <button onClick={() => setSearchQ('')} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Status tabs — scrollable on mobile */}
                            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                                {ALL_STATUSES.map(s => {
                                    const count = s === 'ALL' ? applications.length : (statusCounts[s] || 0)
                                    const meta = s !== 'ALL' ? STATUS_META[s as AppStatus] : null
                                    const isActive = activeFilter === s
                                    return (
                                        <button key={s} onClick={() => setActiveFilter(s as AppStatus | 'ALL')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all
                                                ${isActive
                                                    ? s === 'ALL'
                                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                                                        : `${meta?.bg} ${meta?.color} ${meta?.border}`
                                                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                                }`}>
                                            {meta && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? meta.dot : 'bg-zinc-300 dark:bg-zinc-600'}`} />}
                                            {s === 'ALL' ? 'All' : STATUS_META[s as AppStatus].label}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black
                                                ${isActive
                                                    ? s === 'ALL' ? 'bg-white/20' : 'bg-black/10'
                                                    : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Application Cards */}
                        <div className="space-y-3">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => <AppCardSkeleton key={i} />)
                                : filtered.length === 0
                                    ? <EmptyState
                                        hasApplications={applications.length > 0}
                                        filter={activeFilter}
                                        search={searchQ}
                                        onReset={() => { setActiveFilter('ALL'); setSearchQ('') }}
                                    />
                                    : filtered.map(app => (
                                        <ApplicationCard
                                            key={app.applicationId}
                                            app={app}
                                            selected={selectedApp?.applicationId === app.applicationId}
                                            onClick={() => handleSelect(app)}
                                        />
                                    ))
                            }
                        </div>
                    </div>

                    {/* ── RIGHT: Detail Panel (Desktop) ───────────────────── */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl" ref={detailRef}>
                        {selectedApp
                            ? <DetailPanel app={selectedApp} loading={detailLoading} />
                            : <DetailPlaceholder />
                        }
                    </div>
                </div>
            </div>

            {/* ── Mobile Bottom Sheet ──────────────────────────────────────── */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[92vh] overflow-y-auto" ref={detailRef}>
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1 mr-3 mt-1">{selectedApp.jobTitle}</h3>
                            <button onClick={() => setSelectedApp(null)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <FiX size={15} />
                            </button>
                        </div>
                        <div className="p-4">
                            <DetailPanel app={selectedApp} loading={detailLoading} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Application Card ─────────────────────────────────────────────────────────
function ApplicationCard({ app, selected, onClick }: {
    app: ApplicationListItem; selected: boolean; onClick: () => void
}) {
    const meta = STATUS_META[app.status]
    return (
        <div onClick={onClick}
            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                ${selected
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/5 shadow-md shadow-blue-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-900/5'
                }`}>

            {/* Selected left bar */}
            {selected && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full" />}

            <div className="flex items-start gap-3">
                {/* Company Avatar */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700 overflow-hidden">
                    <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(app.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                        alt={app.companyName}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm leading-snug truncate mb-0.5 transition-colors
                        ${selected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                        {app.jobTitle}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">{app.companyName}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.bg} ${meta.color} ${meta.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                        </span>

                        {/* AI Score */}
                        {app.aiMatchScore != null && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <BsStars size={11} /> {app.aiMatchScore}% match
                            </span>
                        )}
                    </div>
                </div>

                <FiChevronRight className="text-zinc-300 dark:text-zinc-600 shrink-0 group-hover:text-blue-400 transition-colors mt-1" size={16} />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <FiClock size={11} className="text-zinc-400" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    Applied {timeAgo(app.appliedAt)}
                </span>
            </div>
        </div>
    )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ app, loading }: { app: ApplicationDetail; loading: boolean }) {
    const meta = STATUS_META[app.status]

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

            {/* Header gradient */}
            <div className="relative p-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5" />
                <div className="relative">
                    <div className="flex items-start gap-4">
                        {/* Logo */}
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md overflow-hidden shrink-0">
                            <img
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(app.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                                alt={app.companyName} className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-1">{app.jobTitle}</h2>
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{app.companyName}</p>
                            <div className="flex flex-wrap gap-2">
                                {app.location && (
                                    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        <FiMapPin size={11} /> {app.location}
                                    </span>
                                )}
                                {app.jobType && (
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        {app.jobType.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Current status banner */}
                    <div className={`mt-4 flex items-center gap-3 p-3.5 rounded-2xl border ${meta.bg} ${meta.border}`}>
                        <span className={`text-xl ${meta.color}`}>{meta.icon}</span>
                        <div>
                            <p className={`font-bold text-sm ${meta.color}`}>{meta.label}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                {app.status === 'SELECTED'
                                    ? 'Congratulations! You have been selected for this role.'
                                    : app.status === 'REJECTED'
                                        ? 'Unfortunately, your application was not moved forward this time.'
                                        : app.status === 'INTERVIEW_SCHEDULED'
                                            ? app.interviewDate ? `Interview on ${formatDate(app.interviewDate)}` : 'Interview has been scheduled'
                                            : app.status === 'SHORTLISTED'
                                                ? 'You have been shortlisted — prepare for the next round!'
                                                : 'Your application is under review'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Info Row */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                {[
                    { label: 'Applied', value: formatDate(app.appliedAt), icon: <FiCalendar /> },
                    { label: 'Last Update', value: app.lastUpdatedAt ? formatDate(app.lastUpdatedAt) : '—', icon: <FiClock /> },
                    { label: 'Deadline', value: app.lastDateToApply ? formatDate(app.lastDateToApply) : 'Open', icon: <FiFileText /> },
                ].map(item => (
                    <div key={item.label} className="flex flex-col items-center py-4 px-2 text-center">
                        <span className="text-blue-500 mb-1 text-sm">{item.icon}</span>
                        <p className="text-xs text-zinc-400 font-medium mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" style={{ width: `${70 + i * 10}%` }} />
                        ))}
                    </div>
                )}

                {/* AI Match Score */}
                {app.aiMatchScore != null && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-500/5 dark:to-blue-500/5 border border-emerald-100 dark:border-emerald-500/10">
                        <ScoreRing score={app.aiMatchScore} />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <BsRobot className="text-blue-500" />
                                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">AI Match Score</p>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                {app.aiMatchScore >= 80 ? 'Excellent match! Your profile strongly aligns.' :
                                    app.aiMatchScore >= 60 ? 'Good match. You have strong relevant skills.' :
                                        'Moderate match. Consider strengthening your profile.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* AI Summary */}
                {app.aiSummary && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            <BsStars className="text-violet-500" /> AI Application Summary
                        </h4>
                        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                            {app.aiSummary}
                        </div>
                    </div>
                )}

                {/* Interview Date */}
                {app.interviewDate && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0">
                            <FiCalendar />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-0.5">Interview Scheduled</p>
                            <p className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">{formatDate(app.interviewDate)}</p>
                        </div>
                    </div>
                )}

                {/* Interview Feedback */}
                {app.interviewFeedback && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            <FiMessageSquare className="text-blue-500" /> Recruiter Feedback
                        </h4>
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                            "{app.interviewFeedback}"
                        </div>
                    </div>
                )}

                {/* Rejection Reason */}
                {app.status === 'REJECTED' && app.rejectionReason && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            <FiXCircle className="text-red-500" /> Reason
                        </h4>
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {app.rejectionReason}
                        </div>
                    </div>
                )}

                {/* Cover Letter */}
                {app.coverLetter && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            <FiFileText className="text-zinc-400" /> Cover Letter Submitted
                        </h4>
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-h-40 overflow-y-auto">
                            {app.coverLetter}
                        </div>
                    </div>
                )}

                {/* Resume */}
                {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all group">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                            <FiFileText />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">View Submitted Resume</p>
                            <p className="text-xs text-zinc-400 truncate">{app.resumeUrl}</p>
                        </div>
                        <FiExternalLink className="text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" size={15} />
                    </a>
                )}

                {/* Applied At Full */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        Applied on {formatDateTime(app.appliedAt)}
                        {app.lastUpdatedAt && ` · Last updated ${timeAgo(app.lastUpdatedAt)}`}
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
                <Link href="/jobs"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-white text-sm
                        bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
                        shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <FiZap /> Explore More Jobs
                </Link>
            </div>
        </div>
    )
}

// ─── Detail Placeholder ───────────────────────────────────────────────────────
function DetailPlaceholder() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center py-24 px-8 text-center shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/10">
                <BsBuilding className="text-4xl text-blue-300 dark:text-blue-500/50" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Select an Application</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium max-w-xs">
                Click any application from the list to view its full details, AI insights, and recruiter feedback.
            </p>
        </div>
    )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ hasApplications, filter, search, onReset }: {
    hasApplications: boolean; filter: string; search: string; onReset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                {hasApplications
                    ? <FiSearch className="text-4xl text-zinc-300 dark:text-zinc-600" />
                    : <FiBriefcase className="text-4xl text-zinc-300 dark:text-zinc-600" />
                }
            </div>
            {hasApplications ? (
                <>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No results</h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mb-5">
                        {search ? `No applications matching "${search}"` : `No ${STATUS_META[filter as AppStatus]?.label || ''} applications yet`}
                    </p>
                    <button onClick={onReset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 transition-all active:scale-95">
                        <FiRefreshCw size={14} /> Clear Filter
                    </button>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No Applications Yet</h3>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mb-5">
                        You haven't applied to any jobs yet. Start exploring and apply to your dream role!
                    </p>
                    <Link href="/jobs"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                        <FiZap /> Browse Jobs
                    </Link>
                </>
            )}
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AppCardSkeleton() {
    return (
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                    <div className="flex gap-2">
                        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-20" />
                        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
                    </div>
                </div>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-3" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/3" />
        </div>
    )
}