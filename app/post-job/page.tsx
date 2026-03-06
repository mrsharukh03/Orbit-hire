'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    FiBriefcase, FiMapPin, FiDollarSign, FiCalendar,
    FiPlus, FiX, FiCheck, FiLoader, FiAlertCircle,
    FiArrowLeft, FiStar, FiFileText, FiTag, FiEye,
    FiCheckCircle, FiChevronDown,
} from 'react-icons/fi'
import { BsBuilding, BsStars } from 'react-icons/bs'
import { postJob, type JobPostDTO } from '@/services/recruiterService'

// ─── Constants ────────────────────────────────────────────────────────────────
const JOB_TYPES = [
    { value: 'FULL_TIME', label: 'Full Time', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20' },
    { value: 'PART_TIME', label: 'Part Time', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' },
    { value: 'INTERNSHIP', label: 'Internship', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20' },
    { value: 'REMOTE', label: 'Remote', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' },
] as const

const JOB_STATUSES = [
    { value: 'OPEN', label: 'Open — Accepting Applications', icon: '🟢' },
    { value: 'CLOSED', label: 'Closed — Not Accepting', icon: '🔴' },
] as const

const CATEGORIES = [
    'Technology', 'Design', 'Marketing', 'Finance', 'Engineering',
    'Product', 'Sales', 'Healthcare', 'Education', 'Operations',
    'Data Science', 'DevOps', 'Security', 'Research', 'Customer Support',
]

const EXPERIENCE_OPTIONS = [
    'Fresher', '0-1 Years', '1-3 Years', '3-5 Years', '5-8 Years', '8+ Years',
]

// ─── Form Steps ───────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'Basic Info', icon: <FiBriefcase /> },
    { id: 2, label: 'Details', icon: <FiFileText /> },
    { id: 3, label: 'Skills & Pay', icon: <FiTag /> },
    { id: 4, label: 'Review', icon: <FiEye /> },
]

// ─── Default Form State ───────────────────────────────────────────────────────
const DEFAULT_FORM: JobPostDTO = {
    title: '',
    description: '',
    location: '',
    type: 'FULL_TIME',
    category: '',
    companyName: '',
    companyLogoUrl: '',
    experienceRequired: '',
    status: 'OPEN',
    lastDateToApply: '',
    requiredSkills: [],
    minSalary: undefined,
    maxSalary: undefined,
    featured: false,
    priorityScore: 0,
    active: true,
}

// ─── Input Wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: {
    label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1.5 text-xs text-zinc-400 font-medium">{hint}</p>}
        </div>
    )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input {...props}
            className={`w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700
                rounded-xl outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400
                focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all ${className}`} />
    )
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea {...props}
            className={`w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700
                rounded-xl outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 resize-none
                focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all ${className}`} />
    )
}

