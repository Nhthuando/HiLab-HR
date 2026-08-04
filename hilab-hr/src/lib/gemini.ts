import { GoogleGenAI, Type, Schema } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY;

export interface CVAnalysisResult {
  candidate_name: string;
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

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    candidate_name: { type: Type.STRING, description: "Tên ứng viên trích từ CV" },
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
    "candidate_name", "overall_score", "classification",
    "skills_analysis", "experience_analysis", "education_analysis",
    "language_analysis", "strengths", "weaknesses",
    "interview_questions", "summary"
  ]
};

export async function analyzeCVWithGemini(
  pdfBuffer: Buffer,
  fileName: string,
  jdText: string
): Promise<CVAnalysisResult> {
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được thiết lập trong môi trường.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Bạn là chuyên gia tuyển dụng HR cao cấp. Hãy phân tích CV ứng viên dựa trên Job Description (JD) bên dưới.

## Job Description (JD):
${jdText}

## Tiêu chí chấm điểm:
- Kỹ năng (35%): Mức độ tương thích kỹ năng với JD.
- Kinh nghiệm (30%): Số năm kinh nghiệm và mức độ liên quan.
- Học vấn (20%): Trình độ học vấn và chuyên ngành.
- Ngôn ngữ (15%): Trình độ ngoại ngữ đáp ứng yêu cầu.

## Yêu cầu:
1. Đọc kỹ file CV đính kèm (${fileName}).
2. Trích xuất tên ứng viên.
3. Chấm điểm chi tiết từng mục (0-100) và tính điểm tổng overall_score.
4. Ghi rõ kỹ năng khớp (matched) và thiếu (missing).
5. Xếp loại classification: "pass" (>=70), "potential" (50-69), "fail" (<50).
6. Đưa ra danh sách điểm mạnh, điểm yếu.
7. Đề xuất 5 câu hỏi phỏng vấn thực tế bằng tiếng Việt.
8. Viết bài tóm tắt nhận xét chuyên sâu bằng tiếng Việt.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBuffer.toString("base64"),
        },
      },
      { text: prompt },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error("Không nhận được phản hồi từ Gemini API.");
  }

  let cleanJson = response.text.trim();
  // Strip markdown fences like ```json ... ``` or ``` ... ```
  cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleanJson) as CVAnalysisResult;
  } catch (parseError) {
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as CVAnalysisResult;
      } catch (innerErr) {
        console.error("Lỗi parse JSON fallback từ Gemini:", innerErr, "Raw:", cleanJson.slice(0, 300));
      }
    }
    throw new Error(`Không thể parse cấu trúc JSON từ phản hồi AI: ${(parseError as Error).message}`);
  }
}

