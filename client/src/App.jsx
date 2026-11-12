import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams, useLocation, Outlet } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from './api';

class Boundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <div className="p-6 max-w-xl mx-auto"><p className="font-bold text-red-700">Something crashed on this page.</p><pre className="text-xs bg-red-50 p-3 mt-2 whitespace-pre-wrap">{String(this.state.error?.stack || this.state.error)}</pre><a className="text-indigo-700 underline" href="/dashboard">Back to dashboard</a></div> : this.props.children; }
}
const Ctx = createContext();
const useAuth = () => useContext(Ctx);
const err = (e) => e.response?.data?.error || 'Something went wrong. Please try again.';
const card = 'bg-white rounded-2xl border border-slate-200 p-6 shadow-sm';
const btn = 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 font-semibold shadow-sm disabled:opacity-50 transition';
const ghost = 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-xl px-5 py-2.5 font-semibold transition';
const inp = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const SUBJECTS = ['Data Structures and Algorithms', 'Java Programming', 'Python Programming', 'Database Management Systems', 'Operating Systems', 'Computer Networks', 'Computer Organization', 'Software Engineering', 'Web Development', 'Artificial Intelligence', 'Machine Learning'];
const LANGS = ['English', 'Hindi', 'Punjabi', 'Spanish', 'French', 'German'];
const Msg = ({ children, ok }) => children ? <p role="alert" className={`text-sm rounded-lg px-3 py-2 ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{children}</p> : null;
const has = (x) => x !== -1 && x !== '';
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(!!localStorage.getItem('token'));
  useEffect(() => { if (loading) api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false)); }, []);
  const login = (d) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { api.post('/auth/logout').catch(() => {}); localStorage.removeItem('token'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

function Landing() {
  const feats = [['🤖', 'AI quizzes', 'Generate MCQs on any CS topic, in your language.', 'from-indigo-500 to-blue-500'], ['⚡', 'Instant evaluation', 'Server-side scoring with explanations.', 'from-emerald-500 to-teal-500'], ['📈', 'Performance analytics', 'Track scores, streaks and weak subjects.', 'from-amber-500 to-orange-500'], ['🎓', 'AI tutoring', 'Ask doubts and get step-by-step help.', 'from-fuchsia-500 to-pink-500']];
  const steps = [['Pick a subject and topic', 'from-indigo-500 to-violet-500'], ['Take a timed quiz', 'from-amber-500 to-rose-500'], ['Review results and ask the tutor', 'from-emerald-500 to-cyan-500']];
  const g = (a) => `bg-linear-to-r ${a} bg-clip-text text-transparent`;
  return <div className="overflow-x-hidden">
    <header className="max-w-6xl mx-auto flex justify-between items-center px-6 py-5"><Link to="/" className="flex items-center gap-3 text-lg font-extrabold text-slate-900"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">Q</span><span>Quiz Portal</span></Link>
      <div className="flex gap-2"><Link className={ghost} to="/login">Log in</Link><Link className={btn} to="/register">Get started</Link></div></header>
    <section className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
      <span className="inline-block bg-indigo-50 text-indigo-700 font-semibold rounded-full px-4 py-1.5 text-sm mb-6">AI-powered computer science practice</span>
      <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-slate-950">Learn by doing.<br /><span className={g('from-indigo-600 to-violet-500')}>Grow with every quiz.</span></h1>
      <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">Build confidence with focused quizzes, clear explanations, progress insights, and an AI tutor ready to help.</p>
      <div className="flex gap-3 justify-center mt-9 flex-wrap"><Link to="/register" className={`${btn} text-base px-7 py-3.5`}>Create your free account</Link><Link to="/login" className={`${ghost} text-base px-7 py-3.5`}>I already have an account</Link></div>
      <div className="max-w-3xl mx-auto mt-14 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-indigo-100/50 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4"><span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /><span className="ml-2 text-sm font-medium text-slate-500">A better way to study</span></div>
        <div className="grid sm:grid-cols-3 gap-3 pt-4"><div className="rounded-2xl bg-indigo-50 p-4"><p className="text-sm text-indigo-700">Practice</p><p className="mt-1 font-bold text-slate-900">Your topics, your pace</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Understand</p><p className="mt-1 font-bold text-slate-900">Explanations that teach</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">Improve</p><p className="mt-1 font-bold text-slate-900">Progress you can see</p></div></div>
      </div></section>
    <section className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{feats.map(([i, t, d]) => <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-2xl">{i}</div><h3 className="font-bold text-lg mt-4 text-slate-900">{t}</h3><p className="text-sm mt-2 text-slate-600">{d}</p></div>)}</section>
    <section className="max-w-5xl mx-auto px-6 py-20"><h2 className="text-3xl md:text-4xl font-black text-center mb-10 text-slate-950">A simple way to <span className={g('from-indigo-600 to-violet-500')}>make progress</span></h2>
      <div className="grid md:grid-cols-3 gap-5 text-center">{steps.map(([t, c], i) => <div key={t} className={card}><div className={`text-6xl font-black ${g(c)}`}>{i + 1}</div><p className="mt-2 font-bold text-lg">{t}</p></div>)}</div></section>
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-center py-8"><b className="text-slate-700">Quiz Portal</b> · <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link></footer></div>;
}

function AuthPage({ mode }) {
  const { login, user } = useAuth(), nav = useNavigate(), reg = mode === 'register';
  const [f, setF] = useState({ name: '', email: '', password: '', confirmPassword: '' }), [e, setE] = useState(''), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" />;
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const submit = async (ev) => {
    ev.preventDefault(); setE('');
    if (reg && f.password !== f.confirmPassword) return setE('Passwords do not match');
    if (f.password.length < 8) return setE('Password must be at least 8 characters');
    setBusy(true);
    try { login((await api.post(`/auth/${mode}`, f)).data); nav('/dashboard'); } catch (x) { setE(err(x)); } finally { setBusy(false); }
  };
  return <div className="min-h-screen grid place-items-center p-4"><form onSubmit={submit} className={`${card} w-full max-w-md space-y-4`}>
    <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950">{reg ? 'Create your account' : 'Welcome back'}</h1><Msg>{e}</Msg>
    {reg && <label className="block text-sm">Full name<input required className={inp} value={f.name} onChange={set('name')} /></label>}
    <label className="block text-sm">Email<input required type="email" className={inp} value={f.email} onChange={set('email')} /></label>
    <label className="block text-sm">Password<input required type="password" className={inp} value={f.password} onChange={set('password')} /></label>
    {reg && <label className="block text-sm">Confirm password<input required type="password" className={inp} value={f.confirmPassword} onChange={set('confirmPassword')} /></label>}
    <button disabled={busy} className={`${btn} w-full`}>{busy ? 'Please wait…' : reg ? 'Sign up' : 'Log in'}</button>
    <p className="text-sm text-center">{reg ? <>Have an account? <Link className="text-indigo-700" to="/login">Log in</Link></> : <>New here? <Link className="text-indigo-700" to="/register">Sign up</Link></>}</p></form></div>;
}

function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  if (!user) return <Navigate to="/login" />;
  const L = ({ to, children }) => <Link to={to} className="hover:text-amber-300 transition">{children}</Link>;
  return <div><nav className="print:hidden sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="max-w-6xl mx-auto flex flex-wrap gap-4 items-center px-4 md:px-6 py-3 text-sm font-semibold text-slate-600">
    <Link to="/dashboard" className="flex items-center gap-2 text-lg font-extrabold text-slate-900 mr-auto"><span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">Q</span>Quiz Portal</Link><L to="/dashboard">Dashboard</L><L to="/quiz/new">New quiz</L><L to="/history">History</L><L to="/tutor">AI tutor</L><L to="/plan">Study plan</L><L to="/report">Report</L>
    <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">Log out</button></div></nav><main className="max-w-6xl mx-auto p-4 md:p-6"><Outlet /></main></div>;
}

function Dashboard() {
  const { user } = useAuth(), [s, setS] = useState(null), [e, setE] = useState('');
  useEffect(() => { api.get('/dashboard/stats').then((r) => setS(r.data)).catch((x) => setE(err(x))); }, []);
  if (e) return <Msg>{e}</Msg>; if (!s) return <p>Loading…</p>;
  return <div className="space-y-6"><h1 className="text-4xl md:text-5xl font-black text-indigo-950">Welcome, <span className="bg-linear-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span> 👋</h1>
    <div className="flex gap-2 flex-wrap"><Link className={btn} to="/quiz/new">Start Quiz</Link><Link className={ghost} to="/tutor">AI Tutor</Link><Link className={ghost} to="/history">View History</Link></div>
    {s.total === 0 ? <div className={`${card} text-center py-12`}><p className="text-lg font-semibold">No quizzes yet</p><p className="text-slate-600 mt-1">Take your first quiz to see your stats here.</p><Link to="/quiz/new" className={`${btn} inline-block mt-4`}>Take your first quiz</Link></div> : <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['Quizzes', s.total], ['Average', s.average + '%'], ['Best', s.best + '%'], ['Streak', s.streak + ' day(s)']].map(([k, v]) => <div key={k} className={card}><p className="text-sm text-slate-500">{k}</p><p className="text-3xl md:text-4xl font-extrabold text-indigo-950">{v}</p></div>)}</div>
      <div className={card}><h2 className="font-semibold mb-3">Score trend</h2>{s.trend.length < 2 ? <p className="text-sm text-slate-500">Take at least 2 quizzes to see a trend.</p> :
        <div className="h-56"><ResponsiveContainer><LineChart data={s.trend}><XAxis dataKey="n" /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="score" stroke="#4f46e5" strokeWidth={2} /></LineChart></ResponsiveContainer></div>}</div>
      <div className="grid md:grid-cols-2 gap-4"><div className={card}><h2 className="font-semibold mb-3">By subject</h2>{s.subjects.map((x) => <div key={x.subject} className="flex justify-between text-sm py-1"><span>{x.subject}</span><b className={x.average >= 60 ? 'text-green-600' : 'text-amber-600'}>{x.average}%</b></div>)}
        {s.recommended.length > 0 && <p className="text-sm mt-3 text-amber-700">Practice more: {s.recommended.join(', ')}</p>}</div>
        <div className={card}><h2 className="font-semibold mb-3">Recent attempts</h2>{s.recent.map((a) => <Link key={a.id} to={`/results/${a.id}`} className="flex justify-between text-sm py-1 hover:text-indigo-700"><span>{a.subject}</span><b>{a.percentage}%</b></Link>)}</div></div></>}</div>;
}

function NewQuiz() {
  const nav = useNavigate(), [f, setF] = useState({ subject: SUBJECTS[0], topic: '', count: 5, type: 'mcq', notes: '', pdf: '', difficulty: 'Medium', language: 'English', instructions: '' }), [e, setE] = useState(''), [busy, setBusy] = useState(false);
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const upload = (ev) => {
    const file = ev.target.files[0]; setF((p) => ({ ...p, notes: '', pdf: '' })); if (!file) return;
    if (file.size > 4e6) return setE('File must be under 4 MB'); const r = new FileReader();
    if (file.name.toLowerCase().endsWith('.pdf')) { r.onload = () => setF((p) => ({ ...p, pdf: String(r.result).split(',')[1] })); r.readAsDataURL(file); }
    else { r.onload = () => setF((p) => ({ ...p, notes: String(r.result).slice(0, 20000) })); r.readAsText(file); }
  };
  const go = async (ev) => {
    ev.preventDefault(); setE(''); setBusy(true);
    try { const q = (await api.post('/quizzes/generate', f)).data; nav(`/attempt/${(await api.post('/attempts/start', { quizId: q.quizId })).data.id}`); } catch (x) { setE(err(x)); setBusy(false); }
  };
  return <form onSubmit={go} className={`${card} max-w-3xl mx-auto space-y-5`}><div><p className="text-sm font-semibold text-indigo-600">QUIZ BUILDER</p><h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 mt-1">Create a quiz</h1><p className="text-slate-600 mt-2">Choose a subject, set your pace, and start practicing.</p></div><Msg>{e}</Msg>
    <label className="block text-sm">Subject<select className={inp} value={f.subject} onChange={set('subject')}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></label>
    <label className="block text-sm">Topic (optional)<input className={inp} value={f.topic} onChange={set('topic')} placeholder="e.g. Linked lists" /></label>
    <div className="grid sm:grid-cols-3 gap-3"><label className="text-sm font-medium text-slate-700">Number of questions<input type="number" min="3" step="1" required className={inp} value={f.count} onChange={set('count')} /><span className="mt-1 block text-xs font-normal text-slate-500">No fixed maximum. Larger quizzes take longer.</span></label>
      <label className="text-sm">Difficulty<select className={inp} value={f.difficulty} onChange={set('difficulty')}>{['Easy', 'Medium', 'Hard'].map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="text-sm">Language<select className={inp} value={f.language} onChange={set('language')}>{LANGS.map((s) => <option key={s}>{s}</option>)}</select></label></div>
    <label className="block text-sm">Custom instructions (optional)<textarea className={inp} rows="2" maxLength="300" value={f.instructions} onChange={set('instructions')} /></label>
    <label className="block text-sm">Question type<select className={inp} value={f.type} onChange={set('type')}><option value="mcq">Multiple choice</option><option value="truefalse">True / False</option><option value="short">Short answer</option></select></label>
    <label className="block text-sm">Upload notes (PDF or .txt, optional)<input type="file" accept=".pdf,.txt,.md" className={inp} onChange={upload} /></label>
    {(f.pdf || f.notes) && <p className="text-xs text-green-700 font-semibold">Quiz will be based on your uploaded material.</p>}
    <p className="text-xs text-slate-500">Time: 1 minute per question. If AI generation is unavailable, the built-in question bank may repeat questions.</p>
    <button disabled={busy} className={btn}>{busy ? 'Generating your quiz…' : 'Generate and start quiz'}</button></form>;
}

function Take() {
  const { id } = useParams(), nav = useNavigate();
  const [q, setQ] = useState(null), [i, setI] = useState(0), [ans, setAns] = useState([]), [rev, setRev] = useState({}), [left, setLeft] = useState(0), [e, setE] = useState(''), [confirm, setConfirm] = useState(false);
  const sent = useRef(false), ansRef = useRef([]);
  useEffect(() => { api.get(`/attempts/${id}`).then((r) => { if (r.data.status !== 'in_progress') return nav(`/results/${id}`, { replace: true }); setQ(r.data); setLeft(Math.ceil(r.data.remainingMs / 1000)); const a = r.data.questions.map((qq) => (qq.type === 'short' ? '' : -1)); setAns(a); ansRef.current = a; }).catch((x) => setE(err(x))); }, [id]);
  const submit = async () => {
    if (sent.current) return; sent.current = true;
    try { await api.post(`/attempts/${id}/submit`, { answers: ansRef.current }); } catch (x) { if (x.response?.status !== 409) { sent.current = false; return setE(err(x)); } }
    nav(`/results/${id}`, { replace: true });
  };
  useEffect(() => { if (!q) return; const t = setInterval(() => setLeft((l) => l - 1), 1000); return () => clearInterval(t); }, [q]);
  useEffect(() => { if (q && left <= 0) submit(); }, [left, q]);
  useEffect(() => { const h = (ev) => { if (q && !sent.current) { ev.preventDefault(); ev.returnValue = ''; } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [q]);
  if (e) return <Msg>{e}</Msg>; if (!q) return <p>Loading…</p>;
  const cur = q.questions[i], done = ans.filter(has).length;
  const pick = (k) => { const a = [...ans]; a[i] = k; setAns(a); ansRef.current = a; };
  return <div className="space-y-4"><div className="flex justify-between items-center"><div><h1 className="font-bold">{q.subject}{q.topic && ` · ${q.topic}`}</h1><p className="text-sm text-slate-500">Question {i + 1} of {q.questions.length}</p></div>
    <b className={`text-xl ${left < 30 ? 'text-red-600' : 'text-indigo-900'}`} aria-live="off">⏱ {fmt(Math.max(0, left))}</b></div>
    <div className="h-2 bg-slate-200 rounded"><div className="h-2 bg-indigo-600 rounded" style={{ width: `${(done / q.questions.length) * 100}%` }} /></div>
    <div className="grid md:grid-cols-[1fr_200px] gap-4"><div className={card}><p className="font-semibold mb-4">{cur.question}</p>
      {cur.type === 'short' ? <textarea className={inp} rows="4" maxLength="300" placeholder="Type your answer…" value={ans[i] ?? ''} onChange={(x) => pick(x.target.value)} /> : <div className="space-y-2" role="radiogroup">{cur.options.map((o, k) => <button key={k} role="radio" aria-checked={ans[i] === k} onClick={() => pick(k)} className={`w-full text-left border rounded-lg px-4 py-3 ${ans[i] === k ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>{String.fromCharCode(65 + k)}. {o}</button>)}</div>}
      <div className="flex flex-wrap gap-2 mt-5"><button className={ghost} disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button><button className={ghost} disabled={i === q.questions.length - 1} onClick={() => setI(i + 1)}>Next</button>
        <button className={ghost} onClick={() => setRev({ ...rev, [i]: !rev[i] })}>{rev[i] ? 'Unmark review' : 'Mark for review'}</button>
        {has(ans[i]) && <button className={ghost} onClick={() => pick(cur.type === 'short' ? '' : -1)}>Clear</button>}<button className={`${btn} ml-auto`} onClick={() => setConfirm(true)}>Submit</button></div></div>
      <div className={card}><p className="text-sm font-semibold mb-2">Questions</p><div className="grid grid-cols-5 gap-1">{q.questions.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Question ${k + 1}`} className={`h-8 rounded text-xs border ${k === i ? 'ring-2 ring-indigo-500' : ''} ${rev[k] ? 'bg-amber-200' : has(ans[k]) ? 'bg-green-200' : 'bg-white'}`}>{k + 1}</button>)}</div>
        <p className="text-xs text-slate-500 mt-2">Green answered · Amber review</p></div></div>
    {confirm && <div className="fixed inset-0 bg-black/40 grid place-items-center p-4"><div className={`${card} max-w-sm`}><p className="font-semibold">Submit quiz?</p><p className="text-sm text-slate-600 mt-1">{done} of {q.questions.length} answered. You can't change answers after submitting.</p>
      <div className="flex gap-2 mt-4"><button className={btn} onClick={submit}>Yes, submit</button><button className={ghost} onClick={() => setConfirm(false)}>Keep working</button></div></div></div>}</div>;
}

function Results() {
  const { id } = useParams(), nav = useNavigate(), [r, setR] = useState(null), [e, setE] = useState('');
  useEffect(() => { api.get(`/attempts/${id}/results`).then((x) => setR(x.data)).catch((x) => setE(err(x))); }, [id]);
  if (e) return <Msg>{e}</Msg>; if (!r) return <p>Loading…</p>;
  const retry = async () => nav(`/attempt/${(await api.post('/attempts/start', { quizId: r.quizId })).data.id}`);
  const ask = (q, sel) => nav('/tutor', { state: { prompt: `Explain this question: "${q.question}" Options: ${q.options.join(' | ')}. I answered ${q.type === 'short' ? sel || 'nothing' : sel >= 0 ? q.options[sel] : 'nothing'}. Why is "${q.type === 'short' ? q.answerText : q.options[q.correctAnswer]}" correct?` } });
  return <div className="space-y-6"><div className={card}><h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950">{r.subject}{r.topic && ` · ${r.topic}`}</h1>
    <p className={`text-6xl font-black mt-2 ${r.passed ? 'text-green-600' : 'text-amber-600'}`}>{r.percentage}% <span className="text-base">{r.passed ? 'Passed' : 'Needs work'}{r.status === 'expired' && ' (time expired)'}</span></p>
    <p className="text-sm mt-2">{r.correct} correct · {r.incorrect} incorrect · {r.unanswered} unanswered · {r.total} total · {fmt(r.timeTaken)} taken</p><p className="text-sm text-indigo-700 mt-2">{r.suggestion}</p>
    <div className="flex flex-wrap gap-2 mt-4"><button className={btn} onClick={retry}>Retry quiz</button><Link className={ghost} to="/quiz/new">Generate another</Link><Link className={ghost} to="/dashboard">Dashboard</Link></div></div>
    {r.review.map((q, k) => { const ok = q.isCorrect, short = q.type === 'short'; return <div key={k} className={card}><p className="font-semibold">{k + 1}. {q.question}</p>
      <p className={`text-sm mt-2 ${ok ? 'text-green-600' : 'text-red-600'}`}>Your answer: {short ? q.selected || 'Not answered' : q.selected >= 0 ? q.options[q.selected] : 'Not answered'}</p>{!ok && <p className="text-sm text-green-600">Correct: {short ? q.answerText : q.options[q.correctAnswer]}</p>}
      <p className="text-sm text-slate-600 mt-1">💡 {q.explanation}</p>{!ok && <button className="text-sm text-indigo-700 mt-2" onClick={() => ask(q, q.selected)}>Ask the AI tutor</button>}</div>; })}</div>;
}

function History() {
  const [d, setD] = useState(null), [p, setP] = useState(1), [e, setE] = useState('');
  useEffect(() => { api.get(`/attempts?page=${p}`).then((r) => setD(r.data)).catch((x) => setE(err(x))); }, [p]);
  if (e) return <Msg>{e}</Msg>; if (!d) return <p>Loading…</p>;
  return <div className={card}><h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 mb-4">Quiz history</h1>{d.items.length === 0 ? <p className="text-slate-500">No attempts yet.</p> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>Subject</th><th>Difficulty</th><th>Date</th><th>Score</th><th>Time</th><th /></tr></thead>
      <tbody>{d.items.map((a) => <tr key={a.id} className="border-t"><td className="py-2">{a.subject}{a.topic && ` · ${a.topic}`}</td><td>{a.difficulty}</td><td>{new Date(a.date).toLocaleString()}</td><td><b>{a.percentage}%</b></td><td>{fmt(a.timeTaken)}</td><td><Link className="text-indigo-700" to={`/results/${a.id}`}>View</Link></td></tr>)}</tbody></table></div>}
    <div className="flex gap-2 mt-4 items-center"><button className={ghost} disabled={p <= 1} onClick={() => setP(p - 1)}>Prev</button><span className="text-sm">Page {d.page} of {d.pages || 1}</span><button className={ghost} disabled={p >= d.pages} onClick={() => setP(p + 1)}>Next</button></div></div>;
}

function Tutor() {
  const loc = useLocation(), [msgs, setMsgs] = useState([]), [text, setText] = useState(loc.state?.prompt || ''), [busy, setBusy] = useState(false), [e, setE] = useState(''), end = useRef();
  useEffect(() => { try { end.current?.scrollIntoView({ behavior: 'smooth' }); } catch { /* ignore */ } }, [msgs, busy]);
  const ask = async (t) => {
    if (!t.trim() || busy) return; const next = [...msgs, { role: 'user', content: t }]; setMsgs(next); setText(''); setE(''); setBusy(true);
    try { setMsgs([...next, { role: 'assistant', content: String((await api.post('/tutor/chat', { messages: next })).data.reply ?? 'No reply received.') }]); } catch (x) { setE(err(x)); } finally { setBusy(false); }
  };
  const send = (ev) => { ev.preventDefault(); ask(text); };
  return <div className={`${card} flex flex-col h-[70vh]`}><h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 mb-3">AI Tutor</h1>
    <div className="flex-1 overflow-y-auto space-y-3">{msgs.length === 0 && <p className="text-slate-500 text-sm">Ask any computer science question, or paste a quiz question you didn't understand.</p>}
      {msgs.map((m, k) => <div key={k} className={m.role === 'user' ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'}><div className={`rounded-2xl px-4 py-2 whitespace-pre-wrap text-sm ${m.role === 'user' ? 'bg-indigo-700 text-white' : 'bg-slate-100'}`}>{String(m.content)}</div>
        {m.role === 'assistant' && k === msgs.length - 1 && <div className="flex gap-2 mt-1 flex-wrap">{[['Simpler', 'Explain that again in much simpler words.'], ['With an example', 'Explain that again with a concrete example.'], ['In Hindi', 'Explain that again in Hindi.']].map(([l, p]) => <button key={l} disabled={busy} onClick={() => ask(p)} className="text-xs font-bold bg-amber-100 text-amber-800 rounded-full px-3 py-1 hover:bg-amber-200">{l}</button>)}</div>}</div>)}
      {busy && <p className="text-sm text-slate-500">Tutor is thinking…</p>}<div ref={end} /></div><Msg>{e}</Msg>
    <form onSubmit={send} className="flex gap-2 mt-3"><input className={inp} value={text} onChange={(x) => setText(x.target.value)} placeholder="Type your doubt…" aria-label="Message" /><button className={btn} disabled={busy}>Send</button></form></div>;
}

function Report() {
  const { user } = useAuth(), [d, setD] = useState(null), [e, setE] = useState('');
  useEffect(() => { api.get('/report').then((r) => setD(r.data)).catch((x) => setE(err(x))); }, []);
  if (e) return <Msg>{e}</Msg>; if (!d) return <p>Loading…</p>;
  if (d.empty) return <div className={`${card} text-center py-12`}><p className="text-xl font-bold">No data for a report yet</p><p className="text-slate-600 mt-1">Complete a quiz and your analysis will appear here.</p><Link to="/quiz/new" className={`${btn} inline-block mt-4`}>Take a quiz</Link></div>;
  const t = d.totals, all = t.correct + t.incorrect + t.unanswered, acc = all ? Math.round((t.correct / all) * 100) : 0;
  const best = d.subjects[0], worst = d.subjects[d.subjects.length - 1], tips = [];
  if (d.subjects.length > 1) { tips.push(`Strongest subject: ${best.name} (${best.average}%).`); tips.push(`Weakest subject: ${worst.name} (${worst.average}%)${worst.average < 60 ? ' — schedule extra practice here.' : '.'}`); }
  else tips.push(`So far you have practised ${best.name} (${best.average}% average). Try other subjects to compare.`);
  tips.push(d.improvement === null ? 'Complete at least 6 quizzes to see a recent-improvement figure.' : d.improvement > 0 ? `Your last 5 quizzes average ${d.improvement} points higher than the 5 before. Keep it up!` : d.improvement < 0 ? `Your last 5 quizzes average ${-d.improvement} points lower than the 5 before. Revisit your weak topics.` : 'Your recent scores are level with the previous 5 quizzes.');
  if (all && t.unanswered / all > 0.1) tips.push(`You left ${Math.round((t.unanswered / all) * 100)}% of questions unanswered. Try to attempt every question.`);
  const pie = [['Correct', t.correct, '#10b981'], ['Incorrect', t.incorrect, '#ef4444'], ['Unanswered', t.unanswered, '#f59e0b']].map(([name, value, color]) => ({ name, value, color }));
  const bar = (v) => <div className="h-3 rounded bg-slate-100 flex-1"><div className={`h-3 rounded ${v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${v}%` }} /></div>;
  const Rows = ({ rows }) => rows.map((r) => <div key={r.name} className="flex items-center gap-3 text-sm py-1"><span className="w-1/2 md:w-2/5 truncate" title={r.name}>{r.name}</span>{bar(r.average)}<b className="w-20 text-right">{r.average}% <span className="text-slate-400 font-normal">({r.attempts})</span></b></div>);
  return <div className="space-y-6"><div className={`${card} flex flex-wrap gap-3 justify-between items-center`}><div><h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950">Performance analysis report 📊</h1>
      <p className="text-sm text-slate-600 mt-1">{user.name} · {new Date(d.from).toLocaleDateString()} to {new Date(d.to).toLocaleDateString()} · {d.attempts} quiz(zes)</p></div>
      <button className={`${btn} print:hidden`} onClick={() => window.print()}>🖨 Print / Save as PDF</button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['Quizzes', d.attempts, 'from-indigo-500 to-blue-500'], ['Average', d.average + '%', 'from-emerald-500 to-teal-500'], ['Best', d.best + '%', 'from-amber-500 to-orange-500'], ['Accuracy', acc + '%', 'from-fuchsia-500 to-pink-500']].map(([k, v, c]) => <div key={k} className={`rounded-3xl p-5 text-white shadow-lg bg-linear-to-br ${c}`}><p className="text-sm font-semibold text-white/90">{k}</p><p className="text-4xl font-black">{v}</p></div>)}</div>
    <p className="text-sm text-slate-600">Pass rate (40% or above): <b>{d.passRate}%</b> · Lowest score: <b>{d.worst}%</b> · Total time: <b>{Math.round(t.time / 60)} min</b></p>
    <div className="grid md:grid-cols-2 gap-4"><div className={card}><h2 className="font-extrabold text-xl mb-3">Score trend</h2>{d.trend.length < 2 ? <p className="text-sm text-slate-500">Complete at least 2 quizzes to see a trend.</p> : <div className="h-56"><ResponsiveContainer><LineChart data={d.trend}><XAxis dataKey="n" /><YAxis domain={[0, 100]} /><Tooltip /><Line dataKey="score" stroke="#7c3aed" strokeWidth={3} /></LineChart></ResponsiveContainer></div>}</div>
      <div className={card}><h2 className="font-extrabold text-xl mb-3">Answers breakdown</h2>{all === 0 ? <p className="text-sm text-slate-500">No answers recorded.</p> : <div className="h-56"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label>{pie.map((p) => <Cell key={p.name} fill={p.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>}</div></div>
    <div className="grid md:grid-cols-2 gap-4"><div className={card}><h2 className="font-extrabold text-xl mb-2">By subject <span className="text-sm font-normal text-slate-400">(attempts)</span></h2><Rows rows={d.subjects} /></div>
      <div className={card}><h2 className="font-extrabold text-xl mb-2">By difficulty</h2><Rows rows={d.difficulty} /><h2 className="font-extrabold text-xl mt-4 mb-2">By topic</h2>{d.topics.length ? <Rows rows={d.topics} /> : <p className="text-sm text-slate-500">Topics appear after 2+ quizzes on the same topic.</p>}</div></div>
    <div className="rounded-3xl p-6 bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg"><h2 className="font-black text-2xl mb-2">💡 Insights</h2><ul className="list-disc pl-5 space-y-1">{tips.map((x, i) => <li key={i}>{x}</li>)}</ul></div></div>;
}

function Plan() {
  const [d, setD] = useState(null), [busy, setBusy] = useState(false), [e, setE] = useState(''), [lang, setLang] = useState('English');
  const go = async () => { setBusy(true); setE(''); try { setD((await api.post('/plan', { language: lang })).data); } catch (x) { setE(err(x)); } finally { setBusy(false); } };
  const q = encodeURIComponent, cols = ['from-indigo-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-fuchsia-500 to-pink-500', 'from-sky-500 to-indigo-500', 'from-rose-500 to-red-500', 'from-violet-500 to-purple-500'];
  return <div className="space-y-6"><div className={card}><h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950">Your study plan 📅</h1><p className="text-slate-600 mt-1">The AI reads your quiz results and builds a weekly plan with lectures and books.</p>
    <div className="flex gap-2 mt-4 flex-wrap"><select className={`${inp} max-w-40`} value={lang} onChange={(x) => setLang(x.target.value)}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select><button className={btn} disabled={busy} onClick={go}>{busy ? 'Creating…' : d ? 'Regenerate plan' : 'Create my plan'}</button></div><div className="mt-3"><Msg>{e}</Msg></div></div>
    {d && <><div className={card}><p className="font-bold mb-2">Focus areas</p><div className="flex gap-2 flex-wrap">{d.weak.map((w) => <span key={w.subject} className="bg-amber-100 text-amber-900 font-bold rounded-full px-3 py-1 text-sm">{w.subject} · {w.average}%</span>)}</div><p className="mt-3 text-slate-700">{d.plan.summary}</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{d.plan.days?.map((x, i) => <div key={i} className={`rounded-3xl p-5 text-white shadow-lg bg-linear-to-br ${cols[i % 7]}`}><p className="font-black text-xl">{x.day}</p><p className="text-sm mt-1 text-white/95">{x.task}</p></div>)}</div>
      <div className="grid md:grid-cols-2 gap-4"><div className={card}><h2 className="font-extrabold text-xl mb-3">🎥 Lectures</h2>{d.plan.lectures?.map((l, i) => <a key={i} target="_blank" rel="noreferrer" href={`https://www.youtube.com/results?search_query=${q(l.search)}`} className="block py-2 border-t first:border-0 hover:text-indigo-700"><b>{l.title}</b><span className="text-sm text-slate-500"> · {l.channel}</span></a>)}</div>
        <div className={card}><h2 className="font-extrabold text-xl mb-3">📚 Books</h2>{d.plan.books?.map((b, i) => <a key={i} target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${q(b.title + ' ' + b.author + ' book')}`} className="block py-2 border-t first:border-0 hover:text-indigo-700"><b>{b.title}</b><span className="text-sm text-slate-500"> · {b.author}</span></a>)}</div></div>
      <p className="text-xs text-slate-500">Suggestions are AI-generated. Lecture links open a YouTube search; check that books and channels exist before relying on them.</p></>}</div>;
}

export default function App() {
  return <Boundary><AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Layout />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/quiz/new" element={<NewQuiz />} /><Route path="/attempt/:id" element={<Take />} />
      <Route path="/results/:id" element={<Results />} /><Route path="/history" element={<History />} /><Route path="/tutor" element={<Tutor />} /><Route path="/plan" element={<Plan />} /><Route path="/report" element={<Report />} /></Route>
    <Route path="*" element={<Navigate to="/" />} /></Routes></BrowserRouter></AuthProvider></Boundary>;
}
