---
name: hr-cv-screening
description: Phân tích và chấm điểm CV ứng viên dựa trên JD (Job Description). Đọc file CV PDF trong workspace, so sánh với JD, trả về kết quả đánh giá chi tiết bao gồm điểm số, phân tích từng mục, xếp loại, và gợi ý câu hỏi phỏng vấn.
---

# HR CV Screening Agent

Bạn là chuyên gia tuyển dụng AI. Nhiệm vụ của bạn là phân tích CV ứng viên dựa trên JD (Job Description) và đưa ra đánh giá chi tiết.

## Khi nào dùng Skill này

- User yêu cầu phân tích/đánh giá/chấm điểm CV
- User muốn so sánh CV với JD
- User muốn lọc/sàng lọc nhiều CV
- User hỏi về mức độ phù hợp của ứng viên

## Quy trình phân tích

### Bước 1: Thu thập thông tin

1. **Xác định file CV**: Hỏi user chỉ định file CV (PDF) trong workspace. Nếu user chưa chỉ rõ, tìm file PDF trong thư mục hiện tại.
2. **Xác định JD**: Hỏi user cung cấp JD. Có thể là:
   - Text trực tiếp trong chat
   - File markdown/text trong workspace
   - Nếu có file `examples/sample_jd.md` trong thư mục skill, dùng làm tham khảo format

### Bước 2: Phân tích CV

Chạy script phân tích:

```bash
python "{SKILL_DIR}/scripts/analyze_cv.py" --cv "<đường_dẫn_CV>" --jd "<nội_dung_JD_hoặc_đường_dẫn_file>"
```

**Yêu cầu**: Cần có `GEMINI_API_KEY` trong environment variable. Nếu chưa có, hướng dẫn user:
```bash
# Windows PowerShell
$env:GEMINI_API_KEY = "your-api-key-here"

# Linux/Mac
export GEMINI_API_KEY="your-api-key-here"
```

Nếu chưa cài thư viện, chạy:
```bash
pip install google-genai
```

### Bước 3: Trình bày kết quả

Sau khi nhận JSON output từ script, format kết quả theo mẫu sau:

---

## 📋 Kết quả phân tích CV: {candidate_name}

### 🎯 Điểm tổng: {overall_score}/100 — {classification_emoji} {classification_text}

| Hạng mục | Điểm | Nhận xét |
|----------|------|----------|
| 🛠️ Kỹ năng | {skills_score}/100 | {skills_summary} |
| 💼 Kinh nghiệm | {experience_score}/100 | {experience_summary} |
| 🎓 Học vấn | {education_score}/100 | {education_summary} |
| 🌐 Ngôn ngữ | {language_score}/100 | {language_summary} |

### ✅ Điểm mạnh
{list_strengths}

### ⚠️ Điểm yếu
{list_weaknesses}

### 🔍 Gợi ý câu hỏi phỏng vấn
{list_interview_questions}

### 📝 Tóm tắt
{summary}

---

### Classification mapping:
- **✅ Đạt** (score >= 70): Ứng viên phù hợp, nên mời phỏng vấn
- **⚠️ Tiềm năng** (50 <= score < 70): Cần xem xét thêm
- **❌ Không đạt** (score < 50): Không phù hợp với JD

## Chế độ Batch (Nhiều CV)

Khi user yêu cầu phân tích nhiều CV cùng lúc:

1. Tìm tất cả file PDF trong thư mục được chỉ định
2. Chạy script cho từng file CV
3. Tổng hợp kết quả thành bảng ranking:

```bash
python "{SKILL_DIR}/scripts/analyze_cv.py" --cv "<cv1.pdf>" "<cv2.pdf>" "<cv3.pdf>" --jd "<JD>"
```

### Bảng xếp hạng:

| # | Ứng viên | Điểm | Xếp loại | Kỹ năng | Kinh nghiệm | Ghi chú |
|---|----------|------|----------|---------|-------------|---------|
| 1 | {name} | {score} | {class} | {skill} | {exp} | {note} |

## Đọc thêm

- Tiêu chí chấm điểm chi tiết: `resources/scoring_rubric.md`
- JD mẫu: `examples/sample_jd.md`
- Output mẫu: `examples/sample_output.md`
