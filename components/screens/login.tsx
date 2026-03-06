"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authService";

export default function LoginForm({ switchForm }: { switchForm: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Validation function
    const validate = () => {
        if (!email) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address";
        if (!password) return "Password is required";
        if (password.length < 6) return "Password must be at least 6 characters";
        return null;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            await loginUser({ email, password });
            // The browser just saved the httpOnly cookies automatically!
            setSuccess("Successfully logged in! Redirecting...");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Invalid credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    // OAuth login buttons
    const handleOAuthLogin = (provider: string) => {
        setError("");
        setSuccess("");
        setIsLoading(true);
        setTimeout(() => {
            setSuccess(`Redirecting to ${provider} for authentication...`);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800 rounded-3xl shadow-2xl transition-all duration-300">
            <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
                        Sign in to continue to OrbitHire
                    </p>
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-4 mb-6">
                    <button
                        type="button"
                        onClick={() => handleOAuthLogin('Google')}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 py-3 px-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium cursor-pointer shadow-sm"
                    >
                        <FcGoogle className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleOAuthLogin('GitHub')}
                        className="w-full flex items-center justify-center gap-3 bg-zinc-900 dark:bg-zinc-950 text-white border border-transparent py-3 px-4 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-900 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 font-medium cursor-pointer shadow-sm"
                    >
                        <FaGithub className="w-5 h-5" />
                        Continue with GitHub
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700"></div>
                    <span className="px-4 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                        Or continue with email
                    </span>
                    <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Error message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Success message */}
                    {success && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <FiCheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                        </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Email address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                            <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">Forgot password?</a>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading || !!success}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Sign In"}
                    </button>
                </form>
            </div>

            {/* Switch to signup */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={switchForm}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
                    >
                        Create an account
                    </button>
                </p>
            </div>
        </div>
    );
}