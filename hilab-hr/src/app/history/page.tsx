"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  History, 
  Download, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSearch
} from "lucide-react";
import { AnalysisResultView } from "@/components/AnalysisResultView";

export default function HistoryPage() {
  const { data: session } = useSession();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/analyses");
        if (res.ok) {
          const data = await res.json();
          setAnalyses(data.data || []);
        }
      } catch (err) {
        console.error("Lỗi fetch lịch sử:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);


  const handleExportCSV = () => {
    window.open("/api/analyses/export", "_blank");
  };

  const getBadge = (cls: string) => {
    switch (cls) {
      case "pass":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">✅ Đạt</span>;
      case "potential":
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs">⚠️ Tiềm năng</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-xs">❌ Không đạt</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <History className="w-4 h-4" />
            <span>QUẢN LÝ LỊCH SỬ</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Lịch Sử Phân Tích CV</h1>
        </div>

        {analyses.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Đang tải lịch sử...</span>
        </div>
      ) : analyses.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4 border border-zinc-800">
          <FileSearch className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Chưa có dữ liệu lịch sử</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Bạn chưa thực hiện phân tích CV nào. Hãy bắt đầu phân tích 1 CV hoặc batch mode ngay!
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white gradient-button"
          >
            Phân tích CV đầu tiên
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Ứng viên</th>
                  <th className="p-4">File CV</th>
                  <th className="p-4">Vị trí (JD)</th>
                  <th className="p-4">Điểm Tổng</th>
                  <th className="p-4">Xếp Loại</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {analyses.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-4 font-semibold text-zinc-200">
                        {item.candidateName || "N/A"}
                      </td>
                      <td className="p-4 text-zinc-400 font-mono text-[11px]">
                        {item.cvFileName}
                      </td>
                      <td className="p-4 text-zinc-300 truncate max-w-[150px]">
                        {item.jobDescription?.title || "N/A"}
                      </td>
                      <td className="p-4 font-extrabold text-sm text-indigo-400">
                        {item.overallScore}/100
                      </td>
                      <td className="p-4">{getBadge(item.classification)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                        >
                          <span>{expandedId === item.id ? "Ẩn" : "Xem chi tiết"}</span>
                          {expandedId === item.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={7} className="p-6 bg-zinc-950/80 border-b border-zinc-800">
                          <AnalysisResultView
                            result={{
                              candidate_name: item.candidateName || "N/A",
                              overall_score: item.overallScore,
                              classification: item.classification as any,
                              skills_analysis: item.skillsAnalysis as any,
                              experience_analysis: item.experienceAnalysis as any,
                              education_analysis: item.educationAnalysis as any,
                              language_analysis: item.languageAnalysis as any,
                              strengths: item.strengths,
                              weaknesses: item.weaknesses,
                              interview_questions: item.interviewQuestions,
                              summary: item.summary,
                              cvFileName: item.cvFileName,
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
