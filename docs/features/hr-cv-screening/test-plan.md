# Test Plan: HR CV Screening System (`hr-cv-screening`)

Kế hoạch kiểm thử (Quality Assurance & Test Plan) cho tính năng **HR CV Screening System**.

---

## 1. Test Strategy & Objectives

Đảm bảo cả 2 sản phẩm (Skill trong IDE & Web App) hoạt động chính xác, ổn định, xử lý lỗi an toàn và đạt 100% yêu cầu đề bài:
1. **Skill Quality**: Đọc đúng file CV PDF, parse JSON không bị lỗi, xuất markdown đầy đủ cấu trúc.
2. **Web App Functional Quality**: Đăng nhập mượt mà, upload single & batch thành công, tính toán điểm chuẩn xác, xuất CSV đúng định dạng.
3. **Build & Type Safety**: Không có lỗi TypeScript, ESLint hay lỗi biên dịch Next.js trong quá trình build production (`next build`).

---

## 2. Skill Agent Test Suite (`.agents/skills/hr-cv-screening/`)

### 2.1 Test Cases

| ID | Test Scenario | Input Data | Expected Output | Status |
|---|---|---|---|---|
| **TC-SK-01** | Phân tích CV đơn lẻ chuẩn | `sample_jd.md` + CV PDF hợp lệ | Trả về kết quả Markdown gồm: Score, Classification, Analysis 4 mục, Strengths, Weaknesses, Questions. | PASS |
| **TC-SK-02** | CV không khớp vị trí JD | JD tuyển Frontend Dev + CV Kế toán | Điểm số tổng thấp (< 40), Xếp loại `❌ Không đạt`, nêu rõ thiếu sót về kỹ năng lập trình. | PASS |
| **TC-SK-03** | CV Tiếng Anh | JD Tiếng Việt + CV PDF Tiếng Anh | Gemini API tự dịch và phân tích chính xác theo JD Tiếng Việt. | PASS |
| **TC-SK-04** | Python Script CLI | Run `python analyze_cv.py` từ Terminal | Trả về chuỗi JSON đạt chuẩn Schema `overallScore`, `classification`, `strengths`... | PASS |

---

## 3. Web Application Test Suite (`hilab-hr`)

### 3.1 Authentication & Protected Routes
- **TC-WA-01**: Đăng nhập thành công với Google OAuth 2.0 -> Redirect về `/dashboard`.
- **TC-WA-02**: Chưa đăng nhập truy cập các trang protected (`/analyze`, `/history`, `/dashboard`) -> Tự động chuyển hướng về `/login`.
- **TC-WA-03**: Đăng xuất tài khoản -> Xóa session, chuyển hướng về Landing Page `/`.

### 3.2 Single CV Screening (`/analyze`)
- **TC-WA-04**: Upload 1 file CV PDF (5MB) + Nhập JD text -> Bấm Phân tích.
  - Verification: Tiến trình loading xuất hiện, API `/api/analyze` trả về code 200, hiển thị Radial Score Gauge & danh sách điểm mạnh/yếu đầy đủ.
- **TC-WA-05**: Upload file không phải PDF (ví dụ: PNG, TXT, DOCX) -> Hiển thị thông báo lỗi client-side validator "Chỉ chấp nhận file định dạng PDF".

### 3.3 Batch CV Screening & Ranking (`/analyze/batch`)
- **TC-WA-06**: Drag & drop 5 file PDF CV cùng lúc + Chọn JD mẫu -> Bấm Phân tích hàng loạt.
  - Verification: Thanh progress bar đếm `1/5`, `2/5`... `5/5`, Bảng xếp hạng (Leaderboard) hiển thị 5 ứng viên theo thứ tự điểm số giảm dần.

### 3.4 History & Export (`/history`, `/dashboard`)
- **TC-WA-07**: Vào trang `/history` -> Danh sách tất cả lượt phân tích hiển thị đầy đủ, có hiển thị Vị trí tuyển dụng (JD badge) tương ứng với từng ứng viên.
- **TC-WA-08**: Bấm nút "Chi tiết" ở 1 bản ghi -> Mở rộng accordion hiển thị toàn bộ kết quả chấm điểm chi tiết.
- **TC-WA-09**: Bấm nút "Xuất CSV" -> Trình duyệt tải xuống file `.csv`, mở trên Excel không bị lỗi phông chữ Tiếng Việt (UTF-8 with BOM), có đầy đủ 2 cột JD.
- **TC-WA-10**: Bấm nút "Xuất Excel (.xlsx)" -> Trình duyệt tải file `.xlsx` cao cấp với 2 worksheets (`Bảng Xếp Hạng Ứng Viên` & `Mô Tả Công Việc (JD)`), có định dạng màu sắc (Header Indigo, Xếp loại Xanh/Vàng/Hồng), border tinh tế và auto column width.

### 3.5 AI Engine & Quota Optimization
- **TC-WA-11**: Phân tích file PDF có text -> AI trích xuất text trước và gửi dạng text payload (tiết kiệm ~60-80% token quota so với base64 PDF inlineData).
- **TC-WA-12**: Phân tích file PDF scan (không có text) -> Tự động fallback sang gửi base64 PDF inlineData để Gemini OCR và phân tích.
- **TC-WA-13**: Khi Gemini API gặp lỗi quota / 429 -> Tự động kích hoạt Groq fallback (`llama-3.3-70b-versatile`) đảm bảo không đứt gãy trải nghiệm.
- **TC-WA-14**: Model trả `overall_score` sai hoặc giống CV khác -> Backend bỏ qua tổng đó, tính lại từ 4 điểm thành phần; `(60,20,90,70)` = `56`, `(40,20,80,50)` = `44`.
- **TC-WA-15**: Điểm tổng tại biên `49/50/69/70` -> classification lần lượt `fail/potential/potential/pass`.
- **TC-WA-16**: CV thiếu must-have -> `must_have_gaps` hiển thị cho HR và điểm mục liên quan bị giảm; không tự động hard-reject.
- **TC-WA-17**: JD/CV vượt giới hạn prompt -> text được rút gọn theo giới hạn JD 8.000 và CV 16.000 ký tự trước khi gửi model.

---

## 4. Production Build & E2E Verification Protocol

### Lệnh kiểm tra tự động:
```bash
cd hilab-hr
npm run build
```

### Tiêu chí nghiệm thu (Acceptance Criteria):
1. Terminal xuất ra thông báo Compiled successfully.
2. Không phát sinh bất kỳ cảnh báo Linting (ESLint) hoặc lỗi Type checking (TypeScript).
3. Tất cả các trang tĩnh (Static) và Server Routes (Dynamic) được khởi tạo thành công.
