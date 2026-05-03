import { useEffect, useState, type ReactNode, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, LogOut, TrendingUp, Settings, User, Lock, CreditCard, 
  Save, Loader2, Eye, EyeOff
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface SettingsData {
  emailNotifications: boolean;
  dailyDigest: boolean;
  instantAlerts: boolean;
}

interface SubscriptionData {
  tier: string;
  status: string;
  autoAppliesLimit: number;
  autoAppliesUsed: number;
  currentPeriodEnd: string | null;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security' | 'billing'>('account');
  const [showPassword, setShowPassword] = useState(false);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    Promise.all([
      api.get('/preferences'),
      api.get('/subscriptions/current')
    ]).then(([prefRes, subRes]) => {
      if (prefRes.success && prefRes.data) {
        setSettings({
          emailNotifications: (prefRes.data as any).preferences?.emailNotifications ?? true,
          dailyDigest: (prefRes.data as any).preferences?.dailyDigest ?? true,
          instantAlerts: (prefRes.data as any).preferences?.instantAlerts ?? false
        });
      }
      if (subRes.success && subRes.data) {
        setSubscription((subRes.data as any).subscription);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put('/preferences', settings);
      if (res.success) {
        alert('Settings saved!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally { 
      setSaving(false); 
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.success) {
        alert('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to change password');
    }
  };

  const updatePaymentMethod = async () => {
    try {
      const res = await api.post('/subscriptions/update-payment', {});
      if (res.success && (res.data as any)?.url) {
        window.location.href = (res.data as any).url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update payment method');
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
          {sidebarLink('/profile', <User className="w-5 h-5" />, 'Profile')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <Settings className="w-5 h-5" /> Settings
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400 mb-6">Manage your account and preferences</p>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" /></div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {(['account', 'notifications', 'security', 'billing'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-[#7c39f6] text-white' : 'bg-[#13131f] text-gray-400 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">First Name</label>
                      <input value={user?.firstName || ''} disabled
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                      <input value={user?.lastName || ''} disabled
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-gray-400" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Email</label>
                      <input value={user?.email || ''} disabled
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Contact support to change account information.</p>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && settings && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive email updates about your applications</p>
                      </div>
                      <input type="checkbox" checked={settings.emailNotifications} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, emailNotifications: e.target.checked})}
                        className="w-5 h-5 accent-[#7c39f6]" />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
                      <div>
                        <p className="font-medium">Daily Digest</p>
                        <p className="text-sm text-gray-400">Get a daily summary of your job search</p>
                      </div>
                      <input type="checkbox" checked={settings.dailyDigest} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, dailyDigest: e.target.checked})}
                        className="w-5 h-5 accent-[#7c39f6]" />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
                      <div>
                        <p className="font-medium">Instant Alerts</p>
                        <p className="text-sm text-gray-400">Get instant notifications for new matches</p>
                      </div>
                      <input type="checkbox" checked={settings.instantAlerts} 
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({...settings, instantAlerts: e.target.checked})}
                        className="w-5 h-5 accent-[#7c39f6]" />
                    </label>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={saveSettings} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={passwordForm.currentPassword}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full px-4 py-2 pr-10 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">New Password</label>
                      <input type={showPassword ? 'text' : 'password'} value={passwordForm.newPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                      <input type={showPassword ? 'text' : 'password'} value={passwordForm.confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                  </div>
                  <button onClick={changePassword}
                    className="flex items-center gap-2 px-6 py-2 bg-[#7c39f6] text-white font-semibold rounded-xl hover:bg-[#6d28d9] transition-all">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && subscription && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Subscription</h3>
                  <div className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xl font-bold text-white">{subscription.tier}</p>
                        <p className="text-sm text-gray-400">{subscription.status}</p>
                      </div>
                      {subscription.tier !== 'FREE' && (
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">Active</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-4">
                      <p>Auto-applies used: {subscription.autoAppliesUsed} / {subscription.autoAppliesLimit}</p>
                      {subscription.currentPeriodEnd && (
                        <p>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={updatePaymentMethod}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg hover:border-[#7c39f6] transition-colors">
                      <CreditCard className="w-4 h-4" />
                      Update Payment Method
                    </button>
                    {subscription.tier === 'FREE' && (
                      <Link to="/pricing" className="flex items-center gap-2 px-4 py-2 bg-[#7c39f6] rounded-lg hover:bg-[#6d28d9] transition-colors">
                        Upgrade Plan
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
