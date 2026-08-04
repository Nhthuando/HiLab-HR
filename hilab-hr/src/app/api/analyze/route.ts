import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { analyzeCVWithGemini } from "@/lib/gemini";
import { getOrCreateUserForSession } from "@/lib/user";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const formData = await req.formData();
    const cvFile = formData.get("cv") as File | null;
    const jdText = formData.get("jd") as string | null;

    if (!cvFile) {
      return NextResponse.json({ error: "Vui lòng chọn file CV (PDF)." }, { status: 400 });
    }

    if (!jdText || !jdText.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập thông tin Job Description (JD)." }, { status: 400 });
    }

    if (!cvFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Định dạng file không hỗ trợ. Vui lòng chỉ upload file PDF." }, { status: 400 });
    }

    const bytes = await cvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Analyze with Gemini
    const result = await analyzeCVWithGemini(buffer, cvFile.name, jdText);

    let savedAnalysis = null;

    // Save to Neon Database
    try {
      const userId = await getOrCreateUserForSession(session);
      const jdTitle = jdText.slice(0, 50).trim() + "...";
      const jdRecord = await db.jobDescription.create({
        data: {
          title: jdTitle,
          content: jdText,
          userId: userId,
        },
      });

      savedAnalysis = await db.analysis.create({
        data: {
          candidateName: result.candidate_name,
          cvFileName: cvFile.name,
          overallScore: result.overall_score,
          classification: result.classification,
          skillsAnalysis: result.skills_analysis as any,
          experienceAnalysis: result.experience_analysis as any,
          educationAnalysis: result.education_analysis as any,
          languageAnalysis: result.language_analysis as any,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          interviewQuestions: result.interview_questions,
          summary: result.summary,
          jobDescriptionId: jdRecord.id,
          userId: userId,
        },
      });
      console.log(`✅ [Neon DB] Đã lưu thành công single Analysis ID: ${savedAnalysis.id} cho user: ${userId}`);
    } catch (dbError) {
      console.error("❌ [Neon DB Error] Lỗi lưu single Analysis vào DB:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: result,
      analysisId: savedAnalysis?.id || null,
    });
  } catch (error: any) {
    console.error("API /api/analyze Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi phân tích CV." },
      { status: 500 }
    );
  }
}
