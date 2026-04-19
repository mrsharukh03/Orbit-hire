'use client'

import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'

interface Breadcrumb {
    label: string
    href: string
}

interface PageHeaderProps {
    /** The main page title — wrap highlight words in <span> with gradient class if needed */
    title: React.ReactNode
    subtitle?: string
    breadcrumb?: Breadcrumb
    /** Slot for right-side action buttons */
    actions?: React.ReactNode
    className?: string
}

export default function PageHeader({ title, subtitle, breadcrumb, actions, className = '' }: PageHeaderProps) {
    return (
        <div className={`pt-8 pb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between ${className}`}>
            <div>
                {breadcrumb && (
                    <Link
                        href={breadcrumb.href}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-3"
                    >
                        <FiArrowLeft size={12} />
                        {breadcrumb.label}
                    </Link>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
            )}
        </div>
    )
}
