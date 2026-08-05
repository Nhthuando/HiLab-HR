"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Download,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSearch,
  RefreshCw,
  Briefcase,
  FileSpreadsheet
} from "lucide-react";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import {
  StoredAnalysis,
  getAnalyses,
  deleteAnalysis,
  exportAnalysesToCSV,
  clearAllAnalyses,
  extractJdInfo
} from "@/lib/localStorage";
import { exportAnalysesToExcel } from "@/lib/excelExport";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadAnalyses = useCallback(() => {
    setAnalyses(getAnalyses());
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    clearAllAnalyses();
    setAnalyses([]);
    setExpandedId(null);
    setShowClearConfirm(false);
  };

  const handleExportExcel = async () => {
    if (analyses.length > 0) {
      await exportAnalysesToExcel(analyses);
    }
  };

  const handleExportCSV = () => {
    if (analyses.length > 0) {
      exportAnalysesToCSV(analyses);
    }
  };

  const getBadge = (cls: string) => {
    switch (cls) {
      case "pass":
        return (
          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
            ✅ Đạt
          </span>
        );
      case "potential":
        return (
          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs">
            ⚠️ Tiềm năng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-xs">
            ❌ Không đạt
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <History className="w-4 h-4" />
            <span>QUẢN LÝ LỊCH SỬ</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Lịch Sử Phân Tích CV</h1>
          <p className="text-xs text-stone-600">
            Tổng hợp toàn bộ hồ sơ ứng viên đã phân tích kèm Job Description (JD) tương ứng.
          </p>
        </div>

        {analyses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadAnalyses}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-stone-100 text-xs text-stone-700 transition-colors border border-stone-200 shadow-sm"
              title="Tải lại"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
              title="Xuất toàn bộ lịch sử ra file Excel (.xlsx) chuyên nghiệp"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel (.xlsx) ({analyses.length})</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 transition-colors border border-stone-200 shadow-sm"
              title="Xuất file CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa tất cả
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600">Xác nhận xóa hết?</span>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
                >
                  Xóa hết
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors border border-stone-200 shadow-sm"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4 border border-stone-200">
          <FileSearch className="w-12 h-12 text-stone-400 mx-auto" />
          <h2 className="text-lg font-bold text-stone-900">Chưa có dữ liệu lịch sử</h2>
          <p className="text-xs text-stone-600 max-w-sm mx-auto">
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
        <div className="glass-panel rounded-2xl overflow-hidden border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/90 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Thời gian</th>
                  <th className="p-3.5">Vị trí tuyển dụng (JD)</th>
                  <th className="p-3.5">Ứng viên</th>
                  <th className="p-3.5">File CV</th>
                  <th className="p-3.5 whitespace-nowrap">Điểm Tổng</th>
                  <th className="p-3.5">Xếp loại</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {analyses.map((item) => {
                  const title = item.jdTitle || (item.jdText ? extractJdInfo(item.jdText).jdTitle : "Vị trí tuyển dụng");
                  const summary = item.jdSummary || (item.jdText ? extractJdInfo(item.jdText).jdSummary : "");

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(item.analyzedAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3.5 max-w-[220px]">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-medium text-xs truncate" title={title}>
                            <Briefcase className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">{title}</span>
                          </div>
                          {summary && (
                            <div className="text-[10px] text-stone-500 truncate mt-0.5" title={summary}>
                              {summary}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-stone-800">
                            {item.result.candidate_name || "N/A"}
                          </div>
                          {(item.result.candidate_email || item.result.candidate_phone) && (
                            <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2 mt-0.5">
                              {item.result.candidate_email && (
                                <a
                                  href={`mailto:${item.result.candidate_email}`}
                                  className="text-indigo-600 hover:underline truncate max-w-[150px]"
                                  title={item.result.candidate_email}
                                >
                                  {item.result.candidate_email}
                                </a>
                              )}
                              {item.result.candidate_phone && (
                                <span className="font-mono text-stone-500">{item.result.candidate_phone}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-500 font-mono text-[11px] max-w-[160px]">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                            <span className="truncate" title={item.cvFileName}>{item.cvFileName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-extrabold text-sm text-indigo-600 whitespace-nowrap">
                          {item.result.overall_score}/100
                        </td>
                        <td className="p-3.5">{getBadge(item.result.classification)}</td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 transition-colors whitespace-nowrap text-xs border border-stone-200 shadow-sm"
                            >
                              <span>{expandedId === item.id ? "Ẩn" : "Chi tiết"}</span>
                              {expandedId === item.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition-colors"
                              title="Xóa khỏi lịch sử"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={7} className="p-6 bg-stone-50/80 border-b border-stone-200">
                            <AnalysisResultView
                              result={{
                                ...item.result,
                                cvFileName: item.cvFileName,
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
