import { GoogleGenAI, Type, Schema } from "@google/genai";
import Groq from "groq-sdk";
import { calculateOverallScore, classifyScore, normalizeScore } from "./scoring";
import { SkillConfig, SkillWeights } from "./types/skill";
import { DEFAULT_HR_SKILL } from "./defaultSkill";

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
    must_have_gaps: string[];
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
          description: "Danh sách kỹ năng và công nghệ khớp với JD (kèm chi tiết nếu có)"
        },
        missing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách kỹ năng và công nghệ thiếu so với JD"
        },
        must_have_gaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Danh sách yêu cầu bắt buộc trong JD mà CV chưa có bằng chứng thực tế"
        },
        details: { type: Type.STRING, description: "Nhận xét chi tiết 2-4 câu: Nêu cụ thể công nghệ/kỹ năng ứng viên ĐÃ LÀM (kèm dự án/bằng chứng trích từ CV), thiếu chính xác những công nghệ nào trong JD và đánh giá mức độ ảnh hưởng." }
      },
      required: ["score", "matched", "missing", "must_have_gaps", "details"]
    },
    experience_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm kinh nghiệm 0-100" },
        years_total: { type: Type.NUMBER, description: "Tổng số năm kinh nghiệm làm việc" },
        years_relevant: { type: Type.NUMBER, description: "Số năm kinh nghiệm trực tiếp liên quan đến vị trí" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết 2-4 câu: Phân tích số năm, các công ty/vị trí từng làm, quy mô dự án thực tế (traffic, MAU, team size, kiến trúc) và so sánh cụ thể với yêu cầu của JD." }
      },
      required: ["score", "years_total", "years_relevant", "details"]
    },
    education_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm học vấn 0-100" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết 2-3 câu: Nêu rõ chuyên ngành, trường đại học, GPA/xếp loại và các chứng chỉ chuyên môn quốc tế (AWS, CBAP, PMP...) hoặc khoảng cách so với yêu cầu." }
      },
      required: ["score", "details"]
    },
    language_analysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Điểm ngôn ngữ 0-100" },
        details: { type: Type.STRING, description: "Nhận xét chi tiết 2-3 câu: Nêu rõ chứng chỉ ngoại ngữ (TOEIC/IELTS/JLPT...), khả năng giao tiếp kỹ thuật và làm việc với tài liệu chuyên ngành so với đòi hỏi của JD." }
      },
      required: ["score", "details"]
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách 3-5 điểm mạnh nổi bật cụ thể của ứng viên (có dẫn chứng công nghệ, thành tích hoặc dự án cụ thể)"
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách 3-5 điểm yếu hoặc rủi ro cụ thể của ứng viên (nêu rõ kỹ năng thiếu, số năm chưa đủ hoặc khoảng trống kinh nghiệm)"
    },
    interview_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách 4-5 câu hỏi phỏng vấn kỹ thuật và tình huống thực tế (Case Study) xoáy sâu vào các lỗ hổng và kinh nghiệm thực chiến của ứng viên"
    },
    summary: { type: Type.STRING, description: "Tóm tắt đánh giá toàn diện 3-5 câu: (1) Đánh giá tổng quan độ tương thích, (2) Điểm sáng nổi bật nhất kèm bằng chứng, (3) Rủi ro/khoảng trống lớn nhất cần kiểm chứng, (4) Khuyến nghị quyết định tuyển dụng rõ ràng." }
  },
  required: [
    "candidate_name", "candidate_email", "candidate_phone", "overall_score", "classification",
    "skills_analysis", "experience_analysis", "education_analysis",
    "language_analysis", "strengths", "weaknesses",
    "interview_questions", "summary"
  ]
};

// ─── PDF text & contact extractor ──────────────────────────────────────────

