import { GoogleGenAI, Type, Schema } from "@google/genai";
import Groq from "groq-sdk";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CVAnalysisResult {
  candidate_name: string;
  candidate_email?: string;
  candidate_phone?: string;
  overall_score: number;
  classification: "pass" | "potential" | "fail";
  skills_analysis: {
    score: number;
    matched: string[];
    missing: string[];
    details: string;
  };
  experience_analysis: {
    score: number;
    years_total: number;
    years_relevant: number;
    details: string;
  };
  education_analysis: {
    score: number;
    details: string;
  };
  language_analysis: {
    score: number;
    details: string;
  };
  strengths: string[];
  weaknesses: string[];
  interview_questions: string[];
  summary: string;
}

// ─── Gemini JSON Schema ────────────────────────────────────────────────────

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    candidate_name: { type: Type.STRING, description: "Tên ứng viên trích từ CV" },
    candidate_email: { type: Type.STRING, description: "Địa chỉ email ứng viên trích từ CV, để trống nếu không tìm thấy" },
    candidate_phone: { type: Type.STRING, description: "Số điện thoại ứng viên trích từ CV, để trống nếu không tìm thấy" },
    overall_score: { type: Type.INTEGER, description: "Điểm tổng phù hợp 0-100" },
    classification: {
      type: Type.STRING,
      enum: ["pass", "potential", "fail"],
      description: "Xếp loại: pass (>=70), potential (50-69), fail (<50)"
    },
    skills_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm kỹ năng 0-100" },
        matched: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách kỹ năng khớp với JD"
        },
        missing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách kỹ năng thiếu so với JD"
        },
        details: { type: Type.STRING, description: "Nhận xét chi tiết về kỹ năng" }
      },
      required: ["score", "matched", "missing", "details"]
    },
    experience_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm kinh nghiệm 0-100" },
        years_total: { type: Type.NUMBER, description: "Tổng số năm kinh nghiệm" },
        years_relevant: { type: Type.NUMBER, description: "Số năm kinh nghiệm liên quan" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết về kinh nghiệm" }
      },
      required: ["score", "years_total", "years_relevant", "details"]
    },
    education_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm học vấn 0-100" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết về học vấn" }
      },
      required: ["score", "details"]
    },
    language_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm ngôn ngữ 0-100" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết về ngôn ngữ" }
      },
      required: ["score", "details"]
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách điểm mạnh của ứng viên"
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách điểm yếu của ứng viên"
    },
    interview_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách câu hỏi phỏng vấn gợi ý"
    },
    summary: { type: Type.STRING, description: "Tóm tắt đánh giá tổng thể" }
  },
  required: [
    "candidate_name", "candidate_email", "candidate_phone", "overall_score", "classification",
    "skills_analysis", "experience_analysis", "education_analysis",
    "language_analysis", "strengths", "weaknesses",
    "interview_questions", "summary"
  ]
};

// ─── PDF text & contact extractor ──────────────────────────────────────────
// This version of pdf-parse exports a `PDFParse` class (not a function).
// We instantiate it with { data: Uint8Array } then call load() + getText().
// Using createRequire so the CJS module is loaded correctly from ESM context.

export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = req("pdf-parse") as any;

  // pdf-parse v2+ exports a named class: { PDFParse: class }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFParseClass: (new (opts: { data: Uint8Array }) => any) | undefined =
    mod?.PDFParse ?? mod?.default?.PDFParse;

  if (PDFParseClass) {
    const instance = new PDFParseClass({ data: new Uint8Array(pdfBuffer) });
    await instance.load();
    const textResult = await instance.getText();
    // getText() may return string directly or { text: string }
    if (typeof textResult === "string") return textResult;
    if (textResult?.text) return textResult.text;
  }

  // Fallback: legacy pdf-parse v1 exports the parse fn directly
  const parseFn: ((buf: Buffer) => Promise<{ text: string }>) | undefined =
    typeof mod === "function" ? mod :
    typeof mod.default === "function" ? mod.default :
    undefined;

  if (parseFn) {
    const result = await parseFn(pdfBuffer);
    return result.text;
  }

  throw new Error("pdf-parse: không thể load module hoặc API không tương thích.");
}

/**
 * Deterministically extract email and phone number from text using regex
 */
