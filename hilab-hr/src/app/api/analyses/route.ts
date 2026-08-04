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
        jobDescription: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error("API /api/analyses Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi lấy lịch sử." }, { status: 500 });
  }
}
