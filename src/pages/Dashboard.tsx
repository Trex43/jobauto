import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogOut, Briefcase, Send, Clock, TrendingUp, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface DashboardStats {
  totalApplications: number;
  statusBreakdown: { status: string; _count: { status: number } }[];
  responseRate: number;
  interviewsScheduled: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/applications/stats/overview')
      .then((res) => {
        if (res.success && res.data) {
          setStats(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#13131f] border-r border-[#7c39f6]/20">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Job<span className="text-[#7c39f6]">Auto</span>
            </span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/jobs" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Briefcase className="w-5 h-5" />
            Jobs
          </Link>
          <Link to="/applications" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Send className="w-5 h-5" />
            Applications
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <User className="w-5 h-5" />
            Profile
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.firstName}</p>
          </div>
          <Link
            to="/jobs"
            className="px-5 py-2.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white text-sm font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all"
          >
            Find Jobs
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#7c39f6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Applications</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalApplications}</p>
                </div>
                <div className="w-12 h-12 bg-[#7c39f6]/10 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-[#7c39f6]" />
                </div>
              </div>
            </div>

            <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Response Rate</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.responseRate}%</p>
                </div>
                <div className="w-12 h-12 bg-[#7c39f6]/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#7c39f6]" />
                </div>
              </div>
            </div>

            <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Interviews</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.interviewsScheduled}</p>
                </div>
                <div className="w-12 h-12 bg-[#7c39f6]/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#7c39f6]" />
                </div>
              </div>
            </div>

            <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.statusBreakdown.find(s => s.status === 'PENDING')?._count.status || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#7c39f6]/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#7c39f6]" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

