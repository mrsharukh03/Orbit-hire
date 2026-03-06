'use client'

import Link from 'next/link'
import {
    FaFacebookF,
    FaTwitter,
    FaLinkedinIn,
    FaInstagram,
    FaPaperPlane,
    FaCode,
    FaArrowRight
} from 'react-icons/fa'

export default function Footer() {
    return (
        <footer className="relative bg-white dark:bg-[#05050A] pt-24 pb-8 overflow-hidden border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
            {/* 🌌 Background Glows (Adjusts for Light/Dark) */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-300/30 dark:bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none transition-colors duration-300" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/30 dark:bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none transition-colors duration-300" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 dark:via-indigo-500/20 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">

                {/* 🔹 Main Grid */}
                <div className="grid gap-12 lg:gap-8 mb-20 lg:grid-cols-12 md:grid-cols-2 grid-cols-1">

                    {/* 1. Brand Section */}
                    <div className="lg:col-span-4 flex flex-col gap-6 items-center md:items-start text-center md:text-left">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:rotate-6 transition-all duration-300">
                                <img
                                    src="https://cdn-icons-png.flaticon.com/512/6956/6956763.png"
                                    alt="Orbit-Hire Logo"
                                    width={28}
                                    className="brightness-0 invert drop-shadow-md"
                                />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none transition-colors duration-300">
                                    Orbit<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">Hire</span>
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">
                                    AI Powered
                                </span>
                            </div>
                        </Link>

                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm m-auto md:m-0 transition-colors duration-300">
                            The next-generation AI platform connecting elite talent with futuristic companies. Elevate your career with smart matching.
                        </p>

                        {/* Social Icons (Glassy) */}
                        <div className="flex gap-3 mt-2 justify-center md:justify-start">
                            {[
                                { Icon: FaFacebookF, href: "#", color: "group-hover:text-blue-600 dark:group-hover:text-blue-500" },
                                { Icon: FaTwitter, href: "#", color: "group-hover:text-sky-500 dark:group-hover:text-sky-400" },
                                { Icon: FaLinkedinIn, href: "#", color: "group-hover:text-blue-700 dark:group-hover:text-blue-600" },
                                { Icon: FaInstagram, href: "#", color: "group-hover:text-pink-600 dark:group-hover:text-pink-500" }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="group w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <social.Icon size={16} className={`text-slate-500 dark:text-slate-400 transition-colors ${social.color}`} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* 2. Candidates Links */}
                    <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                        <h5 className="text-slate-900 dark:text-white font-bold mb-6 text-lg tracking-wide transition-colors duration-300">Candidates</h5>
                        <ul className="space-y-4 w-full">
                            {[
                                { name: 'Find Jobs', href: '/jobs' },
                                { name: 'Browse Companies', href: '/companies' },
                                { name: 'AI Resume Builder', href: '/resume-builder', special: true },
                                { name: 'Dashboard', href: '/dashboard' },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link href={item.href} className="group inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm hover:text-indigo-600 dark:hover:text-white transition-all duration-300">
                                        <FaArrowRight className="text-indigo-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" size={10} />
                                        <span className={item.special ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 font-medium" : ""}>
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. Recruiters Links */}
                    <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
                        <h5 className="text-slate-900 dark:text-white font-bold mb-6 text-lg tracking-wide transition-colors duration-300">Recruiters</h5>
                        <ul className="space-y-4 w-full">
                            {[
                                { name: 'Post a Job', href: '/post-job' },
                                { name: 'Browse Talent', href: '/candidates' },
                                { name: 'Pricing Plans', href: '/pricing' },
                                { name: 'Contact Support', href: '/contact' },
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link href={item.href} className="group inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm hover:text-cyan-600 dark:hover:text-white transition-all duration-300">
                                        <FaArrowRight className="text-cyan-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" size={10} />
                                        <span>{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 4. Newsletter */}
                    <div className="lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
                        <h5 className="text-slate-900 dark:text-white font-bold mb-6 text-lg tracking-wide transition-colors duration-300">Stay Updated</h5>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed transition-colors duration-300">
                            Subscribe to get the latest AI job matches and industry insights directly in your inbox.
                        </p>
                        <form onSubmit={(e) => e.preventDefault()} className="w-full relative group">
                            {/* Glow Effect behind input */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500"></div>

                            <div className="relative flex items-center bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-white/10 p-1.5 focus-within:border-indigo-500/50 transition-colors">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-transparent px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all duration-300 whitespace-nowrap"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* 🔹 Developer / Agency Card (Glassmorphism Premium Bento) */}
                <div className="relative group rounded-3xl p-[1px] bg-gradient-to-r from-slate-200 via-indigo-300 to-slate-200 dark:from-white/10 dark:via-indigo-500/30 dark:to-white/10 overflow-hidden mb-12 transition-colors duration-300">
                    <div className="relative z-10 bg-white/90 dark:bg-[#0A0A0F]/90 backdrop-blur-2xl rounded-[23px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">

                        {/* Decorative background glow inside the card */}
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-700"></div>

                        <div className="flex items-center gap-5 w-full md:w-auto flex-col sm:flex-row text-center sm:text-left">
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 flex items-center justify-center border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:scale-110 group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 transition-all duration-500">
                                <FaCode size={28} />
                            </div>
                            <div>
                                <h6 className="text-slate-900 dark:text-white text-lg font-bold mb-1.5 transition-colors duration-300">
                                    Designed & Developed by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">Mohammad Sharukh</span>
                                </h6>
                                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed transition-colors duration-300">
                                    Looking for a high-performance web application? Let's build something extraordinary for your business.
                                </p>
                            </div>
                        </div>
                        <a
                            href="mailto:developerindia03@gmail.com"
                            className="relative z-10 inline-flex items-center justify-center gap-3 px-8 py-3.5 text-sm font-bold text-slate-800 bg-slate-100 border border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-md dark:text-white dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-indigo-500/50 shrink-0 dark:shadow-lg hover:-translate-y-1 dark:hover:shadow-[0_10px_20px_rgba(99,102,241,0.2)] transition-all duration-300 w-full md:w-auto"
                        >
                            <span>Hire Me</span>
                            <FaPaperPlane className="text-indigo-600 dark:text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={14} />
                        </a>
                    </div>
                </div>
            </div>

            {/* 🔹 Bottom Copyright Bar */}
            <div className="relative z-10 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-black/20 backdrop-blur-md py-6 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 dark:text-slate-500 text-sm text-center md:text-left font-medium">
                        © {new Date().getFullYear()} OrbitHire AI. All rights reserved.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-500 font-medium">
                        <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</Link>
                        <Link href="/cookies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}