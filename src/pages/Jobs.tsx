import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User, Sliders, Link2,
  Loader2, Search, MapPin, DollarSign, Filter, ExternalLink,
  CheckCircle, Rocket, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  remoteType?: string;
  description: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  skillsRequired: string[];
  applyUrl: string;
  postedAt?: string;
  portal: string;
  matchScore?: number;
  matchingSkills?: string[];
}

interface JobFilters {
  search: string;
  location: string;
  remote: string;
  minSalary: string;
  maxSalary: string;
  portal: string;
  skills: string;
  sortByMatch: boolean;
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    search: '', location: '', remote: '', minSalary: '', maxSalary: '', portal: '', skills: '', sortByMatch: true,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'it'>('recommended');
  const [syncing, setSyncing] = useState(false);

  const fetchJobs = async (p = page, f = filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', '12');
    if (f.search) params.set('search', f.search);
    if (f.location) params.set('location', f.location);
    if (f.remote) params.set('remote', f.remote);
    if (f.minSalary) params.set('minSalary', f.minSalary);
    if (f.maxSalary) params.set('maxSalary', f.maxSalary);
    if (f.portal) params.set('portal', f.portal);
    if (f.skills) params.set('skills', f.skills);
    if (f.sortByMatch) params.set('sortByMatch', 'true');
    if (activeTab === 'it') params.set('tab', 'it');

    try {
      const res = await api.get<{ jobs: Job[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/jobs?${params.toString()}`);
      if (res.success && res.data) {
        setJobs(res.data.jobs);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await api.get<{ jobs: Job[] }>('/jobs/recommendations/personalized?limit=6');
      if (res.success && res.data) {
        setRecommendations(res.data.jobs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchJobs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchJobs(1);
  };

  const applyToJob = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      const res = await api.post('/applications', { jobId });
      if (res.success) {
        setAppliedIds((prev) => new Set(prev).add(jobId));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const sidebarLink = (to: string, icon: ReactNode, label: string, active = false) => (
    <Link
      to={to}
      key={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? 'bg-[#7c39f6]/10 text-[#7c39f6]' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  const getMatchColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchBg = (score?: number) => {
    if (!score) return 'bg-gray-500/10';
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  const displayedJobs = activeTab === 'recommended' ? recommendations : jobs;
  const isLoadingDisplay = activeTab === 'recommended' ? loadingRecs : loading;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#13131f] border-r border-[#7c39f6]/20 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Job<span className="text-[#7c39f6]">Auto</span></span>
          </Link>
        </div>
        <nav className="px-4 space-y-1 flex-1">
          {sidebarLink('/dashboard', <TrendingUp className="w-5 h-5" />, 'Dashboard')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <Briefcase className="w-5 h-5" /> Jobs
          </div>
          {sidebarLink('/applications', <Send className="w-5 h-5" />, 'Applications')}
          {sidebarLink('/profile', <User className="w-5 h-5" />, 'Profile')}
          {sidebarLink('/preferences', <Sliders className="w-5 h-5" />, 'Preferences')}
          {sidebarLink('/portals', <Link2 className="w-5 h-5" />, 'Portals')}
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Find Jobs</h1>
              <p className="text-gray-400">Browse opportunities across 50+ platforms</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'recommended' ? 'bg-[#7c39f6] text-white' : 'bg-[#13131f] text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                For You
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all' ? 'bg-[#7c39f6] text-white' : 'bg-[#13131f] text-gray-400 hover:text-white'
                }`}
              >
                All Jobs
              </button>
              <button
                onClick={() => setActiveTab('it')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'it' ? 'bg-[#7c39f6] text-white' : 'bg-[#13131f] text-gray-400 hover:text-white'
                }`}
              >
                IT Jobs
              </button>
              <button
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await api.post('/jobs/sync', {});
                    fetchJobs(1);
                  } catch (err) {
                    alert('Sync failed');
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Sync
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={filters.search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none"
                  placeholder="Search jobs, companies, or keywords..."
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                  showFilters ? 'bg-[#7c39f6]/20 border-[#7c39f6] text-[#7c39f6]' : 'border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-medium rounded-lg hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all"
              >
                Search
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      value={filters.location}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"
                      placeholder="City or remote"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Work Type</label>
                  <select
                    value={filters.remote}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, remote: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"
                  >
                    <option value="">Any</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Min Salary</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      value={filters.minSalary}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, minSalary: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Skills</label>
                  <input
                    value={filters.skills}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, skills: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"
                    placeholder="e.g. React, Python"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Jobs Grid */}
          {isLoadingDisplay ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" />
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No jobs found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {displayedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-[#13131f] border border-[#7c39f6]/10 hover:border-[#7c39f6]/30 rounded-2xl p-5 transition-all hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {job.companyLogo ? (
                          <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm">
                            {job.company.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-white text-sm">{job.title}</h3>
                          <p className="text-gray-400 text-xs">{job.company}</p>
                        </div>
                      </div>
                      {typeof job.matchScore === 'number' && (
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getMatchBg(job.matchScore)} ${getMatchColor(job.matchScore)}`}>
                          {job.matchScore}% Match
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.location && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      )}
                      {job.remoteType && (
                        <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 capitalize">{job.remoteType}</span>
                      )}
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                          <DollarSign className="w-3 h-3" />
                          {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}
                          {job.salaryMin && job.salaryMax ? ' - ' : ''}
                          {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
                          {' '}{job.salaryPeriod}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#7c39f6]/10 text-[#7c39f6] rounded text-xs">{job.portal}</span>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{job.description}</p>

                    {job.skillsRequired?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {job.skillsRequired.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 rounded text-xs ${
                              job.matchingSkills?.includes(skill.toLowerCase()) || job.matchingSkills?.some((ms) => skill.toLowerCase().includes(ms) || ms.includes(skill.toLowerCase()))
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skillsRequired.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">+{job.skillsRequired.length - 5}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <span className="text-xs text-gray-500">
                        {job.postedAt ? `Posted ${new Date(job.postedAt).toLocaleDateString()}` : 'Recently posted'}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                        {appliedIds.has(job.id) ? (
                          <span className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => applyToJob(job.id)}
                            disabled={applyingId === job.id}
                            className="px-3 py-1.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white rounded-lg text-xs hover:shadow-[0_0_15px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            {applyingId === job.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Rocket className="w-3 h-3" />
                            )}
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {activeTab === 'all' && totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-[#7c39f6]/10 border border-[#7c39f6]/30 rounded-lg text-sm text-[#7c39f6]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

