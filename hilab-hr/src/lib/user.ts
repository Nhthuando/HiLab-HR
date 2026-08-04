import { db } from "@/lib/prisma";

/**
 * Lấy hoặc tạo User trong Neon DB tương ứng với session (Google OAuth hoặc Guest User).
 * Đảm bảo 100% userId trả về tồn tại thực sự trong bảng User của Neon DB,
 * tránh lỗi Foreign Key Constraint khi tạo JobDescription và Analysis.
 */
export async function getOrCreateUserForSession(session: any): Promise<string> {
  const email = session?.user?.email;

  if (email) {
    const user = await db.user.upsert({
      where: { email },
      update: {
        name: session?.user?.name || "User",
        image: session?.user?.image || null,
      },
      create: {
        email,
        name: session?.user?.name || "User",
        image: session?.user?.image || null,
      },
    });
    return user.id;
  }

  // Guest User fallback cho người dùng chưa đăng nhập Google OAuth
  const guestUser = await db.user.upsert({
    where: { email: "guest@hilab.hr" },
    update: {},
    create: {
      email: "guest@hilab.hr",
      name: "Guest User (Nội bộ)",
    },
  });

  return guestUser.id;
}
