import { NextRequest, NextResponse } from "next/server";
import { analyzeCVWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const cvFile = formData.get("cv") as File | null;
    const jdText = formData.get("jd") as string | null;

    const skillConfigRaw = formData.get("skillConfig") as string | null;
    let skillConfig = undefined;
    if (skillConfigRaw) {
      try {
        skillConfig = JSON.parse(skillConfigRaw);
      } catch (err) {
        console.warn("Failed to parse custom skillConfig:", err);
      }
    }

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

    // Analyze with Gemini (stateless — no DB write)
    const result = await analyzeCVWithGemini(buffer, cvFile.name, jdText, skillConfig);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("API /api/analyze Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi phân tích CV." },
      { status: 500 }
    );
  }
}
