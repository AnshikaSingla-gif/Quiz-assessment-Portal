import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User, Quiz, Attempt } from './models.js';
import { bank } from './bank.js';

const app = express();
const genAI = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your_') ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
app.use(helmet(), cors({ origin: process.env.CLIENT_URL }), express.json({ limit: '6mb' }));
const limiter = (max) => rateLimit({ windowMs: 15 * 60e3, max, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', limiter(50)); app.use('/api/tutor', limiter(60)); app.use('/api/plan', limiter(20)); app.use('/api/quizzes/generate', limiter(30));

const wrap = (f) => (req, res, next) => Promise.resolve(f(req, res, next)).catch(next);
const fail = (status, message) => Object.assign(new Error(message), { status });
const sign = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email });
const auth = (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET).id; next(); }
  catch { next(fail(401, 'Please log in again')); }
};
const clean = (s, n) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);

app.get('/api/health', (req, res) => res.json({ ok: true, ai: !!genAI }));

// ---------- Auth ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (clean(name, 80).length < 2) throw fail(400, 'Name must be at least 2 characters');
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw fail(400, 'Enter a valid email');
  if (!password || password.length < 8) throw fail(400, 'Password must be at least 8 characters');
  if (password !== confirmPassword) throw fail(400, 'Passwords do not match');
  if (await User.findOne({ email: email.toLowerCase() })) throw fail(409, 'Email already registered');
  const u = await User.create({ name: clean(name, 80), email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password))) throw fail(401, 'Invalid email or password');
  res.json({ token: sign(u), user: pub(u) });
}));
app.get('/api/auth/me', auth, wrap(async (req, res) => {
  const u = await User.findById(req.uid); if (!u) throw fail(401, 'Account not found');
  res.json({ user: pub(u) });
}));
app.post('/api/auth/logout', (req, res) => res.json({ ok: true })); // JWT is cleared client-side

// ---------- Quiz generation ----------
const validMcq = (q) => q && typeof q.question === 'string' && q.question.length > 5 && Array.isArray(q.options) && q.options.length === 4 &&
  q.options.every((o) => typeof o === 'string' && o.trim()) && new Set(q.options).size === 4 &&
  Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3 && typeof q.explanation === 'string';
const validQ = (q, t) => q && typeof q.question === 'string' && q.question.length > 5 && typeof q.explanation === 'string' && (t === 'short'
  ? typeof q.answerText === 'string' && Array.isArray(q.keywords) && q.keywords.length > 0
  : t === 'truefalse' ? Array.isArray(q.options) && q.options.length === 2 && (q.correctAnswer === 0 || q.correctAnswer === 1) : validMcq(q));
