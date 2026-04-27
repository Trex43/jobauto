import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogOut, Briefcase, Send, Clock, TrendingUp, User, Sliders, Link2, Rocket,
  Loader2, CheckCircle, AlertCircle, Sparkles, MapPin, ChevronRight,
  Target, Timer, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface DashboardStats {
  totalApplications: number;
  statusBreakdown: Array<{ status: string; _count: { status: number } }>;
  responseRate: number;
  interviewsScheduled: number;
}

interface SetupItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  link: string;
  icon: ReactNode;
}

interface JobRec {
  id: string; title: string; company: string; location?: string; remoteType?: string;
  salaryMin?: number; salaryMax?: number; matchScore?: number; matchReasons?: string[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats|null>(null);
  const [aas, setAas] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<JobRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [runningAA, setRunningAA] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [portals, setPortals] = useState<any[]>([]);

  useEffect(()=>{
    api.get<DashboardStats>('/applications/stats/overview')
      .then(r=>{ if(r.success&&r.data) setStats(r.data); }).catch(console.error)
      .finally(()=>setLoading(false));
    api.get('/auto-apply/status')
      .then(r=>{ if(r.success&&r.data) setAas(r.data); }).catch(console.error);
    api.get<{jobs:JobRec[]}>('/jobs/recommendations/personalized?limit=3')
      .then(r=>{ if(r.success&&r.data) setRecommendations(r.data.jobs); }).catch(console.error)
      .finally(()=>setLoadingRecs(false));
    api.get<{ profile: any }>('/profile')
      .then(r=>{ if(r.success&&r.data) setProfile(r.data.profile); }).catch(console.error);
    api.get<{ preferences: any }>('/preferences')
      .then(r=>{ if(r.success&&r.data) setPreferences(r.data.preferences); }).catch(console.error);
    api.get<{ portals: any[] }>('/portals')
      .then(r=>{ if(r.success&&r.data) setPortals(r.data.portals||[]); }).catch(console.error);
  },[]);

  const runAA = async()=>{
    setRunningAA(true);
    try{
      const r=await api.post<{ applied: number }>('/auto-apply/run',{limit:5});
      if(r.success){
        alert(`Auto-applied to ${r.data?.applied ?? 0} jobs!`);
        const rs=await api.get<DashboardStats>('/applications/stats/overview');
        if(rs.success&&rs.data) setStats(rs.data);
        const as=await api.get('/auto-apply/status');
        if(as.success&&as.data) setAas(as.data);
      }
    }catch(err:any){ alert(err.message||'Failed'); }
    finally{ setRunningAA(false); }
  };

  const handleLogout=()=>{ logout(); navigate('/'); };

  const setupItems: SetupItem[]=[
    { id:'profile', label:'Complete Your Profile', description:'Add skills, experience, and education', done:!!(profile?.skills?.length>0&&profile?.experiences?.length>0), link:'/profile', icon:<User className="w-5 h-5"/> },
    { id:'prefs', label:'Set Job Preferences', description:'Define roles, locations, and salary', done:!!(preferences?.desiredRoles?.length>0), link:'/preferences', icon:<Sliders className="w-5 h-5"/> },
    { id:'portals', label:'Connect Job Portals', description:'Link LinkedIn, Indeed, and more', done:portals.some(p=>p.isConnected), link:'/portals', icon:<Link2 className="w-5 h-5"/> },
    { id:'auto', label:'Run Auto-Apply', description:'Let AI apply to matching jobs', done:(aas?.totalAutoApplied||0)>0, link:'/jobs', icon:<Rocket className="w-5 h-5"/> },
  ];
  const completedSetup=setupItems.filter(s=>s.done).length;

  const getStat=(st:string)=>stats?.statusBreakdown.find(s=>s.status===st)?._count.status||0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#13131f] border-r border-[#7c39f6]/20">
        <div className="p-6"><Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center"><Zap className="w-4 h-4 text-white"/></div><span className="text-lg font-bold text-white">Job<span className="text-[#7c39f6]">Auto</span></span></Link></div>
        <nav className="px-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl"><TrendingUp className="w-5 h-5"/> Dashboard</Link>
          <Link to="/jobs" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><Briefcase className="w-5 h-5"/> Jobs</Link>
          <Link to="/applications" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><Send className="w-5 h-5"/> Applications</Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><User className="w-5 h-5"/> Profile</Link>
          <Link to="/preferences" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><Sliders className="w-5 h-5"/> Preferences</Link>
          <Link to="/portals" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"><Link2 className="w-5 h-5"/> Portals</Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4"><button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut className="w-5 h-5"/> Sign Out</button></div>
      </aside>

      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-gray-400">Welcome back, {user?.firstName}</p></div>
          <Link to="/jobs" className="px-5 py-2.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white text-sm font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all">Find Jobs</Link>
        </div>

        {loading?(
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]"/></div>
        ):stats?(
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label:'Total Applications', value:stats.totalApplications, icon:Send, color:'text-[#7c39f6]', bg:'bg-[#7c39f6]/10' },
                { label:'Response Rate', value:`${stats.responseRate}%`, icon:TrendingUp, color:'text-green-400', bg:'bg-green-500/10' },
                { label:'Interviews', value:stats.interviewsScheduled, icon:Clock, color:'text-purple-400', bg:'bg-purple-500/10' },
                { label:'Pending', value:getStat('PENDING'), icon:AlertCircle, color:'text-yellow-400', bg:'bg-yellow-500/10' },
              ].map(s=>(
                <div key={s.label} className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-gray-400 text-sm">{s.label}</p><p className="text-3xl font-bold text-white mt-1">{s.value}</p></div>
                    <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}><s.icon className={`w-6 h-6 ${s.color}`}/></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Setup Checklist */}
              <div className="lg:col-span-1 bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Target className="w-5 h-5 text-[#7c39f6]"/><h3 className="font-semibold">Setup Checklist</h3></div>
                  <span className="text-sm text-[#7c39f6]">{completedSetup}/{setupItems.length}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-4"><div className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] h-2 rounded-full transition-all" style={{width:`${(completedSetup/setupItems.length)*100}%`}}/></div>
                <div className="space-y-3">
                  {setupItems.map(item=>(
                    <Link key={item.id} to={item.link} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.done?'bg-green-500/10 text-green-400':'bg-[#7c39f6]/10 text-[#7c39f6]'}`}>
                        {item.done?<CheckCircle className="w-4 h-4"/>:item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${item.done?'text-gray-400 line-through':'text-white'}`}>{item.label}</p>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#7c39f6] transition-colors"/>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Auto-Apply Status */}
              <div className="lg:col-span-1 bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><Rocket className="w-5 h-5 text-[#7c39f6]"/><h3 className="font-semibold">Auto-Apply Status</h3></div>
                {aas?(
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Credits Used</span><span className="text-white font-medium">{aas.used} / {aas.limit}</span></div>
                      <div className="w-full bg-gray-800 rounded-full h-2.5"><div className="bg-gradient-to-r from-[#7c39f6] to-[#a855f7] h-2.5 rounded-full" style={{width:`${Math.min(100,(aas.used/aas.limit)*100)}%`}}/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0a0a0f] rounded-xl p-3 border border-gray-800 text-center"><p className="text-2xl font-bold text-white">{aas.totalAutoApplied}</p><p className="text-xs text-gray-400">Auto-Applied</p></div>
                      <div className="bg-[#0a0a0f] rounded-xl p-3 border border-gray-800 text-center"><p className="text-2xl font-bold text-white">{aas.timeSaved||0}h</p><p className="text-xs text-gray-400">Time Saved</p></div>
                    </div>
                    <button onClick={runAA} disabled={runningAA||aas.remaining<=0} className="w-full py-2.5 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-medium rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {runningAA?<Loader2 className="w-4 h-4 animate-spin"/>:<Rocket className="w-4 h-4"/>}
                      {aas.remaining<=0?'Limit Reached':runningAA?'Running...':'Run Auto-Apply'}
                    </button>
                    {aas.remaining<=0&&<p className="text-xs text-center text-[#7c39f6]">Upgrade for unlimited auto-applies</p>}
                  </div>
                ):<div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#7c39f6] mx-auto"/></div>}
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-1 bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><Timer className="w-5 h-5 text-[#7c39f6]"/><h3 className="font-semibold">Recent Activity</h3></div>
                {aas?.recentApplications?.length>0?(
                  <div className="space-y-3">
                    {aas.recentApplications.map((ra:any,i:number)=>(
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-xl border border-gray-800">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-400"/></div>
                        <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{ra.job.title}</p><p className="text-xs text-gray-500">{ra.job.company}</p></div>
                      </div>
                    ))}
                  </div>
                ):<p className="text-gray-500 text-sm text-center py-8">No recent applications</p>}
                <Link to="/applications" className="flex items-center justify-center gap-1 mt-4 text-sm text-[#7c39f6] hover:text-[#a855f7]">View All <ArrowRight className="w-4 h-4"/></Link>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#13131f] border border-[#7c39f6]/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#a855f7]"/><h3 className="font-semibold">Recommended For You</h3></div>
                <Link to="/jobs" className="text-sm text-[#7c39f6] hover:text-[#a855f7] flex items-center gap-1">See All <ArrowRight className="w-4 h-4"/></Link>
              </div>
              {loadingRecs?(
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#7c39f6]"/></div>
              ):recommendations.length===0?(
                <div className="text-center py-10"><Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">Complete your profile and preferences to get recommendations</p><Link to="/profile" className="inline-block mt-3 px-4 py-2 bg-[#7c39f6] text-white text-sm rounded-lg">Complete Profile</Link></div>
              ):<div className="grid md:grid-cols-3 gap-4">
                {recommendations.map(job=>(
                  <div key={job.id} className="bg-[#0a0a0f] rounded-xl p-4 border border-gray-800 hover:border-[#7c39f6]/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs">{job.company.charAt(0)}</div>
                      {typeof job.matchScore==='number'&&<span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs font-bold">{job.matchScore}% Match</span>}
                    </div>
                    <h4 className="font-medium text-white text-sm mb-1">{job.title}</h4>
                    <p className="text-gray-500 text-xs mb-2">{job.company}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.location&&<span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300 flex items-center gap-1"><MapPin className="w-3 h-3"/>{job.location}</span>}
                      {job.remoteType&&<span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300 capitalize">{job.remoteType}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.matchReasons?.slice(0,2).map((r,i)=>(<span key={i} className="px-1.5 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px]">{r}</span>))}
                    </div>
                    <Link to={`/jobs`} className="block text-center py-1.5 bg-[#7c39f6]/20 text-[#7c39f6] rounded-lg text-xs hover:bg-[#7c39f6]/30 transition-colors font-medium">Apply Now</Link>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        ):null}
      </main>
    </div>
  );
}

