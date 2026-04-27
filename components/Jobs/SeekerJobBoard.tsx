'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar'
import { searchJobs, getAiJobMatch, getRecommendedJobs } from '@/services/publicService'
import { applyForJob } from '@/services/seekerService'
import { saveJob, unsaveJob } from '@/services/profileService'
import { toast } from '@/components/ui/Toast'
import {
    FiLoader, FiBriefcase, FiBookmark, FiSend,
    FiCheck, FiTrendingUp, FiChevronLeft, FiChevronRight, FiHeart,
    FiMapPin, FiDollarSign, FiCalendar, FiClock, FiTag, FiX,
    FiAlertCircle, FiStar, FiZap, FiArrowRight, FiTarget,
    FiAlertTriangle, FiThumbsUp, FiMessageSquare, FiTool,
} from 'react-icons/fi'
import { BsStars, BsRobot, BsLightningChargeFill, BsShieldCheck } from 'react-icons/bs'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Job {
    id: number
    title: string
    companyName: string
    companyLogoUrl?: string
    location?: string
    type: string
    minSalary?: number
    maxSalary?: number
    status: string
    viewCount?: number
    featured?: boolean
    requiredSkills?: { id?: number; name: string }[]
    aiMatchScore?: number
}

interface AiJobMatchResult {
    matchPercentage: number
    acceptanceProbability: number
    jobSummary?: string
    skillGaps?: string[]
    thingsToFix?: string[]
    strengthHighlights?: string[]
    interviewTips?: string[]
}