export function extractContactInfoFromText(text: string): { email: string; phone: string } {
  let email = "";
  let phone = "";

  if (!text) return { email, phone };

  // Email regex
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[1].trim();
  }

  // Vietnamese phone format with prefix 03, 05, 07, 08, 09, +84, 84
  // Handles spaces, dots, dashes e.g. "0385 591 447", "0365472162", "+84 385 591 447", "0385.591.447"
  const vnPhoneRegex = /(?:(?:\+84|84|0)\s*(?:3|5|7|8|9)\d)(?:[\s.-]?\d){7}\b/;
  const vnMatch = text.match(vnPhoneRegex);
  if (vnMatch) {
    phone = vnMatch[0].trim();
  } else {
    // General international or landline phone fallback
    const generalPhoneRegex = /(?:(?:\+84|0084|0)[\s.-]?[1-9](?:[\s.-]?\d){7,10})\b/;
    const generalMatch = text.match(generalPhoneRegex);
    if (generalMatch) {
      phone = generalMatch[0].trim();
    }
  }

  return { email, phone };
}

// ─── Shared prompt builder ─────────────────────────────────────────────────

// ─── Shared prompt builder (Gemini) ─────────────────────────────────────────

function buildPrompt(
  jdText: string,
  fileName: string,
  detectedContact?: { email?: string; phone?: string },
  cvText?: string
): string {
  const hints: string[] = [];
  if (detectedContact?.email) hints.push(`Email: ${detectedContact.email}`);
  if (detectedContact?.phone) hints.push(`SĐT: ${detectedContact.phone}`);
  const contactHint = hints.length > 0
    ? `\n(Gợi ý thông tin liên hệ nhận diện từ file: ${hints.join(", ")})`
    : "";

  const cvContentBlock =
    cvText && cvText.trim().length >= 60
      ? `\n## Nội dung CV trích xuất từ file (${fileName}):\n${cvText}\n`
      : `\n(Đọc kỹ toàn bộ nội dung từ file đính kèm: ${fileName})\n`;

  return `Bạn là chuyên gia tuyển dụng HR cao cấp. Hãy phân tích CV ứng viên dựa trên Job Description (JD) bên dưới.

## Job Description (JD):
${jdText}

## Tiêu chí chấm điểm:
- Kỹ năng (35%): Mức độ tương thích kỹ năng với JD.
- Kinh nghiệm (30%): Số năm kinh nghiệm và mức độ liên quan.
- Học vấn (20%): Trình độ học vấn và chuyên ngành.
- Ngôn ngữ (15%): Trình độ ngoại ngữ đáp ứng yêu cầu.
${cvContentBlock}
## Yêu cầu BẮT BUỘC:
1. Đọc kỹ file CV (${fileName}), bao gồm toàn bộ Header và phần thông tin liên hệ.
2. Trích xuất tên ứng viên (candidate_name).
3. BẮT BUỘC trích xuất chính xác địa chỉ email ứng viên (candidate_email) nếu có trong CV, nếu không tìm thấy để chuỗi rỗng "".${contactHint}
4. BẮT BUỘC trích xuất chính xác số điện thoại ứng viên (candidate_phone) nếu có trong CV (ví dụ: 0385 591 447, 0365472162, +84...), nếu không tìm thấy để chuỗi rỗng "".
5. Chấm điểm chi tiết từng mục (0-100) và tính điểm tổng overall_score.
6. Ghi rõ kỹ năng khớp (matched) và thiếu (missing).
7. Xếp loại classification: "pass" (>=70), "potential" (50-69), "fail" (<50).
8. Đưa ra danh sách điểm mạnh, điểm yếu.
9. Đề xuất 5 câu hỏi phỏng vấn thực tế bằng tiếng Việt.
10. Viết bài tóm tắt nhận xét chuyên sâu bằng tiếng Việt.

Trả về kết quả CHÍNH XÁC dưới dạng JSON theo schema đã định nghĩa.`;
}

// ─── Dedicated prompt builder for Groq (Embeds JSON structure directly) ────