export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = req("pdf-parse") as any;

    // pdf-parse v2+ class interface
    const PDFParseClass = mod?.PDFParse ?? mod?.default?.PDFParse;
    if (typeof PDFParseClass === "function") {
      const parser = new PDFParseClass({ data: new Uint8Array(pdfBuffer) });
      await parser.load();
      const res = await parser.getText();
      if (typeof res === "string") return res;
      if (res && typeof res.text === "string") return res.text;
      if (res && typeof res.getText === "function") {
        const nested = await res.getText();
        if (typeof nested === "string") return nested;
      }
      if (res && typeof res === "object") {
        if (Array.isArray(res.pages)) {
          return res.pages
            .map((p: any) => (typeof p === "string" ? p : p?.text || ""))
            .filter(Boolean)
            .join("\n");
        }
        return Object.values(res)
          .filter((v): v is string => typeof v === "string")
          .join("\n");
      }
    }

    // Fallback: legacy functional interface
    const parseFn =
      typeof mod === "function"
        ? mod
        : typeof mod?.default === "function"
        ? mod.default
        : undefined;

    if (parseFn) {
      const data = await parseFn(pdfBuffer);
      if (typeof data === "string") return data;
      if (data && typeof data.text === "string") return data.text;
    }
  } catch (err) {
    console.warn("[PDF] extractPdfText warning:", err);
  }

  return "";
}

export function extractContactInfoFromText(rawText: unknown): { email: string; phone: string } {
  let email = "";
  let phone = "";
  if (!rawText) return { email, phone };

  const str =
    typeof rawText === "string"
      ? rawText
      : typeof (rawText as any)?.text === "string"
      ? (rawText as any).text
      : String(rawText || "");

  if (!str || typeof str.replace !== "function") return { email, phone };

  const clean = str
    .replace(/[^\x20-\x7E\s\u00C0-\u024F\u1EA0-\u1EF9]/g, " ")
    .replace(/\s+/g, " ");

  const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const PHONE_REGEX = /(?:\+84|0084|0)[1-9][0-9]{7,9}\b/;

  const emailMatch = clean.match(EMAIL_REGEX);
  if (emailMatch) {
    const candidate = emailMatch[0].trim();
    if (!candidate.endsWith(".png") && !candidate.endsWith(".jpg") && !candidate.includes("example.com")) {
      email = candidate;
    }
  }

  const phoneMatch = clean.match(PHONE_REGEX);
  if (phoneMatch) {
    const digitsOnly = phoneMatch[0].replace(/\D/g, "");
    if (digitsOnly.length >= 9 && digitsOnly.length <= 12) {
      phone = phoneMatch[0].trim();
    }
  }

  return { email, phone };
}

// ─── Shared prompt builder ─────────────────────────────────────────────────

const MAX_JD_CHARS = 8_000;
const MAX_CV_TEXT_CHARS = 16_000;
const MAX_LIST_ITEMS = 12;

function compactText(text: unknown, maxChars: number): string {
  const safeText = typeof text === "string" ? text : typeof (text as any)?.text === "string" ? (text as any).text : "";
  const normalized = safeText.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;

  const marker = " ... [đã rút gọn để tiết kiệm quota] ... ";
  const contentLength = Math.max(0, maxChars - marker.length);
  const headLength = Math.floor(contentLength * 0.7);
  const tailLength = contentLength - headLength;
  return `${normalized.slice(0, headLength)}${marker}${normalized.slice(-tailLength)}`;
}

