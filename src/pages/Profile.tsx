import { useEffect, useState, type ReactNode, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User,
  Plus, X, Save, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Skill { id: string; name: string; category: string | null; proficiency: number | null; }
interface Experience { id: string; title: string; company: string; location?: string; startDate: string; endDate?: string; isCurrent: boolean; description?: string; }
interface Education { id: string; institution: string; degree: string; fieldOfStudy?: string; startDate: string; endDate?: string; isCurrent: boolean; gpa?: string; }
interface ProfileData {
  id: string; phone?: string; location?: string; country?: string; city?: string;
  headline?: string; summary?: string; yearsOfExperience?: number; currentTitle?: string; currentCompany?: string;
  linkedInUrl?: string; githubUrl?: string; portfolioUrl?: string;
  skills: Skill[]; experiences: Experience[]; educations: Education[];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'skills' | 'experience' | 'education'>('personal');
  const [form, setForm] = useState<Partial<ProfileData>>({});

  const [newSkill, setNewSkill] = useState({ name: '', category: '', proficiency: 5 });
  const [newExp, setNewExp] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, gpa: '' });

  useEffect(() => {
    api.get<ProfileData>('/profile')
      .then((res) => {
        if (res.success && res.data) {
          setProfile(res.data);
          setForm(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put<ProfileData>('/profile', form);
      if (res.success && res.data) {
        setProfile(res.data);
        setForm(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const addSkill = async () => {
    if (!newSkill.name) return;
    try {
      const res = await api.post<{ skill: Skill }>('/profile/skills', newSkill);
      if (res.success && res.data) {
        setProfile((p: ProfileData | null) => p ? { ...p, skills: [...p.skills, res.data!.skill] } : p);
        setNewSkill({ name: '', category: '', proficiency: 5 });
      }
    } catch (err: any) { alert(err.message); }
  };

  const removeSkill = async (id: string) => {
    try {
      await api.delete(`/profile/skills/${id}`);
      setProfile((p: ProfileData | null) => p ? { ...p, skills: p.skills.filter((s: Skill) => s.id !== id) } : p);
    } catch (err: any) { alert(err.message); }
  };

  const addExperience = async () => {
    if (!newExp.title || !newExp.company || !newExp.startDate) return;
    try {
      const res = await api.post<{ experience: Experience }>('/profile/experiences', newExp);
      if (res.success && res.data) {
        setProfile((p: ProfileData | null) => p ? { ...p, experiences: [...p.experiences, res.data!.experience] } : p);
        setNewExp({ title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
      }
    } catch (err: any) { alert(err.message); }
  };

  const removeExperience = async (id: string) => {
    try {
      await api.delete(`/profile/experiences/${id}`);
      setProfile((p: ProfileData | null) => p ? { ...p, experiences: p.experiences.filter((e: Experience) => e.id !== id) } : p);
    } catch (err: any) { alert(err.message); }
  };

  const addEducation = async () => {
    if (!newEdu.institution || !newEdu.degree || !newEdu.startDate) return;
    try {
      const res = await api.post<{ education: Education }>('/profile/educations', newEdu);
      if (res.success && res.data) {
        setProfile((p: ProfileData | null) => p ? { ...p, educations: [...p.educations, res.data!.education] } : p);
        setNewEdu({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, gpa: '' });
      }
    } catch (err: any) { alert(err.message); }
  };

  const removeEducation = async (id: string) => {
    try {
      await api.delete(`/profile/educations/${id}`);
      setProfile((p: ProfileData | null) => p ? { ...p, educations: p.educations.filter((e: Education) => e.id !== id) } : p);
    } catch (err: any) { alert(err.message); }
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
          {sidebarLink('/jobs', <Briefcase className="w-5 h-5" />, 'Jobs')}
          {sidebarLink('/applications', <Send className="w-5 h-5" />, 'Applications')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl">
            <User className="w-5 h-5" /> Profile
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
          <h1 className="text-2xl font-bold mb-2">Profile</h1>
          <p className="text-gray-400 mb-6">Manage your profile, skills, and experience</p>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" /></div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                {(['personal', 'skills', 'experience', 'education'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-[#7c39f6] text-white' : 'bg-[#13131f] text-gray-400 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Headline</label>
                      <input value={form.headline || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, headline: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="e.g. Senior Full Stack Developer" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Current Title</label>
                      <input value={form.currentTitle || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, currentTitle: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Current Company</label>
                      <input value={form.currentCompany || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, currentCompany: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Years of Experience</label>
                      <input type="number" value={form.yearsOfExperience || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Location</label>
                      <input value={form.location || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, location: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Phone</label>
                      <input value={form.phone || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Summary</label>
                    <textarea value={form.summary || ''} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, summary: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none h-24 resize-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">LinkedIn</label>
                      <input value={form.linkedInUrl || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, linkedInUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">GitHub</label>
                      <input value={form.githubUrl || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, githubUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Portfolio</label>
                      <input value={form.portfolioUrl || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, portfolioUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile?.skills.map((skill: Skill) => (
                      <span key={skill.id} className="inline-flex items-center gap-1 px-3 py-1 bg-[#7c39f6]/10 text-[#7c39f6] rounded-full text-sm">
                        {skill.name}
                        <button onClick={() => removeSkill(skill.id)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {profile?.skills.length === 0 && <p className="text-gray-500">No skills added yet</p>}
                  </div>
                  <div className="flex gap-3">
                    <input value={newSkill.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="flex-1 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Skill name" />
                    <input value={newSkill.category} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkill({ ...newSkill, category: e.target.value })}
                      className="w-40 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Category" />
                    <input type="number" min={1} max={10} value={newSkill.proficiency} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) || 5 })}
                      className="w-24 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    <button onClick={addSkill} className="px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9] transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === 'experience' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Work Experience</h3>
                  {profile?.experiences.map((exp: Experience) => (
                    <div key={exp.id} className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800 flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white">{exp.title} <span className="text-gray-400">at {exp.company}</span></p>
                        <p className="text-sm text-gray-500">{exp.location} {exp.isCurrent && <span className="text-[#7c39f6]">Current</span>}</p>
                        <p className="text-sm text-gray-500">{new Date(exp.startDate).toLocaleDateString()} {exp.endDate && `- ${new Date(exp.endDate).toLocaleDateString()}`}</p>
                        {exp.description && <p className="text-sm text-gray-400 mt-1">{exp.description}</p>}
                      </div>
                      <button onClick={() => removeExperience(exp.id)} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                    <input value={newExp.title} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, title: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Job Title" />
                    <input value={newExp.company} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, company: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Company" />
                    <input value={newExp.location} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, location: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Location" />
                    <input type="date" value={newExp.startDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, startDate: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    <input type="date" value={newExp.endDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, endDate: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={newExp.isCurrent} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewExp({ ...newExp, isCurrent: e.target.checked })}
                        className="w-4 h-4 accent-[#7c39f6]" />
                      <span className="text-sm text-gray-400">Current position</span>
                    </div>
                    <textarea value={newExp.description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewExp({ ...newExp, description: e.target.value })}
                      className="col-span-2 px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none h-20 resize-none" placeholder="Description" />
                    <div className="col-span-2 flex justify-end">
                      <button onClick={addExperience} className="flex items-center gap-2 px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9] transition-colors">
                        <Plus className="w-4 h-4" /> Add Experience
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {activeTab === 'education' && (
                <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Education</h3>
                  {profile?.educations.map((edu: Education) => (
                    <div key={edu.id} className="p-4 bg-[#0a0a0f] rounded-xl border border-gray-800 flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-white">{edu.degree} <span className="text-gray-400">at {edu.institution}</span></p>
                        {edu.fieldOfStudy && <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>}
                        <p className="text-sm text-gray-500">{new Date(edu.startDate).toLocaleDateString()} {edu.endDate && `- ${new Date(edu.endDate).toLocaleDateString()}`} {edu.isCurrent && <span className="text-[#7c39f6]">Current</span>}</p>
                        {edu.gpa && <p className="text-sm text-gray-400">GPA: {edu.gpa}</p>}
                      </div>
                      <button onClick={() => removeEducation(edu.id)} className="text-gray-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                    <input value={newEdu.institution} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Institution" />
                    <input value={newEdu.degree} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Degree" />
                    <input value={newEdu.fieldOfStudy} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="Field of Study" />
                    <input value={newEdu.gpa} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, gpa: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" placeholder="GPA" />
                    <input type="date" value={newEdu.startDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    <input type="date" value={newEdu.endDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                      className="px-4 py-2 bg-[#0a0a0f] border border-gray-700 rounded-lg text-white focus:border-[#7c39f6] outline-none" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={newEdu.isCurrent} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEdu({ ...newEdu, isCurrent: e.target.checked })}
                        className="w-4 h-4 accent-[#7c39f6]" />
                      <span className="text-sm text-gray-400">Currently studying</span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={addEducation} className="flex items-center gap-2 px-4 py-2 bg-[#7c39f6] text-white rounded-lg hover:bg-[#6d28d9] transition-colors">
                        <Plus className="w-4 h-4" /> Add Education
                      </button>
                    </div>
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