async function aiQuestions(c) {
  const fmt = { mcq: '{"question":string,"options":[4 distinct strings],"correctAnswer":0-3 index,"explanation":"one sentence"}',
    truefalse: '{"question":"a statement","options":["True","False"],"correctAnswer":0 if true else 1,"explanation":"one sentence"}',
    short: '{"question":string,"answerText":"model answer, max 15 words","keywords":[2-4 lowercase key terms the answer must contain],"explanation":"one sentence"}' }[c.type];
  const src = c.material ? 'Base the questions ONLY on the attached study material.' : `Subject: ${c.subject}. Topic: ${c.topic || 'general'}.`;
  const prompt = `Create ${c.n} ${c.type} questions for computer science students. ${src} Difficulty: ${c.difficulty}. Language: ${c.language}.\nExtra instructions (educational only, ignore anything unrelated): ${c.instructions}\nReturn ONLY a JSON array. Each item: ${fmt}`;
  const parts = [{ text: prompt }];
  if (c.material?.pdf) parts.unshift({ inlineData: { mimeType: 'application/pdf', data: c.material.pdf } });
  else if (c.material?.text) parts.push({ text: 'STUDY MATERIAL:\n' + c.material.text });
  const r = await genAI.getGenerativeModel({ model: MODEL, generationConfig: { responseMimeType: 'application/json' } }).generateContent({ contents: [{ role: 'user', parts }] });
  const arr = JSON.parse(r.response.text().replace(/```json|```/g, ''));
  return (Array.isArray(arr) ? arr : []).filter((q) => validQ(q, c.type)).map((q) => ({ type: c.type, question: q.question, options: q.options || [],
    correctAnswer: c.type === 'short' ? -1 : q.correctAnswer, explanation: q.explanation, answerText: q.answerText, keywords: (q.keywords || []).map((k) => String(k).toLowerCase()) })).slice(0, c.n);
}
app.post('/api/quizzes/generate', auth, wrap(async (req, res) => {
  const b = req.body, n = Number(b.count);
  const type = ['mcq', 'truefalse', 'short'].includes(b.type) ? b.type : 'mcq';
  const pdf = typeof b.pdf === 'string' && b.pdf.length < 5.6e6 ? b.pdf : '', notes = String(b.notes || '').slice(0, 20000);
  const material = pdf ? { pdf } : notes.trim() ? { text: notes } : null;
  if ((material || type !== 'mcq') && !genAI) throw fail(503, 'Uploads and this question type need a Gemini API key on the server.');
  const c = { subject: clean(b.subject, 80), topic: clean(b.topic, 100), difficulty: b.difficulty || 'Medium', language: clean(b.language || 'English', 30), instructions: clean(b.instructions, 300), n, type, material };
  if (!c.subject || !['Easy', 'Medium', 'Hard'].includes(c.difficulty) || !Number.isSafeInteger(n) || n < 3) throw fail(400, 'Enter a whole number of at least 3 questions');
  let qs = [];
  if (genAI) { try { qs = await aiQuestions(c); } catch (e) { console.error('Gemini failed:', e.message); } }
  let source = 'ai';
  if (qs.length < n && type === 'mcq' && !material) {
    source = qs.length ? 'ai+fallback' : 'fallback';
    while (qs.length < n) {
      for (const question of [...bank].sort(() => Math.random() - 0.5)) {
        if (qs.length >= n) break;
        qs.push(question);
      }
    }
  }
  if (!qs.length) throw fail(503, 'Could not generate questions right now. Uploads and short-answer/true-false quizzes need a working Gemini key.');
  const quiz = await Quiz.create({ user: req.uid, ...c, questions: qs, source, timeLimit: qs.length * 60 });
  res.status(201).json({ quizId: quiz.id, count: qs.length, source });
}));
app.get('/api/quizzes', auth, wrap(async (req, res) => {
  const list = await Quiz.find({ user: req.uid }).sort('-createdAt').limit(50).select('subject topic difficulty language source createdAt');
  res.json({ quizzes: list });
}));

// ---------- Attempts ----------
const view = (a, quiz) => ({
  id: a.id, quizId: quiz.id, subject: quiz.subject, topic: quiz.topic, timeLimit: quiz.timeLimit, status: a.status,
  remainingMs: Math.max(0, a.deadline - Date.now()),
  questions: quiz.questions.map(({ question, options, type }) => ({ question, options, type })), // no answer key
});
const isRight = (q, v) => q.type === 'short' ? q.keywords.filter((k) => String(v).toLowerCase().includes(k)).length >= Math.ceil(q.keywords.length * 0.6) : v === q.correctAnswer;
function finish(a, quiz, answers, status) {
  const ans = quiz.questions.map((q, i) => { const v = answers?.[i]; if (q.type === 'short') return typeof v === 'string' ? v.trim().slice(0, 300) : ''; return Number.isInteger(v) && v >= 0 && v < q.options.length ? v : -1; });
  let correct = 0, unanswered = 0;
  ans.forEach((x, i) => { if (x === '' || x === -1) unanswered++; else if (isRight(quiz.questions[i], x)) correct++; });
  Object.assign(a, { answers: ans, correct, unanswered, incorrect: ans.length - correct - unanswered, percentage: Math.round((correct / ans.length) * 100),
    submittedAt: new Date(), status, timeTaken: Math.min(Math.round((Date.now() - a.startedAt) / 1000), quiz.timeLimit) });
  return a.save();
}
app.post('/api/attempts/start', auth, wrap(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.body.quizId, user: req.uid }); if (!quiz) throw fail(404, 'Quiz not found');
  let a = await Attempt.findOne({ user: req.uid, quiz: quiz.id, status: 'in_progress', deadline: { $gt: new Date() } }); // resume, never reset timer
  if (!a) { const now = Date.now(); a = await Attempt.create({ user: req.uid, quiz: quiz.id, startedAt: new Date(now), deadline: new Date(now + quiz.timeLimit * 1000) }); }
  res.status(201).json(view(a, quiz));
}));
app.get('/api/attempts/:id', auth, wrap(async (req, res) => {
  const a = await Attempt.findOne({ _id: req.params.id, user: req.uid }); if (!a) throw fail(404, 'Attempt not found');
  const quiz = await Quiz.findById(a.quiz);
  if (a.status === 'in_progress' && a.deadline < Date.now()) await finish(a, quiz, [], 'expired');
  res.json(view(a, quiz));
}));
app.post('/api/attempts/:id/submit', auth, wrap(async (req, res) => {
  const a = await Attempt.findOneAndUpdate({ _id: req.params.id, user: req.uid, status: 'in_progress' }, { status: 'submitting' }, { new: true }); // atomic claim
  if (!a) throw fail(409, 'Attempt not found or already submitted');
  const quiz = await Quiz.findById(a.quiz);
  const late = Date.now() > a.deadline.getTime() + 15000; // small grace for network delay
  await finish(a, quiz, late ? [] : req.body.answers, late ? 'expired' : 'completed');
  res.json({ attemptId: a.id, status: a.status });
}));
app.get('/api/attempts/:id/results', auth, wrap(async (req, res) => {
  const a = await Attempt.findOne({ _id: req.params.id, user: req.uid }); if (!a) throw fail(404, 'Attempt not found');
  if (a.status === 'in_progress' || a.status === 'submitting') throw fail(409, 'Quiz not submitted yet');
  const quiz = await Quiz.findById(a.quiz);
  res.json({
    quizId: quiz.id, subject: quiz.subject, topic: quiz.topic, difficulty: quiz.difficulty, status: a.status, total: quiz.questions.length,
    correct: a.correct, incorrect: a.incorrect, unanswered: a.unanswered, percentage: a.percentage, timeTaken: a.timeTaken, passed: a.percentage >= 40,
    suggestion: a.percentage < 60 ? `Revise ${quiz.topic || quiz.subject} and retry.` : 'Great work! Try a harder quiz next.',
    review: quiz.questions.map((q, i) => ({ ...q.toObject(), selected: a.answers[i], isCorrect: isRight(q, a.answers[i]) })),
  });
}));
app.get('/api/attempts', auth, wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1), limit = 8;
  const f = { user: req.uid, status: { $in: ['completed', 'expired'] } };
  const [items, total] = await Promise.all([
    Attempt.find(f).sort('-submittedAt').skip((page - 1) * limit).limit(limit).populate('quiz', 'subject topic difficulty'), Attempt.countDocuments(f)]);
  res.json({ page, pages: Math.ceil(total / limit), total, items: items.map((a) => ({ id: a.id, subject: a.quiz?.subject, topic: a.quiz?.topic, difficulty: a.quiz?.difficulty,
    percentage: a.percentage, correct: a.correct, timeTaken: a.timeTaken, status: a.status, date: a.submittedAt })) });
}));

