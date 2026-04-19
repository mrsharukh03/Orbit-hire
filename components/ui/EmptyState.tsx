'use client'

import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

interface EmptyStateProps {
    /** React node for the icon (e.g. <FiBriefcase className="text-4xl" />) */
    icon: React.ReactNode
    title: string
    description?: string
    /** If provided, renders a CTA button */
    action?: {
        label: string
        href?: string
        onClick?: () => void
        variant?: 'primary' | 'secondary'
    }
    /** Extra class for outer wrapper */
    className?: string
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-20 text-center px-4 ${className}`}>
            <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5 text-zinc-300 dark:text-zinc-600">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-5">{description}</p>
            )}
            {action && (
                action.href ? (
                    <Link
                        href={action.href}
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95
                            ${action.variant === 'secondary'
                                ? 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20'
                            }`}
                    >
                        {action.label} <FiArrowRight size={14} />
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95
                            ${action.variant === 'secondary'
                                ? 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                : 'text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20'
                            }`}
                    >
                        {action.label} <FiArrowRight size={14} />
                    </button>
                )
            )}
        </div>
    )
}
