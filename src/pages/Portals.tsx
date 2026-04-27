import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User, Sliders,
  Link2, Loader2, RefreshCw, Check, Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Portal {
  id: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  profileUrl?: string;
}

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
};

export default function PortalsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = () => {
    api.get<{ portals: Portal[] }>('/portals')
      .then((res) => {
        if (res.success && res.data) {
          setPortals(res.data.portals);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Job Portals</h1>
          <p className="text-gray-400 mb-6">Connect your accounts from 50+ job platforms</p>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {portals.map((portal: Portal) => (
                <div key={portal.id} className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: portal.color }}>
                      {PORTAL_ICONS[portal.id] || <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{portal.name}</h3>
                      {portal.isConnected ? (
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <Check className="w-3 h-3" /> Connected
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not connected</p>
                      )}
                      {portal.lastSyncAt && (
                        <p className="text-xs text-gray-600 mt-1">Last sync: {new Date(portal.lastSyncAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {portal.isConnected ? (
                      <>
                        <button onClick={() => sync(portal.id)} disabled={actionId === portal.id + '_sync'}
                          className="px-3 py-1.5 bg-[#7c39f6]/20 text-[#7c39f6] rounded-lg text-sm hover:bg-[#7c39f6]/30 transition-colors flex items-center gap-1">
                          {actionId === portal.id + '_sync' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Sync
                        </button>
                        <button onClick={() => disconnect(portal.id)} disabled={actionId === portal.id}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button onClick={() => connect(portal.id)} disabled={actionId === portal.id}
                        className="px-3 py-1.5 bg-[#7c39f6] text-white rounded-lg text-sm hover:bg-[#6d28d9] transition-colors">
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

