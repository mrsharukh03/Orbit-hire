'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import JobCard, { type Job } from '@/components/Jobs/JobCard'
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar'
import { searchJobs, getPopularJobs } from '@/services/publicService'
import { FiLoader, FiAlertCircle, FiBriefcase, FiArrowRight, FiTrendingUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function PublicJobBoard() {
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

    // Load popular jobs on mount
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await getPopularJobs(0, 8)
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

    const jobsToShow = hasSearched ? jobs : popularJobs

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-5">
                    <FiTrendingUp size={12} /> Discover top opportunities
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Find Your <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Dream Job</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-base sm:text-lg max-w-2xl mx-auto">
                    Explore thousands of jobs from top companies. Sign in to apply and track your applications.
                </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-5xl mx-auto mb-10">
                <SearchBar onSearch={handleSearch} />
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto">
                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
                        <FiAlertCircle className="shrink-0" size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Loading */}
                {(loading || searchLoading) && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <FiLoader className="text-blue-500 animate-spin text-3xl mb-3" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {searchLoading ? 'Searching jobs...' : 'Loading popular jobs...'}
                        </p>
                    </div>
                )}

                {/* Section title */}
                {!loading && !searchLoading && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {hasSearched ? `Search Results` : 'Popular Jobs'}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {jobsToShow.length} {jobsToShow.length === 1 ? 'job' : 'jobs'}
                        </span>
                    </div>
                )}

                {/* Jobs List */}
                {!loading && !searchLoading && jobsToShow.length > 0 && (
                    <div className="grid gap-4">
                        {jobsToShow.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                actionButton={
                                    <button
                                        onClick={() => router.push(`/login?redirect=/jobs`)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        Login to Apply <FiArrowRight size={14} />
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !searchLoading && jobsToShow.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <FiBriefcase className="text-zinc-400" size={28} />
                        </div>
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            {hasSearched ? 'No jobs match your search' : 'No popular jobs right now'}
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

                {/* CTA for Guests */}
                <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-600/5 to-violet-600/5 dark:from-blue-600/10 dark:to-violet-600/10 border border-blue-200/30 dark:border-blue-800/30 text-center">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        Ready to start your career journey?
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Create a free account to apply for jobs, save favorites, and get personalized recommendations.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition-all active:scale-95"
                    >
                        Get Started — It&apos;s Free
                    </button>
                </div>
            </div>
        </div>
    )
}