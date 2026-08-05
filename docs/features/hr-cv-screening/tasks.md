# Task Tracker: HR CV Screening System (`hr-cv-screening`)

Danh sách chi tiết công việc triển khai cho tính năng **HR CV Screening System**.

---

## Phần 1: SKILL.md — HR CV Screening Agent (Claude / Antigravity IDE)

- [x] **TSK-01**: Tạo cấu trúc thư mục chuẩn `.agents/skills/hr-cv-screening/`
- [x] **TSK-02**: Viết tài liệu `SKILL.md` (frontmatter yaml metadata + chi tiết instructions)
- [x] **TSK-03**: Viết script `scripts/analyze_cv.py` sử dụng `google-genai` Python SDK
- [x] **TSK-04**: Định nghĩa tiêu chí chấm điểm chi tiết tại `resources/scoring_rubric.md`
- [x] **TSK-05**: Tạo tài liệu dữ liệu mẫu `examples/sample_jd.md` và `examples/sample_output.md`
- [x] **TSK-06**: Chạy thử nghiệm và xác minh thành công Agent Skill trong môi trường Antigravity IDE

---

## Phần 2: Web App — Next.js Fullstack (`hilab-hr`)

### 2.1 Setup & Infrastructure
- [x] **TSK-07**: Khởi tạo dự án Next.js 15 (App Router) + Tailwind CSS v4 + Lucide Icons
- [x] **TSK-08**: Định nghĩa Prisma Schema (`User`, `Account`, `Session`, `JobDescription`, `Analysis`) và push thành công lên Neon PostgreSQL
- [x] **TSK-09**: Tích hợp NextAuth.js (Auth.js v5) hỗ trợ Đăng nhập tài khoản Google (OAuth 2.0)
- [x] **TSK-10**: Cấu hình các biến môi trường tại `.env` và `.env.local` (`.env.example`)

### 2.2 Core Features (Phân tích đơn lẻ)
- [x] **TSK-11**: Tháo lắp và thiết kế Landing Page giới thiệu dịch vụ (`/`)
- [x] **TSK-12**: Thiết kế trang Đăng nhập (`/login`) tích hợp Google Login Button
- [x] **TSK-13**: Xây dựng UI Phân tích CV đơn lẻ (`/analyze`) với khu vực Upload PDF và Nhập/Chọn JD
- [x] **TSK-14**: Viết API Route Handlers `POST /api/analyze` xử lý FormData và gọi Gemini API
- [x] **TSK-15**: Thiết kế giao diện hiển thị kết quả phân tích: Radial score gauge, Progress bars 4 hạng mục, thẻ Điểm mạnh / Điểm yếu và Gợi ý câu hỏi phỏng vấn

### 2.3 Extended Features (Phân tích hàng loạt & Thống kê)
- [x] **TSK-16**: Thiết kế trang Phân tích CV hàng loạt (`/analyze/batch`) hỗ trợ Upload nhiều PDF cùng lúc
- [x] **TSK-17**: Viết API Route Handlers `POST /api/analyze/batch` xử lý hàng chờ phân tích nối tiếp (sequential)
- [x] **TSK-18**: Xây dựng Bảng xếp hạng ứng viên (Leaderboard Table) tự động sắp xếp theo điểm tổng quan
- [x] **TSK-19**: Xây dựng trang Quản lý Lịch sử (`/history`) và trang Chi tiết kết quả (`/history/[id]`)
- [x] **TSK-20**: Viết API Route `GET /api/analyses` tra cứu danh sách lịch sử phân tích
- [x] **TSK-21**: Xây dựng API Route `GET /api/analyses/export` xuất báo cáo dữ liệu dạng file CSV
- [x] **TSK-22**: Xây dựng trang Dashboard tổng quan (`/dashboard`) hiển thị chỉ số thống kê ứng viên

### 2.4 Polish, Verification & QA
- [x] **TSK-23**: Áp dụng thiết kế chuẩn Dark mode Glassmorphism, hiệu ứng chuyển trang mượt mà
- [x] **TSK-24**: Xử lý trạng thái Loading Skeleton, progress bar hiển thị phần trăm khi AI đang phân tích
- [x] **TSK-25**: Kiểm thử lệnh Build Production (`npm run build`) đạt trạng thái 100% Clean Build

### 2.5 Excel Reporting, JD Tracking & Quota Optimization
- [x] **TSK-26**: Tích hợp `exceljs` và xây dựng module `src/lib/excelExport.ts` định dạng bảng tính cao cấp, border tinh tế, màu sắc xếp loại, sheet tóm tắt JD.
- [x] **TSK-27**: Nâng cấp `StoredAnalysis` trong `src/lib/localStorage.ts` hỗ trợ lưu `jdTitle`, `jdSummary`, `jdText` và cập nhật file CSV.
- [x] **TSK-28**: Tối ưu hóa AI Quota theo chiến lược Text-First (`src/lib/gemini.ts`) giúp giảm 60-80% token tiêu thụ khi gọi Gemini 3.1 Flash Lite.
- [x] **TSK-29**: Cập nhật toàn diện giao diện (`/analyze`, `/analyze/batch`, `/history`) tích hợp nút Xuất Excel/CSV và hiển thị tag JD.

### 2.6 Scoring Consistency & Prompt Quality
- [x] **TSK-30**: Tách module scoring deterministic, luôn tính tổng theo trọng số 35/30/20/15 và suy ra classification từ tổng điểm.
- [x] **TSK-31**: Chuẩn hóa prompt theo bằng chứng JD/CV, phân biệt must-have/preferred và hiển thị `must_have_gaps`.
- [x] **TSK-32**: Giới hạn input/output prompt (JD 8.000 ký tự, CV text 16.000 ký tự, danh sách kết quả có giới hạn) để tối ưu quota.
- [x] **TSK-33**: Thêm regression checks cho trường hợp hai CV có điểm thành phần khác nhau nhưng model trả cùng tổng điểm.

- [x] **TSK-34**: Chuy???n theme m???c ?????nh t??? dark sang light theo guideline `notion-DESIGN.md`, ch??? ??i???u ch???nh color tokens, background, border v?? shadow m?? kh??ng thay ?????i layout hay h??nh vi UI.
