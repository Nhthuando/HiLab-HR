# HiLab-HR — AI-Powered CV Screening System

Hệ thống sàng lọc và đánh giá CV ứng viên tự động bằng AI (Google Gemini 3.1 Flash Lite), được thiết kế kép bao gồm **Claude/Antigravity Skill** chạy trong IDE và **Next.js Fullstack Web Application** cho bộ phận HR.

---

## 📁 Spec-Driven Documentation Structure

Dự án được quản lý tài liệu theo chuẩn **Spec-Driven Development**:

```text
.
├── AGENTS.md                      # Hướng dẫn & Quy tắc dành cho AI Agents
├── README.md                      # Tài liệu tổng quan dự án
├── docs/
│   ├── architecture.md            # Tổng quan kiến trúc hệ thống
│   └── features/
│       └── hr-cv-screening/       # Feature: Sàng lọc & Đánh giá CV
│           ├── spec.md            # Đặc tả yêu cầu (Requirements, User Stories, DB Schema, API Specs)
│           ├── plan.md            # Kế hoạch kỹ thuật & Quyết định kiến trúc (ADRs)
│           ├── tasks.md           # Danh sách công việc triển khai (Task Tracker)
│           └── test-plan.md       # Kế hoạch kiểm thử & QA
├── .agents/skills/hr-cv-screening # Skill Engine (IDE Agent)
└── hilab-hr/                      # Web App Next.js 15 Fullstack
```

### 🔗 Quick Links:
- 🏗️ [Architecture Overview](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/architecture.md)
- 📋 [Feature Spec (`spec.md`)](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/features/hr-cv-screening/spec.md)
- 📐 [Feature Plan (`plan.md`)](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/features/hr-cv-screening/plan.md)
- ✅ [Task Checklist (`tasks.md`)](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/features/hr-cv-screening/tasks.md)
- 🧪 [Test Plan (`test-plan.md`)](file:///d:/HuuThuan%20-%20Project/HiLab-HR/docs/features/hr-cv-screening/test-plan.md)

---

## 🚀 Quick Start

### 1. Antigravity/Claude Skill (IDE)
Skill được tự động nạp tại `.agents/skills/hr-cv-screening/`. Sử dụng prompt dạng:
> *"Phân tích CV sample_cv.pdf với JD sample_jd.md trong workspace"*

### 2. Next.js Web App
```bash
cd hilab-hr
npm install
npm run dev
```
Truy cập ứng dụng tại `http://localhost:3000`.
