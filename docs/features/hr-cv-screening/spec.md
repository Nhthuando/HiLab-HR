# Feature Specification: HR CV Screening System (`hr-cv-screening`)

Tài liệu đặc tả yêu cầu chi tiết (Functional & Technical Specifications) cho tính năng **HR CV Screening System**.

---

## 1. Executive Summary & Problem Statement

### 1.1 Bài toán (Problem Statement)
Nhân sự HR non-tech cần một công cụ tự động hóa quy trình sàng lọc CV ứng viên theo Mô tả công việc (Job Description - JD), nhằm giải quyết các bất cập:
- Đánh giá CV thủ công tốn nhiều thời gian và thiếu nhất quán.
- Nhân sự không thành thạo công cụ dòng lệnh (CLI/IDE).
- Cần giao diện trực quan, rõ ràng, đưa ra được điểm số và gợi ý câu hỏi phỏng vấn tức thì.

Đồng thời, dự án cần chứng minh năng lực xây dựng **Antigravity/Claude Skill** chạy trong môi trường IDE hỗ trợ kỹ thuật viên và lập trình viên.

### 1.2 Giải pháp (Solution)
Xây dựng giải pháp kép:
1. **Skill Engine (`SKILL.md`)**: Dành cho Dev / Technical Reviewer chạy trực tiếp trong Antigravity/Claude IDE.
2. **Web Application (`hilab-hr`)**: Dành cho HR Non-tech truy cập giao diện web trực quan, **không cần đăng nhập**.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| **US-01** | HR Manager | Upload CV (PDF) và nhập JD | AI tự động đánh giá mức độ phù hợp của ứng viên với công việc. |
| **US-02** | HR Manager | Upload nhiều CV cùng lúc (Batch upload) | Hệ thống tự động phân tích, so sánh và xếp hạng (ranking) danh sách ứng viên. |
| **US-03** | HR Manager | Xem điểm số chi tiết từng hạng mục (kỹ năng, kinh nghiệm, học vấn, ngôn ngữ) | Hiểu rõ căn cứ đánh giá của AI. |
| **US-04** | HR Manager | Xem danh sách Điểm mạnh (Strengths) và Điểm yếu (Weaknesses) | Đánh giá nhanh mức độ đáp ứng của ứng viên. |
| **US-05** | HR Manager | Xem các câu hỏi phỏng vấn được gợi ý dựa trên CV | Chuẩn bị nội dung phỏng vấn chuyên sâu và hiệu quả hơn. |
| **US-06** | HR Manager | Xuất danh sách phân tích ra file CSV | Dễ dàng lưu trữ, làm báo cáo và chia sẻ với Trưởng bộ phận. CSV bao gồm tên, email, SĐT, điểm số. |
| **US-07** | HR Manager | Xem lại lịch sử các lượt phân tích trước đó | Tra cứu lại kết quả mà không cần chạy phân tích lại (lưu trong LocalStorage trình duyệt). |
| **US-08** | HR Manager | Quản lý và lưu trữ các mẫu JD thường dùng | Tái sử dụng nhanh chóng cho các đợt tuyển dụng sau. |

---

## 3. Functional Specifications

### 3.1 Skill Specification (`SKILL.md`)
- **Location**: `.agents/skills/hr-cv-screening/`
- **Triggering**: Antigravity/Claude IDE tự động nhận diện skill khi user yêu cầu đánh giá/sàng lọc CV.
- **Input**:
  - File CV PDF nằm trong workspace.
  - Text JD hoặc file markdown chứa nội dung tuyển dụng.
- **Processing**:
  - Kích hoạt Python script `scripts/analyze_cv.py`.
  - Nạp rubric chấm điểm tại `resources/scoring_rubric.md`.
  - Đọc file binary PDF gửi trực tiếp lên Gemini API (`gemini-3.1-flash-lite`).
- **Output**: Markdown response trực tiếp trong Chat UI bao gồm: điểm tổng (0-100), phân tích từng phần, điểm mạnh/yếu, phân loại (✅ Đạt / ⚠️ Tiềm năng / ❌ Không đạt), câu hỏi phỏng vấn gợi ý.

### 3.2 Web App Specifications (`hilab-hr`)

> **Không yêu cầu đăng nhập**: Ứng dụng hoàn toàn public, không cần authentication. Lịch sử được lưu trong LocalStorage của trình duyệt.

#### 3.2.1 Single CV Screening (`/analyze`)
- Form nhận thông tin: Upload 1 file PDF CV (tối đa 10MB) + Nhập JD text hoặc chọn từ JD Templates.
- Processing State: Hiển thị hiệu ứng loading/skeleton animation mượt mà.
- Auto-save: Tự động lưu kết quả vào LocalStorage sau khi phân tích thành công.
- Result Screen:
  - Radial score gauge (Điểm tổng quan 0-100).
  - Badge xếp loại (Pass / Potential / Fail).
  - Hiển thị Email và SĐT được AI trích xuất từ CV.
  - Progress bars chi tiết 4 mục: Kỹ năng (35%), Kinh nghiệm (30%), Học vấn (20%), Ngôn ngữ (15%).
  - Card danh sách điểm mạnh & điểm yếu.
  - Accordion / Card danh sách câu hỏi phỏng vấn gợi ý.

#### 3.2.2 Batch CV Screening (`/analyze/batch`)
- Drag & Drop zone hỗ trợ chọn nhiều file PDF cùng lúc.
- Tiến trình phân tích theo hàng chờ (sequential progress bar).
- Bảng xếp hạng (Leaderboard Table) sắp xếp thứ tự ưu tiên ứng viên theo điểm số từ cao xuống thấp.
- Auto-save: Tự động lưu tất cả kết quả vào LocalStorage.
- Nút xuất CSV ngay tại màn hình kết quả.

