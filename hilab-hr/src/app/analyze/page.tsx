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
  Zap
} from "lucide-react";
import { CVAnalysisResult } from "@/lib/gemini";
import { AnalysisResultView } from "@/components/AnalysisResultView";

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
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi gọi Gemini API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <FileSearch className="w-4 h-4" />
          <span>SÀNG LỌC ĐƠN LẺ</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Phân Tích 1 CV Theo JD</h1>
        <p className="text-sm text-zinc-400">
          Upload file PDF CV của ứng viên và nhập yêu cầu công việc (JD) để AI Gemini 2.5 Flash đánh giá.
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-800">
        {/* Step 1: File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-zinc-200">
            1. Upload File CV ứng viên (PDF) <span className="text-rose-400">*</span>
          </label>

          <div className="relative border-2 border-dashed border-zinc-700 hover:border-indigo-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-900/40">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3 text-sm text-indigo-300">
                <FileText className="w-6 h-6 text-indigo-400" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-zinc-500 font-mono">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto" />
                <div className="text-xs text-zinc-400">
                  <span className="text-indigo-400 font-medium">Bấm để chọn file PDF</span> hoặc kéo thả vào đây
                </div>
                <div className="text-[10px] text-zinc-500">Kích thước file tối đa 10MB</div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: JD Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-zinc-200">
              2. Nội dung Job Description (JD) <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleLoadSampleJD}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Kết Quả Đánh Giá</h2>
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Phân tích CV khác
            </button>
          </div>
          <AnalysisResultView result={{ ...result, cvFileName: file?.name }} />
        </div>
      )}
    </div>
  );
}
