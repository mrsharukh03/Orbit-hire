'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getPostedJobs,
    getJobApplications,
    getJobApplicationById,
    updateApplicationStatus
} from '@/services/recruiterService'
import Link from 'next/link'
import {
    FiBriefcase, FiClock, FiCheckCircle, FiXCircle,
    FiAlertCircle, FiLoader, FiX, FiExternalLink, FiCalendar,
    FiFileText, FiMapPin, FiChevronRight, FiSearch,
    FiRefreshCw, FiStar, FiUser, FiMessageSquare, FiEdit3,
    FiArrowLeft
} from 'react-icons/fi'
import { BsBuilding, BsRobot, BsStars } from 'react-icons/bs'

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'REJECTED'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<AppStatus, {
    label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode
}> = {
    PENDING: { label: 'Pending', dot: 'bg-amber-400', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: <FiClock /> },
    SHORTLISTED: { label: 'Shortlisted', dot: 'bg-blue-500', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: <FiStar /> },
    INTERVIEW_SCHEDULED: { label: 'Interview', dot: 'bg-violet-500', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', icon: <FiCalendar /> },
    SELECTED: { label: 'Selected', dot: 'bg-emerald-500', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: <FiCheckCircle /> },
    REJECTED: { label: 'Rejected', dot: 'bg-red-500', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', icon: <FiXCircle /> },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ScoreRing({ score }: { score: number }) {
    const r = 20, c = 2 * Math.PI * r
    const fill = (score / 100) * c
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'
    return (
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 -rotate-90" width="56" height="56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-200 dark:text-zinc-700" />
                <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${fill} ${c - fill}`} strokeLinecap="round" />
            </svg>
            <span className="text-xs font-black" style={{ color }}>{score}%</span>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruiterApplications() {
    // Dropdown States
    const [jobs, setJobs] = useState<any[]>([])
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
    const [jobsLoading, setJobsLoading] = useState(true)

    // Applications List States
    const [applications, setApplications] = useState<any[]>([])
    const [appsLoading, setAppsLoading] = useState(false)
    const [searchQ, setSearchQ] = useState('')

    // Detailed View States
    const [selectedApp, setSelectedApp] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const detailRef = useRef<HTMLDivElement>(null)

    // Status Update Form States
    const [updating, setUpdating] = useState(false)
    const [updateForm, setUpdateForm] = useState({ status: '', recruiterNotes: '', interviewDate: '' })

    // ── 1. Fetch Recruiter Jobs on Mount ──────────────────────────────────────
    useEffect(() => {
        const fetchJobs = async () => {
            setJobsLoading(true)
            try {
                const res: any = await getPostedJobs(0, 50)
                setJobs(res.content || [])
                if (res.content?.length > 0) {
                    setSelectedJobId(res.content[0].id)
                }
            } catch (err: any) {
                console.error("Failed to load jobs", err)
            } finally {
                setJobsLoading(false)
            }
        }
        fetchJobs()
    }, [])

    // ── 2. Fetch Applications when Job is Selected ─────────────────────────────
    const fetchApplications = useCallback(async () => {
        if (!selectedJobId) return
        setAppsLoading(true)
        setSelectedApp(null) // Reset detail panel on job change
        try {
            const res: any = await getJobApplications(selectedJobId, 0, 50)
            setApplications(res.content || [])
        } catch (err: any) {
            console.error("Failed to load applications", err)
        } finally {
            setAppsLoading(false)
        }
    }, [selectedJobId])

    useEffect(() => { fetchApplications() }, [fetchApplications])

    // ── 3. Handle Application Selection & Fetch Details ────────────────────────
    const handleSelectApp = async (app: any) => {
        setSelectedApp(app) // Optimistic load
        setUpdateForm({
            status: app.status || 'PENDING',
            recruiterNotes: app.interviewFeedback || app.rejectionReason || '',
            interviewDate: app.interviewDate || ''
        })
        setDetailLoading(true)
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

        try {
            // Using recruiter API to get full application details
            const fullDetails: any = await getJobApplicationById(app.applicationId || app.id)
            if (fullDetails) {
                setSelectedApp(fullDetails)
                setUpdateForm({
                    status: fullDetails.status || 'PENDING',
                    recruiterNotes: fullDetails.interviewFeedback || fullDetails.rejectionReason || '',
                    interviewDate: fullDetails.interviewDate || ''
                })
            }
        } catch (error) {
            console.error("Failed to fetch full application details", error)
        } finally {
            setDetailLoading(false)
        }
    }

    // ── 4. Handle Status Update Submit ─────────────────────────────────────────
    const handleStatusUpdate = async () => {
        if (!selectedApp) return
        setUpdating(true)
        try {
            await updateApplicationStatus(selectedApp.applicationId || selectedApp.id, updateForm)
            alert("Status Updated Successfully! 🎉")

            // Update local states so UI reflects changes immediately without reloading
            setSelectedApp({ ...selectedApp, status: updateForm.status, interviewDate: updateForm.interviewDate })
            setApplications(applications.map(a =>
                (a.applicationId === selectedApp.applicationId || a.id === selectedApp.id)
                    ? { ...a, status: updateForm.status } : a
            ))
        } catch (err: any) {
            alert(err.message || "Failed to update status")
        } finally {
            setUpdating(false)
        }
    }

    // Search filter
    const filteredApps = applications.filter(a =>
        !searchQ.trim() || String(a.applicationId || a.id).includes(searchQ) || a.status.toLowerCase().includes(searchQ.toLowerCase())
    )

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[1300px]">

                {/* Header & Job Selector */}
                <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end gap-6 justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard" className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
                                <FiArrowLeft size={12} /> Back to Dashboard
                            </Link>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Manage <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Candidates</span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1 font-medium">Review AI-matched profiles and manage hiring stages.</p>
                    </div>

                    <div className="w-full md:w-80 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1 block px-1">Select Job Posting</label>
                        {jobsLoading ? (
                            <div className="h-10 flex items-center px-3 text-sm text-zinc-500"><FiLoader className="animate-spin mr-2" /> Loading Jobs...</div>
                        ) : jobs.length === 0 ? (
                            <div className="h-10 flex items-center px-3 text-sm text-red-500">No jobs posted yet</div>
                        ) : (
                            <select
                                value={selectedJobId || ''}
                                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-purple-500 transition-colors"
                            >
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex gap-5 items-start">

                    {/* LEFT: Candidate List */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
                        {/* Search Bar */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 mb-4 shadow-sm flex items-center gap-2 focus-within:border-purple-400 transition-all">
                            <FiSearch className="text-zinc-400 shrink-0 ml-1" size={16} />
                            <input
                                type="text" placeholder="Search Application ID or Status..."
                                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 px-1"
                            />
                            {searchQ && <button onClick={() => setSearchQ('')} className="text-zinc-400"><FiX /></button>}
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {appsLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse h-24" />
                                ))
                            ) : filteredApps.length === 0 ? (
                                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <BsRobot className="text-5xl text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Candidates Found</h3>
                                    <p className="text-sm text-zinc-400 mt-1 max-w-xs mx-auto">Either nobody has applied to this job yet, or your search didn't match anything.</p>
                                </div>
                            ) : filteredApps.map(app => {
                                const isSelected = selectedApp?.applicationId === app.applicationId || selectedApp?.id === app.id
                                const meta = STATUS_META[app.status as AppStatus] || STATUS_META.PENDING

                                return (
                                    <div key={app.applicationId || app.id} onClick={() => handleSelectApp(app)}
                                        className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                                            ${isSelected ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-500/10 shadow-md' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-300'}`}>

                                        {isSelected && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />}

                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                                                <FiUser size={18} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold text-sm truncate mb-0.5 ${isSelected ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                    Application #{app.applicationId || app.id}
                                                </h3>

                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${meta.bg} ${meta.color} ${meta.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                                                    </span>
                                                    {app.aiMatchScore != null && (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                            <BsStars size={11} /> {app.aiMatchScore}% Match
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <FiChevronRight className={`shrink-0 transition-colors mt-2 ${isSelected ? 'text-purple-500' : 'text-zinc-300 dark:text-zinc-600'}`} size={16} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Detail & Action Panel */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl pb-10 scrollbar-hide" ref={detailRef}>
                        {selectedApp ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

                                {/* Header */}
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-500/5 dark:to-pink-500/5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-white dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-md rounded-2xl flex items-center justify-center text-purple-600 text-2xl shrink-0">
                                                <FiUser />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">Candidate Profile</h2>
                                                <p className="text-sm font-semibold text-zinc-500 mt-1">Application #{selectedApp.applicationId || selectedApp.id} • Applied {formatDate(selectedApp.appliedAt)}</p>
                                            </div>
                                        </div>
                                        {selectedApp.resumeUrl && (
                                            <a href={selectedApp.resumeUrl} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform shrink-0">
                                                <FiFileText /> View Resume
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 grid gap-6">
                                    {detailLoading && <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-1/3 animate-pulse rounded-full" /></div>}

                                    {/* AI Insight */}
                                    {selectedApp.aiMatchScore != null && (
                                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                            <ScoreRing score={selectedApp.aiMatchScore} />
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1"><BsRobot /> Orbit AI Analysis</h4>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{selectedApp.aiSummary || 'AI has evaluated this profile against your job requirements.'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cover Letter */}
                                    {selectedApp.coverLetter && (
                                        <div>
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cover Letter / Pitch</h4>
                                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line italic">
                                                "{selectedApp.coverLetter}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Box: Update Status */}
                                    <div className="p-6 rounded-2xl border-2 border-purple-100 dark:border-purple-500/20 bg-purple-50/30 dark:bg-purple-500/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><FiEdit3 size={100} /></div>

                                        <h4 className="flex items-center gap-2 text-lg font-bold text-purple-900 dark:text-purple-300 mb-5 relative z-10"><FiEdit3 /> Manage Hiring Stage</h4>

                                        <div className="grid gap-4 relative z-10">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block mb-1.5">Current Status</label>
                                                    <select
                                                        value={updateForm.status}
                                                        onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                                        className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-zinc-800 dark:text-white outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:bg-zinc-800 transition-all bg-white"
                                                    >
                                                        <option value="PENDING">🕒 Pending Review</option>
                                                        <option value="SHORTLISTED">⭐ Shortlisted</option>
                                                        <option value="INTERVIEW_SCHEDULED">📅 Interview Scheduled</option>
                                                        <option value="SELECTED">🎉 Selected (Hire)</option>
                                                        <option value="REJECTED">❌ Rejected</option>
                                                    </select>
                                                </div>

                                                {updateForm.status === 'INTERVIEW_SCHEDULED' && (
                                                    <div className="animate-fade-in-up">
                                                        <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block mb-1.5">Interview Date</label>
                                                        <input
                                                            type="date"
                                                            value={updateForm.interviewDate}
                                                            onChange={(e) => setUpdateForm({ ...updateForm, interviewDate: e.target.value })}
                                                            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-white outline-none focus:border-purple-500 dark:bg-zinc-800 bg-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider block mb-1.5 flex justify-between">
                                                    <span>Recruiter Notes</span>
                                                    <span className="text-[10px] text-zinc-400 font-medium normal-case">(Candidate will see this)</span>
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={updateForm.recruiterNotes}
                                                    onChange={(e) => setUpdateForm({ ...updateForm, recruiterNotes: e.target.value })}
                                                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-800 dark:text-white outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:bg-zinc-800 bg-white placeholder:text-zinc-400"
                                                    placeholder={updateForm.status === 'REJECTED' ? "Reason for rejection..." : updateForm.status === 'INTERVIEW_SCHEDULED' ? "Provide meeting link or location details..." : "Add your feedback here..."}
                                                />
                                            </div>

                                            <button
                                                onClick={handleStatusUpdate}
                                                disabled={updating}
                                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
                                            >
                                                {updating ? <FiLoader className="animate-spin text-xl" /> : <><FiCheckCircle size={18} /> Update Candidate Status</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[500px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm text-center px-6">
                                <div className="w-24 h-24 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-6">
                                    <FiUser className="text-5xl text-purple-300 dark:text-purple-500/50" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Select a Candidate</h3>
                                <p className="text-sm text-zinc-500 max-w-sm">Choose an application from the list to review their resume, see AI analysis, and manage their hiring stage.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}