#### 3.2.3 History, Excel & CSV Export (`/history`)
- Lịch sử phân tích lưu trong **LocalStorage trình duyệt** (không cần database) kèm thông tin Job Description (`jdTitle`, `jdSummary`, `jdText`).
- Bảng danh sách với các cột: Thời gian, **Vị trí tuyển dụng (JD)**, Tên ứng viên, **Email**, **SĐT**, File CV, Điểm Tổng, Xếp Loại.
- Nút "Xuất Excel (.xlsx)": Báo cáo bảng tính chuyên nghiệp đa sheet (`Bảng Xếp Hạng Ứng Viên` và `Mô Tả Công Việc (JD)`), phối màu Indigo/Navy hiện đại, border mỏng thanh lịch, highlight màu xếp loại (Xanh lá / Vàng / Hồng), tự căn chỉnh độ rộng cột và text wrapping.
- Nút "Xuất CSV": Hỗ trợ tải file CSV chuẩn UTF-8 BOM kèm cột Vị trí tuyển dụng & Tóm tắt JD.

---

## 4. Technical Specifications

### 4.1 LocalStorage Data Schema

```typescript
interface StoredAnalysis {
  id: string;           // timestamp + random suffix
  cvFileName: string;
  analyzedAt: string;   // ISO 8601 datetime
  jdTitle?: string;     // Tên vị trí tuyển dụng trích xuất từ JD
  jdSummary?: string;   // Tóm tắt 1-2 câu yêu cầu JD
  jdText?: string;      // Nội dung text đầy đủ của JD (giới hạn lưu trữ 5000 ký tự)
  result: CVAnalysisResult;
}

interface CVAnalysisResult {
  candidate_name: string;
  candidate_email?: string;   // Trích xuất từ CV bằng Gemini / Groq / Regex
  candidate_phone?: string;   // Trích xuất từ CV bằng Gemini / Groq / Regex
  overall_score: number;
  classification: "pass" | "potential" | "fail";
  skills_analysis: { score: number; matched: string[]; missing: string[]; must_have_gaps: string[]; details: string };
  experience_analysis: { score: number; years_total: number; years_relevant: number; details: string };
  education_analysis: { score: number; details: string };
  language_analysis: { score: number; details: string };
  strengths: string[];
  weaknesses: string[];
  interview_questions: string[];
  summary: string;
}
```

### 4.2 REST API Endpoints (Stateless)

| Method | Endpoint | Description | Request Payload | Response |
|---|---|---|---|---|
| `POST` | `/api/analyze` | Phân tích 1 CV với JD | `FormData` (cv: File, jd: string) | `{ success: boolean, data: CVAnalysisResult }` |
| `POST` | `/api/analyze/batch` | Phân tích danh sách CV | `FormData` (cvs: File[], jd: string) | `{ success: boolean, data: Array<CVAnalysisResult & { cvFileName }> }` |

### 4.3 AI Engine & Quota Optimization Architecture
- **Text-First Strategy**: Trích xuất text từ file PDF trước qua `pdf-parse`. Nếu file chứa văn bản rõ ràng (>=60 ký tự), gửi text trực tiếp vào Gemini 3.1 Flash Lite prompt thay vì gửi file binary PDF Base64 (tiết kiệm **60-80% token quota**).
- **Vision/InlineData Fallback**: Chỉ gửi file base64 PDF inlineData khi PDF là bản scan/ảnh không trích xuất được text.
- **Failover Provider**: Tự động fallback sang Groq (`llama-3.3-70b-versatile`) khi Gemini API đạt ngưỡng rate limit (HTTP 429) hoặc quota exhausted.
- **Deterministic Scoring**: Backend luôn tính `overall_score = round(skills*0.35 + experience*0.30 + education*0.20 + language*0.15)` từ 4 điểm thành phần; không tin tổng điểm hoặc classification do model trả về.
- **Evidence-Based Matching**: Prompt yêu cầu tách must-have/preferred, trả `must_have_gaps`, và phạt mạnh yêu cầu bắt buộc thiếu nhưng không loại cứng ứng viên.
- **Prompt Budget**: JD gửi model tối đa 8.000 ký tự, CV text trích xuất tối đa 16.000 ký tự; output giới hạn số lượng danh sách để giảm quota.

---

## 5. UI/UX Design System Specifications

1. **Theme Default**: Dark Mode (Glassmorphism design, hiệu ứng làm mờ viền kính `backdrop-blur-md`).
2. **Bảng màu chủ đạo (Color Palette)**:
   - Primary Gradient: Indigo to Violet (`#6366f1` -> `#8b5cf6`).
   - Success / Pass: Emerald Green (`#10b981`).
   - Warning / Potential: Amber Gold (`#f59e0b`).
   - Danger / Fail: Rose Red (`#f43f5e`).
3. **Typography**: Google Font Inter.
4. **Biểu đồ & Chỉ số**: Gauge chart hình tròn cho Điểm tổng, thanh progress bar phân mảng cho 4 tiêu chí thành phần.
5. **Badges**: Sử dụng `whitespace-nowrap` + `inline-flex` để đảm bảo không bị cắt trên mọi viewport.
6. **Excel Report Styling**: Thiết kế bảng tính với header Indigo `1F2937` / `4F46E5`, border xám mảnh `E5E7EB`, font `Segoe UI` / `Calibri`, xen kẽ dòng trắng - xám nhạt `F9FAFB`.
