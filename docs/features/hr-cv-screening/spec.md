# Feature Spec: HR Skill Studio & Dynamic CV Screening

- **Feature Name**: HR Skill Studio & Dynamic Screening
- **Status**: Draft / Planned
- **Version**: 1.0.0

---

## 1. Yêu cầu Tính năng (Feature Requirements)

### FR-1: Dynamic Skill Engine
- Hệ thống chấm điểm CV không còn phụ thuộc vào template prompt tĩnh cố định mà nhận cấu hình từ đối tượng `SkillConfig`.
- Nạp bộ tiêu chí mặc định từ `.agents/skills/hr-cv-screening/` (`SKILL.md` và `scoring_rubric.md`).

### FR-2: HR Skill Studio (`/skills`)
- Giao diện 2 cột tương tác trực tiếp (Split-View):
  - **Cột trái**: Xem và chỉnh sửa bộ tiêu chí (Trọng số 4 mục Skills, Experience, Education, Language; trình soạn thảo Rubric Markdown kèm Preview; System Prompt Live Preview).
  - **Cột phải**: Khung Chat AI Co-pilot hỗ trợ tiếp nhận ý tưởng bằng ngôn ngữ tự nhiên để tự động cập nhật bộ Skill.
- Quản lý nhiều Preset tiêu chí tuyển dụng (Tạo mới, Lưu, Sửa, Xóa, Nhân bản, Khôi phục mặc định).

### FR-3: AI Skill Co-pilot API (`/api/skills/ai-edit`)
- Nhận input gồm: Skill hiện tại, yêu cầu của người dùng, lịch sử chat.
- Sử dụng Gemini 3.1 Flash Lite để phân tích và trả về bản cập nhật Skill chuẩn cấu trúc kèm giải thích các điểm thay đổi.

### FR-4: Tích hợp vào Luồng Phân tích CV
- Trang `/analyze` (Phân tích đơn) và `/analyze/batch` (Phân tích Batch) có Dropdown chọn Bộ Skill áp dụng.
- Backend `/api/analyze` và `/api/analyze/batch` kết hợp JD, CV và bộ Skill được chọn để gửi tới Gemini và tính điểm theo trọng số tùy biến.

### FR-5: Responsive & Accessible Interaction
- Ở viewport nhỏ hơn `md`, Navbar hiển thị nút mở dropdown điều hướng ngay bên dưới header; người dùng có thể mở, đóng bằng Escape và truy cập tất cả các route chính bằng bàn phím.
- Trang `/skills` không được cắt nội dung header hoặc preset selector ở viewport rộng 375px.
- Các file input, Skill selector, weight controls và button chỉ có icon phải có accessible name tiếng Việt thông qua `label`, `htmlFor` hoặc `aria-label`.
- Các modal Tạo, Xóa và Khôi phục preset phải dùng `role="dialog"`, giữ focus trong modal, trả focus về trigger khi đóng và hỗ trợ Escape.
- Các text đã được audit phải đạt độ tương phản WCAG AA cho normal text; cấu trúc heading không được nhảy cấp.

---

## 2. API Endpoints Contract

### 2.1 `POST /api/skills/ai-edit`
- **Request Body**:
  ```json
  {
    "currentSkill": {
      "name": "string",
      "description": "string",
      "roleInstructions": "string",
      "scoringRubric": "string",
      "weights": {
        "skills": 35,
        "experience": 30,
        "education": 20,
        "language": 15
      }
    },
    "userMessage": "string",
    "chatHistory": []
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "replyMessage": "string",
    "changes": ["string"],
    "updatedSkill": {
      "name": "string",
      "description": "string",
      "roleInstructions": "string",
      "scoringRubric": "string",
      "weights": { "skills": 35, "experience": 30, "education": 20, "language": 15 }
    }
  }
  ```

### 2.2 `POST /api/analyze` & `POST /api/analyze/batch`
- **Form Data**:
  - `cv`: File PDF
  - `jd`: Text
  - `skillConfig`: JSON string chứa `SkillConfig` (hoặc `skillId` nếu lưu server)
