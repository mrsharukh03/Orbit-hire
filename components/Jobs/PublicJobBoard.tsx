'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import JobCard, { type Job } from '@/components/Jobs/JobCard'
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar'
import { searchJobs, getPopularJobs, getJobById } from '@/services/publicService'
import {
    FiLoader, FiBriefcase, FiArrowRight, FiTrendingUp,
    FiChevronLeft, FiChevronRight, FiMapPin, FiDollarSign,
    FiCalendar, FiClock, FiTag, FiX, FiAlertCircle, FiExternalLink,
    FiStar, FiCheckCircle,
} from 'react-icons/fi'
import { BsStars } from 'react-icons/bs'

// ─── Types ───────────────────────────────────────────────────────────────────
interface JobDetail {
    id: number
    title: string
    description?: string
    type: string
    category?: string
    companyName: string
    companyLogoUrl?: string
    location?: string
    minSalary?: number
    maxSalary?: number
    experienceRequired?: string
    status: string
    postedDate?: string
    lastDateToApply?: string
    requiredSkills?: { id?: number; name: string }[]
    featured?: boolean
    priorityScore?: number
    active?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSalary(min?: number, max?: number) {
    const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `${fmt(min)}+`
    if (max) return `Up to ${fmt(max)}`
    return null
}

function formatDate(d?: string) {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time', PART_TIME: 'Part Time',
    INTERNSHIP: 'Internship', REMOTE: 'Remote',
}
const TYPE_COLORS: Record<string, string> = {
    FULL_TIME: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/20',
    PART_TIME: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/20',
    INTERNSHIP: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-500/20',
    REMOTE: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500/20',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse">
            <div className="h-36 bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-6 space-y-4">
                {[80, 50, 65, 100, 70].map((w, i) => (
                    <div key={i} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg" style={{ width: `${w}%` }} />
                ))}
            </div>
        </div>
    )
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({
    job, loading, onLoginToApply, onClose
}: {
    job: JobDetail | null
    loading: boolean
    onLoginToApply: () => void
    onClose?: () => void
}) {
    if (loading) return <DetailSkeleton />
    if (!job) return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5">
                <FiBriefcase className="text-4xl text-blue-300 dark:text-blue-500/50" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Select a Job</h3>
            <p className="text-sm text-zinc-400 max-w-xs">Click any job from the list to view its full description, requirements, and apply.</p>
        </div>
    )

