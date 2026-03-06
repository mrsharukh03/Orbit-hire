"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiBriefcase, FiMapPin, FiArrowRight, FiTarget, FiZap, FiArrowUpRight, FiLoader } from 'react-icons/fi';
import { BsRobot, BsStars } from 'react-icons/bs';
import { getPopularJobs } from '@/services/publicService';
import SearchBar, { type SearchBarFilters } from '@/components/ui/SearchBar';

interface JobPosting {
  id: number;
  title: string;
  companyName: string;
  location: string;
  type: string;
  minSalary: number;
  maxSalary: number;
  status: string;
  viewCount: number;
}

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPopularJobs = async () => {
    setLoading(true);
    try {
      const data = await getPopularJobs(0, 4);
      if (data && data.content) setJobs(data.content);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularJobs();
  }, []);

  // Called by SearchBar when user clicks Search
  const handleSearch = (filters: SearchBarFilters) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.location) params.append('location', filters.location);
    router.push(`/jobs?${params.toString()}`);
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return "Not Disclosed";
    if (min && !max) return `$${(min / 1000).toFixed(0)}k+`;
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
  };

  const getJobMatchScore = (id: number) => {
    const scores = [98, 94, 89, 92, 85, 96, 91, 99];
    return scores[id % scores.length] + "%";
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-emerald-500/30 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-8 backdrop-blur-md shadow-sm">
              <BsStars className="w-4 h-4" />
              <span>The Next Generation AI Job Portal</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-zinc-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              Land your dream job in the <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Intelligence Era
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto font-medium">
              Orbit Hire uses advanced AI to perfectly match your skills with top tech companies. Upload your resume and let our algorithm do the magic.
            </p>

            {/* Search Bar — shared component also used on /jobs */}
            <SearchBar
              showFilterToggle={false}
              onSearch={handleSearch}
            />

            {/* Quick tags */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Trending 🔥:</span>
              {["Prompt Engineer", "Machine Learning", "Remote AI", "Next.js", "Python"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => router.push(`/jobs?keyword=${encodeURIComponent(tag)}`)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors border-b border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 font-medium bg-transparent"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners / Social Proof */}
      <section className="py-10 border-y border-zinc-200/50 dark:border-zinc-800/50 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6">Trusted by top AI pioneers</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl md:text-2xl font-extrabold flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-600"></div> OpenAI</div>
            <div className="text-xl md:text-2xl font-extrabold flex items-center gap-2"><div className="w-8 h-8 rounded-sm bg-purple-600"></div> Anthropic</div>
            <div className="text-xl md:text-2xl font-extrabold flex items-center gap-2"><div className="w-8 h-8 rounded bg-teal-500"></div> Hugging Face</div>
            <div className="text-xl md:text-2xl font-extrabold flex items-center gap-2"><div className="w-8 h-8 rounded-tr-xl bg-orange-500"></div> DeepMind</div>
          </div>
        </div>
      </section>

      {/* Live Jobs Section - SLEEK LIST VIEW WITH SIDE TEXT */}
      <section className="py-24 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Background ambient light */}
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">

            {/* LEFT COLUMN: Unique Sticky Text Area */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-bold mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Live Job Feed
                </div>

                <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight mb-4">
                  Jobs tailored by <br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Neural Networks
                  </span>
                </h2>

                <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Bypass the recruiter queue. Our AI analyzes your digital footprint, GitHub commits, and skills to surface roles where you're statistically guaranteed to thrive.
                </p>
              </div>

              {/* Unique Highlight Box */}
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                    <BsStars className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">High Match Probability</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Based on your recent activity</p>
                  </div>
                </div>
              </div>

              <Link href="/jobs" className="inline-flex items-center gap-2 text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all font-bold px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.02]">
                Explore All Jobs <FiArrowRight />
              </Link>
            </div>

            {/* RIGHT COLUMN: Sleek List View (Top 5 Jobs) */}
            <div className="lg:col-span-7">
              {loading ? (
                <div className="flex justify-center items-center py-20 w-full h-full">
                  <FiLoader className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                  <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">No jobs found</h3>
                  <p className="text-zinc-500 mt-2">Try adjusting your search filters</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Slice to ensure max 5 jobs are shown */}
                  {jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="group relative bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 overflow-hidden"
                    >
                      {/* Left Edge Highlight on Hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Company Logo & Basic Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${job.companyName}&backgroundColor=2563eb`}
                          alt={job.companyName}
                          className="w-12 h-12 rounded-xl border border-zinc-100 dark:border-zinc-800 object-cover shadow-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{job.companyName}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                            <span className="flex items-center gap-1 truncate"><FiMapPin className="w-3.5 h-3.5" /> {job.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Info (Badges & Button) */}
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 pt-4 sm:pt-0">

                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                          {/* Salary Tag */}
                          <div className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {formatSalary(job.minSalary, job.maxSalary)}
                          </div>

                          {/* AI Match Badge (Compact) */}
                          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                            <BsStars className="w-3 h-3" />
                            {getJobMatchScore(job.id)} Match
                          </div>
                        </div>

                        {/* Action Button */}
                        <button className="w-10 h-10 rounded-xl bg-zinc-50 group-hover:bg-blue-600 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:group-hover:bg-blue-600 flex flex-shrink-0 items-center justify-center text-zinc-400 group-hover:text-white dark:group-hover:text-white transition-all duration-300 group-hover:rotate-45">
                          <FiArrowUpRight className="w-5 h-5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* AI Features Section (Unchanged) */}
      <section className="py-24 bg-zinc-100/50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white mb-6 tracking-tight">Supercharge Your Career with AI</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">Our platform leverages state-of-the-art LLMs to revolutionize the recruitment process for both candidates and top-tier tech employers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-zinc-900/80 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-blue-100 dark:border-blue-500/20">
                <FiTarget className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Smart Skill Matching</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Our embedding models analyze your skills and GitHub repos to find jobs with over 90% compatibility, saving you hours of scrolling.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900/80 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-purple-100 dark:border-purple-500/20">
                <BsRobot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Resume Parsing Agent</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Upload any PDF and our AI extracts data perfectly, providing instant feedback to tailor your resume for strict ATS systems.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900/80 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-emerald-100 dark:border-emerald-500/20">
                <FiZap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Auto Apply Gen-AI</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">Let our autonomous agents generate highly personalized cover letters and submit applications natively while you sleep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (Unchanged) */}
      <section className="py-24 relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-900/40 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-0"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">Ready to accelerate your career?</h2>
          <p className="text-blue-100/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">Join thousands of professionals landing jobs in AI, Web3, and cutting-edge tech. Create your profile in minutes.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-xl shadow-blue-600/30 w-full sm:w-auto text-lg flex justify-center items-center gap-2 border border-blue-500">
                Create Free Account <FiArrowRight />
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto text-lg backdrop-blur-sm">
                Login to Profile
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}