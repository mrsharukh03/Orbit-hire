'use client'

import { FiClock, FiStar, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi'

// ─── Types ────────────────────────────────────────────────────────────────────
export type AppStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'SELECTED' | 'REJECTED'

interface StatusConfig {
    label: string
    dot: string
    color: string
    bg: string
    border: string
    icon: React.ReactNode
}

// ─── Config ───────────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<AppStatus, StatusConfig> = {
    PENDING: {
        label: 'Pending',
        dot: 'bg-amber-400',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/20',
        icon: <FiClock size={11} />,
    },
    SHORTLISTED: {
        label: 'Shortlisted',
        dot: 'bg-blue-500',
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/20',
        icon: <FiStar size={11} />,
    },
    INTERVIEW_SCHEDULED: {
        label: 'Interview',
        dot: 'bg-violet-500',
        color: 'text-violet-700 dark:text-violet-300',
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        border: 'border-violet-200 dark:border-violet-500/20',
        icon: <FiCalendar size={11} />,
    },
    SELECTED: {
        label: 'Selected',
        dot: 'bg-emerald-500',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/20',
        icon: <FiCheckCircle size={11} />,
    },
    REJECTED: {
        label: 'Rejected',
        dot: 'bg-red-500',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-500/10',
        border: 'border-red-200 dark:border-red-500/20',
        icon: <FiXCircle size={11} />,
    },
}

// ─── Component ────────────────────────────────────────────────────────────────
interface StatusBadgeProps {
    status: string
    /** 'dot' shows a colored dot, 'icon' shows a react-icon, 'none' shows neither */
    indicator?: 'dot' | 'icon' | 'none'
    size?: 'sm' | 'md'
}

export default function StatusBadge({ status, indicator = 'dot', size = 'md' }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status as AppStatus] ?? {
        label: status,
        dot: 'bg-zinc-400',
        color: 'text-zinc-600 dark:text-zinc-400',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        border: 'border-zinc-200 dark:border-zinc-700',
        icon: null,
    }

    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
    const padding   = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider border
                ${textSize} ${padding} ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
            {indicator === 'dot' && (
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            )}
            {indicator === 'icon' && cfg.icon}
            {cfg.label}
        </span>
    )
}
