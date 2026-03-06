'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSavedJobs, unsaveJob } from '@/services/profileService'
import { apiFetch } from '@/services/authService'
import Link from 'next/link'
import {
    FiBookmark, FiMapPin, FiBriefcase, FiLoader, FiAlertCircle,
    FiX, FiSearch, FiArrowLeft, FiRefreshCw, FiZap, FiClock,
    FiDollarSign, FiChevronRight, FiCheckCircle, FiExternalLink,
    FiStar, FiTrash2,
} from 'react-icons/fi'
import { BsBuilding, BsStars } from 'react-icons/bs'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavedJob {
    id: number
    title: string
    companyName: string
    companyLogoUrl?: string
    location: string
    type: string
    category?: string
    minSalary?: number
    maxSalary?: number
    experienceRequired?: string
    description?: string
    status: string
    lastDateToApply?: string
    featured?: boolean
    requiredSkills?: { id: number; name: string }[]
}

// The saved-jobs endpoint may return a paged object or a list directly.
// We handle both cases.

// ─── Helpers ──────────────────────────────────────────────────────────────────
const JOB_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    INTERNSHIP: 'Internship',
    REMOTE: 'Remote',
}
const JOB_TYPE_COLORS: Record<string, string> = {
    FULL_TIME: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    PART_TIME: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    INTERNSHIP: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    REMOTE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
}

