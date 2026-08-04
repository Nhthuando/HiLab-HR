"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  FileSearch, 
  Files, 
  ArrowRight,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analyses");
        if (res.ok) {
          const data = await res.json();
          setAnalyses(data.data || []);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  const total = analyses.length;
  const passCount = analyses.filter((a) => a.classification === "pass").length;
  const potentialCount = analyses.filter((a) => a.classification === "potential").length;
  const failCount = analyses.filter((a) => a.classification === "fail").length;
  const avgScore = total > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.overallScore, 0) / total) : 0;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <LayoutDashboard className="w-4 h-4" />
          <span>TỔNG QUAN HỆ THỐNG</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Dashboard Tuyển Dụng</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Đang tải thống kê...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs text-zinc-400 font-medium">Tổng CV Phân Tích</span>
              <div className="text-3xl font-extrabold text-white">{total}</div>
              <div className="text-[11px] text-zinc-500">Tích lũy từ hệ thống</div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs text-zinc-400 font-medium">Tỷ Lệ Đạt (Pass Rate)</span>
              <div className="text-3xl font-extrabold text-emerald-400">{passRate}%</div>
              <div className="text-[11px] text-emerald-500/80">{passCount} ứng viên đạt</div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs text-zinc-400 font-medium">Điểm Phù Hợp Trung Bình</span>
              <div className="text-3xl font-extrabold text-indigo-400">{avgScore}/100</div>
              <div className="text-[11px] text-indigo-400/80">Trên tổng số CV</div>
            </div>

            <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs text-zinc-400 font-medium">Cần Cân Nhắc / Tiềm Năng</span>
              <div className="text-3xl font-extrabold text-amber-400">{potentialCount}</div>
              <div className="text-[11px] text-amber-500/80">Xếp loại potential</div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Classification Breakdown */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                Phân Bố Xếp Loại Ứng Viên
              </h2>

              {total === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">Chưa có dữ liệu thống kê.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Đạt (≥70 điểm)
                      </span>
                      <span className="text-zinc-300">{passCount} ({total > 0 ? Math.round((passCount/total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(passCount/total)*100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> ⚠️ Tiềm năng (50-69 điểm)
                      </span>
                      <span className="text-zinc-300">{potentialCount} ({total > 0 ? Math.round((potentialCount/total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(potentialCount/total)*100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> ❌ Không đạt (&lt;50 điểm)
                      </span>
                      <span className="text-zinc-300">{failCount} ({total > 0 ? Math.round((failCount/total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(failCount/total)*100}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Bắt Đầu Phân Tích Mới
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Lựa chọn công cụ phù hợp với nhu cầu sàng lọc ứng viên của bạn.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Link
                  href="/analyze"
                  className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-semibold text-white group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <FileSearch className="w-4 h-4" />
                    </div>
                    <span>Phân tích 1 CV đính kèm</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </Link>

                <Link
                  href="/analyze/batch"
                  className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-semibold text-white group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Files className="w-4 h-4" />
                    </div>
                    <span>Phân tích hàng loạt (Batch Ranking)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