interface JobDetail extends Job {
    description?: string
    category?: string
    experienceRequired?: string
    postedDate?: string
    lastDateToApply?: string
    priorityScore?: number
    active?: boolean
    aiJobMatchResult?: AiJobMatchResult | null
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

function getMatchColor(pct: number) {
    if (pct >= 80) return { ring: 'from-emerald-400 to-teal-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Excellent Match 🎯' }
    if (pct >= 60) return { ring: 'from-blue-400 to-violet-400', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Good Match 👍' }
    if (pct >= 40) return { ring: 'from-amber-400 to-orange-400', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Moderate Match' }
    return { ring: 'from-red-400 to-rose-400', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Low Match' }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse">
            <div className="h-8 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/10 dark:to-violet-500/10 p-6 pb-5">
                <div className="flex gap-4 pt-2">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 shrink-0 mt-2" />
                    <div className="flex-1 space-y-2 pt-2">
                        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-3/4" />
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-1/2" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 h-20 mt-20">
                {[1, 2, 3].map(i => <div key={i} className="bg-zinc-50 dark:bg-zinc-800" />)}
            </div>
            <div className="p-6 space-y-4">
                {[80, 55, 70, 100, 55].map((w, i) => (
                    <div key={i} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg" style={{ width: `${w}%` }} />
                ))}
            </div>
        </div>
    )
}

// ─── AI Match Score Ring ──────────────────────────────────────────────────────
function ScoreRing({ value, size = 80, strokeWidth = 7, gradient }: { value: number; size?: number; strokeWidth?: number; gradient: string }) {
    const r = (size - strokeWidth * 2) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (value / 100) * circ
    const id = `ring-${gradient.replace(/\s/g, '')}`
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={gradient.includes('emerald') ? '#34d399' : gradient.includes('blue') ? '#60a5fa' : gradient.includes('amber') ? '#fbbf24' : '#f87171'} />
                    <stop offset="100%" stopColor={gradient.includes('teal') ? '#14b8a6' : gradient.includes('violet') ? '#a78bfa' : gradient.includes('orange') ? '#fb923c' : '#fb7185'} />
                </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-zinc-100 dark:text-zinc-800" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={`url(#${id})`} strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
            />
        </svg>
    )
}

// ─── Premium AI Match Panel ───────────────────────────────────────────────────
function AiMatchPanel({ ai }: { ai: AiJobMatchResult }) {
    const mc = getMatchColor(ai.matchPercentage)
    const ap = getMatchColor(ai.acceptanceProbability)

    return (
        <div className="space-y-4">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Match % */}
                <div className={`relative overflow-hidden rounded-2xl p-4 border ${mc.bg} border-transparent`} style={{ background: 'linear-gradient(135deg, var(--tw-gradient-stops))', boxShadow: '0 0 0 1px rgba(99,102,241,0.1)' }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${mc.ring} opacity-5 rounded-2xl`} />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Profile Match</p>
                            <p className={`text-3xl font-black ${mc.text} leading-none`}>{ai.matchPercentage}%</p>
                            <p className="text-[10px] font-semibold text-zinc-500 mt-1">{mc.label}</p>
                        </div>
                        <div className="relative shrink-0">
                            <ScoreRing value={ai.matchPercentage} size={60} strokeWidth={5} gradient={mc.ring} />
                            <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${mc.text}`} style={{ fontSize: '10px' }}>
                                {ai.matchPercentage}%
                            </span>
                        </div>
                    </div>
                </div>
                {/* Acceptance % */}
                <div className={`relative overflow-hidden rounded-2xl p-4 ${ap.bg}`} style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.1)' }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${ap.ring} opacity-5 rounded-2xl`} />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Acceptance</p>
                            <p className={`text-3xl font-black ${ap.text} leading-none`}>{ai.acceptanceProbability}%</p>
                            <p className="text-[10px] font-semibold text-zinc-500 mt-1">Probability</p>
                        </div>
                        <div className="relative shrink-0">
                            <ScoreRing value={ai.acceptanceProbability} size={60} strokeWidth={5} gradient={ap.ring} />
                            <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${ap.text}`} style={{ fontSize: '10px' }}>
                                {ai.acceptanceProbability}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Summary */}
            {ai.jobSummary && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10 border border-violet-100 dark:border-violet-800/20">
                    <p className="flex items-center gap-2 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">
                        <BsRobot size={12} /> AI Summary
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{ai.jobSummary}</p>
                </div>
            )}

            {/* Strength Highlights */}
            {ai.strengthHighlights && ai.strengthHighlights.length > 0 && (
                <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                        <FiThumbsUp size={11} /> Your Strengths
                    </p>
                    <div className="space-y-2">
                        {ai.strengthHighlights.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
                                <FiCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skill Gaps */}
            {ai.skillGaps && ai.skillGaps.length > 0 && (
                <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
                        <FiAlertTriangle size={11} /> Skill Gaps
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {ai.skillGaps.map((g, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                                {g}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Things to Fix */}
            {ai.thingsToFix && ai.thingsToFix.length > 0 && (
                <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">
                        <FiTool size={11} /> Improve Your Application
                    </p>
                    <div className="space-y-2">
                        {ai.thingsToFix.map((t, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/20">
                                <FiArrowRight size={12} className="text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{t}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Interview Tips */}
            {ai.interviewTips && ai.interviewTips.length > 0 && (
                <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                        <FiMessageSquare size={11} /> Interview Tips
                    </p>
                    <div className="space-y-2">
                        {ai.interviewTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                                <BsLightningChargeFill size={11} className="text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetailPanel({
    job, loading,
    onApply, onToggleSave,
    isApplied, isSaved, isApplying, isSaving,
    onClose,
}: {
    job: JobDetail | null
    loading: boolean
    onApply: (id: number) => void
    onToggleSave: (id: number) => void
    isApplied: boolean
    isSaved: boolean
    isApplying: boolean
    isSaving: boolean
    onClose?: () => void
}) {
    if (loading) return <DetailSkeleton />
    if (!job) return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5">
                <FiBriefcase className="text-4xl text-blue-300 dark:text-blue-500/50" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Select a Job</h3>
            <p className="text-sm text-zinc-400 max-w-xs">Click any job from the list to view full details and your personalized AI match.</p>
        </div>
    )

    const salary = formatSalary(job.minSalary, job.maxSalary)
    const deadline = formatDate(job.lastDateToApply)
    const posted = formatDate(job.postedDate)
    const deadlinePassed = job.lastDateToApply && new Date(job.lastDateToApply) < new Date()
    const typeColor = TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-600 border-zinc-200'
    const ai = job.aiJobMatchResult
    const mc = ai ? getMatchColor(ai.matchPercentage) : null

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="relative p-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-violet-50/80 dark:from-blue-500/5 dark:to-violet-500/5" />
                <div className="relative">
                    {onClose && (
                        <button onClick={onClose} className="absolute top-0 right-0 w-8 h-8 rounded-xl bg-white/80 dark:bg-zinc-800 backdrop-blur-sm flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors">
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
                                {ai && (
                                    <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${mc?.bg} ${mc?.text} border-current/20`}>
                                        <BsStars size={11} /> {ai.matchPercentage}% match
                                    </span>
                                )}
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
            <div className="p-6 space-y-5 max-h-[calc(100vh-22rem)] overflow-y-auto">

                {/* Deadline overdue warning */}
                {deadlinePassed && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-semibold">
                        <FiAlertCircle className="shrink-0" /> Application deadline has passed.
                    </div>
                )}

                {/* Meta bar */}
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

                {/* ─── AI Match Result ────────────────────────────────────── */}
                {ai ? (
                    <div>
                        {/* Header badge */}
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[11px] font-bold shadow-lg shadow-violet-500/25">
                                <BsStars size={12} /> AI Match Analysis
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-transparent dark:from-violet-800/40" />
                        </div>
                        <AiMatchPanel ai={ai} />
                    </div>
                ) : (
                    /* AI loading shimmer — happens when result is being computed */
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10 border border-violet-100 dark:border-violet-800/20 text-center">
                        <FiLoader className="animate-spin text-violet-500 mx-auto mb-2" size={18} />
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">AI is analyzing this job for you…</p>
                    </div>
                )}

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
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </div>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-3">
                    {/* Save button */}
                    <button
                        onClick={() => onToggleSave(job.id)}
                        disabled={isSaving}
                        className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-95 shrink-0
                            ${isSaved
                                ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50'
                                : 'text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-pink-300 hover:text-pink-600'
                            }`}
                    >
                        {isSaving
                            ? <FiLoader className="animate-spin" size={16} />
                            : <FiBookmark size={16} className={isSaved ? 'fill-current' : ''} />
                        }
                        {isSaved ? 'Saved' : 'Save'}
                    </button>

                    {/* Apply button */}
                    <button
                        onClick={() => onApply(job.id)}
                        disabled={isApplied || isApplying || !!deadlinePassed}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95
                            ${isApplied
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-default'
                                : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {isApplying
                            ? <><FiLoader className="animate-spin" size={16} /> Applying...</>
                            : isApplied
                                ? <><FiCheck size={16} /> Applied</>
                                : <><FiZap size={16} /> Quick Apply</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SeekerJobBoard() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const detailRef = useRef<HTMLDivElement>(null)

    // ── Job list state ────────────────────────────────────────────────────────
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasSearched, setHasSearched] = useState(false)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentFilters, setCurrentFilters] = useState<SearchBarFilters>({})
    const [isRecommended, setIsRecommended] = useState(false)

    // ── Detail panel state ────────────────────────────────────────────────────
    const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

    // ── Apply / Save state ────────────────────────────────────────────────────
    const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set())
    const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())
    const [applyingId, setApplyingId] = useState<number | null>(null)
    const [savingId, setSavingId] = useState<number | null>(null)

    // ── Fetch recommendations on mount ───────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError('')
                const data = await getRecommendedJobs()
                const content = Array.isArray(data) ? data : (data?.content || [])
                setJobs(content)
                setTotalPages(data?.totalPages || 1)
                setIsRecommended(true)
                if (content.length > 0) handleSelectJob(content[0].id)
            } catch {
                // Fallback to popular jobs if recommends fails (e.g. no profile yet)
                try {
                    const { getPopularJobs } = await import('@/services/publicService')
                    const data = await getPopularJobs(0, 12)
                    const content = data?.content || data || []
                    setJobs(Array.isArray(content) ? content : [])
                    setTotalPages(data?.totalPages || 1)
                    setIsRecommended(false)
                    if (content.length > 0) handleSelectJob(content[0].id)
                } catch (err: any) {
                    setError(err.message || 'Failed to load jobs')
                }
            } finally {
                setLoading(false)
            }
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── URL params from home search ───────────────────────────────────────────
    useEffect(() => {
        const kw = searchParams.get('q') || searchParams.get('keyword')
        const loc = searchParams.get('location')
        if (kw || loc) {
            handleSearch({ keyword: kw || undefined, location: loc || undefined })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Fetch single job detail (AI match endpoint for logged-in seekers) ─────
    const handleSelectJob = async (jobId: number) => {
        setDetailLoading(true)
        setMobileDetailOpen(true)
        detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        try {
            // Use the AI-powered endpoint for logged-in seekers
            const detail = await getAiJobMatch(jobId)
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
            if (content.length > 0) handleSelectJob(content[0].id)
            else setSelectedJob(null)
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

    // ── Apply ─────────────────────────────────────────────────────────────────
    const handleApply = async (jobId: number) => {
        if (appliedJobs.has(jobId)) return
        try {
            setApplyingId(jobId)
            await applyForJob(jobId)
            setAppliedJobs(prev => new Set(prev).add(jobId))
            toast.success('Application submitted! 🎉')
        } catch (err: any) {
            toast.error(err.message || 'Failed to apply')
        } finally {
            setApplyingId(null)
        }
    }

    // ── Save / Unsave ─────────────────────────────────────────────────────────
    const handleToggleSave = async (jobId: number) => {
        try {
            setSavingId(jobId)
            if (savedJobs.has(jobId)) {
                await unsaveJob(jobId)
                setSavedJobs(prev => { const n = new Set(prev); n.delete(jobId); return n })
                toast.info('Job removed from saved')
            } else {
                await saveJob(jobId)
                setSavedJobs(prev => new Set(prev).add(jobId))
                toast.success('Job saved! ❤️')
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to save job')
        } finally {
            setSavingId(null)
        }
    }

    const isLoading = loading || searchLoading

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-950">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-3">
                            {isRecommended && !hasSearched ? <BsRobot size={12} /> : <FiTrendingUp size={12} />}
                            {isRecommended && !hasSearched ? 'AI Recommendations' : 'Job Board'}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                            {isRecommended && !hasSearched
                                ? <>Jobs <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Matched for You</span></>
                                : <>Explore <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Opportunities</span></>
                            }
                        </h1>
                        {isRecommended && !hasSearched && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                <BsStars className="text-violet-500" /> Personalized based on your profile and skills
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={() => router.push('/applications')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 transition-all">
                            <FiBriefcase size={14} /> My Applications
                        </button>
                        <button onClick={() => router.push('/saved-jobs')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-pink-400 hover:text-pink-600 transition-all">
                            <FiHeart size={14} /> Saved
                        </button>
                    </div>
                </div>
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

            {/* ── Main layout ──────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto">
                {!isLoading && (
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {hasSearched ? 'Search Results'
                                : isRecommended ? 'Your AI Recommendations'
                                    : 'Popular Jobs'}
                        </h2>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                        </span>
                    </div>
                )}

                <div className="flex gap-5 items-start">
                    {/* ── LEFT: Job List ─────────────────────────────────── */}
                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <FiLoader className="text-blue-500 animate-spin text-3xl mb-3" />
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {searchLoading ? 'Searching...' : 'Loading personalized jobs...'}
                                </p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <FiBriefcase className="text-5xl text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
                                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                    {hasSearched ? 'No jobs match your search' : 'No recommendations yet'}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
                                    {hasSearched ? 'Try adjusting filters.' : 'Complete your profile to get personalized recommendations.'}
                                </p>
                                {!hasSearched && (
                                    <button onClick={() => router.push('/profile')}
                                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
                                        <FiArrowRight size={14} /> Complete Profile
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map(job => {
                                    const isSelected = selectedJob?.id === job.id
                                    const applied = appliedJobs.has(job.id)
                                    const saved = savedJobs.has(job.id)

                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => handleSelectJob(job.id)}
                                            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
                                                ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/5 shadow-md shadow-blue-500/10'
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md'
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full" />
                                            )}
                                            {job.featured && (
                                                <div className="absolute -top-2 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-bold text-white shadow-sm">
                                                    <FiStar size={9} /> FEATURED
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3">
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
                                                        ${isSelected
                                                            ? 'text-blue-700 dark:text-blue-400'
                                                            : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600'
                                                        }`}>
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">{job.companyName}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        {job.location && (
                                                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                                                                <FiMapPin size={11} />
                                                                <span className="truncate max-w-[90px]">{job.location}</span>
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${TYPE_COLORS[job.type] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                                            {TYPE_LABELS[job.type] || job.type}
                                                        </span>
                                                        {job.aiMatchScore != null && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                <BsStars size={10} /> {job.aiMatchScore}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Applied / Saved chips */}
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {applied && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <FiCheck size={10} /> Applied
                                                        </span>
                                                    )}
                                                    {saved && (
                                                        <span className="text-[10px] font-bold text-pink-500">
                                                            ❤️ Saved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Salary & view cue */}
                                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                                                {job.minSalary || job.maxSalary ? (
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        <FiDollarSign className="inline" size={11} />
                                                        {formatSalary(job.minSalary, job.maxSalary)}
                                                    </span>
                                                ) : <span />}
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View & Apply →
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoading && hasSearched && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    <FiChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{page + 1} / {totalPages}</span>
                                <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}
                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    Next <FiChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Detail Panel (Desktop) ──────────────────── */}
                    <div className="hidden lg:block flex-1 sticky top-24 max-h-[calc(100vh-6rem)]" ref={detailRef}>
                        <JobDetailPanel
                            job={selectedJob}
                            loading={detailLoading}
                            onApply={handleApply}
                            onToggleSave={handleToggleSave}
                            isApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false}
                            isSaved={selectedJob ? savedJobs.has(selectedJob.id) : false}
                            isApplying={selectedJob?.id === applyingId}
                            isSaving={selectedJob?.id === savingId}
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
                            <button onClick={() => setMobileDetailOpen(false)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <FiX size={15} />
                            </button>
                        </div>
                        <div className="p-4">
                            <JobDetailPanel
                                job={selectedJob}
                                loading={detailLoading}
                                onApply={handleApply}
                                onToggleSave={handleToggleSave}
                                isApplied={selectedJob ? appliedJobs.has(selectedJob.id) : false}
                                isSaved={selectedJob ? savedJobs.has(selectedJob.id) : false}
                                isApplying={selectedJob?.id === applyingId}
                                isSaving={selectedJob?.id === savingId}
                                onClose={() => setMobileDetailOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}