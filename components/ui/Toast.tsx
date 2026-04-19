'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi'

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
    id: string
    type: ToastType
    message: string
    duration?: number
}

// ─── Internal State ───────────────────────────────────────────────────────────
type Listener = (toasts: ToastMessage[]) => void
const listeners: Set<Listener> = new Set()
let toasts: ToastMessage[] = []

function notify() {
    listeners.forEach(fn => fn([...toasts]))
}

// ─── Public API — call these anywhere ─────────────────────────────────────────
export const toast = {
    success: (message: string, duration = 4000) => addToast('success', message, duration),
    error:   (message: string, duration = 5000) => addToast('error',   message, duration),
    info:    (message: string, duration = 4000) => addToast('info',    message, duration),
    warning: (message: string, duration = 4000) => addToast('warning', message, duration),
}

function addToast(type: ToastType, message: string, duration: number) {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts = [...toasts, { id, type, message, duration }]
    notify()
    if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
    }
}

function removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id)
    notify()
}

// ─── Config per type ──────────────────────────────────────────────────────────
const CONFIG: Record<ToastType, {
    icon: React.ReactNode
    bg: string
    border: string
    text: string
}> = {
    success: {
        icon: <FiCheckCircle className="shrink-0 text-lg" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/80',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        text: 'text-emerald-800 dark:text-emerald-300',
    },
    error: {
        icon: <FiAlertCircle className="shrink-0 text-lg" />,
        bg: 'bg-red-50 dark:bg-red-950/80',
        border: 'border-red-200 dark:border-red-500/30',
        text: 'text-red-800 dark:text-red-300',
    },
    info: {
        icon: <FiInfo className="shrink-0 text-lg" />,
        bg: 'bg-blue-50 dark:bg-blue-950/80',
        border: 'border-blue-200 dark:border-blue-500/30',
        text: 'text-blue-800 dark:text-blue-300',
    },
    warning: {
        icon: <FiAlertTriangle className="shrink-0 text-lg" />,
        bg: 'bg-amber-50 dark:bg-amber-950/80',
        border: 'border-amber-200 dark:border-amber-500/30',
        text: 'text-amber-800 dark:text-amber-300',
    },
}

// ─── Toast Item ───────────────────────────────────────────────────────────────
function ToastItem({ toast: t, onClose }: { toast: ToastMessage; onClose: () => void }) {
    const [visible, setVisible] = useState(false)
    const cfg = CONFIG[t.type]

    useEffect(() => {
        // Slight delay so the enter animation fires
        const timer = setTimeout(() => setVisible(true), 10)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg shadow-black/10
                backdrop-blur-xl transition-all duration-300
                ${cfg.bg} ${cfg.border} ${cfg.text}
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ minWidth: 280, maxWidth: 420 }}
        >
            {cfg.icon}
            <p className="flex-1 text-sm font-semibold leading-snug">{t.message}</p>
            <button
                onClick={onClose}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
            >
                <FiX size={15} />
            </button>
        </div>
    )
}

// ─── Toast Container — place once in layout or page ───────────────────────────
export function ToastContainer() {
    const [msgs, setMsgs] = useState<ToastMessage[]>([])

    const sync = useCallback((next: ToastMessage[]) => {
        setMsgs(next)
    }, [])

    useEffect(() => {
        listeners.add(sync)
        return () => { listeners.delete(sync) }
    }, [sync])

    if (msgs.length === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {msgs.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onClose={() => removeToast(t.id)} />
                </div>
            ))}
        </div>
    )
}
