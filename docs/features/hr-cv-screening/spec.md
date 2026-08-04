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
2. **Web Application (`hilab-hr`)**: Dành cho HR Non-tech truy cập giao diện web trực quan.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| **US-01** | HR Manager | Upload CV (PDF) và nhập JD | AI tự động đánh giá mức độ phù hợp của ứng viên với công việc. |
| **US-02** | HR Manager | Upload nhiều CV cùng lúc (Batch upload) | Hệ thống tự động phân tích, so sánh và xếp hạng (ranking) danh sách ứng viên. |
| **US-03** | HR Manager | Xem điểm số chi tiết từng hạng mục (kỹ năng, kinh nghiệm, học vấn, ngôn ngữ) | Hiểu rõ căn cứ đánh giá của AI. |
| **US-04** | HR Manager | Xem danh sách Điểm mạnh (Strengths) và Điểm yếu (Weaknesses) | Đánh giá nhanh mức độ đáp ứng của ứng viên. |
| **US-05** | HR Manager | Xem các câu hỏi phỏng vấn được gợi ý dựa trên CV | Chuẩn bị nội dung phỏng vấn chuyên sâu và hiệu quả hơn. |
| **US-06** | HR Manager | Xuất danh sách phân tích ra file CSV | Dễ dàng lưu trữ, làm báo cáo và chia sẻ với Trưởng bộ phận. |
| **US-07** | HR Manager | Xem lại lịch sử các lượt phân tích trước đó | Tra cứu lại kết quả mà không cần chạy phân tích lại. |
| **US-08** | HR Manager | Quản lý và lưu trữ các mẫu JD thường dùng | Tái sử dụng nhanh chóng cho các đợt tuyển dụng sau. |
| **US-09** | User | Đăng nhập an toàn bằng tài khoản Google | Sử dụng hệ thống thuận tiện mà không cần quản lý mật khẩu riêng. |
| **US-10** | HR Manager | Xem Dashboard tổng quan chỉ số tuyển dụng | Nắm bắt nhanh tỷ lệ ứng viên Đạt/Tiềm năng/Không đạt. |

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
  - Đọc file binary PDF gửi trực tiếp lên Gemini API (`gemini-2.5-flash`).
- **Output**: Markdown response trực tiếp trong Chat UI bao gồm: điểm tổng (0-100), phân tích từng phần, điểm mạnh/yếu, phân loại (✅ Đạt / ⚠️ Tiềm năng / ❌ Không đạt), câu hỏi phỏng vấn gợi ý.

### 3.2 Web App Specifications (`hilab-hr`)

#### 3.2.1 Single CV Screening (`/analyze`)
- Form nhận thông tin: Upload 1 file PDF CV (tối đa 10MB) + Nhập JD text hoặc chọn từ JD Templates.
- Processing State: Hiển thị hiệu ứng loading/skeleton animation mượt mà.
- Result Screen:
  - Radial score gauge (Điểm tổng quan 0-100).
  - Badge xếp loại (Pass / Potential / Fail).
  - Progress bars chi tiết 4 mục: Kỹ năng (35%), Kinh nghiệm (35%), Học vấn (15%), Ngôn ngữ & Khác (15%).
  - Card danh sách điểm mạnh & điểm yếu.
  - Accordion / Card danh sách câu hỏi phỏng vấn gợi ý.

#### 3.2.2 Batch CV Screening (`/analyze/batch`)
- Drag & Drop zone hỗ trợ chọn nhiều file PDF cùng lúc.
- Tiến trình phân tích theo hàng chờ (sequential progress bar).
- Bảng xếp hạng (Leaderboard Table) sắp xếp thứ tự ưu tiên ứng viên theo điểm số từ cao xuống thấp.

#### 3.2.3 History & CSV Export (`/history`, `/dashboard`)
- Lịch sử phân tích lưu trong Database Neon PostgreSQL.
- Tính năng lọc theo ngày, theo vị trí công việc, theo xếp loại.
- Nút "Xuất CSV" hỗ trợ tải file báo cáo chuẩn UTF-8.

---

## 4. Technical Specifications & Database Schema

### 4.1 Prisma Database Schema

```prisma
model User {
  id              String           @id @default(cuid())
  name            String?
  email           String           @unique
  emailVerified   DateTime?
  image           String?
  accounts        Account[]
  sessions        Session[]
  analyses        Analysis[]
  jobDescriptions JobDescription[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model JobDescription {
  id          String     @id @default(cuid())
  title       String     
  content     String     @db.Text
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  analyses    Analysis[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Analysis {
  id                 String         @id @default(cuid())
  candidateName      String?        
  cvFileName         String         
  cvFileUrl          String?        
  overallScore       Int            
  classification     String         // "pass" | "potential" | "fail"
  skillsAnalysis     Json           
  experienceAnalysis Json           
  educationAnalysis  Json           
  languageAnalysis   Json           
  strengths          String[]       
  weaknesses         String[]       
  interviewQuestions String[]       
  summary            String         @db.Text
  jobDescriptionId   String
  jobDescription     JobDescription @relation(fields: [jobDescriptionId], references: [id], onDelete: Cascade)
  userId             String
  user               User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt          DateTime       @default(now())
}
```

### 4.2 Rest API Endpoints

| Method | Endpoint | Description | Request Payload | Response |
|---|---|---|---|---|
| `POST` | `/api/analyze` | Phân tích 1 CV với JD | `FormData` (file, jobDescriptionId / jdText) | `Analysis` JSON Object |
| `POST` | `/api/analyze/batch` | Phân tích danh sách CV | `FormData` (files[], jobDescriptionId / jdText) | `Analysis[]` Array |
| `GET` | `/api/analyses` | Lấy danh sách lịch sử phân tích | Query params: `page`, `limit` | `{ data: Analysis[], total: number }` |
| `GET` | `/api/analyses/[id]` | Xem chi tiết 1 kết quả phân tích | Path param `id` | `Analysis` JSON Object |
| `DELETE` | `/api/analyses/[id]` | Xóa 1 bản ghi phân tích | Path param `id` | `{ success: boolean }` |
| `GET` | `/api/analyses/export` | Tải xuống file CSV báo cáo | Query params filter | Binary CSV file (`Content-Type: text/csv`) |
| `POST` | `/api/job-descriptions` | Tạo template JD mới | `{ title: string, content: string }` | `JobDescription` Object |
| `GET` | `/api/job-descriptions` | Danh sách JD của user | None | `JobDescription[]` |

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
