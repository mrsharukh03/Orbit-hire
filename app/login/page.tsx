"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/screens/login";
import SignupForm from "@/components/screens/signup";
import { checkAuth, loginUser, signupUser } from "@/services/authService";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await checkAuth();
        if (user) router.replace("/dashboard");
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
      <div className="absolute -top-1/4 right-1/4 w-96 h-96 bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

      <div className="relative w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLogin ? (
          <LoginForm switchForm={toggleForm} />
        ) : (
          <SignupForm switchForm={toggleForm} />
        )}
      </div>
    </div>
  );
}