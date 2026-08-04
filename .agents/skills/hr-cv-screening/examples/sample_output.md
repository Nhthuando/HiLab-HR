# Output mẫu — Kết quả phân tích CV

> Đây là ví dụ output khi Agent phân tích CV cho vị trí Senior Frontend Developer.

---

## 📋 Kết quả phân tích CV: Nguyễn Văn A

### 🎯 Điểm tổng: 78/100 — ✅ Đạt

| Hạng mục | Điểm | Nhận xét |
|----------|------|----------|
| 🛠️ Kỹ năng | 82/100 | Có React, TypeScript, Next.js. Thiếu GraphQL |
| 💼 Kinh nghiệm | 75/100 | 4 năm frontend, 3 năm React. Đủ yêu cầu |
| 🎓 Học vấn | 80/100 | Cử nhân CNTT - ĐH Bách Khoa TP.HCM |
| 🌐 Ngôn ngữ | 70/100 | TOEIC 720, đủ đọc tài liệu kỹ thuật |

### ✅ Điểm mạnh
- 4 năm kinh nghiệm frontend, trong đó 3 năm chuyên React/Next.js
- Có kinh nghiệm với TypeScript và Tailwind CSS
- Đã lead team 3 người ở công ty trước
- Có kinh nghiệm CI/CD với GitHub Actions
- Tốt nghiệp trường top (ĐH Bách Khoa TP.HCM)

### ⚠️ Điểm yếu
- Chưa có kinh nghiệm GraphQL (JD yêu cầu)
- TOEIC 720 — đạt mức giao tiếp cơ bản, chưa thành thạo
- Chưa thấy kinh nghiệm testing (Jest/Cypress) trong CV
- Không đề cập Web Accessibility

### 🔍 Gợi ý câu hỏi phỏng vấn
1. "Anh/chị có thể chia sẻ về kinh nghiệm lead team 3 người? Cách anh/chị handle conflict và code review?"
2. "Anh/chị đã optimize performance cho ứng dụng React như thế nào? Cho ví dụ cụ thể."
3. "Anh/chị có kinh nghiệm với GraphQL không? Nếu chưa, anh/chị sẵn sàng học không?"
4. "Anh/chị xử lý state management trong dự án lớn như thế nào? So sánh Redux vs Zustand?"
5. "Chia sẻ về một bug phức tạp nhất anh/chị đã debug và cách giải quyết."

### 📝 Tóm tắt

Nguyễn Văn A là ứng viên **phù hợp** cho vị trí Senior Frontend Developer. Với 4 năm kinh nghiệm frontend và 3 năm React, ứng viên đáp ứng tốt yêu cầu kỹ thuật cốt lõi. Có kinh nghiệm lead team là điểm cộng. Tuy nhiên, cần kiểm tra thêm về khả năng tiếng Anh thực tế và kinh nghiệm testing trong phỏng vấn. Thiếu GraphQL không phải blocker vì có thể đào tạo.

**Đề xuất**: ✅ Mời phỏng vấn vòng kỹ thuật.

---

## JSON Output Reference

Đây là JSON raw output từ script `analyze_cv.py`:

```json
{
  "candidate_name": "Nguyễn Văn A",
  "overall_score": 78,
  "classification": "pass",
  "skills_analysis": {
    "score": 82,
    "matched": ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Git", "CI/CD"],
    "missing": ["GraphQL", "Jest/Cypress", "Web Accessibility"],
    "details": "Ứng viên có đầy đủ kỹ năng kỹ thuật cốt lõi. Thiếu GraphQL và testing frameworks."
  },
  "experience_analysis": {
    "score": 75,
    "years_total": 4,
    "years_relevant": 3,
    "details": "4 năm kinh nghiệm frontend, 3 năm chuyên React. Có kinh nghiệm lead team."
  },
  "education_analysis": {
    "score": 80,
    "details": "Cử nhân CNTT - ĐH Bách Khoa TP.HCM. Trường top, chuyên ngành phù hợp."
  },
  "language_analysis": {
    "score": 70,
    "details": "TOEIC 720. Đủ đọc tài liệu kỹ thuật, giao tiếp cơ bản."
  },
  "strengths": [
    "4 năm kinh nghiệm frontend, 3 năm chuyên React/Next.js",
    "Có kinh nghiệm lead team",
    "TypeScript + Tailwind CSS",
    "CI/CD với GitHub Actions",
    "Tốt nghiệp ĐH Bách Khoa TP.HCM"
  ],
  "weaknesses": [
    "Chưa có kinh nghiệm GraphQL",
    "TOEIC 720 - chưa thành thạo tiếng Anh",
    "Chưa có kinh nghiệm testing frameworks",
    "Không đề cập Web Accessibility"
  ],
  "interview_questions": [
    "Chia sẻ kinh nghiệm lead team 3 người?",
    "Cách optimize performance React?",
    "Kinh nghiệm GraphQL?",
    "So sánh Redux vs Zustand?",
    "Bug phức tạp nhất đã debug?"
  ],
  "summary": "Ứng viên phù hợp cho vị trí. Đáp ứng tốt yêu cầu kỹ thuật cốt lõi. Cần kiểm tra thêm tiếng Anh và testing trong phỏng vấn."
}
```
