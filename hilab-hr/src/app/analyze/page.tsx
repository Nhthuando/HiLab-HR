"use client";

import { useState } from "react";
import {
  FileSearch,
  UploadCloud,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  CheckCircle2,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { CVAnalysisResult } from "@/lib/gemini";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { saveAnalysis, exportAnalysesToCSV, StoredAnalysis } from "@/lib/localStorage";
import { exportAnalysesToExcel } from "@/lib/excelExport";

const SAMPLE_JD = `Vị trí: Senior Frontend Developer
Địa điểm: TP. Hồ Chí Minh (Hybrid)
Lương: 25 - 40 triệu

Mô tả công việc:
- Phát triển các ứng dụng web với React.js / Next.js
- Thiết kế và tối ưu kiến trúc frontend, state management (Zustand/Redux)
- Viết TypeScript chất lượng cao, tối ưu web performance
- Phối hợp với team Backend (REST API/GraphQL) và UX Designer
- Mentor cho các Junior Developer trong team

Yêu cầu:
- Ít nhất 3 năm kinh nghiệm làm việc với React.js / Next.js
- Thành thạo TypeScript, HTML5, CSS3, Tailwind CSS
- Hiểu biết sâu về Web Performance (Core Web Vitals) & RESTful API
- Tiếng Anh đọc hiểu tài liệu kỹ thuật tốt
- Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương`;

export default function SingleAnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith(".pdf")) {
        setError("Vui lòng chọn file định dạng .pdf");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleLoadSampleJD = () => {
    setJd(SAMPLE_JD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn file CV (PDF).");
      return;
    }
    if (!jd.trim()) {
      setError("Vui lòng nhập nội dung Job Description (JD).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSavedToHistory(false);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      formData.append("jd", jd);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Phân tích thất bại.");
      }

      setResult(data.data);

      // Auto-save to localStorage with JD metadata
      saveAnalysis(data.data, file.name, jd);
      setSavedToHistory(true);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi gọi Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!result || !file) return;
    const entry: StoredAnalysis = {
      id: "single-export",
      cvFileName: file.name,
      analyzedAt: new Date().toISOString(),
      jdText: jd,
      result,
    };
    await exportAnalysesToExcel([entry], jd);
  };

  const handleExportCSV = () => {
    if (!result || !file) return;
    const entry: StoredAnalysis = {
      id: "single-export",
      cvFileName: file.name,
      analyzedAt: new Date().toISOString(),
      jdText: jd,
      result,
    };
    exportAnalysesToCSV([entry]);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
          <FileSearch className="w-4 h-4" />
          <span>SÀNG LỌC ĐƠN LẺ</span>
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Phân Tích 1 CV Theo JD</h1>
        <p className="text-sm text-stone-600">
          Upload file PDF CV của ứng viên và nhập yêu cầu công việc (JD) để AI đánh giá chuyên sâu.
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 sm:p-8 rounded-2xl border border-stone-200">
        {/* Step 1: File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-stone-800">
            1. Upload File CV ứng viên (PDF) <span className="text-rose-400">*</span>
          </label>

          <div className="relative border-2 border-dashed border-stone-300 hover:border-indigo-300 rounded-xl p-6 text-center cursor-pointer transition-colors bg-stone-50/80">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3 text-sm text-indigo-700">
                <FileText className="w-6 h-6 text-indigo-600" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-stone-500 font-mono">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <UploadCloud className="w-8 h-8 text-stone-400 mx-auto" />
                <div className="text-xs text-stone-600">
                  <span className="text-indigo-600 font-medium">Bấm để chọn file PDF</span> hoặc kéo thả vào đây
                </div>
                <div className="text-[10px] text-stone-500">Kích thước file tối đa 10MB</div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: JD Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-stone-800">
              2. Nội dung Job Description (JD) <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleLoadSampleJD}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Tải JD mẫu (Senior Frontend)
            </button>
          </div>

          <textarea
            rows={7}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Dán nội dung mô tả công việc, các yêu cầu kỹ thuật, kinh nghiệm, học vấn tại đây..."
            className="w-full bg-white border border-stone-300 rounded-xl p-4 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Error alert */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white gradient-button flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI đang đọc CV & phân tích... (khoảng 5-10s)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu Phân Tích CV</span>
            </>
          )}
        </button>
      </form>

      {/* Result Section */}
      {result && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-stone-900">Kết Quả Đánh Giá</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {savedToHistory && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu vào lịch sử</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm"
                title="Xuất file Excel (.xlsx) định dạng đẹp, bảng màu, border, 2 sheet"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-xs text-stone-700 transition-colors border border-stone-200 shadow-sm"
                title="Xuất file CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setSavedToHistory(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-xs text-stone-700 transition-colors border border-stone-200 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Phân tích khác
              </button>
            </div>
          </div>
          <AnalysisResultView result={{ ...result, cvFileName: file?.name }} />
        </div>
      )}
    </div>
  );
}
