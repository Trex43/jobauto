import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, LogOut, Briefcase, Send, TrendingUp, User, Sliders, Link2,
  Loader2, Calendar, CheckCircle, Clock, XCircle, Trophy, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, MessageSquare, Trash2,
  Plus, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Application {
  id: string; status: string; appliedAt?: string;
  coverLetter?: string; notes?: string;
  matchScore?: number; matchReasons: string[]; isAutoApplied: boolean; createdAt: string;
  job: { id: string; title: string; company: string; companyLogo?: string; location?: string; remoteType?: string;
    salaryMin?: number; salaryMax?: number; salaryCurrency: string; applyUrl: string; };
  interviews: Array<{ id: string; scheduledAt: string; duration: number; type: string; round: string;
    interviewerName?: string; status: string; notes?: string; }>;
}

const sc: Record<string, { c: string; bg: string; i: any }> = {
  PENDING: { c: 'text-yellow-400', bg: 'bg-yellow-500/10', i: Clock },
  APPLIED: { c: 'text-blue-400', bg: 'bg-blue-500/10', i: CheckCircle },
  INTERVIEW: { c: 'text-purple-400', bg: 'bg-purple-500/10', i: Calendar },
  OFFER: { c: 'text-green-400', bg: 'bg-green-500/10', i: Trophy },
  REJECTED: { c: 'text-red-400', bg: 'bg-red-500/10', i: XCircle },
  WITHDRAWN: { c: 'text-gray-400', bg: 'bg-gray-500/10', i: AlertCircle },
};

