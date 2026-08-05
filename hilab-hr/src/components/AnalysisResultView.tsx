"use client";

import { CVAnalysisResult } from "@/lib/gemini";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  HelpCircle, 
  ThumbsUp, 
  ThumbsDown, 
  FileText,
  Copy,
  Check,
  Mail,
  Phone
} from "lucide-react";
import { useState } from "react";

interface Props {
  result: CVAnalysisResult & { cvFileName?: string };
}

export function AnalysisResultView({ result }: Props) {
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "pass":
        return (
          <div className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>✅ Đạt — Nên mời phỏng vấn</span>
          </div>
        );
      case "potential":
        return (
          <div className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>⚠️ Tiềm năng — Cần cân nhắc thêm</span>
          </div>
        );
      case "fail":
      default:
        return (
          <div className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>❌ Không đạt — Không khớp JD</span>
          </div>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600 stroke-emerald-500";
    if (score >= 50) return "text-amber-600 stroke-amber-500";
    return "text-rose-600 stroke-rose-500";
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const skills = result?.skills_analysis || { score: 0, matched: [], missing: [], must_have_gaps: [], details: "" };
  const experience = result?.experience_analysis || { score: 0, years_total: 0, years_relevant: 0, details: "" };
  const education = result?.education_analysis || { score: 0, details: "" };
  const language = result?.language_analysis || { score: 0, details: "" };

  const categories = [
    {
      label: "Kỹ năng",
      icon: Wrench,
      score: typeof skills.score === "number" ? skills.score : 0,
      details: skills.details || "Chưa có nhận xét chi tiết",
      color: "bg-indigo-500",
    },
    {
      label: "Kinh nghiệm",
      icon: Briefcase,
      score: typeof experience.score === "number" ? experience.score : 0,
      details: experience.details || "Chưa có nhận xét chi tiết",
      color: "bg-purple-500",
    },
    {
      label: "Học vấn",
      icon: GraduationCap,
      score: typeof education.score === "number" ? education.score : 0,
      details: education.details || "Chưa có nhận xét chi tiết",
      color: "bg-sky-500",
    },
    {
      label: "Ngôn ngữ",
      icon: Globe,
      score: typeof language.score === "number" ? language.score : 0,
      details: language.details || "Chưa có nhận xét chi tiết",
      color: "bg-emerald-500",
    },
  ];

  const overallScore = typeof result?.overall_score === "number" ? result.overall_score : 0;
  const matchedSkills = Array.isArray(skills.matched) ? skills.matched : [];
  const missingSkills = Array.isArray(skills.missing) ? skills.missing : [];
  const mustHaveGaps = Array.isArray(skills.must_have_gaps) ? skills.must_have_gaps : [];
  const strengths = Array.isArray(result?.strengths) ? result.strengths : [];
  const weaknesses = Array.isArray(result?.weaknesses) ? result.weaknesses : [];
  const interviewQuestions = Array.isArray(result?.interview_questions) ? result.interview_questions : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{result?.cvFileName || "CV.pdf"}</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900">
              {result?.candidate_name || "Ứng viên không rõ tên"}
            </h2>
            {(result?.candidate_email || result?.candidate_phone) && (
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-500">
                {result?.candidate_email && (
                  <a
                    href={`mailto:${result.candidate_email}`}
                    className="inline-flex items-center gap-1.5 hover:text-indigo-700 transition-colors bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>{result.candidate_email}</span>
                  </a>
                )}
                {result?.candidate_phone && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{result.candidate_phone}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">{getClassificationBadge(result?.classification || "fail")}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Radial score gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-stone-200 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(overallScore)}
                  strokeDasharray={`${overallScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-stone-900">
                  {overallScore}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                  / 100 Điểm
                </span>
              </div>
            </div>
            <span className="text-xs text-stone-500 mt-2 font-medium">Điểm Phù Hợp Tổng Thể</span>
          </div>

          {/* Key Summary */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Tóm Tắt Đánh Giá
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
              {result?.summary || "Không có tóm tắt đánh giá."}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="glass-card rounded-xl p-5 space-y-3 border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-stone-900">{cat.label}</span>
                </div>
                <span className="text-sm font-bold text-indigo-400">{cat.score}/100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                />
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">{cat.details}</p>
            </div>
          );
        })}
      </div>

      {/* Skills Matched / Missing */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 border border-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Kỹ Năng Khớp JD ({matchedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {matchedSkills.length ? (
              matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium"
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Không có dữ liệu</span>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 border border-stone-200 space-y-3">
          <h3 className="text-sm font-semibold text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Kỹ Năng Thiếu So Với JD ({missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {missingSkills.length ? (
              missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-medium"
                >
                  ✗ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Không thiếu kỹ năng nào</span>
            )}
          </div>
        </div>
      </div>

      {mustHaveGaps.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-amber-200 space-y-3">
          <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Yêu Cầu Bắt Buộc Chưa Có Bằng Chứng ({mustHaveGaps.length})
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {mustHaveGaps.map((gap) => (
              <span
                key={gap}
                className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-medium"
              >
                ! {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 border border-stone-200 space-y-4">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            Điểm Mạnh Nổi Bật
          </h3>
          <ul className="space-y-2 text-xs text-stone-700">
            {strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-xl p-6 border border-stone-200 space-y-4">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <ThumbsDown className="w-4 h-4 text-amber-600" />
            Điểm Yếu / Rủi Ro
          </h3>
          <ul className="space-y-2 text-xs text-stone-700">
            {weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Interview Questions */}
      <div className="glass-card rounded-xl p-6 border border-stone-200 space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Gợi Ý 5 Câu Hỏi Phỏng Vấn Dành Cho Ứng Viên
        </h3>

        <div className="space-y-3">
          {interviewQuestions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 group hover:border-stone-300 transition-colors"
            >
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{q}</p>
              </div>
              <button
                onClick={() => handleCopyQuestion(q, idx)}
                className="text-stone-400 hover:text-indigo-700 p-1 rounded transition-colors"
                title="Sao chép câu hỏi"
              >
                {copiedQuestionIndex === idx ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
