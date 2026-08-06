import { NextRequest, NextResponse } from "next/server";
import { analyzeCVWithGemini, CVAnalysisResult } from "@/lib/gemini";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Support both 'cvs' and 'cvs[]' keys in FormData
    const rawFiles = [
      ...formData.getAll("cvs"),
      ...formData.getAll("cvs[]"),
    ];

    const cvFiles: File[] = [];
    const seenNames = new Set<string>();

    for (const item of rawFiles) {
      if (typeof item !== "string" && item && item.name) {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          cvFiles.push(item as File);
        }
      }
    }

    const jdText = formData.get("jd") as string | null;

    const skillConfigRaw = formData.get("skillConfig") as string | null;
    let skillConfig = undefined;
    if (skillConfigRaw) {
      try {
        skillConfig = JSON.parse(skillConfigRaw);
      } catch (err) {
        console.warn("Failed to parse custom skillConfig in batch:", err);
      }
    }

    if (!cvFiles || cvFiles.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất 1 file CV (PDF)." }, { status: 400 });
    }

    if (!jdText || !jdText.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập thông tin Job Description (JD)." }, { status: 400 });
    }

    const validFiles = cvFiles.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (validFiles.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy file PDF hợp lệ nào trong các file đã upload." }, { status: 400 });
    }

    const results: Array<CVAnalysisResult & { cvFileName: string; errorMsg?: string }> = [];

    for (let i = 0; i < validFiles.length; i++) {
      const cvFile = validFiles[i];

      // Delay between API calls to avoid Gemini rate limits
      // Free-tier Gemini allows ~20 req/day and has per-minute limits.
      // 2s spacing helps avoid hitting the per-minute limit in batch mode.
      if (i > 0) {
        await delay(2000);
      }

      let result: CVAnalysisResult | null = null;
      let errorMsg: string | undefined;

      // Retry up to 2 times for robustness
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const bytes = await cvFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          result = await analyzeCVWithGemini(buffer, cvFile.name, jdText, skillConfig);
          errorMsg = undefined;
          break; // Success
        } catch (err: any) {
          errorMsg = err.message || "Lỗi khi gọi Gemini API";
          console.warn(`Lỗi phân tích file ${cvFile.name} (lần ${attempt}/2):`, errorMsg);
          if (attempt < 2) {
            // Wait longer on retry to let the rate limit window reset
            await delay(3000);
          }
        }
      }

      // If both attempts failed, construct fallback result item
      if (!result) {
        result = {
          candidate_name: cvFile.name.replace(/\.pdf$/i, ""),
          candidate_email: "",
          candidate_phone: "",
          overall_score: 0,
          classification: "fail",
          skills_analysis: { score: 0, matched: [], missing: [], must_have_gaps: [], details: "Lỗi phân tích" },
          experience_analysis: { score: 0, years_total: 0, years_relevant: 0, details: "Lỗi phân tích" },
          education_analysis: { score: 0, details: "Lỗi phân tích" },
          language_analysis: { score: 0, details: "Lỗi phân tích" },
          strengths: [],
          weaknesses: [errorMsg || "Không phân tích được file này"],
          interview_questions: [],
          summary: `Không thể hoàn thành phân tích cho file ${cvFile.name}. Lý do: ${errorMsg}`,
        };
      }

      results.push({ ...result, cvFileName: cvFile.name, errorMsg });
    }

    // Sort results by overall_score descending (highest score first)
    results.sort((a, b) => b.overall_score - a.overall_score);

    return NextResponse.json({
      success: true,
      total: validFiles.length,
      processed: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("API /api/analyze/batch Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi phân tích hàng loạt CV." },
      { status: 500 }
    );
  }
}