function formatSalary(min?: number, max?: number) {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}k`
    if (min && max) return `₹${fmt(min)} – ₹${fmt(max)}`
    if (min) return `₹${fmt(min)}+`
    return `₹${fmt(max!)}`
}

function formatDate(d?: string) {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SavedJobsPage() {
    const [jobs, setJobs] = useState<SavedJob[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQ, setSearchQ] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null)
    const [unsaving, setUnsaving] = useState<number | null>(null)
    const [applying, setApplying] = useState(false)
    const [applySuccess, setApplySuccess] = useState(false)
    const [applyError, setApplyError] = useState('')
    const detailRef = useRef<HTMLDivElement>(null)

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchSaved = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const raw = await getSavedJobs()
            // Backend may return paged or array
            const list: SavedJob[] = Array.isArray(raw)
                ? raw
                : raw?.content ?? raw?.jobs ?? []
            setJobs(list)
            if (list.length > 0 && !selectedJob) setSelectedJob(list[0])
        } catch (err: any) {
            setError(err?.message || 'Failed to load saved jobs')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSaved() }, [fetchSaved])

    // ── Unsave ─────────────────────────────────────────────────────────────────
    const handleUnsave = async (jobId: number, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setUnsaving(jobId)
        try {
            await unsaveJob(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
            if (selectedJob?.id === jobId) {
                const remaining = jobs.filter(j => j.id !== jobId)
                setSelectedJob(remaining[0] ?? null)
            }
        } catch (err: any) {
            // silent — user can retry
        } finally {
            setUnsaving(null)
        }
    }

    // ── Apply ──────────────────────────────────────────────────────────────────
    const handleApply = async () => {
        if (!selectedJob) return
        setApplying(true)
        setApplyError('')
        try {
            await apiFetch(`/seeker/job/${selectedJob.id}/apply`, { method: 'POST' })
            setApplySuccess(true)
        } catch (err: any) {
            setApplyError(err?.message || 'Failed to apply. Please try again.')
        } finally {
            setApplying(false)
        }
    }

    const handleSelect = (j: SavedJob) => {
        setSelectedJob(j)
        setApplySuccess(false)
        setApplyError('')
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // ── Filters ────────────────────────────────────────────────────────────────
    const filtered = jobs.filter(j => {
        const q = searchQ.toLowerCase()
        const matchesQ = !q || j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q)
        const matchesType = !typeFilter || j.type === typeFilter
        return matchesQ && matchesType
    })

    const TYPE_OPTIONS = [...new Set(jobs.map(j => j.type).filter(Boolean))]

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
            {/* Ambient */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]
                bg-gradient-to-r from-blue-500/8 via-violet-500/8 to-emerald-500/8
                rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[1300px]">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard"
                                className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
                                <FiArrowLeft size={12} /> Dashboard
                            </Link>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Saved <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Jobs</span>
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                            {jobs.length} job{jobs.length !== 1 ? 's' : ''} bookmarked — apply when you're ready
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchSaved}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 transition-all">
                            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <Link href="/jobs"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-md shadow-blue-600/20 transition-all active:scale-95">
                            <FiSearch size={14} /> Browse More
                        </Link>
                    </div>
                </div>

                {/* ── Error ──────────────────────────────────────────────── */}
                {error && (
                    <div className="mb-5 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        <FiAlertCircle className="shrink-0" /> {error}
                        <button onClick={fetchSaved} className="ml-auto underline hover:no-underline">Retry</button>
                    </div>
                )}

                {/* ── Stat Strip ─────────────────────────────────────────── */}
                {!loading && jobs.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total Saved', value: jobs.length, icon: <FiBookmark />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                            { label: 'Remote', value: jobs.filter(j => j.type === 'REMOTE').length, icon: <FiBriefcase />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                            { label: 'Full Time', value: jobs.filter(j => j.type === 'FULL_TIME').length, icon: <FiBriefcase />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                            { label: 'Internships', value: jobs.filter(j => j.type === 'INTERNSHIP').length, icon: <FiStar />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                        ].map(s => (
                            <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                                <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-base mb-3`}>{s.icon}</div>
                                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Two-Column Layout ────────────────────────────────────── */}
                <div className="flex gap-5 items-start">

                    {/* ── LEFT List ───────────────────────────────────────── */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">

                        {/* Filter Row */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 mb-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 transition-all">
                                <FiSearch className="text-zinc-400 shrink-0" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search saved jobs..."
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                                />
                                {searchQ && <button onClick={() => setSearchQ('')} className="text-zinc-400 hover:text-zinc-600"><FiX size={13} /></button>}
                            </div>

                            {TYPE_OPTIONS.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-0.5">
                                    {['', ...TYPE_OPTIONS].map(t => (
                                        <button key={t} onClick={() => setTypeFilter(t)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border whitespace-nowrap shrink-0 transition-all
                                                ${typeFilter === t
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'}`}>
                                            {t ? JOB_TYPE_LABELS[t] || t : 'All Types'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cards */}
                        <div className="space-y-3">
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                                : filtered.length === 0
                                    ? <EmptyState hasJobs={jobs.length > 0} search={searchQ} />
                                    : filtered.map(job => (
                                        <SavedJobCard
                                            key={job.id}
                                            job={job}
                                            selected={selectedJob?.id === job.id}
                                            unsaving={unsaving === job.id}
                                            onClick={() => handleSelect(job)}
                                            onUnsave={e => handleUnsave(job.id, e)}
                                        />
                                    ))
                            }
                        </div>
                    </div>

                    {/* ── RIGHT Detail ────────────────────────────────────── */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl" ref={detailRef}>
                        {selectedJob
                            ? <DetailPanel
                                job={selectedJob}
                                applying={applying}
                                applySuccess={applySuccess}
                                applyError={applyError}
                                onApply={handleApply}
                                onUnsave={() => handleUnsave(selectedJob.id)}
                                unsaving={unsaving === selectedJob.id}
                            />
                            : <EmptyDetail />
                        }
                    </div>
                </div>
            </div>

            {/* ── Mobile Drawer ────────────────────────────────────────────── */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1 mr-3 mt-1">{selectedJob.title}</h3>
                            <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <FiX size={15} />
                            </button>
                        </div>
                        <div className="p-4">
                            <DetailPanel
                                job={selectedJob}
                                applying={applying}
                                applySuccess={applySuccess}
                                applyError={applyError}
                                onApply={handleApply}
                                onUnsave={() => handleUnsave(selectedJob.id)}
                                unsaving={unsaving === selectedJob.id}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Saved Job Card ───────────────────────────────────────────────────────────
function SavedJobCard({ job, selected, unsaving, onClick, onUnsave }: {
    job: SavedJob; selected: boolean; unsaving: boolean
    onClick: () => void; onUnsave: (e: React.MouseEvent) => void
}) {
    const salary = formatSalary(job.minSalary, job.maxSalary)
    const deadline = formatDate(job.lastDateToApply)
    const deadlinePassed = job.lastDateToApply && new Date(job.lastDateToApply) < new Date()

    return (
        <div onClick={onClick}
            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                ${selected
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/5 shadow-md shadow-blue-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md'
                }`}>

            {/* Selected bar */}
            {selected && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full" />}

            {/* Featured badge */}
            {job.featured && (
                <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                    <FiStar size={10} className="fill-current" /> Featured
                </div>
            )}

            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shrink-0 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                        alt={job.companyName} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 pr-8">
                    <h3 className={`font-bold text-sm truncate mb-0.5 transition-colors
                        ${selected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                        {job.title}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">{job.companyName}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                            <FiMapPin size={11} /> <span className="truncate max-w-[90px]">{job.location}</span>
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${JOB_TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                            {JOB_TYPE_LABELS[job.type] || job.type}
                        </span>
                        {salary && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{salary}</span>}
                    </div>
                </div>

                {/* Unsave button */}
                <button onClick={onUnsave} disabled={unsaving}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-blue-100 dark:border-blue-500/20 transition-all">
                    {unsaving ? <FiLoader size={13} className="animate-spin" /> : <FiBookmark size={13} className="fill-current" />}
                </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className={`flex items-center gap-1 text-xs font-medium ${deadlinePassed ? 'text-red-500' : 'text-zinc-400'}`}>
                    <FiClock size={11} />
                    {deadline ? `Closes ${deadline}` : 'Open'}
                    {deadlinePassed && ' (Expired)'}
                </span>
                <FiChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors" />
            </div>
        </div>
    )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ job, applying, applySuccess, applyError, onApply, onUnsave, unsaving }: {
    job: SavedJob; applying: boolean; applySuccess: boolean; applyError: string
    onApply: () => void; onUnsave: () => void; unsaving: boolean
}) {
    const salary = formatSalary(job.minSalary, job.maxSalary)
    const deadline = formatDate(job.lastDateToApply)
    const deadlinePassed = job.lastDateToApply && new Date(job.lastDateToApply) < new Date()

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="relative p-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5" />
                <div className="relative flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md overflow-hidden shrink-0">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                            alt={job.companyName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-1">{job.title}</h2>
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{job.companyName}</p>
                            </div>
                            <button onClick={onUnsave} disabled={unsaving}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
                                {unsaving ? <FiLoader size={12} className="animate-spin" /> : <FiTrash2 size={12} />}
                                Remove
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-xs text-zinc-500"><FiMapPin size={11} />{job.location}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${JOB_TYPE_COLORS[job.type] || ''}`}>
                                {JOB_TYPE_LABELS[job.type] || job.type}
                            </span>
                            {job.featured && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                    <FiStar size={10} className="fill-current" /> Featured
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                {[
                    { icon: <FiDollarSign />, label: 'Salary', value: salary || 'Not Disclosed' },
                    { icon: <FiBriefcase />, label: 'Experience', value: job.experienceRequired || 'Any' },
                    { icon: <FiClock />, label: 'Deadline', value: deadline || 'Open' },
                ].map(s => (
                    <div key={s.label} className="flex flex-col items-center py-4 px-2 text-center">
                        <span className="text-blue-500 mb-1">{s.icon}</span>
                        <p className="text-xs text-zinc-400 font-medium mb-0.5">{s.label}</p>
                        <p className={`text-sm font-bold leading-tight ${s.label === 'Deadline' && deadlinePassed ? 'text-red-500' : 'text-zinc-800 dark:text-zinc-100'}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="p-6 space-y-5">
                {/* Expired warning */}
                {deadlinePassed && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold">
                        <FiAlertCircle className="shrink-0" />
                        This job's application deadline has passed.
                    </div>
                )}

                {/* Apply outcomes */}
                {applySuccess && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <FiCheckCircle className="text-xl shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Application Submitted! 🎉</p>
                            <p className="text-xs mt-0.5 opacity-80">Your profile was sent to {job.companyName}.</p>
                        </div>
                    </div>
                )}
                {applyError && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 text-sm">
                        <FiAlertCircle className="shrink-0" /> {applyError}
                    </div>
                )}

                {/* Skills */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BsStars className="text-violet-500" /> Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map(s => (
                                <span key={s.id} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {job.description && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Job Description</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-10">{job.description}</p>
                    </div>
                )}

                {/* Category */}
                {job.category && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-zinc-400">Category:</span>
                        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs">{job.category}</span>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-3">
                <div className="flex gap-3">
                    {applySuccess
                        ? <button disabled className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-emerald-500 opacity-80 cursor-default text-sm">
                            <FiCheckCircle /> Applied
                        </button>
                        : <button onClick={onApply} disabled={applying || !!deadlinePassed}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm
                                bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
                                shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-60">
                            {applying ? <><FiLoader className="animate-spin" /> Applying…</> : <><FiZap /> Quick Apply</>}
                        </button>
                    }
                    <Link href="/jobs" className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                        <FiExternalLink size={15} /> More Jobs
                    </Link>
                </div>
                <p className="text-center text-xs text-zinc-400 font-medium">⚡ Quick Apply uses your saved profile</p>
            </div>
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EmptyDetail() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center py-24 px-8 text-center shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 flex items-center justify-center mb-6">
                <FiBookmark className="text-4xl text-blue-300 dark:text-blue-500/50" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Select a Saved Job</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium max-w-xs">
                Click any bookmark from the list to see full details and apply with one click.
            </p>
        </div>
    )
}

function EmptyState({ hasJobs, search }: { hasJobs: boolean; search: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <FiBookmark className="text-4xl text-zinc-300 dark:text-zinc-600" />
            </div>
            {hasJobs ? (
                <>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No results</h3>
                    <p className="text-sm text-zinc-400 max-w-xs mb-5">{search ? `No saved jobs matching "${search}"` : 'No jobs match the selected filter'}</p>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No Saved Jobs</h3>
                    <p className="text-sm text-zinc-400 max-w-xs mb-5">Start bookmarking jobs from the job board and apply when you're ready.</p>
                    <Link href="/jobs" className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20">
                        <FiSearch /> Browse Jobs
                    </Link>
                </>
            )}
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                    <div className="flex gap-2">
                        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16" />
                        <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-20" />
                    </div>
                </div>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-3" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/3" />
        </div>
    )
}
