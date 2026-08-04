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
  Check
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>✅ Đạt (Nên mời phỏng vấn)</span>
          </div>
        );
      case "potential":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>⚠️ Tiềm năng (Cần cân nhắc thêm)</span>
          </div>
        );
      case "fail":
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-xs">
            <XCircle className="w-4 h-4" />
            <span>❌ Không đạt (Không khớp JD)</span>
          </div>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 stroke-emerald-500";
    if (score >= 50) return "text-amber-400 stroke-amber-500";
    return "text-rose-400 stroke-rose-500";
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const categories = [
    {
      label: "Kỹ năng",
      icon: Wrench,
      score: result.skills_analysis.score,
      details: result.skills_analysis.details,
      color: "bg-indigo-500",
    },
    {
      label: "Kinh nghiệm",
      icon: Briefcase,
      score: result.experience_analysis.score,
      details: result.experience_analysis.details,
      color: "bg-purple-500",
    },
    {
      label: "Học vấn",
      icon: GraduationCap,
      score: result.education_analysis.score,
      details: result.education_analysis.details,
      color: "bg-sky-500",
    },
    {
      label: "Ngôn ngữ",
      icon: Globe,
      score: result.language_analysis.score,
      details: result.language_analysis.details,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>File: {result.cvFileName || "CV.pdf"}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {result.candidate_name || "Ứng viên không rõ tên"}
            </h2>
          </div>
          <div>{getClassificationBadge(result.classification)}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Radial score gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(result.overall_score)}
                  strokeDasharray={`${result.overall_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white">
                  {result.overall_score}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  / 100 Điểm
                </span>
              </div>
            </div>
            <span className="text-xs text-zinc-400 mt-2 font-medium">Điểm Phù Hợp Tổng Thể</span>
          </div>

          {/* Key Summary */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              Tóm Tắt Đánh Giá
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">
              {result.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="glass-card rounded-xl p-5 space-y-3 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm text-white">{cat.label}</span>
                </div>
                <span className="text-sm font-bold text-indigo-400">{cat.score}/100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.color}`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{cat.details}</p>
            </div>
          );
        })}
      </div>

      {/* Skills Matched / Missing */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Kỹ Năng Khớp JD ({result.skills_analysis.matched?.length || 0})
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.skills_analysis.matched?.length ? (
              result.skills_analysis.matched.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500">Không có dữ liệu</span>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Kỹ Năng Thiếu So Với JD ({result.skills_analysis.missing?.length || 0})
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {result.skills_analysis.missing?.length ? (
              result.skills_analysis.missing.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium"
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

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            Điểm Mạnh Nổi Bật
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {result.strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ThumbsDown className="w-4 h-4 text-amber-400" />
            Điểm Yếu / Rủi Ro
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {result.weaknesses?.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Interview Questions */}
      <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          Gợi Ý 5 Câu Hỏi Phỏng Vấn Dành Cho Ứng Viên
        </h3>

        <div className="space-y-3">
          {result.interview_questions?.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 group hover:border-zinc-700 transition-colors"
            >
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{q}</p>
              </div>
              <button
                onClick={() => handleCopyQuestion(q, idx)}
                className="text-zinc-500 hover:text-indigo-400 p-1 rounded transition-colors"
                title="Sao chép câu hỏi"
              >
                {copiedQuestionIndex === idx ? (
                  <Check className="w-4 h-4 text-emerald-400" />
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
