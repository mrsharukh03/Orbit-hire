'use client'

import { FiMapPin, FiClock, FiBriefcase, FiDollarSign, FiCalendar, FiStar } from "react-icons/fi"

export interface Job {
    id: number
    title: string
    companyName: string
    companyLogoUrl?: string
    location: string
    type: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'REMOTE'
    category?: string
    minSalary?: number
    maxSalary?: number
    experienceRequired?: string
    description?: string
    lastDateToApply?: string
    featured?: boolean
    active?: boolean
    requiredSkills?: { id?: number; name: string }[]
    status?: string
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    FULL_TIME: { label: 'Full Time', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    PART_TIME: { label: 'Part Time', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    INTERNSHIP: { label: 'Internship', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
    REMOTE: { label: 'Remote', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
}

function formatSalary(val?: number) {
    if (!val) return null
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
    return `₹${val}`
}

interface JobCardProps {
    job: Job
    actionButton: React.ReactNode
    onCardClick?: () => void
}

export default function JobCard({ job, actionButton, onCardClick }: JobCardProps) {
    const typeInfo = TYPE_LABELS[job.type] || { label: job.type, color: 'bg-zinc-100 text-zinc-600' }
    const minS = formatSalary(job.minSalary)
    const maxS = formatSalary(job.maxSalary)
    const salaryText = minS && maxS ? `${minS} – ${maxS}` : minS || maxS || null

    return (
        <div
            onClick={onCardClick}
            className={`group relative cursor-pointer rounded-2xl border bg-white dark:bg-zinc-900/80 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 ${job.featured
                ? 'border-amber-300/60 dark:border-amber-500/30 ring-1 ring-amber-200/40 dark:ring-amber-500/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300/50 dark:hover:border-blue-500/30'
                }`}
        >
            {/* Featured badge */}
            {job.featured && (
                <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-[10px] font-bold text-white shadow-lg shadow-amber-500/30">
                    <FiStar size={10} /> FEATURED
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                    {job.companyLogoUrl ? (
                        <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        <span className="text-lg font-bold bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {job.companyName?.charAt(0)?.toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                                {job.companyName}
                            </p>
                        </div>
                        {/* Type badge */}
                        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold ${typeInfo.color}`}>
                            {typeInfo.label}
                        </span>
                    </div>

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><FiMapPin size={12} /> {job.location}</span>
                        {job.experienceRequired && (
                            <span className="flex items-center gap-1"><FiBriefcase size={12} /> {job.experienceRequired}</span>
                        )}
                        {salaryText && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <FiDollarSign size={12} /> {salaryText}
                            </span>
                        )}
                        {job.lastDateToApply && (
                            <span className="flex items-center gap-1"><FiCalendar size={12} /> Apply by {job.lastDateToApply}</span>
                        )}
                    </div>

                    {/* Skills Row */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.requiredSkills.slice(0, 5).map((skill, i) => (
                                <span key={skill.id || i}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                                    {skill.name}
                                </span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                    +{job.requiredSkills.length - 5} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-end mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                    {actionButton}
                </div>
            </div>
        </div>
    )
}