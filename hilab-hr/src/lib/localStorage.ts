/**
 * localStorage utility for HR CV Screening history management.
 * Stores analysis results locally in the browser without authentication.
 */

import { CVAnalysisResult } from "./gemini";

export const STORAGE_KEY = "hilab_hr_analyses";

export interface StoredAnalysis {
  id: string;
  cvFileName: string;
  analyzedAt: string; // ISO string
  jdTitle?: string;
  jdSummary?: string;
  jdText?: string;
  result: CVAnalysisResult;
}

/**
 * Trích xuất nhanh Vị trí tuyển dụng và Tóm tắt yêu cầu từ nội dung JD text
 */
export function extractJdInfo(jdText: string): { jdTitle: string; jdSummary: string } {
  if (!jdText || !jdText.trim()) {
    return {
      jdTitle: "Vị trí chuyên môn",
      jdSummary: "Đánh giá theo 4 tiêu chí cốt lõi: Kỹ năng, Kinh nghiệm, Học vấn, Ngôn ngữ.",
    };
  }

  const lines = jdText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let jdTitle = "";
  // Tìm các dòng chứa "Vị trí:", "Position:", "Tuyển dụng:", "Job Title:"
  for (const line of lines) {
    const match = line.match(/(?:vị trí|chức danh|job title|position|tuyển dụng|tuyển)\s*[:\-]\s*(.+)/i);
    if (match && match[1]) {
      jdTitle = match[1].trim().replace(/^[\*\#\-\s]+/, "").slice(0, 60);
      break;
    }
  }

  // Nếu không match được, lấy dòng đầu tiên nếu ngắn hơn 70 ký tự
  if (!jdTitle && lines.length > 0) {
    const firstLine = lines[0].replace(/^[\*\#\-\s]+/, "").trim();
    if (firstLine.length <= 70) {
      jdTitle = firstLine;
    } else {
      jdTitle = "Vị trí tuyển dụng";
    }
  }

  // Tóm tắt JD: lấy 1-2 câu đầu hoặc các yêu cầu chính
  let jdSummary = "";
  const reqLines = lines.filter((l) =>
    /(?:yêu cầu|kỹ năng|kinh nghiệm|mô tả|bắt buộc|require)/i.test(l)
  );

  if (reqLines.length > 0) {
    jdSummary = reqLines.slice(0, 2).join(" | ").slice(0, 180);
  } else {
    jdSummary = lines.slice(0, 3).join(" - ").slice(0, 180);
  }

  return {
    jdTitle: jdTitle || "Vị trí tuyển dụng",
    jdSummary: jdSummary || "Đánh giá chi tiết dựa trên JD và rubric chấm điểm 4 tiêu chí.",
  };
}

/** Generate a simple unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Load all stored analyses from localStorage */
export function getAnalyses(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save a single analysis result to localStorage with JD metadata */
export function saveAnalysis(
  result: CVAnalysisResult,
  cvFileName: string,
  jdText?: string
): StoredAnalysis {
  const jdInfo = jdText ? extractJdInfo(jdText) : { jdTitle: undefined, jdSummary: undefined };

  const entry: StoredAnalysis = {
    id: generateId(),
    cvFileName,
    analyzedAt: new Date().toISOString(),
    jdTitle: jdInfo.jdTitle,
    jdSummary: jdInfo.jdSummary,
    jdText: jdText?.slice(0, 5000), // Lưu tối đa 5000 ký tự JD để tiết kiệm dung lượng
    result,
  };
  const existing = getAnalyses();
  // Prepend newest first
  const updated = [entry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return entry;
}

/** Delete a single analysis by id */
export function deleteAnalysis(id: string): void {
  const existing = getAnalyses();
  const updated = existing.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/** Clear all stored analyses */
export function clearAllAnalyses(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Escape a CSV field value */
function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Export all stored analyses to a UTF-8 BOM CSV file and trigger download */
export function exportAnalysesToCSV(analyses: StoredAnalysis[]): void {
  if (!analyses || analyses.length === 0) {
    alert("Không có dữ liệu ứng viên để xuất CSV.");
    return;
  }

  const headers = [
    "STT",
    "Ngày phân tích",
    "Vị trí tuyển dụng (JD)",
    "Tóm tắt yêu cầu JD",
    "Tên ứng viên",
    "Email",
    "Số điện thoại",
    "File CV",
    "Điểm tổng",
    "Xếp loại",
    "Điểm Kỹ năng (35%)",
    "Điểm Kinh nghiệm (30%)",
    "Điểm Học vấn (20%)",
    "Điểm Ngôn ngữ (15%)",
    "Kỹ năng khớp JD",
    "Kỹ năng thiếu",
    "Điểm mạnh",
    "Điểm yếu",
    "Tóm tắt đánh giá",
  ];

  const classificationLabel = (cls: string) => {
    switch (cls) {
      case "pass":
        return "Đạt";
      case "potential":
        return "Tiềm năng";
      default:
        return "Không đạt";
    }
  };

  const rows = analyses.map((item, idx) => {
    const r = item.result;
    const jdInfo = item.jdTitle ? { jdTitle: item.jdTitle, jdSummary: item.jdSummary || "" } : extractJdInfo(item.jdText || "");

    return [
      idx + 1,
      new Date(item.analyzedAt).toLocaleString("vi-VN"),
      jdInfo.jdTitle || "Vị trí tuyển dụng",
      jdInfo.jdSummary || "",
      r.candidate_name || "",
      r.candidate_email || "",
      r.candidate_phone || "",
      item.cvFileName,
      r.overall_score,
      classificationLabel(r.classification),
      r.skills_analysis?.score ?? "",
      r.experience_analysis?.score ?? "",
      r.education_analysis?.score ?? "",
      r.language_analysis?.score ?? "",
      (r.skills_analysis?.matched ?? []).join("; "),
      (r.skills_analysis?.missing ?? []).join("; "),
      (r.strengths ?? []).join("; "),
      (r.weaknesses ?? []).join("; "),
      r.summary || "",
    ]
      .map(escapeCSV)
      .join(",");
  });

  // UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const csvContent = BOM + [headers.map(escapeCSV).join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `HiLab-HR_CV-Analysis_${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