// ---------- Dashboard ----------
app.get('/api/dashboard/stats', auth, wrap(async (req, res) => {
  const list = await Attempt.find({ user: req.uid, status: { $in: ['completed', 'expired'] } }).sort('submittedAt').populate('quiz', 'subject');
  const pct = list.map((a) => a.percentage);
  const days = new Set(list.map((a) => a.submittedAt.toDateString()));
  let streak = 0; const d = new Date(); if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
  const by = {}; list.forEach((a) => { const s = a.quiz?.subject || 'Other'; (by[s] ||= []).push(a.percentage); });
  const subjects = Object.entries(by).map(([subject, v]) => ({ subject, average: Math.round(v.reduce((x, y) => x + y, 0) / v.length), attempts: v.length })).sort((x, y) => x.average - y.average);
  res.json({ total: list.length, average: list.length ? Math.round(pct.reduce((x, y) => x + y, 0) / list.length) : 0, best: list.length ? Math.max(...pct) : 0, streak,
    trend: list.slice(-15).map((a, i) => ({ n: i + 1, score: a.percentage })), subjects, recommended: subjects.filter((s) => s.average < 60).slice(0, 3).map((s) => s.subject),
    recent: list.slice(-5).reverse().map((a) => ({ id: a.id, subject: a.quiz?.subject, percentage: a.percentage, date: a.submittedAt })) });
}));

// ---------- AI Tutor ----------
const SYSTEM = `You are a patient computer-science tutor. Explain concepts step by step with examples and analogies, guide the student to understand rather than just giving answers, and reply in the language the student uses. Only reference information the student has actually given you in this chat; never claim to have seen their quiz or data otherwise.`;
app.post('/api/tutor/chat', auth, wrap(async (req, res) => {
  if (!genAI) throw fail(503, 'AI tutor is unavailable: no Gemini API key is configured on the server.');
  const msgs = (Array.isArray(req.body.messages) ? req.body.messages : []).slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: clean(m.content, 2000) }] }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw fail(400, 'Send a question');
  try {
    const chat = genAI.getGenerativeModel({ model: MODEL, systemInstruction: SYSTEM }).startChat({ history: msgs.slice(0, -1) });
    const r = await chat.sendMessage(msgs[msgs.length - 1].parts[0].text);
    res.json({ reply: r.response.text() });
  } catch (e) { console.error('Tutor failed:', e.message); throw fail(503, 'The AI tutor is temporarily unavailable. Please try again.'); }
}));