const stList = ['PENDING','APPLIED','INTERVIEW','OFFER','REJECTED','WITHDRAWN'];

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [scounts, setScounts] = useState<{status:string;_count:{status:number}}[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tpages, setTpages] = useState(1);
  const [sfilter, setSfilter] = useState('');
  const [expId, setExpId] = useState<string|null>(null);
  const [scheduling, setScheduling] = useState<string|null>(null);
  const [ifrm, setIfrm] = useState({scheduledAt:'',duration:60,type:'video',round:'screening',interviewerName:'',interviewerEmail:'',notes:''});
  const [wdId, setWdId] = useState<string|null>(null);

  const fetch = async (p=page, s=sfilter) => {
    setLoading(true);
    const pr = new URLSearchParams();
    pr.set('page',String(p)); pr.set('limit','10');
    if(s) pr.set('status',s);
    try {
      const r = await api.get<{applications:Application[];statusCounts:typeof scounts;pagination:{page:number;total:number;pages:number}}>(`/applications?${pr.toString()}`);
      if(r.success&&r.data){ setApps(r.data.applications); setScounts(r.data.statusCounts); setTpages(r.data.pagination.pages); }
    } catch(e){ console.error(e); }
    setLoading(false);
  };
  useEffect(()=>{ fetch(1,sfilter); },[sfilter]);
  useEffect(()=>{ fetch(page,sfilter); },[page]);

  const withdraw = async (id:string)=>{
    setWdId(id);
    try{ await api.delete(`/applications/${id}`); fetch(page,sfilter); }
    catch(err:any){ alert(err.message||'Failed'); } finally{ setWdId(null); }
  };

  const schedule = async (appId:string)=>{
    if(!ifrm.scheduledAt) return;
    setScheduling(appId);
    try{ await api.post(`/applications/${appId}/interviews`, ifrm);
      setIfrm({scheduledAt:'',duration:60,type:'video',round:'screening',interviewerName:'',interviewerEmail:'',notes:''});
      setExpId(null); fetch(page,sfilter);
    } catch(err:any){ alert(err.message||'Failed'); } finally{ setScheduling(null); }
  };

  const sidebarLink = (to:string,icon:ReactNode,label:string,active=false)=>(
    <Link to={to} key={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active?'bg-[#7c39f6]/10 text-[#7c39f6]':'text-gray-400 hover:text-white hover:bg-white/5'}`}>{icon}{label}</Link>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <aside className="w-64 bg-[#13131f] border-r border-[#7c39f6]/20 flex flex-col">
        <div className="p-6"><Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center"><Zap className="w-4 h-4 text-white"/></div><span className="text-lg font-bold">Job<span className="text-[#7c39f6]">Auto</span></span></Link></div>
        <nav className="px-4 space-y-1 flex-1">
          {sidebarLink('/dashboard',<TrendingUp className="w-5 h-5"/>,'Dashboard')}
          {sidebarLink('/jobs',<Briefcase className="w-5 h-5"/>,'Jobs')}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#7c39f6]/10 text-[#7c39f6] rounded-xl"><Send className="w-5 h-5"/> Applications</div>
          {sidebarLink('/profile',<User className="w-5 h-5"/>,'Profile')}
          {sidebarLink('/preferences',<Sliders className="w-5 h-5"/>,'Preferences')}
          {sidebarLink('/portals',<Link2 className="w-5 h-5"/>,'Portals')}
        </nav>
        <div className="p-4"><button onClick={()=>{logout();navigate('/');}} className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><LogOut className="w-5 h-5"/> Sign Out</button></div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Your Applications</h1>
            <p className="text-gray-400">Track all your job applications in one place</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {stList.map(s=>{
              const cnt=scounts.find(c=>c.status===s)?._count.status||0;
              const cfg=sc[s]||sc.PENDING; const I=cfg.i;
              return (
                <button key={s} onClick={()=>setSfilter(sfilter===s?'':s)}
                  className={`p-3 rounded-xl border transition-all text-left ${sfilter===s?'border-[#7c39f6] bg-[#7c39f6]/10':'border-gray-800 bg-[#13131f] hover:border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-1"><I className={`w-4 h-4 ${cfg.c}`}/><span className={`text-xs font-medium capitalize ${cfg.c}`}>{s.toLowerCase()}</span></div>
                  <p className="text-xl font-bold text-white">{cnt}</p>
                </button>
              );
            })}
          </div>

          {loading?(
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]"/></div>
          ):apps.length===0?(
            <div className="text-center py-20">
              <Send className="w-12 h-12 text-gray-600 mx-auto mb-4"/>
              <p className="text-gray-400 text-lg">No applications yet</p>
              <p className="text-gray-500 text-sm mt-1">Browse jobs and start applying</p>
              <Link to="/jobs" className="inline-block mt-4 px-5 py-2 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white text-sm font-medium rounded-lg hover:shadow-[0_0_15px_rgba(124,57,246,0.4)] transition-all">Find Jobs</Link>
            </div>
          ):<>
            <div className="space-y-3">
              {apps.map(app=>{
                const cfg=sc[app.status]||sc.PENDING; const I=cfg.i; const isExp=expId===app.id;
                return (
                  <div key={app.id} className="bg-[#13131f] border border-[#7c39f6]/10 hover:border-[#7c39f6]/20 rounded-2xl transition-all">
                    <div className="p-5 cursor-pointer" onClick={()=>setExpId(isExp?null:app.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm">{app.job.company.charAt(0)}</div>
                          <div><h3 className="font-semibold text-white text-sm">{app.job.title}</h3><p className="text-gray-400 text-xs">{app.job.company}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          {typeof app.matchScore==='number'&&<span className={`px-2 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.c}`}>{app.matchScore}% Match</span>}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${cfg.bg} ${cfg.c}`}><I className="w-3 h-3"/> {app.status}</span>
                          {isExp?<ChevronUp className="w-4 h-4 text-gray-500"/>:<ChevronDown className="w-4 h-4 text-gray-500"/>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.job.location&&<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300"><MapPin className="w-3 h-3"/> {app.job.location}</span>}
                        {app.job.remoteType&&<span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 capitalize">{app.job.remoteType}</span>}
                        {app.isAutoApplied&&<span className="px-2 py-0.5 bg-[#7c39f6]/10 text-[#7c39f6] rounded text-xs">Auto-Applied</span>}
                        {app.appliedAt&&<span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>}
                      </div>
                      {app.matchReasons?.length>0&&(
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {app.matchReasons.map((r,i)=>(<span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">{r}</span>))}
                        </div>
                      )}
                    </div>
                    {isExp&&(
                      <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {app.notes&&<div className="bg-[#0a0a0f] rounded-xl p-4 border border-gray-800"><div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-[#7c39f6]"/><span className="text-sm font-medium">Notes</span></div><p className="text-gray-400 text-sm">{app.notes}</p></div>}
                          {app.coverLetter&&<div className="bg-[#0a0a0f] rounded-xl p-4 border border-gray-800"><div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-[#7c39f6]"/><span className="text-sm font-medium">Cover Letter</span></div><p className="text-gray-400 text-sm line-clamp-4">{app.coverLetter}</p></div>}
                        </div>
                        {app.interviews.length>0&&(
                          <div>
                            <h4 className="text-sm font-medium mb-3">Interviews Scheduled</h4>
                            <div className="space-y-2">
                              {app.interviews.map(intv=>(
                                <div key={intv.id} className="bg-[#0a0a0f] rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-[#7c39f6]"/>
                                    <div>
                                      <p className="text-sm text-white">{intv.round} — {intv.type}</p>
                                      <p className="text-xs text-gray-400">{new Date(intv.scheduledAt).toLocaleString()} · {intv.duration} min{intv.interviewerName&&` · ${intv.interviewerName}`}</p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-xs capitalize ${intv.status==='scheduled'?'bg-yellow-500/10 text-yellow-400':intv.status==='completed'?'bg-green-500/10 text-green-400':'bg-gray-500/10 text-gray-400'}`}>{intv.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            {app.status!=='WITHDRAWN'&&app.status!=='OFFER'&&(
                              <button onClick={e=>{e.stopPropagation();withdraw(app.id);}} disabled={wdId===app.id} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50">
                                {wdId===app.id?<Loader2 className="w-3 h-3 animate-spin"/>:<Trash2 className="w-3 h-3"/>} Withdraw
                              </button>
                            )}
                            <a href={app.job.applyUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700 transition-colors flex items-center gap-1"><ExternalLink className="w-3 h-3"/> View Job</a>
                          </div>
                          {(app.status==='APPLIED'||app.status==='INTERVIEW')&&(
                            <button onClick={e=>{e.stopPropagation();if(expId===app.id+'_sched')setExpId(app.id);else setExpId(app.id+'_sched');}} className="px-3 py-1.5 bg-[#7c39f6]/20 text-[#7c39f6] rounded-lg text-xs hover:bg-[#7c39f6]/30 transition-colors flex items-center gap-1"><Plus className="w-3 h-3"/> Schedule Interview</button>
                          )}
                        </div>
                        {expId===app.id+'_sched'&&(
                          <div className="bg-[#0a0a0f] rounded-xl p-4 border border-gray-800 space-y-3">
                            <h4 className="text-sm font-medium">Schedule New Interview</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div><label className="text-xs text-gray-500 mb-1 block">Date & Time</label><input type="datetime-local" value={ifrm.scheduledAt} onChange={e=>setIfrm({...ifrm,scheduledAt:e.target.value})} className="w-full px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"/></div>
                              <div><label className="text-xs text-gray-500 mb-1 block">Type</label><select value={ifrm.type} onChange={e=>setIfrm({...ifrm,type:e.target.value})} className="w-full px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"><option value="phone">Phone</option><option value="video">Video</option><option value="onsite">On-site</option></select></div>
                              <div><label className="text-xs text-gray-500 mb-1 block">Round</label><select value={ifrm.round} onChange={e=>setIfrm({...ifrm,round:e.target.value})} className="w-full px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"><option value="screening">Screening</option><option value="technical">Technical</option><option value="behavioral">Behavioral</option><option value="final">Final</option></select></div>
                              <div><label className="text-xs text-gray-500 mb-1 block">Duration (min)</label><input type="number" value={ifrm.duration} onChange={e=>setIfrm({...ifrm,duration:parseInt(e.target.value)||60})} className="w-full px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input value={ifrm.interviewerName} onChange={e=>setIfrm({...ifrm,interviewerName:e.target.value})} className="px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none" placeholder="Interviewer name"/>
                              <input value={ifrm.interviewerEmail} onChange={e=>setIfrm({...ifrm,interviewerEmail:e.target.value})} className="px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none" placeholder="Interviewer email"/>
                            </div>
                            <textarea value={ifrm.notes} onChange={e=>setIfrm({...ifrm,notes:e.target.value})} className="w-full px-3 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-white text-sm focus:border-[#7c39f6] outline-none h-20 resize-none" placeholder="Notes..."/>
                            <div className="flex gap-2">
                              <button onClick={()=>setExpId(app.id)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
                              <button onClick={()=>schedule(app.id)} disabled={scheduling===app.id||!ifrm.scheduledAt} className="px-4 py-2 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white rounded-lg text-sm hover:shadow-[0_0_15px_rgba(124,57,246,0.4)] transition-all disabled:opacity-50">
                                {scheduling===app.id?<Loader2 className="w-4 h-4 animate-spin inline"/>:'Schedule Interview'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {tpages>1&&(
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30">Previous</button>
                <span className="px-4 py-2 bg-[#7c39f6]/10 border border-[#7c39f6]/30 rounded-lg text-sm text-[#7c39f6]">Page {page} of {tpages}</span>
                <button onClick={()=>setPage(p=>Math.min(tpages,p+1))} disabled={page===tpages} className="px-4 py-2 bg-[#13131f] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30">Next</button>
              </div>
            )}
          </>}
        </div>
      </main>
    </div>
  );
}

