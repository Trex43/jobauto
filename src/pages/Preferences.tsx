import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User, Settings,
  Plus, X, Save, Loader2, Sliders, MapPin, DollarSign, Building2, Ban
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface JobPreferences {
  desiredRoles: string[];
  desiredLocations: string[];
  remotePreference: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  minMatchScore: number;
  industryPreferences: string[];
  companySizePreferences: string[];
  excludedCompanies: string[];
  excludedKeywords: string[];
  emailNotifications: boolean;
  dailyDigest: boolean;
  instantAlerts: boolean;
}

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState<JobPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newCompanySize, setNewCompanySize] = useState('');
  const [newExcludedCompany, setNewExcludedCompany] = useState('');
  const [newExcludedKeyword, setNewExcludedKeyword] = useState('');

  useEffect(() => {
    api.get<{ preferences: JobPreferences }>('/preferences')
      .then((res) => {
        if (res.success && res.data) {
          setPrefs(res.data.preferences);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const savePreferences = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await api.put<{ preferences: JobPreferences }>('/preferences', prefs);
      if (res.success && res.data) {
        setPrefs(res.data.preferences);
        alert('Preferences saved successfully');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const addItem = (field: keyof JobPreferences, value: string, setter: (v: string) => void) => {
    if (!value.trim() || !prefs) return;
    const arr = (prefs[field] as string[]) || [];
    if (arr.includes(value.trim())) return;
    setPrefs({ ...prefs, [field]: [...arr, value.trim()] });
    setter('');
  };

  const removeItem = (field: keyof JobPreferences, value: string) => {
    if (!prefs) return;
    const arr = (prefs[field] as string[]) || [];
    setPrefs({ ...prefs, [field]: arr.filter((i) => i !== value) });
  };

  const sidebarLink = (to: string, icon: React.ReactNode, label: string) => (
    <Link to={to} key={to} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
      {icon}
      {label}
    </Link>
  );

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
          {sidebarLink('/jobs', <Briefcase className="w-5 h-5" />, 'Jobs')}
          {sidebarLink('/applications', <Send className="w-5 h-5" />, 'Applications')}
          {sidebarLink('/profile', <User className="w-5 h-5" />, 'Profile')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <Sliders className="w-5 h-5" /> Preferences
          </div>
        </nav>
        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Job Preferences</h1>
          <p className="text-gray-400 mb-6">Define what you're looking for so our AI can find the best matches</p>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" /></div>
          ) : prefs ? (
            <div className="space-y-6">
              {/* Desired Roles */}
              <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-[#7c39f6]" />
                  <h3 className="text-lg font-semibold">Desired Roles</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {prefs.desiredRoles.map((role) => (
                    <span key={role} className="inline-flex items-center gap-1 px-3 py-1 bg-[#7c39f6]/10 text-[#7c39f6] rounded-full text-sm">
                      {role}
                      <button onClick={() => removeItem('desiredRoles', role)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newRole} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewRole(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="e.g. Senior Frontend Developer" />
                  <button onClick={() => addItem('desiredRoles', newRole, setNewRole)} className="px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9]">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Locations */}
              <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#7c39f6]" />
                  <h3 className="text-lg font-semibold">Desired Locations</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {prefs.desiredLocations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 px-3 py-1 bg-[#7c39f6]/10 text-[#7c39f6] rounded-full text-sm">
                      {loc}
                      <button onClick={() => removeItem('desiredLocations', loc)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newLocation} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLocation(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="e.g. San Francisco, Remote" />
                  <button onClick={() => addItem('desiredLocations', newLocation, setNewLocation)} className="px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9]">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Remote & Salary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-[#7c39f6]" />
                    <h3 className="text-lg font-semibold">Work Preference</h3>
                  </div>
                  <select value={prefs.remotePreference || ''} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPrefs({ ...prefs, remotePreference: e.target.value || null })}
                    className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none">
                    <option value="">Any</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-[#7c39f6]" />
                    <h3 className="text-lg font-semibold">Salary Range</h3>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" value={prefs.minSalary || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, minSalary: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Min" />
                    <input type="number" value={prefs.maxSalary || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, maxSalary: parseInt(e.target.value) || null })}
                      className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Max" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <select value={prefs.salaryCurrency} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPrefs({ ...prefs, salaryCurrency: e.target.value })}
                      className="px-3 py-1 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm">
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <select value={prefs.salaryPeriod} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPrefs({ ...prefs, salaryPeriod: e.target.value })}
                      className="px-3 py-1 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white text-sm">
                      <option value="yearly">Yearly</option>
                      <option value="monthly">Monthly</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Match Score */}
              <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Minimum Match Score</h3>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} value={prefs.minMatchScore} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, minMatchScore: parseInt(e.target.value) })}
                    className="flex-1 accent-[#7c39f6]" />
                  <span className="text-2xl font-bold text-[#7c39f6] w-16 text-center">{prefs.minMatchScore}%</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Jobs below this score won't be auto-applied. 50%+ recommended.</p>
              </div>

              {/* Industries */}
              <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-[#7c39f6]" />
                  <h3 className="text-lg font-semibold">Industries</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {prefs.industryPreferences.map((ind) => (
                    <span key={ind} className="inline-flex items-center gap-1 px-3 py-1 bg-[#7c39f6]/10 text-[#7c39f6] rounded-full text-sm">
                      {ind}
                      <button onClick={() => removeItem('industryPreferences', ind)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newIndustry} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewIndustry(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="e.g. Technology, Healthcare" />
                  <button onClick={() => addItem('industryPreferences', newIndustry, setNewIndustry)} className="px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9]">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Exclusions */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ban className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold">Excluded Companies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {prefs.excludedCompanies.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm">
                        {c}
                        <button onClick={() => removeItem('excludedCompanies', c)} className="hover:text-red-300"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newExcludedCompany} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExcludedCompany(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-red-400 outline-none" placeholder="Company name" />
                    <button onClick={() => addItem('excludedCompanies', newExcludedCompany, setNewExcludedCompany)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ban className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold">Excluded Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {prefs.excludedKeywords.map((k) => (
                      <span key={k} className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm">
                        {k}
                        <button onClick={() => removeItem('excludedKeywords', k)} className="hover:text-red-300"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newExcludedKeyword} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExcludedKeyword(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-red-400 outline-none" placeholder="e.g. contract, intern" />
                    <button onClick={() => addItem('excludedKeywords', newExcludedKeyword, setNewExcludedKeyword)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications' },
                    { key: 'dailyDigest', label: 'Daily Digest' },
                    { key: 'instantAlerts', label: 'Instant Alerts' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={prefs[key as keyof JobPreferences] as boolean} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, [key]: e.target.checked })}
                        className="w-5 h-5 accent-[#7c39f6]" />
                      <span className="text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-4">
                <button onClick={savePreferences} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

