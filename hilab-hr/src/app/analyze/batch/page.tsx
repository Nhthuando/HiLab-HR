"use client";

import React, { useState } from "react";
import {
  Files,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { CVAnalysisResult } from "@/lib/gemini";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { saveAnalysis, exportAnalysesToCSV, getAnalyses, StoredAnalysis } from "@/lib/localStorage";
import { exportAnalysesToExcel } from "@/lib/excelExport";

const SAMPLE_JD = `Vị trí: Senior Frontend Developer
Yêu cầu: React.js, Next.js, TypeScript, Tailwind CSS, REST API, > 3 năm kinh nghiệm. Tiếng Anh khá.`;

export default function BatchAnalyzePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<CVAnalysisResult & { cvFileName: string }>>([]);
  const [savedEntries, setSavedEntries] = useState<StoredAnalysis[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedList = Array.from(e.target.files);
      const validPdfs = selectedList.filter((f) => f.name.toLowerCase().endsWith(".pdf"));

      if (validPdfs.length < selectedList.length) {
        setError("Chỉ chấp nhận các file có định dạng PDF.");
      } else {
        setError(null);
      }

      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const newUniquePdfs = validPdfs.filter((f) => !existingNames.has(f.name));
        return [...prev, ...newUniquePdfs];
      });

      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất 1 file CV (PDF).");
      return;
    }
    if (!jd.trim()) {
      setError("Vui lòng nhập nội dung Job Description (JD).");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSavedEntries([]);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("cvs", f));
      formData.append("jd", jd);

      const res = await fetch("/api/analyze/batch", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Phân tích hàng loạt thất bại.");
      }

      const analysisResults: Array<CVAnalysisResult & { cvFileName: string }> = data.data || [];
      setResults(analysisResults);

      // Auto-save all results to localStorage with JD metadata
      const entries: StoredAnalysis[] = [];
      for (const item of analysisResults) {
        const entry = saveAnalysis(item, item.cvFileName, jd);
        entries.push(entry);
      }
      setSavedEntries(entries);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi gọi Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcelBatch = async () => {
    // Export this current batch's results (or all if empty)
    if (savedEntries.length > 0) {
      await exportAnalysesToExcel(savedEntries, jd);
    } else {
      const allAnalyses = getAnalyses();
      if (allAnalyses.length > 0) {
        await exportAnalysesToExcel(allAnalyses, jd);
      }
    }
  };

  const handleExportCSV = () => {
    if (savedEntries.length > 0) {
      exportAnalysesToCSV(savedEntries);
    } else {
      const allAnalyses = getAnalyses();
      if (allAnalyses.length > 0) {
        exportAnalysesToCSV(allAnalyses);
      }
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-600">
          <Files className="w-4 h-4" />
          <span>SÀNG LỌC HÀNG LOẠT (BATCH MODE)</span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900">So Sánh & Ranking Nhiều CV</h1>
        <p className="text-sm text-stone-600">
          Upload danh sách nhiều file PDF CV cùng lúc để AI tự động so sánh, tính điểm và xếp hạng từ cao xuống thấp.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 sm:p-8 rounded-2xl border border-stone-200">
        {/* Step 1: Upload multiple files */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-stone-800">
            1. Upload danh sách CVs (PDF) <span className="text-rose-400">*</span>
          </label>

          <div className="relative border-2 border-dashed border-stone-300 hover:border-violet-300 rounded-xl p-6 text-center cursor-pointer transition-colors bg-stone-50/80">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFilesChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 pointer-events-none">
              <UploadCloud className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-xs text-stone-600">
                <span className="text-violet-600 font-medium">Bấm để chọn nhiều file PDF</span> hoặc kéo thả vào đây
              </div>
            </div>
          </div>

          {/* Selected File List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs text-stone-600 flex items-center justify-between">
                <span>Đã chọn {files.length} file:</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-violet-600 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-stone-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: JD */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-stone-800">
              2. Nội dung Job Description (JD) <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setJd(SAMPLE_JD)}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-purple-300"
            >
              <Zap className="w-3.5 h-3.5" />
              Tải JD mẫu
            </button>
          </div>
          <textarea
            rows={5}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Dán yêu cầu tuyển dụng..."
            className="w-full bg-white border border-stone-300 rounded-xl p-4 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-violet-500 shadow-sm"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang chấm điểm {files.length} CV... Vui lòng đợi</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Phân Tích & Ranking {files.length ? `(${files.length} CVs)` : ""}</span>
            </>
          )}
        </button>
      </form>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-stone-900">Bảng Xếp Hạng Ranking ({results.length} Ứng Viên)</h2>
              {savedEntries.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu {savedEntries.length} kết quả vào lịch sử</span>
                </div>
              )}
            </div>
            {savedEntries.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportExcelBatch}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md"
                  title="Xuất bảng xếp hạng đợt này ra file Excel (.xlsx) chuyên nghiệp"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Excel Đợt Này ({savedEntries.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 transition-colors border border-stone-200 shadow-sm"
                  title="Xuất file CSV"
                >
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/90 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-4"># Hạng</th>
                    <th className="p-4">Ứng viên</th>
                    <th className="p-4">File CV</th>
                    <th className="p-4">Điểm Tổng</th>
                    <th className="p-4">Xếp Loại</th>
                    <th className="p-4">Kỹ Năng</th>
                    <th className="p-4">Kinh Nghiệm</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {results.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 font-bold text-stone-900">
                          {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-stone-800">
                            {item.candidate_name || "N/A"}
                          </div>
                          {(item.candidate_email || item.candidate_phone) && (
                            <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2 mt-0.5">
                              {item.candidate_email && (
                                <a
                                  href={`mailto:${item.candidate_email}`}
                                  className="text-indigo-400 hover:underline truncate max-w-[160px]"
                                  title={item.candidate_email}
                                >
                                  {item.candidate_email}
                                </a>
                              )}
                              {item.candidate_phone && (
                                <span className="font-mono text-stone-500">{item.candidate_phone}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-stone-500 font-mono text-[11px]">
                          {item.cvFileName}
                        </td>
                        <td className="p-4 font-extrabold text-sm text-indigo-400">
                          {item.overall_score ?? 0}/100
                        </td>
                        <td className="p-4">{getBadge(item.classification || "fail")}</td>
                        <td className="p-4 text-stone-700">{item.skills_analysis?.score ?? 0}/100</td>
                        <td className="p-4 text-stone-700">{item.experience_analysis?.score ?? 0}/100</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 transition-colors border border-stone-200 shadow-sm"
                          >
                            <span>{expandedIndex === idx ? "Ẩn" : "Chi tiết"}</span>
                            {expandedIndex === idx ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedIndex === idx && (
                        <tr>
                          <td colSpan={8} className="p-6 bg-stone-50/80 border-b border-stone-200">
                            <AnalysisResultView result={item} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