function buildGroqPrompt(
  jdText: string,
  fileName: string,
  cvText: string,
  detectedContact?: { email?: string; phone?: string }
): { system: string; user: string } {
  const hints: string[] = [];
  if (detectedContact?.email) hints.push(`Email: ${detectedContact.email}`);
  if (detectedContact?.phone) hints.push(`SĐT: ${detectedContact.phone}`);
  const contactHint = hints.length > 0
    ? `\n(Gợi ý thông tin liên hệ nhận diện từ file: ${hints.join(", ")})`
    : "";

  const system = `Bạn là chuyên gia tuyển dụng HR cao cấp. Bạn có nhiệm vụ phân tích CV và so sánh với Job Description (JD).
BẠN BẮT BUỘC PHẢI TRẢ VỀ KẾT QUẢ DƯỚI DẠNG 1 ĐỐI TƯỢNG JSON DUY NHẤT theo đúng 100% cấu trúc dưới đây (không markdown fence, không giải thích ngoài JSON):

{
  "candidate_name": "Tên ứng viên trích từ CV",
  "candidate_email": "Địa chỉ email (hoặc chuỗi rỗng)",
  "candidate_phone": "Số điện thoại (hoặc chuỗi rỗng)",
  "overall_score": 85,
  "classification": "pass",
  "skills_analysis": {
    "score": 85,
    "matched": ["Kỹ năng phù hợp 1", "Kỹ năng phù hợp 2"],
    "missing": ["Kỹ năng còn thiếu"],
    "details": "Đánh giá chi tiết về các kỹ năng kỹ thuật, công nghệ và chuyên môn so với JD"
  },
  "experience_analysis": {
    "score": 80,
    "years_total": 3,
    "years_relevant": 2.5,
    "details": "Đánh giá chi tiết về số năm kinh nghiệm, các dự án đã làm và mức độ liên quan tới vị trí"
  },
  "education_analysis": {
    "score": 90,
    "details": "Đánh giá chi tiết về trình độ học vấn, trường đại học/cao đẳng, chuyên ngành và các chứng chỉ"
  },
  "language_analysis": {
    "score": 75,
    "details": "Đánh giá chi tiết về trình độ ngoại ngữ (Tiếng Anh, v.v.) và khả năng giao tiếp"
  },
  "strengths": [
    "Điểm mạnh nổi bật 1",
    "Điểm mạnh nổi bật 2"
  ],
  "weaknesses": [
    "Điểm cần cải thiện 1",
    "Điểm cần cải thiện 2"
  ],
  "interview_questions": [
    "1. Câu hỏi phỏng vấn chuyên môn 1?",
    "2. Câu hỏi phỏng vấn tình huống 2?",
    "3. Câu hỏi phỏng vấn kinh nghiệm 3?",
    "4. Câu hỏi phỏng vấn kỹ năng mềm 4?",
    "5. Câu hỏi phỏng vấn định hướng 5?"
  ],
  "summary": "Tóm tắt tổng quan đánh giá ứng viên và đề xuất cho HR..."
}`;

  const user = `Hãy phân tích CV sau đây dựa trên Job Description (JD):

## 1. Job Description (JD):
${jdText}

## 2. Tiêu chí chấm điểm:
- Kỹ năng (35%): Mức độ tương thích kỹ năng với JD.
- Kinh nghiệm (30%): Số năm kinh nghiệm và mức độ liên quan.
- Học vấn (20%): Trình độ học vấn và chuyên ngành.
- Ngôn ngữ (15%): Trình độ ngoại ngữ đáp ứng yêu cầu.
- Xếp loại classification: "pass" (>=70), "potential" (50-69), "fail" (<50).

## 3. Thông tin file CV: ${fileName}${contactHint}

## 4. Nội dung CV trích xuất:
${cvText}

## YÊU CẦU BẮT BUỘC:
- Bắt buộc phân tích ĐẦY ĐỦ cả 4 mục: skills_analysis, experience_analysis, education_analysis, language_analysis.
- Mỗi mục phải có điểm (score từ 0-100) và nhận xét (details).
- Trích xuất chính xác candidate_name, candidate_email, candidate_phone.
- Trả về đúng JSON thuần túy theo cấu trúc đã định nghĩa.`;

  return { system, user };
}