function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select {...props}
                className={`w-full px-4 py-3 pr-10 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700
                    rounded-xl outline-none text-zinc-800 dark:text-zinc-100 appearance-none
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all ${className}`}>
                {children}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PostJobPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<JobPostDTO>(DEFAULT_FORM)
    const [skillInput, setSkillInput] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const topRef = useRef<HTMLDivElement>(null)

    const set = (field: keyof JobPostDTO, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }))

    const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

    // ── Skill Tag Management ──────────────────────────────────────────────────
    const addSkill = () => {
        const name = skillInput.trim()
        if (!name) return
        if (form.requiredSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            setSkillInput('')
            return
        }
        set('requiredSkills', [...form.requiredSkills, { name }])
        setSkillInput('')
    }

    const removeSkill = (name: string) =>
        set('requiredSkills', form.requiredSkills.filter(s => s.name !== name))

    // ── Validation ────────────────────────────────────────────────────────────
    const errors = {
        title: !form.title.trim() ? 'Job title is required' : form.title.length > 255 ? 'Max 255 characters' : '',
        description: !form.description.trim() ? 'Description is required' : form.description.length > 3000 ? 'Max 3000 characters' : '',
        location: !form.location.trim() ? 'Location is required' : '',
        companyName: !form.companyName.trim() ? 'Company name is required' : '',
        category: !form.category ? 'Please select a category' : '',
        experienceRequired: !form.experienceRequired ? 'Please select experience level' : '',
        requiredSkills: form.requiredSkills.length === 0 ? 'Add at least one required skill' : '',
    }

    const step1Valid = !errors.title && !errors.companyName && !errors.location && form.type
    const step2Valid = !errors.description && !errors.category && !errors.experienceRequired
    const step3Valid = !errors.requiredSkills
    const allValid = step1Valid && step2Valid && step3Valid

    const goNext = () => {
        setTouched(t => ({
            ...t,
            title: true, companyName: true, location: true,
            description: true, category: true, experienceRequired: true,
        }))
        if (step === 1 && !step1Valid) return
        if (step === 2 && !step2Valid) return
        if (step < 4) { setStep(s => s + 1); topRef.current?.scrollIntoView({ behavior: 'smooth' }) }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!allValid) return
        setSubmitting(true)
        setSubmitError('')
        try {
            // Clean payload — strip empty optional fields
            const payload: JobPostDTO = {
                ...form,
                companyLogoUrl: form.companyLogoUrl || undefined,
                lastDateToApply: form.lastDateToApply || undefined,
                minSalary: form.minSalary || undefined,
                maxSalary: form.maxSalary || undefined,
                priorityScore: form.priorityScore || undefined,
            }
            await postJob(payload)
            setSubmitSuccess(true)
        } catch (err: any) {
            setSubmitError(err?.message || 'Failed to post job. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ─── Success Screen ───────────────────────────────────────────────────────
    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-16 flex items-center justify-center">
                <div className="max-w-lg w-full mx-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-10 text-center shadow-xl">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <FiCheckCircle className="text-4xl text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">Job Posted! 🎉</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-8">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">"{form.title}"</span> at{' '}
                        <span className="font-bold text-blue-600">{form.companyName}</span> is now live and visible to candidates.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => { setForm(DEFAULT_FORM); setStep(1); setSubmitSuccess(false); setTouched({}) }}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                            <FiPlus /> Post Another Job
                        </button>
                        <Link href="/dashboard"
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16" ref={topRef}>
            {/* Ambient */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px]
                bg-gradient-to-r from-blue-500/8 via-violet-500/8 to-emerald-500/8
                rounded-full blur-[140px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10 max-w-[900px]">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="pt-8 pb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Link href="/dashboard"
                            className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
                            <FiArrowLeft size={12} /> Dashboard
                        </Link>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                Post a <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">New Job</span>
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                                Fill in the details below — your listing will be visible to thousands of candidates.
                            </p>
                        </div>
                        <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <BsBuilding className="text-white text-2xl" />
                        </div>
                    </div>
                </div>

                {/* ── Stepper ─────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => s.id < step && setStep(s.id)}
                                disabled={s.id > step}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
                                    ${step === s.id
                                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent shadow-md shadow-blue-600/20'
                                        : s.id < step
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 cursor-pointer'
                                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                                    }`}>
                                {s.id < step
                                    ? <FiCheck size={12} />
                                    : <span className="text-[11px]">{s.icon}</span>
                                }
                                {s.label}
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={`w-6 h-px shrink-0 transition-all ${s.id < step ? 'bg-emerald-300 dark:bg-emerald-500/40' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Card ─────────────────────────────────────────────────── */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">

                    {/* Progress bar */}
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-500 rounded-full"
                            style={{ width: `${(step / STEPS.length) * 100}%` }} />
                    </div>

                    <div className="p-6 md:p-8">

                        {/* ════ STEP 1: Basic Info ═════════════════════════ */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">Basic Information</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Start with the essentials candidates see first.</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="sm:col-span-2">
                                        <Field label="Job Title" required>
                                            <Input
                                                value={form.title}
                                                onChange={e => set('title', e.target.value)}
                                                onBlur={() => touch('title')}
                                                placeholder="e.g. Senior Full Stack Engineer"
                                                maxLength={255}
                                            />
                                            {touched.title && errors.title && (
                                                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.title}</p>
                                            )}
                                            <p className="mt-1 text-xs text-zinc-400">{form.title.length}/255</p>
                                        </Field>
                                    </div>

                                    <Field label="Company Name" required>
                                        <Input
                                            value={form.companyName}
                                            onChange={e => set('companyName', e.target.value)}
                                            onBlur={() => touch('companyName')}
                                            placeholder="e.g. Tech Solutions Pvt. Ltd."
                                        />
                                        {touched.companyName && errors.companyName && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.companyName}</p>
                                        )}
                                    </Field>

                                    <Field label="Company Logo URL" hint="Paste a URL to your company logo (optional)">
                                        <Input
                                            type="url"
                                            value={form.companyLogoUrl}
                                            onChange={e => set('companyLogoUrl', e.target.value)}
                                            placeholder="https://company.com/logo.png"
                                        />
                                    </Field>

                                    <Field label="Location" required>
                                        <Input
                                            value={form.location}
                                            onChange={e => set('location', e.target.value)}
                                            onBlur={() => touch('location')}
                                            placeholder="e.g. Bangalore, India"
                                        />
                                        {touched.location && errors.location && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.location}</p>
                                        )}
                                    </Field>

                                    <Field label="Application Deadline" hint="Leave blank for open-ended listing">
                                        <Input
                                            type="date"
                                            value={form.lastDateToApply}
                                            onChange={e => set('lastDateToApply', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </Field>
                                </div>

                                {/* Job Type Selector */}
                                <Field label="Job Type" required>
                                    <div className="flex flex-wrap gap-3">
                                        {JOB_TYPES.map(t => (
                                            <button key={t.value} type="button"
                                                onClick={() => set('type', t.value)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all
                                                    ${form.type === t.value
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600'
                                                    }`}>
                                                {form.type === t.value && <FiCheck size={13} />}
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </Field>

                                {/* Status */}
                                <Field label="Job Status" required>
                                    <div className="flex flex-wrap gap-3">
                                        {JOB_STATUSES.map(s => (
                                            <button key={s.value} type="button"
                                                onClick={() => set('status', s.value)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all
                                                    ${form.status === s.value
                                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-md'
                                                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                                                    }`}>
                                                <span className="text-xs">{s.icon}</span> {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </Field>

                                {/* Featured toggle */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <FiStar className="text-amber-500 text-lg" />
                                        <div>
                                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">Featured Listing</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Get 3× more applicants by boosting visibility</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => set('featured', !form.featured)}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.featured ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.featured ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ════ STEP 2: Details ════════════════════════════ */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">Job Details</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Describe the role and requirements clearly.</p>
                                </div>

                                <Field label="Job Description" required hint={`${form.description.length}/3000 characters`}>
                                    <Textarea
                                        value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        onBlur={() => touch('description')}
                                        placeholder="Describe the role, responsibilities, team, and what makes this opportunity exciting..."
                                        rows={10}
                                        maxLength={3000}
                                    />
                                    {touched.description && errors.description && (
                                        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.description}</p>
                                    )}
                                </Field>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    <Field label="Category" required>
                                        <Select value={form.category} onChange={e => { set('category', e.target.value); touch('category') }}>
                                            <option value="">Select a category...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </Select>
                                        {touched.category && errors.category && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.category}</p>
                                        )}
                                    </Field>

                                    <Field label="Experience Required" required>
                                        <Select value={form.experienceRequired} onChange={e => { set('experienceRequired', e.target.value); touch('experienceRequired') }}>
                                            <option value="">Select experience level...</option>
                                            {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                        </Select>
                                        {touched.experienceRequired && errors.experienceRequired && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.experienceRequired}</p>
                                        )}
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* ════ STEP 3: Skills & Pay ═══════════════════════ */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">Skills & Compensation</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Specify required skills, salary range, and priority.</p>
                                </div>

                                {/* Required Skills */}
                                <Field label="Required Skills" required hint="Type and press Enter or click + to add">
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={e => setSkillInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                                            placeholder="e.g. React, TypeScript, Node.js..."
                                            className="flex-1 px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                                        />
                                        <button type="button" onClick={addSkill}
                                            className="w-12 h-[46px] flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95">
                                            <FiPlus size={18} />
                                        </button>
                                    </div>
                                    {/* Skills Tags */}
                                    {form.requiredSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {form.requiredSkills.map(s => (
                                                <span key={s.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                                                    {s.name}
                                                    <button type="button" onClick={() => removeSkill(s.name)}
                                                        className="text-violet-400 hover:text-violet-700 dark:hover:text-violet-200 transition-colors">
                                                        <FiX size={11} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {touched.requiredSkills && errors.requiredSkills && (
                                        <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1"><FiAlertCircle size={11} /> {errors.requiredSkills}</p>
                                    )}
                                </Field>

                                {/* Salary */}
                                <Field label="Salary Range (₹/year)" hint="Optional — leave blank if not disclosed">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₹</span>
                                            <Input
                                                type="number"
                                                value={form.minSalary ?? ''}
                                                onChange={e => set('minSalary', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Minimum salary"
                                                className="pl-8"
                                                min={0}
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₹</span>
                                            <Input
                                                type="number"
                                                value={form.maxSalary ?? ''}
                                                onChange={e => set('maxSalary', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Maximum salary"
                                                className="pl-8"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </Field>

                                {/* Priority Score */}
                                <Field label="Priority Score (0–100)" hint="Higher score = more visibility in search results">
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="range"
                                            min={0} max={100} step={5}
                                            value={form.priorityScore || 0}
                                            onChange={e => set('priorityScore', Number(e.target.value))}
                                            className="flex-1 h-2 accent-blue-600 bg-transparent border-none focus:ring-0 p-0"
                                        />
                                        <span className="w-12 text-center text-sm font-extrabold text-blue-600 dark:text-blue-400">
                                            {form.priorityScore || 0}
                                        </span>
                                    </div>
                                </Field>
                            </div>
                        )}

                        {/* ════ STEP 4: Review ═════════════════════════════ */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-1">Review & Publish</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Confirm the details before posting your job.</p>
                                </div>

                                {/* Preview Card */}
                                <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                    {/* Card header */}
                                    <div className="relative p-5 border-b border-zinc-200 dark:border-zinc-700">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5" />
                                        <div className="relative flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md overflow-hidden shrink-0">
                                                {form.companyLogoUrl
                                                    ? <img src={form.companyLogoUrl} alt={form.companyName} className="w-full h-full object-cover" />
                                                    : <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.companyName || 'Co')}&backgroundColor=2563eb&textColor=ffffff`}
                                                        alt={form.companyName || 'Company'} className="w-full h-full object-cover" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">{form.title || '—'}</h3>
                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{form.companyName || '—'}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {form.location && <span className="flex items-center gap-1 text-xs text-zinc-500"><FiMapPin size={11} />{form.location}</span>}
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${JOB_TYPES.find(t => t.value === form.type)?.color || ''}`}>
                                                        {JOB_TYPES.find(t => t.value === form.type)?.label}
                                                    </span>
                                                    {form.featured && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                            <FiStar size={10} className="fill-current" /> Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review rows */}
                                    <div className="p-5 space-y-4">
                                        {[
                                            { label: 'Category', value: form.category },
                                            { label: 'Experience', value: form.experienceRequired },
                                            { label: 'Status', value: form.status },
                                            { label: 'Deadline', value: form.lastDateToApply || 'Open-ended' },
                                            { label: 'Salary', value: form.minSalary || form.maxSalary ? `₹${(form.minSalary || 0).toLocaleString()} – ₹${(form.maxSalary || 0).toLocaleString()}` : 'Not disclosed' },
                                            { label: 'Priority Score', value: `${form.priorityScore || 0}/100` },
                                        ].map(row => (
                                            <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{row.label}</span>
                                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{row.value}</span>
                                            </div>
                                        ))}

                                        {/* Skills preview */}
                                        {form.requiredSkills.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Required Skills</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {form.requiredSkills.map(s => (
                                                        <span key={s.name} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description preview */}
                                        <div>
                                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Description Preview</p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-5 whitespace-pre-line">{form.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Error */}
                                {submitError && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                                        <FiAlertCircle className="shrink-0" /> {submitError}
                                    </div>
                                )}

                                {/* Warning if invalid */}
                                {!allValid && (
                                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
                                        <FiAlertCircle className="shrink-0" />
                                        Some required fields are missing. Go back and fill them in.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Navigation Footer ────────────────────────── */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={() => step > 1 && setStep(s => s - 1)}
                                disabled={step === 1}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 disabled:opacity-30 transition-all">
                                <FiArrowLeft size={14} /> Back
                            </button>

                            <div className="flex items-center gap-1.5">
                                {STEPS.map(s => (
                                    <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${s.id === step ? 'w-6 bg-blue-600' : s.id < step ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                                ))}
                            </div>

                            {step < 4
                                ? <button onClick={goNext}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                    Continue <FiCheck size={14} />
                                </button>
                                : <button onClick={handleSubmit} disabled={submitting || !allValid}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-60">
                                    {submitting ? <><FiLoader className="animate-spin" /> Publishing…</> : <><BsStars /> Publish Job</>}
                                </button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
