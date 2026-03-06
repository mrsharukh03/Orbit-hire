'use client'

import { useState } from 'react'
import {
    FiSearch, FiMapPin, FiSliders, FiX, FiRefreshCw,
} from 'react-icons/fi'

// ─── Constants ────────────────────────────────────────────────────────────────
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'REMOTE'] as const
const JOB_TYPE_LABELS: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    INTERNSHIP: 'Internship',
    REMOTE: 'Remote',
}

const CATEGORIES = [
    'Technology', 'Design', 'Marketing', 'Finance', 'Engineering',
    'Product', 'Sales', 'Healthcare', 'Education', 'Operations',
]

const EXPERIENCE_OPTIONS = [
    { label: 'Fresher', value: 'FRESHER' },
    { label: '1–3 Years', value: '1-3' },
    { label: '3–5 Years', value: '3-5' },
    { label: '5+ Years', value: '5+' },
]

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SearchBarFilters {
    keyword?: string
    location?: string
    type?: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'REMOTE'
    category?: string
    experienceRequired?: string
    minSalary?: number
    maxSalary?: number
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    page?: number
    size?: number
}

interface SearchBarProps {
    initialKeyword?: string
    initialLocation?: string
    showFilterToggle?: boolean
    onSearch: (filters: SearchBarFilters) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SearchBar({
    initialKeyword = '',
    initialLocation = '',
    showFilterToggle = true,
    onSearch,
}: SearchBarProps) {
    const [keyword, setKeyword] = useState(initialKeyword)
    const [location, setLocation] = useState(initialLocation)
    const [type, setType] = useState('')
    const [category, setCategory] = useState('')
    const [experience, setExperience] = useState('')
    const [minSalary, setMinSalary] = useState('')
    const [maxSalary, setMaxSalary] = useState('')
    const [sortBy, setSortBy] = useState('postedDate')
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC')
    const [showFilters, setShowFilters] = useState(false)

    const activeFiltersCount = [type, category, experience, minSalary, maxSalary].filter(Boolean).length

    const submit = () => {
        onSearch({
            keyword: keyword || undefined,
            location: location || undefined,
            type: (type || undefined) as SearchBarFilters['type'],
            category: category || undefined,
            experienceRequired: experience || undefined,
            minSalary: minSalary ? Number(minSalary) : undefined,
            maxSalary: maxSalary ? Number(maxSalary) : undefined,
            sortBy,
            sortDir,
            page: 0,
            size: 10,
        })
    }

    const handleReset = () => {
        setType(''); setCategory(''); setExperience('')
        setMinSalary(''); setMaxSalary(''); setSortBy('postedDate'); setSortDir('DESC')
        onSearch({
            keyword: keyword || undefined,
            location: location || undefined,
            page: 0,
            size: 10
        })
    }

    return (
        <div>
            {/* ── Main Search Bar ─────────────────────────────────────── */}
            <form onSubmit={e => { e.preventDefault(); submit() }}
                className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-blue-900/5 p-3 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">

                {/* Keyword field */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-transparent focus-within:border-blue-400/50 transition-all">
                    <FiSearch className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Job title, skills, or company..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 font-medium"
                    />
                    {keyword && (
                        <button type="button" onClick={() => setKeyword('')}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <FiX size={14} />
                        </button>
                    )}
                </div>

                {/* Location field */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-transparent focus-within:border-violet-400/50 transition-all">
                    <FiMapPin className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="City, state, or 'Remote'..."
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 font-medium"
                    />
                    {location && (
                        <button type="button" onClick={() => setLocation('')}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <FiX size={14} />
                        </button>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 shrink-0">
                    {showFilterToggle && (
                        <button type="button" onClick={() => setShowFilters(f => !f)}
                            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all
                                ${showFilters
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                                }`}>
                            <FiSliders />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    )}
                    <button type="submit"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/25 transition-all active:scale-95">
                        <FiSearch /> Search
                    </button>
                </div>
            </form>

            {/* ── Expanded Filters Panel ────────────────────────────── */}
            {showFilterToggle && showFilters && (
                <div className="max-w-4xl mx-auto mt-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-lg animate-[fadeInUp_0.2s_ease-out]">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                        {/* Job Type */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Job Type</label>
                            <div className="flex flex-wrap gap-2">
                                {JOB_TYPES.map(t => (
                                    <button key={t} type="button"
                                        onClick={() => setType(type === t ? '' : t)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all
                                            ${type === t
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400'}`}>
                                        {JOB_TYPE_LABELS[t]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-zinc-800 dark:text-zinc-100 focus:border-blue-400">
                                <option value="">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Experience</label>
                            <div className="flex flex-wrap gap-2">
                                {EXPERIENCE_OPTIONS.map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setExperience(experience === opt.value ? '' : opt.value)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all
                                            ${experience === opt.value
                                                ? 'bg-violet-600 text-white border-violet-600'
                                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Salary Range (₹)</label>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Min" value={minSalary} onChange={e => setMinSalary(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-zinc-800 dark:text-zinc-100 focus:border-blue-400" />
                                <input type="number" placeholder="Max" value={maxSalary} onChange={e => setMaxSalary(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-zinc-800 dark:text-zinc-100 focus:border-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Sort + Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sort:</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-700 dark:text-zinc-300">
                                <option value="postedDate">Relevance</option>
                                <option value="lastDateToApply">Deadline</option>
                                <option value="minSalary">Salary</option>
                            </select>
                            <select value={sortDir} onChange={e => setSortDir(e.target.value as 'ASC' | 'DESC')}
                                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-700 dark:text-zinc-300">
                                <option value="DESC">High to Low</option>
                                <option value="ASC">Low to High</option>
                            </select>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={handleReset}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 transition-all">
                                <FiRefreshCw size={12} /> Reset All
                            </button>
                            <button type="button" onClick={() => { submit(); setShowFilters(false) }}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 transition-all active:scale-95">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}