// ─── Helpers for JSON parsing & normalization ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScoreValue(val: any, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) {
    if (val > 0 && val <= 1) return Math.round(val * 100);
    return Math.round(Math.max(0, Math.min(100, val)));
  }
  if (typeof val === "string") {
    const match = val.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const num = parseFloat(match[1]);
      if (num > 0 && num <= 1 && (val.includes("%") || !val.includes("/"))) {
        return Math.round(num * 100);
      }
      return Math.round(Math.max(0, Math.min(100, num)));
    }
  }
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNumberValue(val: any, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const match = val.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]);
  }
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStringArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val
      .map((v) => (typeof v === "string" ? v.trim() : typeof v === "object" ? JSON.stringify(v) : String(v)))
      .filter(Boolean);
  }
  if (typeof val === "string" && val.trim().length > 0) {
    return val
      .split(/[\n,;•-]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDetailsString(obj: any, defaultText: string): string {
  if (!obj) return defaultText;
  if (typeof obj === "string") return obj.trim() || defaultText;
  if (typeof obj === "object") {
    const candidate =
      obj.details ||
      obj.detail ||
      obj.comment ||
      obj.comments ||
      obj.description ||
      obj.summary ||
      obj.evaluation ||
      obj.note ||
      obj.notes ||
      obj.nhan_xet ||
      obj.danh_gia ||
      obj.nhan_xet_chi_tiet;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return defaultText;
}

function parseJsonResult(raw: string): CVAnalysisResult {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch {
        throw new Error("Không thể parse JSON từ phản hồi AI: " + clean.slice(0, 150));
      }
    } else {
      throw new Error("Không thể parse JSON từ phản hồi AI: " + clean.slice(0, 150));
    }
  }

  // 1. Skills analysis (with robust alias fallbacks)
  const rawSkills =
    parsed.skills_analysis ||
    parsed.skills ||
    parsed.skill_analysis ||
    parsed.technical_skills ||
    parsed.ky_nang ||
    parsed.danh_gia_ky_nang ||
    {};

  const skillsScore = parseScoreValue(
    rawSkills.score ??
    rawSkills.point ??
    rawSkills.diem ??
    parsed.skills_score ??
    parsed.skill_score ??
    parsed.skills_point,
    70
  );

  const skillsMatched = parseStringArray(
    rawSkills.matched ?? rawSkills.matched_skills ?? rawSkills.phu_hop ?? rawSkills.da_co
  );

  const skillsMissing = parseStringArray(
    rawSkills.missing ?? rawSkills.missing_skills ?? rawSkills.thieu ?? rawSkills.chua_co
  );

  const skillsDetails = parseDetailsString(
    rawSkills,
    skillsMatched.length > 0
      ? `Kỹ năng phù hợp với yêu cầu: ${skillsMatched.join(", ")}.`
      : "Đánh giá kỹ năng chuyên môn phù hợp với vị trí tuyển dụng."
  );

  // 2. Experience analysis (with robust alias fallbacks)
  const rawExp =
    parsed.experience_analysis ||
    parsed.experience ||
    parsed.work_experience ||
    parsed.kinh_nghiem ||
    parsed.danh_gia_kinh_nghiem ||
    {};

  const expScore = parseScoreValue(
    rawExp.score ??
    rawExp.point ??
    rawExp.diem ??
    parsed.experience_score ??
    parsed.kinh_nghiem_score ??
    parsed.experience_point,
    70
  );

  const yearsTotal = parseNumberValue(
    rawExp.years_total ?? rawExp.total_years ?? rawExp.years ?? rawExp.so_nam_kinh_nghiem,
    rawExp.years_relevant ?? 2
  );

  const yearsRelevant = parseNumberValue(
    rawExp.years_relevant ?? rawExp.relevant_years ?? rawExp.so_nam_lien_quan,
    yearsTotal
  );

  const expDetails = parseDetailsString(
    rawExp,
    `Kinh nghiệm làm việc ${yearsTotal > 0 ? `${yearsTotal} năm ` : ""}đáp ứng tốt các yêu cầu trọng yếu.`
  );

  // 3. Education analysis (with robust alias fallbacks)
  const rawEdu =
    parsed.education_analysis ||
    parsed.education ||
    parsed.academic ||
    parsed.hoc_van ||
    parsed.danh_gia_hoc_van ||
    {};

  const eduScore = parseScoreValue(
    rawEdu.score ??
    rawEdu.point ??
    rawEdu.diem ??
    parsed.education_score ??
    parsed.hoc_van_score ??
    parsed.education_point,
    75
  );

  const eduDetails = parseDetailsString(
    rawEdu,
    "Trình độ học vấn và chuyên ngành đào tạo phù hợp với tiêu chuẩn tuyển dụng."
  );

  // 4. Language analysis (with robust alias fallbacks)
  const rawLang =
    parsed.language_analysis ||
    parsed.language ||
    parsed.languages ||
    parsed.foreign_languages ||
    parsed.ngon_ngu ||
    parsed.ngoai_ngu ||
    parsed.danh_gia_ngon_ngu ||
    {};

  const langScore = parseScoreValue(
    rawLang.score ??
    rawLang.point ??
    rawLang.diem ??
    parsed.language_score ??
    parsed.languages_score ??
    parsed.ngon_ngu_score ??
    parsed.language_point,
    70
  );

  const langDetails = parseDetailsString(
    rawLang,
    "Khả năng ngoại ngữ và giao tiếp đáp ứng yêu cầu công việc."
  );

  // 5. Overall score & Classification
  let score = parseScoreValue(
    parsed.overall_score ?? parsed.total_score ?? parsed.score ?? parsed.diem_tong,
    0
  );

  if (score === 0) {
    score = Math.round(
      skillsScore * 0.35 +
      expScore * 0.30 +
      eduScore * 0.20 +
      langScore * 0.15
    );
  }

  const rawClassification = String(
    parsed.classification || parsed.xep_loai || parsed.result || ""
  ).toLowerCase();

  let classification: "pass" | "potential" | "fail";
  if (
    rawClassification.includes("pass") ||
    rawClassification.includes("đạt") ||
    rawClassification.includes("dat")
  ) {
    classification = "pass";
  } else if (
    rawClassification.includes("potential") ||
    rawClassification.includes("tiềm") ||
    rawClassification.includes("tiem")
  ) {
    classification = "potential";
  } else if (
    rawClassification.includes("fail") ||
    rawClassification.includes("loại") ||
    rawClassification.includes("loai") ||
    rawClassification.includes("không đạt")
  ) {
    classification = "fail";
  } else {
    classification = score >= 70 ? "pass" : score >= 50 ? "potential" : "fail";
  }

  // 6. Candidate info & Lists
  const candidate_name =
    parsed.candidate_name ||
    parsed.name ||
    parsed.ho_ten ||
    parsed.ung_vien ||
    "Ứng viên";

  const candidate_email =
    parsed.candidate_email ||
    parsed.email ||
    "";

  const candidate_phone =
    parsed.candidate_phone ||
    parsed.phone ||
    parsed.so_dien_thoai ||
    parsed.sdt ||
    "";

  const strengths = parseStringArray(
    parsed.strengths ?? parsed.diem_manh ?? parsed.pros ?? parsed.advantages
  );
  if (strengths.length === 0) {
    strengths.push("Có nền tảng chuyên môn và kỹ năng phù hợp với vị trí.");
  }

  const weaknesses = parseStringArray(
    parsed.weaknesses ?? parsed.diem_yeu ?? parsed.cons ?? parsed.disadvantages
  );
  if (weaknesses.length === 0) {
    weaknesses.push("Cần kiểm tra thêm về độ sâu kinh nghiệm thực tế qua phỏng vấn.");
  }

  const interview_questions = parseStringArray(
    parsed.interview_questions ?? parsed.questions ?? parsed.cau_hoi_phong_van
  );
  if (interview_questions.length === 0) {
    interview_questions.push(
      "1. Em hãy chia sẻ về dự án tiêu biểu nhất mà em từng tham gia?",
      "2. Những thách thức kỹ thuật lớn nhất em từng gặp và cách giải quyết?",
      "3. Mục tiêu phát triển nghề nghiệp của em trong 1-2 năm tới là gì?"
    );
  }

  const summary =
    parsed.summary ||
    parsed.tom_tat ||
    parsed.conclusion ||
    parsed.overview ||
    "Đánh giá tổng quan: Ứng viên có tiềm năng đáp ứng yêu cầu công việc.";

  return {
    candidate_name,
    candidate_email,
    candidate_phone,
    overall_score: score,
    classification,
    skills_analysis: {
      score: skillsScore,
      matched: skillsMatched,
      missing: skillsMissing,
      details: skillsDetails,
    },
    experience_analysis: {
      score: expScore,
      years_total: yearsTotal,
      years_relevant: yearsRelevant,
      details: expDetails,
    },
    education_analysis: {
      score: eduScore,
      details: eduDetails,
    },
    language_analysis: {
      score: langScore,
      details: langDetails,
    },
    strengths,
    weaknesses,
    interview_questions,
    summary,
  };
}

// ─── Helper: should we fallback to Groq for this Gemini error? ────────────
// Whenever Gemini fails (503 High Demand / Spikes in demand / Service Unavailable,
// 429 Resource Exhausted / Quota, 500 Server Error, Network error, Timeout, etc.),
// we automatically fall back to Groq if GROQ_API_KEY is available.

function shouldFallbackToGroq(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
}

// ─── Provider 1: Gemini 2.5 Flash (Text-First with PDF inlineData fallback) ──

async function analyzeWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string,
  pdfText?: string,
  detectedContact?: { email?: string; phone?: string }
): Promise<CVAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa được thiết lập.");

  const ai = new GoogleGenAI({ apiKey });
  const hasGoodText = Boolean(pdfText && pdfText.trim().length >= 60);

  // Quota optimization: Use compact text prompt if text extracted cleanly (saves 60-80% tokens).
  // Fall back to PDF inlineData only for scanned/image PDFs (<60 characters).
  const contents = hasGoodText
    ? [{ text: buildPrompt(jdText, fileName, detectedContact, pdfText) }]
    : [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
        { text: buildPrompt(jdText, fileName, detectedContact) },
      ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.3,
    },
  });

  if (!response.text) throw new Error("Không nhận được phản hồi từ Gemini API.");
  return parseJsonResult(response.text);
}