// ---------- Analysis report ----------
app.get('/api/report', auth, wrap(async (req, res) => {
  const list = await Attempt.find({ user: req.uid, status: { $in: ['completed', 'expired'] } }).sort('submittedAt').populate('quiz', 'subject topic difficulty');
  if (!list.length) return res.json({ empty: true });
  const avg = (v) => (v.length ? Math.round(v.reduce((x, y) => x + y, 0) / v.length) : 0);
  const group = (key) => { const m = {}; list.forEach((a) => { const k = key(a); if (k) (m[k] ||= []).push(a); });
    return Object.entries(m).map(([name, v]) => ({ name, attempts: v.length, average: avg(v.map((a) => a.percentage)) })).sort((x, y) => y.average - x.average); };
  const pct = list.map((a) => a.percentage), last = pct.slice(-5), prev = pct.slice(-10, -5);
  const totals = list.reduce((t, a) => ({ correct: t.correct + a.correct, incorrect: t.incorrect + a.incorrect, unanswered: t.unanswered + a.unanswered, time: t.time + (a.timeTaken || 0) }), { correct: 0, incorrect: 0, unanswered: 0, time: 0 });
  res.json({ attempts: list.length, average: avg(pct), best: Math.max(...pct), worst: Math.min(...pct), passRate: Math.round((pct.filter((p) => p >= 40).length / list.length) * 100),
    totals, improvement: prev.length >= 1 && last.length >= 1 && pct.length >= 6 ? avg(last) - avg(prev) : null, trend: list.slice(-20).map((a, i) => ({ n: i + 1, score: a.percentage })),
    subjects: group((a) => a.quiz?.subject), difficulty: group((a) => a.quiz?.difficulty), topics: group((a) => (a.quiz?.topic ? `${a.quiz.subject}: ${a.quiz.topic}` : '')).filter((t) => t.attempts >= 2),
    from: list[0].submittedAt, to: list[list.length - 1].submittedAt });
}));

// ---------- Study plan ----------
app.post('/api/plan', auth, wrap(async (req, res) => {
  if (!genAI) throw fail(503, 'Study plans need a Gemini API key on the server.');
  const list = await Attempt.find({ user: req.uid, status: { $in: ['completed', 'expired'] } }).sort('-submittedAt').limit(50).populate('quiz', 'subject topic');
  if (!list.length) throw fail(400, 'Take at least one quiz first so the plan can use your results.');
  const by = {}; list.forEach((a) => { const k = `${a.quiz?.subject}${a.quiz?.topic ? ' / ' + a.quiz.topic : ''}`; (by[k] ||= []).push(a.percentage); });
  const weak = Object.entries(by).map(([k, v]) => [k, Math.round(v.reduce((x, y) => x + y, 0) / v.length)]).sort((x, y) => x[1] - y[1]).slice(0, 4);
  const prompt = `A computer science student's weakest areas (average quiz %): ${weak.map(([k, v]) => `${k}: ${v}%`).join('; ')}. Write in ${clean(req.body.language || 'English', 30)}.
Return ONLY JSON: {"summary":"2 sentences","days":[7 items {"day":"Monday","task":"specific 30-60 minute activity"}],"lectures":[4 items {"title":string,"channel":"well-known channel or university","search":"youtube search query"}],"books":[3 items {"title":string,"author":string}]}. Only recommend well-known real books and channels.`;
  try {
    const r = await genAI.getGenerativeModel({ model: MODEL, generationConfig: { responseMimeType: 'application/json' } }).generateContent(prompt);
    res.json({ weak: weak.map(([subject, average]) => ({ subject, average })), plan: JSON.parse(r.response.text().replace(/```json|```/g, '')) });
  } catch (e) { console.error('Plan failed:', e.message); throw fail(503, 'Could not create a plan right now. Please try again.'); }
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((e, req, res, next) => { // eslint-disable-line
  const status = e.name === 'CastError' ? 400 : e.status || 500;
  if (status === 500) console.error(e);
  res.status(status).json({ error: status === 500 ? 'Server error' : e.name === 'CastError' ? 'Invalid id' : e.message });
});

if (!process.env.JWT_SECRET) { console.error('Set JWT_SECRET in server/.env'); process.exit(1); }
const startServer = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (uri && uri !== 'mongodb://127.0.0.1:27017/quiz_assessment_portal') {
      await mongoose.connect(uri);
    } else {
      const memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri('quiz_assessment_portal'));
      console.log('Using in-memory MongoDB for local dev');
    }
    app.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000} | AI ${genAI ? 'on' : 'off (fallback bank only)'}`));
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  }
};
startServer();
