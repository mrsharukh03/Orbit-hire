'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JobCard, { type Job } from '@/components/Jobs/JobCard'
import { getPostedJobs, deleteJob } from '@/services/recruiterService'
import {
    FiLoader, FiAlertCircle, FiPlus, FiEye, FiTrash2,
    FiUsers, FiChevronLeft, FiChevronRight, FiEdit2, FiBriefcase
} from 'react-icons/fi'

const STATUS_COLORS: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CLOSED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    EXPIRED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default function RecruiterJobBoard() {
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [successMsg, setSuccessMsg] = useState('')

    const loadJobs = async (p = 0) => {
        try {
            setLoading(true)
            setError('')
            const data = await getPostedJobs(p, 10)
            const content = data?.content || data || []
            setJobs(Array.isArray(content) ? content : [])
            setTotalPages(data?.totalPages || 1)
            setPage(p)
        } catch (err: any) {
            setError(err.message || 'Failed to load your jobs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadJobs(0)
    }, [])

    const handleDelete = async (jobId: number) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return
        try {
            setDeletingId(jobId)
            await deleteJob(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
            setSuccessMsg('Job posting deleted successfully')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to delete job')
            setTimeout(() => setError(''), 4000)
        } finally {
            setDeletingId(null)
        }
    }

    // Stats
    const openJobs = jobs.filter(j => j.status === 'OPEN' || j.active).length
    const closedJobs = jobs.filter(j => j.status === 'CLOSED').length

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-3">
                            <FiUsers size={12} /> Recruiter Dashboard
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                            My <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Job Postings</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                            Manage your listings and view applications
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/post-job')}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25 transition-all active:scale-95"
                    >
                        <FiPlus size={16} /> Post New Job
                    </button>
                </div>

                {/* Quick Stats */}
                {!loading && jobs.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">{jobs.length}</p>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Total Jobs</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-2xl font-extrabold text-emerald-600">{openJobs}</p>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Active</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                            <p className="text-2xl font-extrabold text-zinc-400">{closedJobs}</p>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Closed</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto">
                {/* Messages */}
                {successMsg && (
                    <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm animate-[fadeInUp_0.2s_ease-out]">
                        <FiEye className="shrink-0" size={18} />
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
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <FiLoader className="text-purple-500 animate-spin text-3xl mb-3" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your job postings...</p>
                    </div>
                )}

                {/* Section title */}
                {!loading && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Your Listings</h2>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                        </span>
                    </div>
                )}

                {/* Jobs List */}
                {!loading && jobs.length > 0 && (
                    <div className="grid gap-4">
                        {jobs.map(job => {
                            const isDeleting = deletingId === job.id
                            const statusColor = STATUS_COLORS[job.status || 'OPEN'] || STATUS_COLORS['OPEN']

                            return (
                                <div key={job.id} className="relative">
                                    {/* Status indicator */}
                                    {job.status && (
                                        <div className="absolute -top-2 right-4 z-10">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                                                {job.status}
                                            </span>
                                        </div>
                                    )}
                                    <JobCard
                                        job={job}
                                        actionButton={
                                            <div className="flex items-center gap-2">
                                                {/* View Applications */}
                                                <button
                                                    onClick={() => router.push(`/jobs/${job.id}/applications`)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                                                >
                                                    <FiUsers size={13} /> Applications
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => router.push(`/post-job?edit=${job.id}`)}
                                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                                >
                                                    <FiEdit2 size={12} />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    disabled={isDeleting}
                                                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-all ${isDeleting ? 'opacity-50' : ''}`}
                                                >
                                                    {isDeleting ? <FiLoader className="animate-spin" size={12} /> : <FiTrash2 size={12} />}
                                                </button>
                                            </div>
                                        }
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && jobs.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <FiBriefcase className="text-zinc-400" size={28} />
                        </div>
                        <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">No jobs posted yet</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
                            Start by posting your first job to find the perfect candidates.
                        </p>
                        <button
                            onClick={() => router.push('/post-job')}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25 transition-all active:scale-95"
                        >
                            <FiPlus className="inline mr-1" /> Post Your First Job
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => loadJobs(page - 1)}
                            disabled={page === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <FiChevronLeft size={14} /> Prev
                        </button>
                        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => loadJobs(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next <FiChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}