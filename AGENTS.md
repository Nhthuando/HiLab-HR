# AGENTS.md — Workspace Guidelines for AI Agents

Tài liệu hướng dẫn và quy tắc dành cho các AI Agent (Antigravity, Claude...) làm việc trong dự án **HiLab-HR**.

---

## 🛠️ System Overview & Core Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/UI, Lucide Icons (Dark mode glassmorphism)
- **Database**: Neon Serverless PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) với Google OAuth 2.0
- **AI Integration**: Google Gemini 3.1 Flash Lite (`@google/genai`)

---

## 📐 Spec-Driven Workflow Rules

Tất cả cập nhật về tính năng, công việc và kiến trúc phải được phản ánh vào bộ tài liệu Spec-Driven tại thư mục [`docs/features/hr-cv-screening/`](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/features/hr-cv-screening):

1. **`spec.md`**: Khi có thay đổi về Yêu cầu tính năng, Schema Database, API Endpoints hoặc UI Spec.
2. **`plan.md`**: Khi thay đổi về Quyết định Kiến trúc (ADRs), Tech Stack hoặc Luồng dữ liệu.
3. **`tasks.md`**: Khi thêm, cập nhật hoặc hoàn thành các task triển khai (`[x]`).
4. **`test-plan.md`**: Khi bổ sung các kịch bản kiểm thử (Test Cases) hoặc quy trình nghiệm thu.
5. **`docs/architecture.md`**: Khi cập nhật sơ đồ kiến trúc tổng quan hệ thống.

---

## 🔒 Security & Best Practices

- Không hardcode API Key hoặc Credentials vào mã nguồn. Luôn truy cập qua `process.env.GEMINI_API_KEY`.
- Giữ nguyên các hợp đồng API (Request/Response format) đã định nghĩa trong `spec.md`.
- Chạy `npm run build` trước khi hoàn tất công việc để đảm bảo không đứt gãy kiểu TypeScript hoặc build production error.
