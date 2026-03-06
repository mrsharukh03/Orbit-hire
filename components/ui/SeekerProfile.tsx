// components/ui/SeekerProfile.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import {
    getSeekerProfile,
    updateSeekerPersonalDetails,
    updateSeekerProfessionalDetails,
    addSkill,
    removeSkill,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addCertification,
    deleteCertification,
} from "@/services/profileService"

import {
    FiSave, FiCheckCircle, FiEdit2, FiX, FiPlus, FiTrash2,
    FiAlertCircle, FiUser, FiBriefcase, FiAward, FiBook,
    FiStar, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiGlobe,
    FiInfo, FiAlertTriangle
} from "react-icons/fi"

// ─── Types ────────────────────────────────────────────────────────────────────
interface PersonalData {
    phone: string
    gender: string
    dob: string
    marriageStatus: string
    currentLocation: string
}

interface ProfessionalData {
    bio: string
    linkedinProfile: string
    githubProfile: string
    portfolioUrl: string
    expectedSalary: number | string
    noticePeriod: string
}

// ─── Validators ───────────────────────────────────────────────────────────────
function validatePersonal(data: PersonalData): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.phone.trim()) {
        errors.phone = "Phone number is required."
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(data.phone.trim())) {
        errors.phone = "Enter a valid phone number (7–15 digits)."
    }
    if (!data.currentLocation.trim()) {
        errors.currentLocation = "Current location is required."
    }
    if (!data.dob) {
        errors.dob = "Date of birth is required."
    } else {
        const dob = new Date(data.dob)
        const now = new Date()
        const age = now.getFullYear() - dob.getFullYear()
        if (dob >= now) errors.dob = "Date of birth must be in the past."
        else if (age < 15) errors.dob = "You must be at least 15 years old."
        else if (age > 100) errors.dob = "Please enter a valid date of birth."
    }
    return errors
}

function validateProfessional(data: ProfessionalData): Record<string, string> {
    const errors: Record<string, string> = {}
    const urlPattern = /^https?:\/\/.+\..+/
    if (data.linkedinProfile && !urlPattern.test(data.linkedinProfile)) {
        errors.linkedinProfile = "Must be a valid URL (e.g. https://linkedin.com/in/…)"
    }
    if (data.githubProfile && !urlPattern.test(data.githubProfile)) {
        errors.githubProfile = "Must be a valid URL (e.g. https://github.com/…)"
    }
    if (data.portfolioUrl && !urlPattern.test(data.portfolioUrl)) {
        errors.portfolioUrl = "Must be a valid URL."
    }
    if (data.expectedSalary !== "" && Number(data.expectedSalary) < 0) {
        errors.expectedSalary = "Salary cannot be negative."
    }
    return errors
}

function validateExperience(data: typeof defaultExp): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.jobTitle.trim()) errors.jobTitle = "Job title is required."
    if (!data.companyName.trim()) errors.companyName = "Company name is required."
    if (!data.startDate) errors.startDate = "Start date is required."
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
        errors.endDate = "End date must be after start date."
    }
    return errors
}

function validateEducation(data: typeof defaultEdu): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.degree.trim()) errors.degree = "Degree is required."
    if (!data.collegeName.trim()) errors.collegeName = "College / University is required."
    if (!data.fieldOfStudy.trim()) errors.fieldOfStudy = "Field of study is required."
    if (!data.startYear) {
        errors.startYear = "Start year is required."
    } else if (Number(data.startYear) < 1950 || Number(data.startYear) > new Date().getFullYear()) {
        errors.startYear = `Year must be between 1950 and ${new Date().getFullYear()}.`
    }
    if (data.endYear && Number(data.endYear) < Number(data.startYear)) {
        errors.endYear = "End year must be after start year."
    }
    return errors
}

function validateCertification(data: typeof defaultCert): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.name.trim()) errors.name = "Certification name is required."
    if (data.expiryDate && data.issueDate && data.expiryDate < data.issueDate) {
        errors.expiryDate = "Expiry date must be after issue date."
    }
    if (data.credentialUrl && !/^https?:\/\/.+\..+/.test(data.credentialUrl)) {
        errors.credentialUrl = "Enter a valid credential URL."
    }
    return errors
}

