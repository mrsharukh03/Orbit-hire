'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import JobCard, { type Job } from '@/components/Jobs/JobCard'
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar'
import { searchJobs, getPopularJobs } from '@/services/publicService'
import { applyForJob, saveJob, unsaveJob } from '@/services/seekerService'
import {
    FiLoader, FiAlertCircle, FiBriefcase, FiSend, FiBookmark,
    FiCheck, FiTrendingUp, FiChevronLeft, FiChevronRight, FiHeart
} from 'react-icons/fi'

export default function SeekerJobBoard() {
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [popularJobs, setPopularJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentFilters, setCurrentFilters] = useState<SearchBarFilters>({})

    // Track applied and saved states
    const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set())
    const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())
    const [applyingId, setApplyingId] = useState<number | null>(null)
    const [savingId, setSavingId] = useState<number | null>(null)
    const [successMsg, setSuccessMsg] = useState('')

    // Load popular jobs on mount
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await getPopularJobs(0, 10)
                const content = data?.content || data || []
                setPopularJobs(Array.isArray(content) ? content : [])
            } catch (err: any) {
                setError(err.message || 'Failed to load jobs')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

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
        } catch (err: any) {
            setError(err.message || 'Search failed')
            setJobs([])
        } finally {
            setSearchLoading(false)
        }
    }, [])

    const handlePageChange = (newPage: number) => {
        handleSearch({ ...currentFilters, page: newPage })
    }

    // Apply for a job
    const handleApply = async (jobId: number) => {
        try {
            setApplyingId(jobId)
            await applyForJob(jobId)
            setAppliedJobs(prev => new Set(prev).add(jobId))
            setSuccessMsg('Application submitted successfully!')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to apply')
            setTimeout(() => setError(''), 4000)
        } finally {
            setApplyingId(null)
        }
    }

    // Save / Unsave a job
    const handleToggleSave = async (jobId: number) => {
        try {
            setSavingId(jobId)
            if (savedJobs.has(jobId)) {
                await unsaveJob(jobId)
                setSavedJobs(prev => {
                    const next = new Set(prev)
                    next.delete(jobId)
                    return next
                })
            } else {
                await saveJob(jobId)
                setSavedJobs(prev => new Set(prev).add(jobId))
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save job')
            setTimeout(() => setError(''), 4000)
        } finally {
            setSavingId(null)
        }
    }

    const jobsToShow = hasSearched ? jobs : popularJobs

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
                            <FiTrendingUp size={12} /> Job Seeker Dashboard
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                            Explore <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Opportunities</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                            Search, apply and save jobs that match your skills
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/applications')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        >
                            <FiBriefcase size={14} /> My Applications
                        </button>
                        <button
                            onClick={() => router.push('/saved-jobs')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-pink-400 hover:text-pink-600 dark:hover:text-pink-400 transition-all"
                        >
                            <FiHeart size={14} /> Saved Jobs
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-5xl mx-auto mb-8">
                <SearchBar onSearch={handleSearch} />
            </div>

            {/* Success / Error Messages */}
            <div className="max-w-5xl mx-auto">
                {successMsg && (
                    <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm animate-[fadeInUp_0.2s_ease-out]">
                        <FiCheck className="shrink-0" size={18} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
                        <FiAlertCircle className="shrink-0" size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Loading */}
                {(loading || searchLoading) && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <FiLoader className="text-blue-500 animate-spin text-3xl mb-3" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {searchLoading ? 'Searching jobs...' : 'Loading jobs...'}
                        </p>
                    </div>
                )}

                {/* Section title */}
                {!loading && !searchLoading && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {hasSearched ? 'Search Results' : 'Recommended for You'}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {jobsToShow.length} {jobsToShow.length === 1 ? 'job' : 'jobs'}
                        </span>
                    </div>
                )}

                {/* Jobs List */}
                {!loading && !searchLoading && jobsToShow.length > 0 && (
                    <div className="grid gap-4">
                        {jobsToShow.map(job => {
                            const isApplied = appliedJobs.has(job.id)
                            const isSaved = savedJobs.has(job.id)
                            const isApplying = applyingId === job.id
                            const isSaving = savingId === job.id

                            return (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    actionButton={
                                        <div className="flex items-center gap-2">
                                            {/* Save Button */}
                                            <button
                                                onClick={() => handleToggleSave(job.id)}
                                                disabled={isSaving}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${isSaved
                                                    ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50'
                                                    : 'text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-pink-300 hover:text-pink-600'
                                                    } ${isSaving ? 'opacity-60' : ''}`}
                                            >
                                                {isSaving ? (
                                                    <FiLoader className="animate-spin" size={13} />
                                                ) : (
                                                    <FiBookmark size={13} className={isSaved ? 'fill-current' : ''} />
                                                )}
                                                {isSaved ? 'Saved' : 'Save'}
                                            </button>

                                            {/* Apply Button */}
                                            <button
                                                onClick={() => handleApply(job.id)}
                                                disabled={isApplied || isApplying}
                                                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${isApplied
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-default'
                                                    : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20'
                                                    } ${isApplying ? 'opacity-70' : ''}`}
                                            >
                                                {isApplying ? (
                                                    <FiLoader className="animate-spin" size={14} />
                                                ) : isApplied ? (
                                                    <FiCheck size={14} />
                                                ) : (
                                                    <FiSend size={14} />
                                                )}
                                                {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Quick Apply'}
                                            </button>
                                        </div>
                                    }
                                />
                            )
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !searchLoading && jobsToShow.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <FiBriefcase className="text-zinc-400" size={28} />
                        </div>
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            {hasSearched ? 'No jobs match your search' : 'No jobs available right now'}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {hasSearched ? 'Try adjusting your filters or search keywords.' : 'Check back later for new opportunities.'}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {hasSearched && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <FiChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                            Page {page + 1} of {totalPages}
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
            </div>
        </div>
    )
}