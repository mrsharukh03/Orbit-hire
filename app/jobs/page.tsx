'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    FiDollarSign, FiBriefcase, FiClock, FiBookmark, FiExternalLink,
    FiLoader, FiAlertCircle, FiStar, FiCheckCircle, FiZap,
    FiMapPin, FiChevronLeft, FiChevronRight, FiRefreshCw, FiX, FiSearch,
} from 'react-icons/fi'
import { BsBuilding } from 'react-icons/bs'
import { searchJobs, getJobById } from '@/services/publicService'
import { apiFetch } from '@/services/authService'
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
    id: number
    title: string
    companyName: string
    companyLogoUrl?: string
    location: string
    type: string
    category: string
    minSalary?: number
    maxSalary?: number
    experienceRequired?: string
    description?: string
    status: string
    lastDateToApply?: string
    featured?: boolean
    priorityScore?: number
    requiredSkills?: { id: number; name: string }[]
    active?: boolean
}

interface PagedResponse {
    content: Job[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
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

const PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSalary(min?: number, max?: number) {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}k`
    if (min && max) return `₹${fmt(min)} – ₹${fmt(max)}`
    if (min) return `₹${fmt(min)}+`
    return `₹${fmt(max!)}`
}

function shimmerClass(w: string, h: string, rounded = 'rounded-lg') {
    return `${w} ${h} ${rounded} bg-zinc-200 dark:bg-zinc-700 animate-pulse`
}

// ─── Inner Page (uses useSearchParams) ───────────────────────────────────────
function JobsPageInner() {
    const searchParams = useSearchParams()

    // Latest filters that the SearchBar emitted
    const [filters, setFilters] = useState<SearchBarFilters>({
        keyword: searchParams.get('keyword') || undefined,
        location: searchParams.get('location') || undefined,
        type: (searchParams.get('type') as SearchBarFilters['type']) || undefined,
        sortBy: 'postedDate',
        sortDir: 'DESC',
        page: 0,
        size: PAGE_SIZE,
    })
    const [page, setPage] = useState(0)

    // Data state
    const [jobs, setJobs] = useState<Job[]>([])
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [applying, setApplying] = useState(false)
    const [applySuccess, setApplySuccess] = useState(false)
    const [applyError, setApplyError] = useState('')
    const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())
    const [savingJob, setSavingJob] = useState<number | null>(null)
    const detailRef = useRef<HTMLDivElement>(null)

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchJobs = useCallback(async (f: SearchBarFilters, pg = 0) => {
        setLoading(true)
        setError('')
        try {
            const payload = {
                ...f,
                page: pg,
                size: PAGE_SIZE,
                status: 'OPEN' as const,
                sortBy: f.sortBy || 'postedDate',
                sortDir: f.sortDir || 'DESC',
            }

            const data: PagedResponse = await searchJobs(payload)
            if (data) {
                setJobs(data.content || [])
                setTotalPages(data.totalPages || 0)
                setTotalElements(data.totalElements || 0)
                setPage(data.number || 0)
                if (data.content?.length > 0 && !selectedJob) {
                    setSelectedJob(data.content[0])
                }
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to load jobs')
        } finally {
            setLoading(false)
        }
    }, [selectedJob])


    // Initial load — respects URL params
    useEffect(() => {
        fetchJobs(filters, 0)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── SearchBar callback ─────────────────────────────────────────────────────
    const handleSearch = (newFilters: SearchBarFilters) => {
        setFilters(newFilters)
        setSelectedJob(null)
        fetchJobs(newFilters, 0)
    }

    // ── Job Detail ─────────────────────────────────────────────────────────────
    const handleSelectJob = async (job: Job) => {
        setSelectedJob(job)
        setApplySuccess(false)
        setApplyError('')
        setDetailLoading(true)
        try {
            const full = await getJobById(job.id)
            if (full) setSelectedJob(full)
        } catch { /* use cached */ }
        finally { setDetailLoading(false) }
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handlePageChange = (p: number) => {
        fetchJobs(filters, p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
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

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSaveJob = async (jobId: number) => {
        setSavingJob(jobId)
        try {
            if (savedJobs.has(jobId)) {
                await apiFetch(`/saved-jobs/unsave?jobId=${jobId}`, { method: 'DELETE' })
                setSavedJobs(prev => { const n = new Set(prev); n.delete(jobId); return n })
            } else {
                await apiFetch(`/saved-jobs/save?jobId=${jobId}`, { method: 'POST' })
                setSavedJobs(prev => new Set(prev).add(jobId))
            }
        } catch { /* silent */ }
        finally { setSavingJob(null) }
    }

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
            {/* Ambient BG */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[1400px]">

                {/* ── Hero header + SearchBar ────────────────────────────── */}
                <div className="pt-8 pb-6">
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold mb-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                            </span>
                            {totalElements > 0 ? `${totalElements.toLocaleString()} Live Openings` : 'Live Job Board'}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Find Your <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">Perfect Role</span>
                        </h1>
                    </div>

                    {/* ── Reusable SearchBar ── */}
                    <SearchBar
                        initialKeyword={filters.keyword}
                        initialLocation={filters.location}
                        showFilterToggle={true}
                        onSearch={handleSearch}
                    />
                </div>

                {/* ── Error Banner ───────────────────────────────────────── */}
                {error && (
                    <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        <FiAlertCircle className="shrink-0 text-lg" />
                        {error}
                        <button onClick={() => fetchJobs(filters, page)} className="ml-auto underline font-semibold hover:no-underline">Retry</button>
                    </div>
                )}

                {/* ── Two-Column Layout ─────────────────────────────────── */}
                <div className="flex gap-5 items-start">

                    {/* LEFT: Job List */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">

                        {/* Results header */}
                        {!loading && (
                            <div className="flex items-center justify-between mb-4 px-1">
                                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                                    {totalElements > 0
                                        ? <><span className="text-zinc-900 dark:text-white font-bold">{totalElements.toLocaleString()}</span> jobs found</>
                                        : 'No jobs found'
                                    }
                                </p>
                                {totalPages > 1 && (
                                    <p className="text-xs text-zinc-400 font-medium">Page {page + 1} of {totalPages}</p>
                                )}
                            </div>
                        )}

                        {/* Job Cards */}
                        <div className="space-y-3">
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
                                : jobs.length === 0
                                    ? <EmptyState keyword={filters.keyword} onReset={() => handleSearch({ keyword: '', location: '' })} />
                                    : jobs.map(job => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            selected={selectedJob?.id === job.id}
                                            saved={savedJobs.has(job.id)}
                                            saving={savingJob === job.id}
                                            onClick={() => handleSelectJob(job)}
                                            onSave={() => handleSaveJob(job.id)}
                                        />
                                    ))
                            }
                        </div>

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-600 transition-all">
                                    <FiChevronLeft />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                                    const p = totalPages <= 7 ? i : (
                                        page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
                                    )
                                    return (
                                        <button key={p} onClick={() => handlePageChange(p)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                                ${p === page
                                                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30'
                                                    : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600'}`}>
                                            {p + 1}
                                        </button>
                                    )
                                })}
                                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-600 transition-all">
                                    <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Job Detail Panel */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl" ref={detailRef}>
                        {selectedJob
                            ? <JobDetailPanel
                                job={selectedJob}
                                loading={detailLoading}
                                applying={applying}
                                applySuccess={applySuccess}
                                applyError={applyError}
                                saved={savedJobs.has(selectedJob.id)}
                                saving={savingJob === selectedJob.id}
                                onApply={handleApply}
                                onSave={() => handleSaveJob(selectedJob.id)}
                            />
                            : <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-600">
                                <BsBuilding className="text-5xl mb-3 opacity-30" />
                                <p className="text-sm font-medium">Select a job to see details</p>
                            </div>
                        }
                    </div>
                </div>
            </div>

            {/* ── Mobile Detail Drawer ──────────────────────────────────────── */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[92vh] overflow-y-auto" ref={detailRef}>
                        <div className="sticky top-0 flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 -top-1" />
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1 mr-3">{selectedJob.title}</h3>
                            <button onClick={() => setSelectedJob(null)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-700">
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-4">
                            <JobDetailPanel
                                job={selectedJob}
                                loading={detailLoading}
                                applying={applying}
                                applySuccess={applySuccess}
                                applyError={applyError}
                                saved={savedJobs.has(selectedJob.id)}
                                saving={savingJob === selectedJob.id}
                                onApply={handleApply}
                                onSave={() => handleSaveJob(selectedJob.id)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, selected, saved, saving, onClick, onSave }: {
    job: Job; selected: boolean; saved: boolean; saving: boolean
    onClick: () => void; onSave: () => void
}) {
    const salary = formatSalary(job.minSalary, job.maxSalary)

    return (
        <div onClick={onClick}
            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                ${selected
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/5 shadow-md shadow-blue-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-900/5'
                }`}>

            {selected && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full" />}

            {job.featured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                    <FiStar size={10} className="fill-current" /> Featured
                </div>
            )}

            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {job.companyLogoUrl
                        ? <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        : <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                            alt={job.companyName} className="w-full h-full object-cover" />
                    }
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm leading-snug truncate mb-0.5 transition-colors
                        ${selected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                        {job.title}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">{job.companyName}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                            <FiMapPin size={11} /> <span className="truncate max-w-[100px]">{job.location}</span>
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${JOB_TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                            {JOB_TYPE_LABELS[job.type] || job.type}
                        </span>
                        {salary && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{salary}</span>}
                    </div>

                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.requiredSkills.slice(0, 3).map(s => (
                                <span key={s.id} className="px-2 py-0.5 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">{s.name}</span>
                            ))}
                            {job.requiredSkills.length > 3 && (
                                <span className="px-2 py-0.5 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">+{job.requiredSkills.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <FiClock size={11} />
                    {job.lastDateToApply ? `Closes ${new Date(job.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Open'}
                </span>
                <button onClick={e => { e.stopPropagation(); onSave() }} disabled={saving}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
                        ${saved ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}>
                    {saving ? <FiLoader size={12} className="animate-spin" /> : <FiBookmark size={13} className={saved ? 'fill-current' : ''} />}
                </button>
            </div>
        </div>
    )
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({ job, loading, applying, applySuccess, applyError, saved, saving, onApply, onSave }: {
    job: Job; loading: boolean; applying: boolean; applySuccess: boolean; applyError: string
    saved: boolean; saving: boolean; onApply: () => void; onSave: () => void
}) {
    const salary = formatSalary(job.minSalary, job.maxSalary)

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="relative p-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5" />
                <div className="relative flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-md overflow-hidden">
                        {job.companyLogoUrl
                            ? <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                            : <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.companyName)}&backgroundColor=2563eb&textColor=ffffff`}
                                alt={job.companyName} className="w-full h-full object-cover" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-1">{job.title}</h2>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{job.companyName}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-xs text-zinc-500"><FiMapPin size={12} /> {job.location}</span>
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
                    <button onClick={onSave} disabled={saving}
                        className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl border-2 transition-all
                            ${saved ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-blue-400 hover:text-blue-500'}`}>
                        {saving ? <FiLoader className="animate-spin" size={16} /> : <FiBookmark size={16} className={saved ? 'fill-current' : ''} />}
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                {[
                    { icon: <FiDollarSign />, label: 'Salary', value: salary || 'Not Disclosed' },
                    { icon: <FiBriefcase />, label: 'Experience', value: job.experienceRequired || 'Any Level' },
                    { icon: <FiClock />, label: 'Deadline', value: job.lastDateToApply ? new Date(job.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Open' },
                ].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center py-4 px-2 text-center">
                        <span className="text-blue-500 mb-1 text-base">{stat.icon}</span>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-0.5">{stat.label}</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <div key={i} className={shimmerClass('w-full', 'h-4')} />)}
                    </div>
                )}
                {applySuccess && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <FiCheckCircle className="text-xl shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Application Submitted! 🎉</p>
                            <p className="text-xs mt-0.5 opacity-80">Your profile was sent to {job.companyName}. Good luck!</p>
                        </div>
                    </div>
                )}
                {applyError && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        <FiAlertCircle className="shrink-0" /> {applyError}
                    </div>
                )}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiZap className="text-violet-500" /> Required Skills
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
                {job.description && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Job Description</h4>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{job.description}</div>
                    </div>
                )}
                {job.category && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">Category:</span>
                        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs">{job.category}</span>
                    </div>
                )}
            </div>

            {/* CTA */}
            {!loading && (
                <div className="p-6 pt-0">
                    <div className="flex gap-3">
                        {applySuccess
                            ? <button disabled className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-emerald-500 opacity-80 cursor-default text-sm">
                                <FiCheckCircle /> Applied Successfully
                            </button>
                            : <button onClick={onApply} disabled={applying}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-60 text-sm">
                                {applying ? <><FiLoader className="animate-spin" /> Applying…</> : <><FiZap /> Quick Apply</>}
                            </button>
                        }
                        <button className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-sm">
                            <FiExternalLink size={15} /> Details
                        </button>
                    </div>
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3 font-medium">
                        ⚡ Quick Apply uses your saved profile — make sure it's complete!
                    </p>
                </div>
            )}
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function JobCardSkeleton() {
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
            <div className="flex gap-1.5 mb-3">
                {[1, 2, 3].map(i => <div key={i} className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded-md w-14" />)}
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-3" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/3" />
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ keyword, onReset }: { keyword?: string; onReset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <FiBriefcase className="text-4xl text-zinc-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No jobs found</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs mb-5">
                {keyword ? `No results for "${keyword}". Try different keywords or remove filters.` : 'No jobs match your current filters.'}
            </p>
            <button onClick={onReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 transition-all active:scale-95">
                <FiRefreshCw size={14} /> Clear Filters
            </button>
        </div>
    )
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function JobsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 flex items-center justify-center">
                <FiLoader className="text-blue-500 animate-spin text-4xl" />
            </div>
        }>
            <JobsPageInner />
        </Suspense>
    )
}