// ─── Provider 2: Groq llama-3.3-70b (text-only, PDF parsed first) ─────────

async function analyzeWithGroq(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string,
  pdfText?: string,
  detectedContact?: { email?: string; phone?: string }
): Promise<CVAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY chưa được thiết lập.");

  // Extract text from PDF if not already provided
  const cvText = pdfText || (await extractPdfText(pdfBuffer));

  const groq = new Groq({ apiKey });
  const { system, user } = buildGroqPrompt(jdText, fileName, cvText, detectedContact);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: system,
      },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Không nhận được phản hồi từ Groq API.");
  return parseJsonResult(raw);
}

// ─── Public API: Gemini first, fallback to Groq ───────────────────────────

export async function analyzeCVWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string
): Promise<CVAnalysisResult> {
  // 1. Pre-extract contact info (email, phone) deterministically from PDF text
  let pdfText = "";
  let detectedContact: { email: string; phone: string } = { email: "", phone: "" };
  try {
    pdfText = await extractPdfText(pdfBuffer);
    detectedContact = extractContactInfoFromText(pdfText);
  } catch (err) {
    console.warn(`[PDF] Không thể trích xuất text sơ bộ từ "${fileName}":`, err);
  }

  let result: CVAnalysisResult;

  try {
    console.log(`[AI] Đang phân tích "${fileName}" với Gemini 2.5 Flash...`);
    result = await analyzeWithGemini(pdfBuffer, fileName, jdText, pdfText, detectedContact);
    console.log(`[AI] ✅ Gemini phân tích thành công cho "${fileName}"`);
  } catch (geminiErr: any) {
    const geminiErrMsg = geminiErr?.message || String(geminiErr);
    console.warn(`[AI] ⚠️  Gemini gặp lỗi khi phân tích "${fileName}": ${geminiErrMsg}`);

    if (shouldFallbackToGroq()) {
      console.log(
        `[AI] 🔄 Kích hoạt fallback sang Groq (llama-3.3-70b-versatile) cho "${fileName}"...`
      );
      try {
        result = await analyzeWithGroq(pdfBuffer, fileName, jdText, pdfText, detectedContact);
        console.log(`[AI] ✅ Groq phân tích thành công cho "${fileName}"`);
      } catch (groqErr: any) {
        const groqErrMsg = groqErr?.message || String(groqErr);
        console.error(`[AI] ❌ Groq cũng thất bại cho "${fileName}":`, groqErrMsg);
        throw new Error(
          `Cả Gemini lẫn Groq đều thất bại.\nGemini: ${geminiErrMsg}\nGroq: ${groqErrMsg}`
        );
      }
    } else {
      console.warn(`[AI] ⚠️  Không thể fallback vì chưa cấu hình GROQ_API_KEY trong .env.`);
      throw geminiErr;
    }
  }

  // 2. Post-processing guarantee: If AI omitted email or phone, fill with regex-detected info
  if ((!result.candidate_email || result.candidate_email.trim() === "") && detectedContact.email) {
    result.candidate_email = detectedContact.email;
  }
  if ((!result.candidate_phone || result.candidate_phone.trim() === "") && detectedContact.phone) {
    result.candidate_phone = detectedContact.phone;
  }

  return result;
}
