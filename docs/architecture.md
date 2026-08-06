# HiLab-HR System Architecture Overview

## 1. High-Level Architecture

```mermaid
graph TD
    User["Người dùng Tuyển dụng (HR / Recruiter)"]
    
    subgraph Frontend ["Next.js 15 App Router Frontend"]
        Nav["Navbar Navigation"]
        PageStudio["Skill Studio (/skills)"]
        PageSingle["Phân tích đơn (/analyze)"]
        PageBatch["Phân tích Batch (/analyze/batch)"]
        PageHistory["Lịch sử (/history)"]
    end

    subgraph API ["Next.js API Layer"]
        API_AICopilot["/api/skills/ai-edit\n(Gemini 3.1 Flash Lite)"]
        API_Analyze["/api/analyze & /api/analyze/batch\n(PDF Parse + Gemini Scoring)"]
    end

    subgraph CoreEngine ["Dynamic Skill & AI Engine"]
        SkillFiles["Skill Files: .agents/skills/hr-cv-screening/"]
        DynamicPrompt["Dynamic Prompt & Weights Builder"]
        LocalStorageState["Browser LocalStorage"]
        NeonDB[("Neon PostgreSQL via Prisma")]
    end

    User --> Nav
    Nav --> PageStudio & PageSingle & PageBatch & PageHistory

    PageStudio <-->|Chat & Refine Skill| API_AICopilot
    PageStudio <--> LocalStorageState
    
    PageSingle & PageBatch -->|Gửi CV + JD + SkillConfig| API_Analyze
    API_Analyze --> DynamicPrompt
    DynamicPrompt -.-> SkillFiles
```

## 2. Core Components
- **Framework**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Glassmorphism design system
- **AI Core**: Google Gemini 3.1 Flash Lite (`@google/genai`)
- **PDF Extraction**: `pdf-parse`
- **Excel/Data Export**: `exceljs`