// ─── Default form values ───────────────────────────────────────────────────────
const defaultExp = { jobTitle: "", companyName: "", startDate: "", endDate: "", description: "" }
const defaultEdu = { degree: "", fieldOfStudy: "", collegeName: "", startYear: "", endYear: "", country: "", gradeType: "CGPA", gradeValue: "" }
const defaultCert = { name: "", issuingOrganization: "", issueDate: "", expiryDate: "", credentialUrl: "" }

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SeekerProfile() {

    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)
    const [globalError, setGlobalError] = useState("")

    const [isFirstTime, setIsFirstTime] = useState(false)

    const [savingPersonal, setSavingPersonal] = useState(false)
    const [savingProfessional, setSavingProfessional] = useState(false)

    const [editPersonal, setEditPersonal] = useState(false)
    const [editProfessional, setEditProfessional] = useState(false)

    const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({})
    const [professionalErrors, setProfessionalErrors] = useState<Record<string, string>>({})
    const [expErrors, setExpErrors] = useState<Record<string, string>>({})
    const [eduErrors, setEduErrors] = useState<Record<string, string>>({})
    const [certErrors, setCertErrors] = useState<Record<string, string>>({})

    const [errorBanner, setErrorBanner] = useState("")

    const [skillsArr, setSkillsArr] = useState<any[]>([])
    const [experienceArr, setExperienceArr] = useState<any[]>([])
    const [educationArr, setEducationArr] = useState<any[]>([])
    const [certArr, setCertArr] = useState<any[]>([])

    const [savingSkills, setSavingSkills] = useState(false)
    const [deletingSkillId, setDeletingSkillId] = useState<number | null>(null)
    // Tag-input: skills queued locally before saving to DB
    const [pendingSkills, setPendingSkills] = useState<string[]>([])
    const [skillInput, setSkillInput] = useState("")
    const [skillError, setSkillError] = useState("")

    const [showExpForm, setShowExpForm] = useState(false)
    const [newExp, setNewExp] = useState(defaultExp)
    const [showEduForm, setShowEduForm] = useState(false)
    const [newEdu, setNewEdu] = useState(defaultEdu)
    const [showCertForm, setShowCertForm] = useState(false)
    const [newCert, setNewCert] = useState(defaultCert)

    const [personalData, setPersonalData] = useState<PersonalData>({
        phone: "", gender: "MALE", dob: "", marriageStatus: "SINGLE", currentLocation: ""
    })
    const [professionalData, setProfessionalData] = useState<ProfessionalData>({
        bio: "", linkedinProfile: "", githubProfile: "", portfolioUrl: "", expectedSalary: "", noticePeriod: "IMMEDIATE"
    })

    // ─── Fetch Profile ──────────────────────────────────────────────────────
    const fetchProfile = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSeekerProfile()
            if (data) {
                const personal = {
                    phone: data.phone || "",
                    gender: data.gender || "MALE",
                    dob: data.dob || "",
                    marriageStatus: data.marriageStatus || "SINGLE",
                    currentLocation: data.currentLocation || ""
                }
                setPersonalData(personal)
                setProfessionalData({
                    bio: data.bio || "",
                    linkedinProfile: data.linkedinProfile || "",
                    githubProfile: data.githubProfile || "",
                    portfolioUrl: data.portfolioUrl || "",
                    expectedSalary: data.expectedSalary ?? "",
                    noticePeriod: data.noticePeriod || "IMMEDIATE"
                })
                setSkillsArr(data.skills || [])
                setExperienceArr(data.experienceList || [])
                setEducationArr(data.educationList || [])
                setCertArr(data.certifications || [])

                // First-time check: no phone AND no location means empty profile
                const isNew = !data.phone && !data.currentLocation && !data.dob
                setIsFirstTime(isNew)
            }
        } catch (err: any) {
            setGlobalError(err?.message || "Failed to load profile. Please refresh.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchProfile() }, [fetchProfile])

    // ─── Toast ──────────────────────────────────────────────────────────────
    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 4000)
    }

    const showError = (msg: string) => {
        setErrorBanner(msg)
        setTimeout(() => setErrorBanner(""), 5000)
    }

    // ─── Personal Submit ────────────────────────────────────────────────────
    const handlePersonalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors = validatePersonal(personalData)
        setPersonalErrors(errors)
        if (Object.keys(errors).length > 0) return

        setSavingPersonal(true)
        try {
            await updateSeekerPersonalDetails(personalData)
            showToast("success", "Personal details updated successfully!")
            setEditPersonal(false)
            setIsFirstTime(false)
        } catch (error: any) {
            showError(error?.message || "Failed to update personal details.")
        } finally {
            setSavingPersonal(false)
        }
    }

    // ─── Professional Submit ────────────────────────────────────────────────
    const handleProfessionalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors = validateProfessional(professionalData)
        setProfessionalErrors(errors)
        if (Object.keys(errors).length > 0) return

        setSavingProfessional(true)
        try {
            await updateSeekerProfessionalDetails({
                ...professionalData,
                expectedSalary: professionalData.expectedSalary === "" ? null : Number(professionalData.expectedSalary)
            })
            showToast("success", "Professional details updated successfully!")
            setEditProfessional(false)
        } catch (error: any) {
            showError(error?.message || "Failed to update professional details.")
        } finally {
            setSavingProfessional(false)
        }
    }

    // ─── Skills ─────────────────────────────────────────────────────────────
    /** Add a skill to the local pending queue (no API call yet) */
    const handleQueueSkill = () => {
        const trimmed = skillInput.trim()
        if (!trimmed) { setSkillError("Skill name cannot be empty."); return }
        if (trimmed.length < 2) { setSkillError("Skill must be at least 2 characters."); return }
        if (skillsArr.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
            setSkillError("This skill is already in your profile."); return
        }
        if (pendingSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            setSkillError("Already queued — press Save Skills to add."); return
        }
        setSkillError("")
        setPendingSkills(prev => [...prev, trimmed])
        setSkillInput("")
    }

    /** Remove a skill from the pending queue (before saving) */
    const handleRemovePending = (name: string) => {
        setPendingSkills(prev => prev.filter(s => s !== name))
    }

    /** Save ALL pending skills to the backend in one batch call */
    const handleSaveSkills = async () => {
        if (pendingSkills.length === 0) return
        setSavingSkills(true)
        try {
            await addSkill(pendingSkills)      // sends [{ skillName }, ...]
            setPendingSkills([])
            await fetchProfile()              // re-fetch so we get real DB ids
            showToast("success", `${pendingSkills.length > 1 ? `${pendingSkills.length} skills` : "Skill"} added!`)
        } catch (err: any) {
            showError(err?.message || "Failed to save skills. Please try again.")
        } finally {
            setSavingSkills(false)
        }
    }

    const handleDeleteSkill = async (id: number) => {
        setDeletingSkillId(id)
        try {
            await removeSkill(id)
            setSkillsArr(prev => prev.filter(s => s.id !== id))
            showToast("success", "Skill removed.")
        } catch (err: any) {
            showError(err?.message || "Failed to remove skill. Please try again.")
        } finally {
            setDeletingSkillId(null)
        }
    }

    // ─── Experience ──────────────────────────────────────────────────────────
    const handleAddExp = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors = validateExperience(newExp)
        setExpErrors(errors)
        if (Object.keys(errors).length > 0) return
        try {
            await addExperience(newExp)
            showToast("success", "Experience added!")
            setShowExpForm(false)
            setNewExp(defaultExp)
            setExpErrors({})
            await fetchProfile()
        } catch (err: any) { showError(err?.message || "Failed to add experience.") }
    }
    const handleDeleteExp = async (id: number) => {
        try {
            await deleteExperience(id)
            setExperienceArr(experienceArr.filter(x => x.id !== id))
            showToast("success", "Experience deleted.")
        } catch (err: any) { showError(err?.message || "Failed to delete experience.") }
    }

    // ─── Education ───────────────────────────────────────────────────────────
    const handleAddEdu = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors = validateEducation(newEdu)
        setEduErrors(errors)
        if (Object.keys(errors).length > 0) return
        try {
            await addEducation(newEdu)
            showToast("success", "Education added!")
            setShowEduForm(false)
            setNewEdu(defaultEdu)
            setEduErrors({})
            await fetchProfile()
        } catch (err: any) { showError(err?.message || "Failed to add education.") }
    }
    const handleDeleteEdu = async (id: number) => {
        try {
            await deleteEducation(id)
            setEducationArr(educationArr.filter(e => e.id !== id))
            showToast("success", "Education deleted.")
        } catch (err: any) { showError(err?.message || "Failed to delete education.") }
    }

    // ─── Certification ───────────────────────────────────────────────────────
    const handleAddCert = async (e: React.FormEvent) => {
        e.preventDefault()
        const errors = validateCertification(newCert)
        setCertErrors(errors)
        if (Object.keys(errors).length > 0) return
        try {
            await addCertification(newCert)
            showToast("success", "Certification added!")
            setShowCertForm(false)
            setNewCert(defaultCert)
            setCertErrors({})
            await fetchProfile()
        } catch (err: any) { showError(err?.message || "Failed to add certification.") }
    }
    const handleDeleteCert = async (id: number) => {
        try {
            await deleteCertification(id)
            setCertArr(certArr.filter(c => c.id !== id))
            showToast("success", "Certification deleted.")
        } catch (err: any) { showError(err?.message || "Failed to delete certification.") }
    }

    // ─── Loading Skeleton ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="rounded-3xl p-8 border border-zinc-200/60 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 animate-pulse">
                        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 pb-12">

            {/* Global Fetch Error */}
            {globalError && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400">
                    <FiAlertCircle className="shrink-0 text-xl" />
                    <span className="font-medium text-sm">{globalError}</span>
                </div>
            )}

            {/* ── First-Time User Banner ──────────────────────────────────────── */}
            {isFirstTime && (
                <div className="relative overflow-hidden rounded-3xl p-6 border border-violet-300/50 dark:border-violet-500/30"
                    style={{ background: "linear-gradient(135deg, #7c3aed15 0%, #3b82f615 100%)" }}>
                    <div className="absolute top-0 right-0 w-48 h-48 opacity-10"
                        style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-400/20 shrink-0">
                            <FiUser className="text-violet-500 text-xl" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-violet-700 dark:text-violet-300 mb-1">
                                👋 Welcome! Let's set up your profile
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Your profile is empty right now. A complete profile helps recruiters discover you faster.
                                Start by filling in your <strong>Personal Details</strong> below.
                            </p>
                            <button
                                onClick={() => setEditPersonal(true)}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                                <FiEdit2 size={14} /> Complete My Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast Notification ────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border font-medium text-sm transition-all duration-300
                    ${toast.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-900/40 border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300"}`}>
                    {toast.type === "success" ? <FiCheckCircle className="text-lg" /> : <FiAlertCircle className="text-lg" />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><FiX /></button>
                </div>
            )}

            {/* ── Error Banner ───────────────────────────────────────────────── */}
            {errorBanner && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400">
                    <FiAlertTriangle className="shrink-0 text-lg" />
                    <span className="text-sm font-medium flex-1">{errorBanner}</span>
                    <button onClick={() => setErrorBanner("")}><FiX /></button>
                </div>
            )}

            {/* ══════════════ PERSONAL DETAILS ══════════════ */}
            <Section
                icon={<FiUser />}
                title="Personal Details"
                accentColor="#6366f1"
                headerAction={
                    !editPersonal
                        ? <EditButton onClick={() => { setEditPersonal(true); setPersonalErrors({}) }} />
                        : <CancelButton onClick={() => { setEditPersonal(false); setPersonalErrors({}) }} />
                }
            >
                {!editPersonal ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoCard icon={<FiPhone />} label="Phone" value={personalData.phone} />
                        <InfoCard icon={<FiMapPin />} label="Location" value={personalData.currentLocation} />
                        <InfoCard icon={<FiInfo />} label="Date of Birth" value={personalData.dob} />
                        <InfoCard icon={<FiUser />} label="Gender" value={personalData.gender} badge />
                        <InfoCard icon={<FiUser />} label="Marriage Status" value={personalData.marriageStatus} badge />
                    </div>
                ) : (
                    <form onSubmit={handlePersonalSubmit} noValidate>
                        <div className="grid sm:grid-cols-2 gap-5 mb-6">
                            <InputField
                                label="Phone Number" required
                                placeholder="e.g. +91 98765 43210"
                                value={personalData.phone}
                                onChange={v => setPersonalData({ ...personalData, phone: v })}
                                error={personalErrors.phone}
                            />
                            <InputField
                                label="Current Location" required
                                placeholder="e.g. Bangalore, India"
                                value={personalData.currentLocation}
                                onChange={v => setPersonalData({ ...personalData, currentLocation: v })}
                                error={personalErrors.currentLocation}
                            />
                            <InputField
                                label="Date of Birth" required type="date"
                                value={personalData.dob}
                                onChange={v => setPersonalData({ ...personalData, dob: v })}
                                error={personalErrors.dob}
                            />
                            <SelectField
                                label="Gender" required
                                value={personalData.gender}
                                options={["MALE", "FEMALE", "OTHER"]}
                                onChange={v => setPersonalData({ ...personalData, gender: v })}
                            />
                            <SelectField
                                label="Marital Status"
                                value={personalData.marriageStatus}
                                options={["SINGLE", "MARRIED"]}
                                onChange={v => setPersonalData({ ...personalData, marriageStatus: v })}
                            />
                        </div>
                        <SaveBtn loading={savingPersonal} text="Save Personal Details" />
                    </form>
                )}
            </Section>

            {/* ══════════════ PROFESSIONAL DETAILS ══════════════ */}
            <Section
                icon={<FiBriefcase />}
                title="Professional Details"
                accentColor="#0ea5e9"
                headerAction={
                    !editProfessional
                        ? <EditButton onClick={() => { setEditProfessional(true); setProfessionalErrors({}) }} />
                        : <CancelButton onClick={() => { setEditProfessional(false); setProfessionalErrors({}) }} />
                }
            >
                {!editProfessional ? (
                    <div className="space-y-5">
                        {professionalData.bio && (
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/40">
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Bio</p>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{professionalData.bio}</p>
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InfoCard icon={<FiLinkedin />} label="LinkedIn" value={professionalData.linkedinProfile} isLink />
                            <InfoCard icon={<FiGithub />} label="GitHub" value={professionalData.githubProfile} isLink />
                            <InfoCard icon={<FiGlobe />} label="Portfolio" value={professionalData.portfolioUrl} isLink />
                            <InfoCard icon={<FiBriefcase />} label="Expected Salary" value={professionalData.expectedSalary ? `${professionalData.expectedSalary} LPA` : ""} />
                            <InfoCard icon={<FiInfo />} label="Notice Period" value={professionalData.noticePeriod} badge />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleProfessionalSubmit} noValidate>
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Bio</label>
                            <textarea
                                value={professionalData.bio}
                                onChange={e => setProfessionalData({ ...professionalData, bio: e.target.value })}
                                rows={4}
                                placeholder="Write a short professional summary…"
                                className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none transition-all text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                            />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-5 mb-6">
                            <InputField
                                label="LinkedIn Profile URL"
                                placeholder="https://linkedin.com/in/username"
                                value={professionalData.linkedinProfile}
                                onChange={v => setProfessionalData({ ...professionalData, linkedinProfile: v })}
                                error={professionalErrors.linkedinProfile}
                            />
                            <InputField
                                label="GitHub Profile URL"
                                placeholder="https://github.com/username"
                                value={professionalData.githubProfile}
                                onChange={v => setProfessionalData({ ...professionalData, githubProfile: v })}
                                error={professionalErrors.githubProfile}
                            />
                            <InputField
                                label="Portfolio / Website URL"
                                placeholder="https://your-portfolio.com"
                                value={professionalData.portfolioUrl}
                                onChange={v => setProfessionalData({ ...professionalData, portfolioUrl: v })}
                                error={professionalErrors.portfolioUrl}
                            />
                            <InputField
                                label="Expected Salary (LPA)" type="number"
                                placeholder="e.g. 12"
                                value={professionalData.expectedSalary}
                                onChange={v => setProfessionalData({ ...professionalData, expectedSalary: v })}
                                error={professionalErrors.expectedSalary}
                            />
                            <SelectField
                                label="Notice Period"
                                value={professionalData.noticePeriod}
                                options={["IMMEDIATE", "15_DAYS", "30_DAYS", "60_DAYS"]}
                                displayMap={{ IMMEDIATE: "Immediate", "15_DAYS": "15 Days", "30_DAYS": "30 Days", "60_DAYS": "60 Days" }}
                                onChange={v => setProfessionalData({ ...professionalData, noticePeriod: v })}
                            />
                        </div>
                        <SaveBtn loading={savingProfessional} text="Save Professional Details" />
                    </form>
                )}
            </Section>

            {/* ══════════════ SKILLS ══════════════ */}
            <Section icon={<FiStar />} title="Skills" accentColor="#f59e0b">

                {/* ── Saved skills from DB ──────────────── */}
                {skillsArr.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {skillsArr.map(skill => (
                            <span key={skill.id}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                                    bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300
                                    border border-amber-200 dark:border-amber-500/25 transition-all group">
                                {deletingSkillId === skill.id
                                    ? <span className="w-3 h-3 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin" />
                                    : skill.name
                                }
                                <button
                                    type="button"
                                    onClick={() => handleDeleteSkill(skill.id)}
                                    disabled={deletingSkillId === skill.id}
                                    className="opacity-40 group-hover:opacity-100 hover:text-red-500 transition-all disabled:cursor-not-allowed"
                                    title="Remove skill">
                                    <FiX size={13} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Pending (not yet saved) queue ───── */}
                {pendingSkills.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                            ✦ Pending — click "Save Skills" to add
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {pendingSkills.map(name => (
                                <span key={name}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                                        bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                                        border-2 border-dashed border-amber-400 dark:border-amber-500/60
                                        transition-all group">
                                    {name}
                                    <button type="button" onClick={() => handleRemovePending(name)}
                                        className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-all" title="Remove">
                                        <FiX size={13} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tag input row ───────────────────── */}
                <div className="flex gap-3 items-start">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Type a skill and press Enter or click + (e.g. React, Python…)"
                            value={skillInput}
                            onChange={e => { setSkillInput(e.target.value); setSkillError("") }}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleQueueSkill())}
                            className={`w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl outline-none focus:ring-2 transition-all text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400
                                ${skillError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-amber-400/20"}`}
                        />
                        {skillError && <FieldError msg={skillError} />}
                    </div>
                    <button
                        type="button"
                        onClick={handleQueueSkill}
                        title="Queue skill (then Save)"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                            text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300
                            hover:bg-amber-200 dark:hover:bg-amber-500/25 border border-amber-300 dark:border-amber-500/30
                            shrink-0 transition-all active:scale-95">
                        <FiPlus /> +
                    </button>
                </div>

                {/* ── Empty state ─────────────────────── */}
                {skillsArr.length === 0 && pendingSkills.length === 0 && (
                    <p className="mt-4 text-sm text-zinc-400 italic">
                        No skills yet. Type one above and press Enter to queue it, then Save.
                    </p>
                )}

                {/* ── Save all pending skills button ───── */}
                {pendingSkills.length > 0 && (
                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={handleSaveSkills}
                            disabled={savingSkills}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                                transition-all disabled:opacity-60 active:scale-95"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                            {savingSkills
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                : <><FiSave /> Save {pendingSkills.length} Skill{pendingSkills.length > 1 ? "s" : ""}</>
                            }
                        </button>
                    </div>
                )}
            </Section>

            {/* ══════════════ EXPERIENCE ══════════════ */}
            <Section
                icon={<FiBriefcase />}
                title="Work Experience"
                accentColor="#10b981"
                headerAction={
                    <button
                        onClick={() => { setShowExpForm(!showExpForm); setExpErrors({}) }}
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all
                            ${showExpForm ? "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"}`}>
                        {showExpForm ? <><FiX /> Cancel</> : <><FiPlus /> Add New</>}
                    </button>
                }>

                {showExpForm && (
                    <form onSubmit={handleAddExp} noValidate className="mb-6 p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5">
                        <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2"><FiPlus /> New Experience</h4>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <InputField label="Job Title" required placeholder="e.g. Software Engineer"
                                value={newExp.jobTitle} onChange={v => setNewExp({ ...newExp, jobTitle: v })} error={expErrors.jobTitle} />
                            <InputField label="Company Name" required placeholder="e.g. Google"
                                value={newExp.companyName} onChange={v => setNewExp({ ...newExp, companyName: v })} error={expErrors.companyName} />
                            <InputField label="Start Date" required type="date"
                                value={newExp.startDate} onChange={v => setNewExp({ ...newExp, startDate: v })} error={expErrors.startDate} />
                            <InputField label="End Date (leave blank if current)" type="date"
                                value={newExp.endDate} onChange={v => setNewExp({ ...newExp, endDate: v })} error={expErrors.endDate} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Description</label>
                            <textarea rows={3} value={newExp.description}
                                onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                                placeholder="Describe your responsibilities and achievements…"
                                className="w-full px-4 py-3 text-sm bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none transition-all text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400" />
                        </div>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                            <FiSave /> Save Experience
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {experienceArr.length === 0 && !showExpForm && (
                        <EmptyState icon={<FiBriefcase />} text="No work experience added yet." />
                    )}
                    {experienceArr.map(exp => (
                        <ExperienceCard key={exp.id} exp={exp} onDelete={() => handleDeleteExp(exp.id)} />
                    ))}
                </div>
            </Section>

            {/* ══════════════ EDUCATION ══════════════ */}
            <Section
                icon={<FiBook />}
                title="Education"
                accentColor="#8b5cf6"
                headerAction={
                    <button
                        onClick={() => { setShowEduForm(!showEduForm); setEduErrors({}) }}
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all
                            ${showEduForm ? "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700" : "text-violet-600 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20"}`}>
                        {showEduForm ? <><FiX /> Cancel</> : <><FiPlus /> Add New</>}
                    </button>
                }>

                {showEduForm && (
                    <form onSubmit={handleAddEdu} noValidate className="mb-6 p-6 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-500/30 bg-violet-50/30 dark:bg-violet-500/5">
                        <h4 className="font-semibold text-violet-700 dark:text-violet-400 mb-4 flex items-center gap-2"><FiPlus /> New Education</h4>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <InputField label="Degree" required placeholder="e.g. B.Tech, MBA"
                                value={newEdu.degree} onChange={v => setNewEdu({ ...newEdu, degree: v })} error={eduErrors.degree} />
                            <InputField label="College / University" required placeholder="e.g. IIT Bombay"
                                value={newEdu.collegeName} onChange={v => setNewEdu({ ...newEdu, collegeName: v })} error={eduErrors.collegeName} />
                            <InputField label="Field of Study" required placeholder="e.g. Computer Science"
                                value={newEdu.fieldOfStudy} onChange={v => setNewEdu({ ...newEdu, fieldOfStudy: v })} error={eduErrors.fieldOfStudy} />
                            <InputField label="Country" placeholder="e.g. India"
                                value={newEdu.country} onChange={v => setNewEdu({ ...newEdu, country: v })} />
                            <InputField label="Start Year" required type="number" placeholder="e.g. 2019"
                                value={newEdu.startYear} onChange={v => setNewEdu({ ...newEdu, startYear: v })} error={eduErrors.startYear} />
                            <InputField label="End Year (or expected)" type="number" placeholder="e.g. 2023"
                                value={newEdu.endYear} onChange={v => setNewEdu({ ...newEdu, endYear: v })} error={eduErrors.endYear} />
                            <SelectField label="Grade Type" value={newEdu.gradeType} options={["CGPA", "PERCENTAGE", "GRADE"]}
                                onChange={v => setNewEdu({ ...newEdu, gradeType: v })} />
                            <InputField label="Grade Value" placeholder="e.g. 8.5"
                                value={newEdu.gradeValue} onChange={v => setNewEdu({ ...newEdu, gradeValue: v })} />
                        </div>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
                            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                            <FiSave /> Save Education
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {educationArr.length === 0 && !showEduForm && (
                        <EmptyState icon={<FiBook />} text="No education details added yet." />
                    )}
                    {educationArr.map(edu => (
                        <EducationCard key={edu.id} edu={edu} onDelete={() => handleDeleteEdu(edu.id)} />
                    ))}
                </div>
            </Section>

            {/* ══════════════ CERTIFICATIONS ══════════════ */}
            <Section
                icon={<FiAward />}
                title="Certifications"
                accentColor="#f43f5e"
                headerAction={
                    <button
                        onClick={() => { setShowCertForm(!showCertForm); setCertErrors({}) }}
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all
                            ${showCertForm ? "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20"}`}>
                        {showCertForm ? <><FiX /> Cancel</> : <><FiPlus /> Add New</>}
                    </button>
                }>

                {showCertForm && (
                    <form onSubmit={handleAddCert} noValidate className="mb-6 p-6 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-500/30 bg-rose-50/30 dark:bg-rose-500/5">
                        <h4 className="font-semibold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2"><FiPlus /> New Certification</h4>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <InputField label="Certification Name" required placeholder="e.g. AWS Solutions Architect"
                                value={newCert.name} onChange={v => setNewCert({ ...newCert, name: v })} error={certErrors.name} />
                            <InputField label="Issuing Organization" placeholder="e.g. Amazon Web Services"
                                value={newCert.issuingOrganization} onChange={v => setNewCert({ ...newCert, issuingOrganization: v })} />
                            <InputField label="Issue Date" type="date"
                                value={newCert.issueDate} onChange={v => setNewCert({ ...newCert, issueDate: v })} />
                            <InputField label="Expiry Date" type="date"
                                value={newCert.expiryDate} onChange={v => setNewCert({ ...newCert, expiryDate: v })} error={certErrors.expiryDate} />
                            <div className="sm:col-span-2">
                                <InputField label="Credential URL" placeholder="https://certification.example.com/verify/…"
                                    value={newCert.credentialUrl} onChange={v => setNewCert({ ...newCert, credentialUrl: v })} error={certErrors.credentialUrl} />
                            </div>
                        </div>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
                            style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                            <FiSave /> Save Certification
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {certArr.length === 0 && !showCertForm && (
                        <EmptyState icon={<FiAward />} text="No certifications added yet." />
                    )}
                    {certArr.map(cert => (
                        <CertificationCard key={cert.id} cert={cert} onDelete={() => handleDeleteCert(cert.id)} />
                    ))}
                </div>
            </Section>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (all below main export)
// ─────────────────────────────────────────────────────────────────────────────

/** Reusable section wrapper with gradient accent border */
function Section({ icon, title, accentColor, children, headerAction }: {
    icon: React.ReactNode
    title: string
    accentColor: string
    children: React.ReactNode
    headerAction?: React.ReactNode
}) {
    return (
        <div className="relative rounded-3xl border border-zinc-200/70 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl text-white text-base" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}>
                            {icon}
                        </div>
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{title}</h2>
                    </div>
                    {headerAction}
                </div>
                {children}
            </div>
        </div>
    )
}

/** Read-only info card */
function InfoCard({ icon, label, value, badge, isLink }: {
    icon: React.ReactNode; label: string; value: any; badge?: boolean; isLink?: boolean
}) {
    const display = String(value || "").trim()
    return (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/40">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-zinc-400 text-sm">{icon}</span>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
            </div>
            {display ? (
                isLink ? (
                    <a href={display} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-500 hover:text-blue-600 hover:underline truncate block">
                        {display}
                    </a>
                ) : badge ? (
                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                        {display}
                    </span>
                ) : (
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{display}</p>
                )
            ) : (
                <p className="text-sm text-zinc-400 italic">Not set</p>
            )}
        </div>
    )
}

/** Field error message */
function FieldError({ msg }: { msg: string }) {
    return (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500 font-medium">
            <FiAlertCircle size={12} className="shrink-0" /> {msg}
        </p>
    )
}

/** Styled input field with error support */
function InputField({ label, required, placeholder, value, onChange, type = "text", error }: {
    label: string; required?: boolean; placeholder?: string; value: any
    onChange: (v: string) => void; type?: string; error?: string
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className={`w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/60 border rounded-xl outline-none transition-all
                    text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400
                    ${error
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-zinc-200 dark:border-zinc-700 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20"}`}
            />
            {error && <FieldError msg={error} />}
        </div>
    )
}

/** Styled select field */
function SelectField({ label, required, value, options, displayMap, onChange }: {
    label: string; required?: boolean; value: string; options: string[]
    displayMap?: Record<string, string>; onChange: (v: string) => void
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 text-zinc-800 dark:text-zinc-100 transition-all">
                {options.map(opt => (
                    <option key={opt} value={opt}>{displayMap?.[opt] ?? opt}</option>
                ))}
            </select>
        </div>
    )
}

/** Save button with loading spinner */
function SaveBtn({ loading, text }: { loading: boolean; text: string }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FiSave />}
            {loading ? "Saving…" : text}
        </button>
    )
}

function EditButton({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
            text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
            <FiEdit2 size={14} /> Edit
        </button>
    )
}

function CancelButton({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
            text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <FiX size={14} /> Cancel
        </button>
    )
}

/** Empty state placeholder */
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-600 gap-3">
            <span className="text-3xl opacity-40">{icon}</span>
            <p className="text-sm italic">{text}</p>
        </div>
    )
}

/** Experience card */
function ExperienceCard({ exp, onDelete }: { exp: any; onDelete: () => void }) {
    return (
        <div className="relative group flex gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
            <div className="mt-0.5 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <FiBriefcase className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{exp.jobTitle}</h3>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{exp.companyName}</p>
                <p className="text-xs text-zinc-400 mt-0.5 mb-2">{exp.startDate} → {exp.endDate || "Present"}</p>
                {exp.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{exp.description}</p>}
            </div>
            <button onClick={onDelete} title="Delete"
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <FiTrash2 size={16} />
            </button>
        </div>
    )
}

/** Education card */
function EducationCard({ edu, onDelete }: { edu: any; onDelete: () => void }) {
    return (
        <div className="relative group flex gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all">
            <div className="mt-0.5 w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                <FiBook className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{edu.degree} in {edu.fieldOfStudy}</h3>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">{edu.collegeName}{edu.country ? `, ${edu.country}` : ""}</p>
                <p className="text-xs text-zinc-400 mt-0.5 mb-2">{edu.startYear} – {edu.endYear || "Ongoing"}</p>
                {edu.gradeValue && (
                    <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                        {edu.gradeType}: {edu.gradeValue}
                    </span>
                )}
            </div>
            <button onClick={onDelete} title="Delete"
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <FiTrash2 size={16} />
            </button>
        </div>
    )
}

/** Certification card */
function CertificationCard({ cert, onDelete }: { cert: any; onDelete: () => void }) {
    return (
        <div className="relative group flex gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all">
            <div className="mt-0.5 w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <FiAward className="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{cert.name}</h3>
                {cert.issuingOrganization && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{cert.issuingOrganization}</p>}
                {cert.issueDate && (
                    <p className="text-xs text-zinc-400 mt-0.5 mb-2">
                        Issued: {cert.issueDate}{cert.expiryDate ? ` · Expires: ${cert.expiryDate}` : ""}
                    </p>
                )}
                {cert.credentialUrl && (
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline">
                        <FiGlobe size={12} /> Verify Credential →
                    </a>
                )}
            </div>
            <button onClick={onDelete} title="Delete"
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <FiTrash2 size={16} />
            </button>
        </div>
    )
}