function buildScoringRules(weights?: SkillWeights): string {
  const w = weights || DEFAULT_HR_SKILL.weights;
  return `
Quy tắc đánh giá & nhận xét chuyên sâu (BẮT BUỘC TUÂN THỦ):
1. BẮT BUỘC tuân thủ các thang điểm 0-100 và quy tắc phân loại trong [Bộ tiêu chí đánh giá chi tiết (Scoring Rubric)].
2. ĐÁNH GIÁ CỤ THỂ, CÓ DẪN CHỨNG (TUYỆT ĐỐI KHÔNG VIẾT CHUNG CHUNG HOẶC 1 CÂU SƠ SÀI):
   - 'skills_analysis.details': Phải viết 2-4 câu đầy đủ. Nêu rõ ứng viên đã làm việc với những công nghệ/kỹ năng nào (trích dẫn dự án/kinh nghiệm thực tế trong CV), thiếu chính xác những công nghệ/kỹ năng nào theo JD (ví dụ: Next.js, TypeScript, SQL, Docker...) và đánh giá mức độ rủi ro đối với dự án.
   - 'experience_analysis.details': Phải viết 2-4 câu đầy đủ. Nêu rõ tổng số năm kinh nghiệm, các công ty/vị trí từng làm, quy mô dự án thực tế (traffic, MAU, team size, kiến trúc) và so sánh cụ thể số năm kinh nghiệm liên quan với yêu cầu tối thiểu của JD.
   - 'education_analysis.details': Phải viết 2-3 câu đầy đủ. Nêu rõ chuyên ngành tốt nghiệp, trường đại học, kết quả học tập (GPA/xếp loại), các chứng chỉ nghề nghiệp quốc tế (AWS, CBAP, PMP, Scrum...) hoặc đối chiếu khoảng cách so với yêu cầu.
   - 'language_analysis.details': Phải viết 2-3 câu đầy đủ. Nêu rõ trình độ ngoại ngữ (điểm số chứng chỉ TOEIC/IELTS/JLPT hoặc mức độ sử dụng thực tế), khả năng giao tiếp và đọc hiểu tài liệu chuyên ngành so với đòi hỏi của JD.
   - 'summary': Viết bản tóm tắt phân tích chuyên sâu 3-5 câu gồm: (1) Đánh giá tổng quan độ tương thích, (2) Điểm sáng nổi bật nhất kèm bằng chứng, (3) Rủi ro/khoảng trống lớn nhất cần kiểm chứng, (4) Khuyến nghị quyết định tuyển dụng rõ ràng (Mời phỏng vấn / Phỏng vấn kiểm tra kỹ năng thiếu / Không phù hợp).
3. PHÂN TÁCH RẠCH RÒI YÊU CẦU JD:
   - Must-Have (bắt buộc): Thiếu bất kỳ tiêu chí nào sẽ làm giảm mạnh điểm và BẮT BUỘC liệt kê trong must_have_gaps.
   - Preferred (điểm cộng): Giúp nâng điểm lên mức Xuất sắc (90-100).
4. Trọng số chấm điểm 4 mục: Kỹ năng (${w.skills}%), Kinh nghiệm (${w.experience}%), Học vấn (${w.education}%), Ngôn ngữ (${w.language}%).
5. 'strengths' & 'weaknesses': Mỗi mục có 3-5 gạch đầu dòng cụ thể, trích dẫn rõ công nghệ/kỹ năng/thành tích thực tế, không dùng câu sáo rỗng.
6. 'interview_questions': Đưa ra 4-5 câu hỏi phỏng vấn chuyên sâu hoặc câu hỏi tình huống (Case Study) xoáy sâu vào các lỗ hổng kỹ thuật và kinh nghiệm thực chiến của ứng viên.
`;
}

function buildPrompt(
  jdText: string,
  fileName: string,
  detectedContact?: { email?: string; phone?: string },
  cvText?: string,
  skillConfig?: SkillConfig
): string {
  const skill = skillConfig || DEFAULT_HR_SKILL;
  const hints: string[] = [];
  if (detectedContact?.email) hints.push(`Email: ${detectedContact.email}`);
  if (detectedContact?.phone) hints.push(`SĐT: ${detectedContact.phone}`);
  const contactHint = hints.length > 0
    ? `\n(Gợi ý thông tin liên hệ nhận diện từ file: ${hints.join(", ")})`
    : "";

  const boundedJd = compactText(jdText, MAX_JD_CHARS);
  const boundedCvText = cvText ? compactText(cvText, MAX_CV_TEXT_CHARS) : "";
  const cvContentBlock =
    boundedCvText && boundedCvText.length >= 60
      ? `\n## Nội dung CV trích xuất từ file (${fileName}):\n${boundedCvText}\n`
      : `\n(Đọc kỹ toàn bộ nội dung từ file đính kèm: ${fileName})\n`;

  const scoringRules = buildScoringRules(skill.weights);
  const rubricSection = skill.scoringRubric
    ? `\n## Bộ tiêu chuẩn đánh giá chi tiết (Scoring Rubric - Bắt buộc áp dụng):\n${compactText(skill.scoringRubric, 4000)}\n`
    : "";

  return `${skill.roleInstructions || "Bạn là Chuyên gia Tuyển dụng AI (Senior Technical Recruiter & HR Screening Architect). Hãy phân tích, đối soát CV dựa trên JD và Scoring Rubric với độ chi tiết cao, minh bạch và có dẫn chứng cụ thể."}

## Job Description (JD):
${boundedJd}
${rubricSection}
${scoringRules}
${cvContentBlock}
## Yêu cầu trích xuất & đầu ra:
- Đọc header để lấy candidate_name, candidate_email và candidate_phone; nếu không có thì trả chuỗi rỗng.${contactHint}
- Nhận xét từng mục phải CHI TIẾT, CỤ THỂ, CÓ DẪN CHỨNG (không viết 1 câu chung chung).
- Trả JSON đúng schema, không markdown và không giải thích ngoài JSON.`;
}

