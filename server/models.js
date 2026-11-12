import mongoose from 'mongoose';
const { Schema } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m, index: true });
export const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true }));
const Q = new Schema({ question: String, type: { type: String, default: 'mcq' }, options: [String], correctAnswer: Number, explanation: String, answerText: String, keywords: [String] }, { _id: false });
export const Quiz = mongoose.model('Quiz', new Schema({
  user: ref('User'), subject: String, topic: String, difficulty: String, language: String,
  source: String, timeLimit: Number, questions: [Q],
}, { timestamps: true }));
export const Attempt = mongoose.model('Attempt', new Schema({
  user: ref('User'), quiz: ref('Quiz'), startedAt: Date, deadline: Date, submittedAt: Date,
  answers: [Schema.Types.Mixed], status: { type: String, default: 'in_progress' },
  correct: Number, incorrect: Number, unanswered: Number, percentage: Number, timeTaken: Number,
}));
