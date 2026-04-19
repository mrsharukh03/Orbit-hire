'use client'

import { FiLoader } from 'react-icons/fi'

interface LoadingSpinnerProps {
    /** 'sm' | 'md' | 'lg' | 'xl' — defaults to 'md' */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** Optional message shown below the spinner */
    message?: string
    /** If true, centers itself in a full-height container */
    fullPage?: boolean
}

const SIZE_MAP = {
    sm:  { icon: 'text-lg',  container: 'h-10' },
    md:  { icon: 'text-3xl', container: 'h-32' },
    lg:  { icon: 'text-4xl', container: 'h-64' },
    xl:  { icon: 'text-5xl', container: 'h-screen' },
}

export default function LoadingSpinner({ size = 'md', message, fullPage = false }: LoadingSpinnerProps) {
    const { icon, container } = SIZE_MAP[size]
    const wrapperClass = fullPage
        ? 'min-h-screen flex flex-col items-center justify-center gap-3'
        : `flex flex-col items-center justify-center gap-3 ${container}`

    return (
        <div className={wrapperClass}>
            <FiLoader className={`text-blue-500 animate-spin ${icon}`} />
            {message && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{message}</p>
            )}
        </div>
    )
}