// ─── Dedicated prompt builder for Groq (Embeds JSON structure directly) ────

function buildGroqPrompt(
  jdText: string,
  fileName: string,
  cvText: string,
  detectedContact?: { email?: string; phone?: string },
  skillConfig?: SkillConfig
): { system: string; user: string } {
  const skill = skillConfig || DEFAULT_HR_SKILL;
  const hints: string[] = [];
  if (detectedContact?.email) hints.push(`Email: ${detectedContact.email}`);
  if (detectedContact?.phone) hints.push(`SĐT: ${detectedContact.phone}`);
  const contactHint = hints.length > 0
    ? `\n(Gợi ý thông tin liên hệ nhận diện từ file: ${hints.join(", ")})`
    : "";

  const boundedJd = compactText(jdText, MAX_JD_CHARS);
  const boundedCvText = compactText(cvText, MAX_CV_TEXT_CHARS);
  const scoringRules = buildScoringRules(skill.weights);
  const rubricSection = skill.scoringRubric
    ? `\n## Tiêu chuẩn Scoring Rubric:\n${compactText(skill.scoringRubric, 2500)}\n`
    : "";

  const system = `${skill.roleInstructions || "Bạn là Chuyên gia Tuyển dụng AI (Senior Technical Recruiter & HR Screening Architect)."} BẮT BUỘC áp dụng thang điểm Scoring Rubric và nhận xét CHI TIẾT, CỤ THỂ, CÓ DẪN CHỨNG BẰNG CHỨNG THỰC TẾ (không viết 1 câu chung chung). Trả về đúng một object JSON, không markdown và không giải thích ngoài JSON.
Các field bắt buộc: candidate_name, candidate_email, candidate_phone, overall_score, classification, skills_analysis, experience_analysis, education_analysis, language_analysis, strengths, weaknesses, interview_questions, summary.
skills_analysis phải có score, matched, missing, must_have_gaps và details (nhận xét chi tiết 2-4 câu). experience_analysis phải có score, years_total, years_relevant và details (nhận xét chi tiết 2-4 câu). education_analysis và language_analysis phải có score và details.
${scoringRules}
${rubricSection}`;

  const user = `## JD\n${boundedJd}\n\n## CV (${fileName})${contactHint}\n${boundedCvText}\n\nTrích xuất chính xác thông tin liên hệ nếu có. Chấm điểm 4 mục theo đúng Scoring Rubric. Trả lời bằng tiếng Việt.`;

  return { system, user };
}

// ─── Helpers for JSON parsing & normalization ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseScoreValue(val: any, fallback = 0): number {
  return normalizeScore(val, fallback);
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

function capList(values: string[], max = MAX_LIST_ITEMS): string[] {
  return values.slice(0, max);
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

function parseJsonResult(raw: string, customWeights?: SkillWeights): CVAnalysisResult {
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
    0
  );

  const skillsMatched = capList(parseStringArray(
    rawSkills.matched ?? rawSkills.matched_skills ?? rawSkills.phu_hop ?? rawSkills.da_co
  ));

  const skillsMissing = capList(parseStringArray(
    rawSkills.missing ?? rawSkills.missing_skills ?? rawSkills.thieu ?? rawSkills.chua_co
  ));

  const mustHaveGaps = capList(parseStringArray(
    rawSkills.must_have_gaps ?? rawSkills.missing_must_have ?? rawSkills.required_gaps
  ));

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
    0
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
    0
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
    0
  );

  const langDetails = parseDetailsString(
    rawLang,
    "Khả năng ngoại ngữ và giao tiếp đáp ứng yêu cầu công việc."
  );

  // 5. Overall score & Classification
  const score = calculateOverallScore({
    skills: skillsScore,
    experience: expScore,
    education: eduScore,
    language: langScore,
  }, customWeights);
  const classification = classifyScore(score);

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

  const strengths = capList(parseStringArray(
    parsed.strengths ?? parsed.diem_manh ?? parsed.pros ?? parsed.advantages
  ), 5);
  if (strengths.length === 0) {
    strengths.push("Có nền tảng chuyên môn và kỹ năng phù hợp với vị trí.");
  }

  const weaknesses = capList(parseStringArray(
    parsed.weaknesses ?? parsed.diem_yeu ?? parsed.cons ?? parsed.disadvantages
  ), 5);
  if (weaknesses.length === 0) {
    weaknesses.push("Cần kiểm tra thêm về độ sâu kinh nghiệm thực tế qua phỏng vấn.");
  }

  const interview_questions = capList(parseStringArray(
    parsed.interview_questions ?? parsed.questions ?? parsed.cau_hoi_phong_van
  ), 5);
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
      must_have_gaps: mustHaveGaps,
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

