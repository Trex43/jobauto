import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User, Sliders,
  Link2, Loader2, RefreshCw, Check, Globe, Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';

interface Portal {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  profileUrl?: string;
}

type CategoryFilter = 'ALL' | 'GENERAL' | 'TECH' | 'REMOTE' | 'MENA' | 'STARTUP' | 'FREELANCE';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All Portals' },
  { key: 'GENERAL', label: 'General' },
  { key: 'TECH', label: 'Tech' },
  { key: 'REMOTE', label: 'Remote' },
  { key: 'MENA', label: 'MENA' },
  { key: 'STARTUP', label: 'Startup' },
  { key: 'FREELANCE', label: 'Freelance' },
];

const PORTAL_ICONS: Record<string, ReactNode> = {
  LINKEDIN: <span className="font-bold text-sm">in</span>,
  INDEED: <span className="font-bold text-sm">I</span>,
  GLASSDOOR: <span className="font-bold text-sm">G</span>,
  ZIPRECRUITER: <span className="font-bold text-sm">Z</span>,
  MONSTER: <span className="font-bold text-sm">M</span>,
  CAREERBUILDER: <span className="font-bold text-sm">C</span>,
  SIMPLYHIRED: <span className="font-bold text-sm">S</span>,
  ANGELLIST: <span className="font-bold text-sm">A</span>,
  STACKOVERFLOW: <span className="font-bold text-sm">SO</span>,
  GITHUB: <span className="font-bold text-sm">GH</span>,
  BAYT: <span className="font-bold text-sm">B</span>,
  NAUKRI: <span className="font-bold text-sm">N</span>,
  GULFTALENT: <span className="font-bold text-sm">GT</span>,
  WUZZUF: <span className="font-bold text-sm">W</span>,
  AKHTABOOT: <span className="font-bold text-sm">A</span>,
  DICE: <span className="font-bold text-sm">D</span>,
  HIRED: <span className="font-bold text-sm">H</span>,
  WELLFOUND: <span className="font-bold text-sm">WF</span>,
  REMOTE_CO: <span className="font-bold text-sm">R</span>,
  WEWORKREMOTELY: <span className="font-bold text-sm">WWR</span>,
  FLEXJOBS: <span className="font-bold text-sm">FJ</span>,
  UPWORK: <span className="font-bold text-sm">UW</span>,
  FIVERR: <span className="font-bold text-sm">FV</span>,
  GOOGLE_JOBS: <span className="font-bold text-sm">G</span>,
  YCOMBINATOR: <span className="font-bold text-sm">YC</span>,
  TOPTAL: <span className="font-bold text-sm">T</span>,
};

export default function PortalsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPortals = () => {
    setLoading(true);
    setError(null);
    api.get<{ portals: Portal[] }>('/portals')
      .then((res) => {
        if (res.success && res.data) {
          setPortals(res.data.portals);
        } else {
          setPortals([]);
        }
      })
      .catch((err: any) => {
        console.error('[Portals] Load error:', err);
        setError(err.message || 'Failed to load portals');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const connect = async (portalId: string) => {
    setActionId(portalId);
    try {
      const res = await api.post(`/portals/${portalId}/connect`, {});
      if (res.success) {
        fetchPortals();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect');
    } finally {
      setActionId(null);
    }
  };

  const disconnect = async (portalId: string) => {
    setActionId(portalId);
    try {
      const res = await api.post(`/portals/${portalId}/disconnect`, {});
      if (res.success) {
        fetchPortals();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect');
    } finally {
      setActionId(null);
    }
  };

  const sync = async (portalId: string) => {
    setActionId(portalId + '_sync');
    try {
      const res = await api.post(`/portals/${portalId}/sync`, {});
      if (res.success) {
        alert('Sync completed');
        fetchPortals();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sync');
    } finally {
      setActionId(null);
    }
  };

  const filteredPortals = useMemo(() => {
    let result = portals;
    if (activeCategory !== 'ALL') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [portals, activeCategory, searchQuery]);

  const connectedCount = portals.filter((p) => p.isConnected).length;

  const sidebarLink = (to: string, icon: ReactNode, label: string) => (
    <Link to={to} key={to} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
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
          {sidebarLink('/jobs', <Briefcase className="w-5 h-5" />, 'Jobs')}
          {sidebarLink('/applications', <Send className="w-5 h-5" />, 'Applications')}
          {sidebarLink('/profile', <User className="w-5 h-5" />, 'Profile')}
          {sidebarLink('/preferences', <Sliders className="w-5 h-5" />, 'Preferences')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <Link2 className="w-5 h-5" /> Portals
          </div>
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold mb-1">Job Portals</h1>
              <p className="text-gray-400">Connect your accounts from 50+ job platforms</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#7c39f6]">{connectedCount}</p>
              <p className="text-sm text-gray-400">Connected</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search portals..."
                className="w-full pl-10 pr-4 py-2 bg-[#13131f] border border-gray-700 rounded-xl text-white focus:border-[#7c39f6] outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-[#7c39f6] text-white'
                      : 'bg-[#13131f] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" /></div>
          ) : error ? (
            <ErrorState
              title="Failed to load portals"
              message={error}
              onRetry={fetchPortals}
            />
          ) : filteredPortals.length === 0 ? (
            <EmptyState
              icon={<Globe className="w-12 h-12" />}
              title="No portals found"
              message={searchQuery ? 'No portals match your search.' : 'No portals available in this category.'}
              action={
                searchQuery ? (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                    className="px-5 py-2.5 bg-[#7c39f6] text-white rounded-xl hover:bg-[#6d28d9] transition-colors"
                  >
                    Clear Filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPortals.map((portal: Portal) => (
                <div key={portal.id} className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-5 flex items-start justify-between hover:border-[#7c39f6]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: portal.color }}>
                      {PORTAL_ICONS[portal.id] || <Globe className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{portal.name}</h3>
                      {portal.isConnected ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <Check className="w-3 h-3" /> Connected
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Not connected</p>
                      )}
                      {portal.lastSyncAt && (
                        <p className="text-xs text-gray-600 mt-0.5">Sync: {new Date(portal.lastSyncAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-2">
                    {portal.isConnected ? (
                      <>
                        <button onClick={() => sync(portal.id)} disabled={actionId === portal.id + '_sync'}
                          className="px-2.5 py-1 bg-[#7c39f6]/20 text-[#7c39f6] rounded-lg text-xs hover:bg-[#7c39f6]/30 transition-colors flex items-center gap-1">
                          {actionId === portal.id + '_sync' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Sync
                        </button>
                        <button onClick={() => disconnect(portal.id)} disabled={actionId === portal.id}
                          className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button onClick={() => connect(portal.id)} disabled={actionId === portal.id}
                        className="px-3 py-1.5 bg-[#7c39f6] text-white rounded-lg text-xs hover:bg-[#6d28d9] transition-colors">
                        {actionId === portal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

