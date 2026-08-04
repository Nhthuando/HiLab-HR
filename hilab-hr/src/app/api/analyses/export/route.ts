import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { getOrCreateUserForSession } from "@/lib/user";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = await getOrCreateUserForSession(session);

    const analyses = await db.analysis.findMany({
      where: {
        OR: [
          { userId: userId },
          { user: { email: "guest@hilab.hr" } },
        ],
      },
      include: {
        jobDescription: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "STT",
      "Ứng viên",
      "File CV",
      "Vị trí (JD)",
      "Điểm tổng",
      "Xếp loại",
      "Điểm kỹ năng",
      "Điểm kinh nghiệm",
      "Điểm học vấn",
      "Điểm ngôn ngữ",
      "Ngày phân tích",
    ];

    const rows = analyses.map((a, idx) => {
      const skills = (a.skillsAnalysis as any)?.score || 0;
      const exp = (a.experienceAnalysis as any)?.score || 0;
      const edu = (a.educationAnalysis as any)?.score || 0;
      const lang = (a.languageAnalysis as any)?.score || 0;

      const clsMap: Record<string, string> = {
        pass: "Đạt",
        potential: "Tiềm năng",
        fail: "Không đạt",
      };

      return [
        idx + 1,
        `"${(a.candidateName || "N/A").replace(/"/g, '""')}"`,
        `"${(a.cvFileName || "N/A").replace(/"/g, '""')}"`,
        `"${(a.jobDescription?.title || "N/A").replace(/"/g, '""')}"`,
        a.overallScore,
        `"${clsMap[a.classification] || a.classification}"`,
        skills,
        exp,
        edu,
        lang,
        `"${new Date(a.createdAt).toLocaleString("vi-VN")}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hilab_hr_analyses_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("API /api/analyses/export Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi xuất CSV." }, { status: 500 });
  }
}
