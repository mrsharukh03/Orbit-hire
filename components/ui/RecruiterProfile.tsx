// src/components/profile/RecruiterProfile.tsx
'use client'

import { useState, useEffect } from "react"
import { getRecruiterProfile, updateRecruiterProfile } from "@/services/profileService"
import { FiSave, FiCheckCircle, FiEdit2, FiX, FiTrash2 } from "react-icons/fi"

export default function RecruiterProfile() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [successMsg, setSuccessMsg] = useState("")
    const [newSkill, setNewSkill] = useState("")

    const [formData, setFormData] = useState({
        phone: "",
        profileImageUrl: "",
        companyLogoUrl: "",
        linkedInProfile: "",
        companyWebsite: "",
        companyName: "",
        designation: "",
        location: "",
        industry: "",
        companySize: "",
        companyDescription: "",
        yearsOfExperience: 0,
        about: "",
        hiringSkills: [] as string[]
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getRecruiterProfile()
                if (data && data.companyName) {
                    setFormData(prev => ({ ...prev, ...data, hiringSkills: data.hiringSkills || [] }))
                    setIsEditing(false)
                } else {
                    setIsEditing(true)
                }
            } catch (error) {
                setIsEditing(true)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleAddSkill = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSkill.trim()) return
        if (!formData.hiringSkills.includes(newSkill.trim())) {
            setFormData({ ...formData, hiringSkills: [...formData.hiringSkills, newSkill.trim()] })
        }
        setNewSkill("")
    }

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData({ ...formData, hiringSkills: formData.hiringSkills.filter(s => s !== skillToRemove) })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateRecruiterProfile(formData)
            setSuccessMsg("Company Profile updated successfully!")
            setIsEditing(false)
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="animate-pulse h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full"></div>

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {successMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-2 font-medium">
                    <FiCheckCircle /> {successMsg}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Company Details</h2>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                            <FiEdit2 /> Edit Profile
                        </button>
                    ) : formData.companyName && (
                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                            <FiX /> Cancel
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8">
                        {formData.companyLogoUrl && (
                            <div className="md:col-span-2 lg:col-span-3 mb-2 flex items-center gap-4">
                                <img src={formData.companyLogoUrl} alt="Company Logo" className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" />
                                <div>
                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{formData.companyName}</h3>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{formData.industry}</p>
                                </div>
                            </div>
                        )}

                        {!formData.companyLogoUrl && (
                            <>
                                <div><p className="text-sm text-zinc-500">Company Name</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.companyName}</p></div>
                                <div><p className="text-sm text-zinc-500">Industry</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.industry}</p></div>
                            </>
                        )}

                        <div><p className="text-sm text-zinc-500">Your Designation</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.designation}</p></div>
                        <div><p className="text-sm text-zinc-500">Location</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.location}</p></div>
                        <div><p className="text-sm text-zinc-500">Phone</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.phone}</p></div>
                        <div><p className="text-sm text-zinc-500">Company Size</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.companySize || "Not specified"}</p></div>
                        <div><p className="text-sm text-zinc-500">Years of Experience</p><p className="font-semibold text-zinc-900 dark:text-white text-lg">{formData.yearsOfExperience} Yrs</p></div>

                        {formData.companyWebsite && <div><p className="text-sm text-zinc-500">Website</p><a href={formData.companyWebsite} target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-lg truncate inline-block max-w-[200px]">{formData.companyWebsite}</a></div>}
                        {formData.linkedInProfile && <div><p className="text-sm text-zinc-500">LinkedIn</p><a href={formData.linkedInProfile} target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-lg truncate inline-block max-w-[200px]">{formData.linkedInProfile}</a></div>}

                        <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-sm text-zinc-500 mb-2">Hiring Skills & Technologies</p>
                            <div className="flex flex-wrap gap-2">
                                {formData.hiringSkills && formData.hiringSkills.length > 0 ? (
                                    formData.hiringSkills.map(skill => (
                                        <span key={skill} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-700">{skill}</span>
                                    ))
                                ) : <p className="text-zinc-500 text-sm">No skills added</p>}
                            </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                            <p className="text-sm text-zinc-500">About the Recruiter</p>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-wrap">{formData.about || "No description provided."}</p>
                        </div>

                        <div className="md:col-span-2 lg:col-span-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                            <p className="text-sm text-zinc-500">Company Description</p>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-1 whitespace-pre-wrap">{formData.companyDescription || "No description provided."}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Input label="Company Name *" name="companyName" value={formData.companyName} onChange={handleChange} required />
                            <Input label="Your Designation *" name="designation" value={formData.designation} onChange={handleChange} required />
                            <Input label="Industry *" name="industry" value={formData.industry} onChange={handleChange} required />
                            <Input label="Location *" name="location" value={formData.location} onChange={handleChange} required />
                            <Input label="Phone Number *" name="phone" value={formData.phone} onChange={handleChange} required />
                            <Input label="Years of Experience *" name="yearsOfExperience" type="number" value={formData.yearsOfExperience} onChange={handleChange} required />
                            <Input label="Company Website URL" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} />
                            <Input label="Company Logo URL" name="companyLogoUrl" value={formData.companyLogoUrl} onChange={handleChange} />
                            <Input label="LinkedIn Profile URL" name="linkedInProfile" value={formData.linkedInProfile} onChange={handleChange} />
                            <Input label="Profile Image URL" name="profileImageUrl" value={formData.profileImageUrl} onChange={handleChange} />

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Size</label>
                                <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white">
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 Employees</option>
                                    <option value="11-50">11-50 Employees</option>
                                    <option value="51-200">51-200 Employees</option>
                                    <option value="200+">200+ Employees</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Hiring Skills & Technologies</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.hiringSkills.map((skill) => (
                                    <div key={skill} className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full flex items-center gap-2 border border-purple-200 dark:border-purple-500/20 font-medium text-sm">
                                        {skill}
                                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500 transition-colors"><FiTrash2 size={13} /></button>
                                    </div>
                                ))}
                                {formData.hiringSkills.length === 0 && <p className="text-zinc-500 text-sm">No skills added yet.</p>}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add skill (e.g. React, Talent Acquisition)"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                                />
                                <button type="button" onClick={handleAddSkill} className="bg-zinc-800 dark:bg-zinc-700 text-white px-5 py-2 rounded-xl font-semibold hover:bg-zinc-700 transition">
                                    Add Skill
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">About the Recruiter</label>
                            <textarea name="about" value={formData.about} onChange={handleChange} rows={3} placeholder="Tell us about yourself..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"></textarea>
                        </div>

                        <div className="space-y-1 mb-8">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Description</label>
                            <textarea name="companyDescription" value={formData.companyDescription} onChange={handleChange} rows={4} placeholder="What does your company do?" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"></textarea>
                        </div>

                        <button type="submit" disabled={saving} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiSave />} Save Company Profile
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

function Input({ label, name, value, onChange, type = "text", required = false }: any) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                required={required}
                onChange={onChange}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
        </div>
    )
}