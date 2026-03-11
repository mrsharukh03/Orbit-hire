'use client'

import { useEffect, useState, useRef, useContext, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FaBars, FaTimes, FaMoon, FaSun, FaBell } from "react-icons/fa"
import { MdDashboard, MdSettings, MdLogout, MdPerson, MdBolt, MdWork, MdPeople } from "react-icons/md"
import { DarkModeContext } from "../../context/DarkModeContext"
import { useAuth } from "@/context/AuthContext"
import { logoutUser } from "@/services/authService"

export default function Navbar() {
    const router = useRouter()
    const pathname = usePathname()
    const { darkMode, toggleDarkMode } = useContext(DarkModeContext)

    // 🔹 Use Global Auth State
    const { user, loading, setUser } = useAuth()

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notificationOpen, setNotificationOpen] = useState(false)
    const [showAlerts, setShowAlerts] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const notificationRef = useRef<HTMLDivElement>(null)

    const isAuthenticated = !!user

    // 🔹 Extract and format the highest role (Hide 'USER', show 'SEEKER' or 'RECRUITER')
    const displayRole = useMemo(() => {
        if (!user?.role) return "User";
        const roles = Array.isArray(user.role) ? user.role : [user.role];

        if (roles.includes("SUPER_ADMIN")) return "Super Admin";
        if (roles.includes("ADMIN")) return "Admin";
        if (roles.includes("RECRUITER")) return "Recruiter";
        if (roles.includes("SEEKER")) return "Job Seeker";
        return "User";
    }, [user?.role]);

    // 🔹 Dynamic Navigation Links based on User Role
    const navLinks = useMemo(() => {
        if (!isAuthenticated) {
            // Public Links
            return [
                { name: "Find Jobs", href: "/jobs" },
                { name: "Companies", href: "/companies" },
                { name: "Pricing", href: "/pricing" },
                { name: "Contact", href: "/contact" },
            ];
        }

        const roles = Array.isArray(user?.role) ? user.role : [user?.role];

        if (roles.includes("RECRUITER")) {
            // Recruiter Links
            return [
                { name: "Dashboard", href: "/dashboard" },
                { name: "My Jobs", href: "/jobs" },
                { name: "Applications", href: "/applications" },
                { name: "Post a Job", href: "/post-job", special: true },
            ];
        }

        // Default Seeker Links
        return [
            { name: "Find Jobs", href: "/jobs" },
            { name: "My Applications", href: "/applications" },
            { name: "Saved", href: "/saved-jobs" },
            { name: "AI Resume Builder", href: "/ai-resume-builder", special: true },
        ];
    }, [isAuthenticated, user?.role]);


    // 🔹 Scroll detection
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // 🔹 Alerts logic
    useEffect(() => {
        if (isAuthenticated) setShowAlerts(true)
    }, [isAuthenticated])

    // 🔹 Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setNotificationOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await logoutUser()
        setDropdownOpen(false)
        setIsMobileMenuOpen(false) // Close mobile menu on logout
        setUser(null)
        router.push("/login")
    }

    return (
        <>
            {/* 🔹 TOP SYSTEM STATUS BAR */}
            {isAuthenticated && showAlerts && (
                <div className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white text-xs font-medium h-9 flex items-center overflow-hidden z-50">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="container mx-auto px-4 flex items-center justify-between relative z-10 w-full">
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded border border-white/10 animate-pulse">
                                <MdBolt className="text-yellow-400" /> New
                            </span>
                            <div className="whitespace-nowrap w-full overflow-hidden mask-linear-fade">
                                <div className="inline-block animate-ticker">
                                    {displayRole === "Recruiter" ? (
                                        <>
                                            <span className="mx-4">• 🚀 Orbit-Hire v2.0 AI Candidate Matching is live</span>
                                            <span className="mx-4">• 📢 15 new candidates applied to your recent job post</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="mx-4">• 🚀 3 New AI-Matched Jobs found for your profile</span>
                                            <span className="mx-4">• 📢 Orbit-Hire v2.0 is live with AI Resume Analysis</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowAlerts(false)} className="text-white/60 hover:text-white transition p-1">
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}

            {/* 🔹 MAIN NAVBAR */}
            <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 border-b ${scrolled || isMobileMenuOpen ? "bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-slate-200/50 dark:border-white/5 shadow-lg shadow-primary/5 py-3" : "bg-transparent border-transparent py-5"} ${showAlerts ? "mt-9" : "mt-0"}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                    {/* LOGO */}
                    <Link href="/" className="group flex items-center gap-2 relative z-50">
                        <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-primary to-accent rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                            <img src="https://cdn-icons-png.flaticon.com/512/6956/6956763.png" alt="Orbit Logo" className="w-6 h-6 brightness-0 invert" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                Orbit<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Hire</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
                                {displayRole === "Recruiter" ? "For Employers" : "AI Powered"}
                            </span>
                        </div>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden lg:flex items-center gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-md">
                        {/* 🟢 Render Nav Links Dynamically */}
                        {loading ? (
                            <div className="px-10 py-3 flex items-center justify-center">
                                <div className="w-32 h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            navLinks.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.name} href={item.href} className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive ? "bg-white dark:bg-white/10 text-primary dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"} ${item.special ? "text-primary dark:text-accent font-semibold" : ""}`}>
                                        {item.name}
                                        {item.special && (
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                                            </span>
                                        )}
                                    </Link>
                                )
                            })
                        )}
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="hidden lg:flex items-center gap-4">
                        {/* THEME TOGGLE */}
                        <button onClick={toggleDarkMode} className="p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                        </button>

                        {/* NOTIFICATIONS */}
                        {!loading && isAuthenticated && (
                            <div className="relative" ref={notificationRef}>
                                <button onClick={() => setNotificationOpen(!notificationOpen)} className="p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative">
                                    <FaBell />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                                </button>
                                {notificationOpen && (
                                    <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#121420] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-fade-in-up origin-top-right z-50">
                                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                            <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {[1, 2].map((_, i) => (
                                                <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition flex gap-3 border-b border-slate-100 dark:border-white/5 last:border-0">
                                                    <div className="w-2 h-2 mt-2 bg-accent rounded-full shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">System Alert</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Welcome back to OrbitHire.</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PROFILE DROPDOWN / LOGIN BUTTON */}
                        <div className="relative" ref={dropdownRef}>
                            {loading ? (
                                <div className="w-28 h-10 bg-slate-200 dark:bg-white/10 animate-pulse rounded-full"></div>
                            ) : !isAuthenticated ? (
                                <Link href="/login" className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-primary/20">
                                    Login
                                </Link>
                            ) : (
                                <>
                                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all bg-white dark:bg-white/5 shadow-sm">
                                        <div className="text-right hidden xl:block">
                                            <p className="text-sm font-bold text-slate-700 dark:text-white leading-none">{user?.fullName?.split(' ')[0]}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                {/* 🟢 CLEAN ROLE DISPLAY */}
                                                {displayRole}
                                            </p>
                                        </div>
                                        <img src={user?.profileImage || "https://i.pravatar.cc/150"} alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-white/10" />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-4 w-60 bg-white dark:bg-[#121420] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 p-2 animate-fade-in-up origin-top-right z-50">
                                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                            </div>

                                            <Link href={displayRole === "Recruiter" ? "/recruiter/dashboard" : "/dashboard"} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-primary transition">
                                                <MdDashboard size={18} /> Dashboard
                                            </Link>
                                            <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-primary transition">
                                                <MdPerson size={18} /> My Profile
                                            </Link>
                                            <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-primary transition">
                                                <MdSettings size={18} /> Account Settings
                                            </Link>

                                            <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>

                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                                                <MdLogout size={18} /> Logout
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-slate-700 dark:text-white p-2">
                        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>

                {/* MOBILE MENU */}
                <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-[#05050A] border-b border-slate-200 dark:border-white/10 shadow-2xl transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-[calc(100vh-70px)] opacity-100 overflow-y-auto" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <div className="flex flex-col p-6 gap-4">
                        {/* Dynamic Navigation Links */}
                        {navLinks.map((item) => (
                            <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-medium transition py-2 border-b border-slate-100 dark:border-white/5 ${item.special ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white"}`}>
                                {item.name}
                            </Link>
                        ))}

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Dark Mode</span>
                            <button onClick={toggleDarkMode} className="p-3 bg-slate-100 dark:bg-white/10 rounded-full">
                                {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                            </button>
                        </div>

                        {/* Mobile Auth/Profile Actions */}
                        {loading ? (
                            <div className="w-full h-12 bg-slate-200 dark:bg-white/10 animate-pulse rounded-xl mt-2"></div>
                        ) : isAuthenticated ? (
                            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                                {/* Display User Details on Mobile */}
                                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                    <img src={user?.profileImage || "https://i.pravatar.cc/150"} alt="Profile" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                                    <div>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Profile & Dashboard Links for Mobile */}
                                <Link href={displayRole === "Recruiter" ? "/recruiter/dashboard" : "/dashboard"} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                    <MdDashboard size={20} className="text-slate-400" /> Dashboard
                                </Link>
                                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                    <MdPerson size={20} className="text-slate-400" /> My Profile
                                </Link>
                                <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                                    <MdSettings size={20} className="text-slate-400" /> Account Settings
                                </Link>

                                <button onClick={handleLogout} className="bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold mt-2 flex items-center justify-center gap-2 transition hover:bg-red-500/20">
                                    <MdLogout size={20} /> Logout
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-white py-3 rounded-xl font-bold text-center mt-4">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </>
    )
}