    const salary = formatSalary(job.minSalary, job.maxSalary)
    const deadline = formatDate(job.lastDateToApply)
    const posted = formatDate(job.postedDate)
    const deadlinePassed = job.lastDateToApply && new Date(job.lastDateToApply) < new Date()
    const typeColor = TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-600 border-zinc-200'

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="relative p-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 to-violet-50/70 dark:from-blue-500/5 dark:to-violet-500/5" />
                <div className="relative">
                    {onClose && (
                        <button onClick={onClose} className="absolute top-0 right-0 w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
                            <FiX size={15} />
                        </button>
                    )}
                    <div className="flex items-start gap-4 pr-10">
                        {/* Logo */}
                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                            {job.companyLogoUrl ? (
                                <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-extrabold bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                    {job.companyName?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-1">{job.title}</h2>
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">{job.companyName}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${typeColor}`}>
                                    {TYPE_LABELS[job.type] || job.type}
                                </span>
                                {job.featured && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/20">
                                        <FiStar size={10} className="fill-current" /> Featured
                                    </span>
                                )}
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {job.status === 'OPEN' ? '🟢 Open' : '🔴 Closed'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                {[
                    { icon: <FiMapPin />, label: 'Location', value: job.location || 'Not specified' },
                    { icon: <FiDollarSign />, label: 'Salary', value: salary || 'Not disclosed' },
                    { icon: <FiBriefcase />, label: 'Experience', value: job.experienceRequired || 'Any' },
                ].map(item => (
                    <div key={item.label} className="flex flex-col items-center py-4 px-2 text-center">
                        <span className="text-blue-500 mb-1 text-sm">{item.icon}</span>
                        <p className="text-[10px] text-zinc-400 font-medium mb-0.5 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-tight">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-20rem)] overflow-y-auto">

                {/* Deadline warning */}
                {deadlinePassed && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-semibold">
                        <FiAlertCircle className="shrink-0" /> This job's application deadline has passed.
                    </div>
                )}

                {/* Meta info bar */}
                <div className="flex flex-wrap gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800">
                    {job.category && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            <FiTag size={12} className="text-violet-500" /> {job.category}
                        </span>
                    )}
                    {posted && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            <FiClock size={12} className="text-blue-500" /> Posted {posted}
                        </span>
                    )}
                    {deadline && (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${deadlinePassed ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            <FiCalendar size={12} className={deadlinePassed ? 'text-red-400' : 'text-emerald-500'} />
                            Apply by {deadline}
                        </span>
                    )}
                </div>

                {/* Required Skills */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            <BsStars className="text-violet-500" /> Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map((s, i) => (
                                <span key={s.id || i} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                {job.description && (
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            Job Description
                        </h4>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line space-y-2">
                            {job.description}
                        </div>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <button
                    onClick={onLoginToApply}
                    disabled={!!deadlinePassed}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <FiArrowRight size={16} /> Login to Apply
                </button>
                <p className="text-center text-xs text-zinc-400 font-medium">
                    Create a free account to apply and track your applications
                </p>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PublicJobBoard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const detailRef = useRef<HTMLDivElement>(null)

    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentFilters, setCurrentFilters] = useState<SearchBarFilters>({})

    // ── Job Detail state ──────────────────────────────────────────────────────
    const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

    // ── Load popular jobs on mount ────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await getPopularJobs(0, 12)
                const content = data?.content || data || []
                setJobs(Array.isArray(content) ? content : [])
                setTotalPages(data?.totalPages || 1)
                // Auto-select first job on desktop
                if (content.length > 0) {
                    handleSelectJob(content[0].id)
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load jobs')
            } finally {
                setLoading(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── URL param for pre-filled search (from home page trending tags) ────────
    useEffect(() => {
        const kw = searchParams.get('q') || searchParams.get('keyword')
        const loc = searchParams.get('location')
        if (kw || loc) {
            handleSearch({ keyword: kw || undefined, location: loc || undefined })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Fetch job detail ──────────────────────────────────────────────────────
    const handleSelectJob = async (jobId: number) => {
        setDetailLoading(true)
        setMobileDetailOpen(true)
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        try {
            const detail = await getJobById(jobId)
            setSelectedJob(detail)
        } catch {
            setSelectedJob(null)
        } finally {
            setDetailLoading(false)
        }
    }

    // ── Search ────────────────────────────────────────────────────────────────
    const handleSearch = useCallback(async (filters: SearchBarFilters) => {
        try {
            setSearchLoading(true)
            setError('')
            setHasSearched(true)
            setCurrentFilters(filters)
            const data = await searchJobs({ ...filters, status: 'OPEN' })
            const content = data?.content || data || []
            setJobs(Array.isArray(content) ? content : [])
            setTotalPages(data?.totalPages || 1)
            setPage(filters.page || 0)
            // Auto-select first result
            if (content.length > 0) {
                handleSelectJob(content[0].id)
            } else {
                setSelectedJob(null)
            }
        } catch (err: any) {
            setError(err.message || 'Search failed')
            setJobs([])
        } finally {
            setSearchLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePageChange = (newPage: number) => {
        handleSearch({ ...currentFilters, page: newPage })
    }

    const isLoading = loading || searchLoading

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-950">

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-5">
                    <FiTrendingUp size={12} /> Discover top opportunities
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Find Your <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Dream Job</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-base sm:text-lg max-w-2xl mx-auto">
                    Explore thousands of jobs. Sign in to apply and track your applications.
                </p>
            </div>

            {/* ── Search ───────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto mb-8">
                <SearchBar onSearch={handleSearch} />
            </div>

            {/* ── Error ────────────────────────────────────────────────────── */}
            {error && (
                <div className="max-w-6xl mx-auto mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
                    <FiAlertCircle className="shrink-0" size={18} /> <span>{error}</span>
                </div>
            )}

            {/* ── Main two-column layout ────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto">
                {/* Section label */}
                {!isLoading && (
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {hasSearched ? 'Search Results' : 'Popular Jobs'}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                        </span>
                    </div>
                )}

                <div className="flex gap-5 items-start">

                    {/* ── LEFT: Job List ──────────────────────────────────── */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <FiLoader className="text-blue-500 animate-spin text-3xl mb-3" />
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {searchLoading ? 'Searching...' : 'Loading jobs...'}
                                </p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <FiBriefcase className="text-5xl text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                    {hasSearched ? 'No jobs match your search' : 'No popular jobs right now'}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {hasSearched ? 'Try adjusting your filters.' : 'Check back later.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => handleSelectJob(job.id)}
                                        className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                                            ${selectedJob?.id === job.id
                                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/5 shadow-md shadow-blue-500/10'
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md'
                                            }`}
                                    >
                                        {selectedJob?.id === job.id && (
                                            <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full" />
                                        )}
                                        {job.featured && (
                                            <div className="absolute -top-2 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-bold text-white shadow-sm">
                                                <FiStar size={9} /> FEATURED
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            {/* Logo */}
                                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                                {job.companyLogoUrl ? (
                                                    <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-extrabold bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                                        {job.companyName?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold text-sm truncate mb-0.5 transition-colors
                                                    ${selectedJob?.id === job.id
                                                        ? 'text-blue-700 dark:text-blue-400'
                                                        : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                    }`}>
                                                    {job.title}
                                                </h3>
                                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">{job.companyName}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {job.location && (
                                                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                                                            <FiMapPin size={11} />
                                                            <span className="truncate max-w-[100px]">{job.location}</span>
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                                        {TYPE_LABELS[job.type] || job.type}
                                                    </span>
                                                </div>
                                                {/* Skills preview */}
                                                {job.requiredSkills && job.requiredSkills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {job.requiredSkills.slice(0, 3).map((s, i) => (
                                                            <span key={s.id || i} className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                        {job.requiredSkills.length > 3 && (
                                                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                                                +{job.requiredSkills.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                                            {job.minSalary || job.maxSalary ? (
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    <FiDollarSign className="inline" size={11} />
                                                    {formatSalary(job.minSalary, job.maxSalary)}
                                                </span>
                                            ) : <span />}
                                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                View details →
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages - 1}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <FiChevronRight size={14} />
                                </button>
                            </div>
                        )}

                        {/* Guest CTA */}
                        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-600/5 to-violet-600/5 dark:from-blue-600/10 dark:to-violet-600/10 border border-blue-200/30 dark:border-blue-800/30 text-center">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Ready to start?</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                Create a free account to apply and get personalized recommendations.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition-all active:scale-95"
                            >
                                Get Started — It&apos;s Free
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT: Job Detail (Desktop) ─────────────────────── */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)]" ref={detailRef}>
                        <JobDetailPanel
                            job={selectedJob}
                            loading={detailLoading}
                            onLoginToApply={() => router.push('/login?redirect=/jobs')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Mobile Bottom Sheet ────────────────────────────────────── */}
            {mobileDetailOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileDetailOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800">
                            <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm truncate flex-1 mt-1 mr-4">
                                {selectedJob?.title || 'Job Detail'}
                            </h3>
                            <button
                                onClick={() => setMobileDetailOpen(false)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500"
                            >
                                <FiX size={15} />
                            </button>
                        </div>
                        <div className="p-4">
                            <JobDetailPanel
                                job={selectedJob}
                                loading={detailLoading}
                                onLoginToApply={() => router.push('/login?redirect=/jobs')}
                                onClose={() => setMobileDetailOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}