// ─── Provider 1: Gemini 3.1 Flash Lite (Text-First with PDF inlineData fallback) ──

async function analyzeWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string,
  pdfText?: string,
  detectedContact?: { email?: string; phone?: string },
  skillConfig?: SkillConfig
): Promise<CVAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa được thiết lập.");

  const ai = new GoogleGenAI({ apiKey });
  const safePdfText = typeof pdfText === "string" ? pdfText : "";
  const hasGoodText = Boolean(safePdfText && safePdfText.trim().length >= 60);

  // Quota optimization: Use compact text prompt if text extracted cleanly (saves 60-80% tokens).
  // Fall back to PDF inlineData only for scanned/image PDFs (<60 characters).
  const contents = hasGoodText
    ? [{ text: buildPrompt(jdText, fileName, detectedContact, safePdfText, skillConfig) }]
    : [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
        { text: buildPrompt(jdText, fileName, detectedContact, undefined, skillConfig) },
      ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.3,
    },
  });

  if (!response.text) throw new Error("Không nhận được phản hồi từ Gemini API.");
  return parseJsonResult(response.text, skillConfig?.weights);
}

// ─── Provider 2: Groq llama-3.3-70b (text-only, PDF parsed first) ─────────

async function analyzeWithGroq(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string,
  pdfText?: string,
  detectedContact?: { email?: string; phone?: string },
  skillConfig?: SkillConfig
): Promise<CVAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY chưa được thiết lập.");

  // Extract text from PDF if not already provided
  const rawCvText = pdfText || (await extractPdfText(pdfBuffer));
  const cvText = typeof rawCvText === "string" ? rawCvText : "";

  const groq = new Groq({ apiKey });
  const { system, user } = buildGroqPrompt(jdText, fileName, cvText, detectedContact, skillConfig);

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
  return parseJsonResult(raw, skillConfig?.weights);
}

// ─── Public API: Gemini first, fallback to Groq ───────────────────────────

export async function analyzeCVWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string,
  skillConfig?: SkillConfig
): Promise<CVAnalysisResult> {
  // 1. Pre-extract contact info (email, phone) deterministically from PDF text
  let pdfText = "";
  let detectedContact: { email: string; phone: string } = { email: "", phone: "" };
  try {
    const rawPdfText = await extractPdfText(pdfBuffer);
    pdfText = typeof rawPdfText === "string" ? rawPdfText : "";
    detectedContact = extractContactInfoFromText(pdfText);
  } catch (err) {
    console.warn(`[PDF] Không thể trích xuất text sơ bộ từ "${fileName}":`, err);
    pdfText = "";
  }

  let result: CVAnalysisResult;

  try {
    console.log(`[AI] Đang phân tích "${fileName}" với Gemini 3.1 Flash Lite (Skill: ${skillConfig?.name || "Default"})...`);
    result = await analyzeWithGemini(pdfBuffer, fileName, jdText, pdfText, detectedContact, skillConfig);
    console.log(`[AI] ✅ Gemini phân tích thành công cho "${fileName}"`);
  } catch (geminiErr: unknown) {
    const geminiErrMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
    console.warn(`[AI] ⚠️  Gemini gặp lỗi khi phân tích "${fileName}": ${geminiErrMsg}`);

    if (shouldFallbackToGroq()) {
      console.log(
        `[AI] 🔄 Kích hoạt fallback sang Groq (llama-3.3-70b-versatile) cho "${fileName}"...`
      );
      try {
        result = await analyzeWithGroq(pdfBuffer, fileName, jdText, pdfText, detectedContact, skillConfig);
        console.log(`[AI] ✅ Groq phân tích thành công cho "${fileName}"`);
      } catch (groqErr: unknown) {
        const groqErrMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
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
