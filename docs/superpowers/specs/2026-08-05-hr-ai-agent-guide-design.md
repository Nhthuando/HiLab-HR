# Design Spec — Bộ tài liệu hướng dẫn AI Agent cho HR non-tech

## 1. Mục tiêu

Tạo một bộ tài liệu Word/PDF giúp nhân sự HR không chuyên kỹ thuật:

- Hiểu AI agent và Skill bằng ngôn ngữ đời thường.
- Tự sàng lọc CV theo JD bằng hai cách: HR Screening Skill trong Claude/Antigravity và HiLab-HR Web App.
- Biết đọc kết quả, kiểm tra bằng chứng và nhận diện kết luận cần xác minh.
- Xuất báo cáo và sử dụng kết quả như một đầu vào hỗ trợ quyết định tuyển dụng.

Slide thuyết trình đã có sẵn và nằm ngoài phạm vi của thiết kế này. Bộ tài liệu sẽ bổ trợ cho slide, không lặp lại slide một cách máy móc.

## 2. Phạm vi và đối tượng

### Đối tượng chính

- Nhân sự HR non-tech, có thể chưa từng dùng Claude/Antigravity Skill.
- Người trình bày hoặc người hướng dẫn workshop cần một kịch bản demo ổn định.

### Workflow lõi

Sàng lọc CV theo Job Description (JD), gồm phân tích mức độ phù hợp, điểm theo tiêu chí, bằng chứng, điểm mạnh/yếu, câu hỏi phỏng vấn và báo cáo.

### Ngoài phạm vi

- Hướng dẫn lập trình, API, database hoặc xây dựng mô hình AI.
- Thiết kế lại HiLab-HR Web App.
- Tạo slide thuyết trình mới.
- Tự động đưa ra quyết định tuyển dụng cuối cùng.

## 3. Phương án đã chọn

Sử dụng một bộ workbook gồm ba tài liệu độc lập nhưng liên kết với nhau. Tất cả tài liệu được phát hành dưới dạng Word/PDF, với dữ liệu CV và JD thật được chèn sau khi đã ẩn danh.

### Tài liệu 1 — Sổ tay HR non-tech

Mục đích: xây dựng hiểu biết và cách tư duy đúng.

Nội dung:

1. Vì sao HR có thể dùng AI agent trong sàng lọc CV.
2. AI agent là gì qua ví dụ trợ lý tuyển dụng.
3. Chatbot, agent và Skill khác nhau thế nào.
4. Các bước agent xử lý CV và JD.
5. Cách giao nhiệm vụ bằng ngôn ngữ tự nhiên.
6. Cách đọc điểm tổng, điểm thành phần, kỹ năng, kinh nghiệm, điểm mạnh/yếu và câu hỏi phỏng vấn.
7. Những việc AI không được tự quyết định thay HR.
8. Checklist kiểm tra kết quả trước khi sử dụng.
9. Glossary các thuật ngữ tối thiểu.

### Tài liệu 2 — Workbook thực hành sàng lọc CV

Mục đích: giúp HR tự hoàn thành một quy trình sàng lọc.

Gồm ba bài tập:

1. Sàng lọc một CV theo JD.
2. So sánh nhiều ứng viên.
3. Phát hiện nhận xét AI chưa đủ bằng chứng.

Mỗi bài tập có mục tiêu, dữ liệu cần chuẩn bị, hướng dẫn chạy Skill, hướng dẫn dùng Web App, ô ghi kết quả, câu hỏi kiểm tra và tiêu chí hoàn thành.

Các vùng dữ liệu sẽ dùng placeholder rõ ràng, ví dụ:

- `[DÁN JD ĐÃ ẨN DANH VÀO ĐÂY]`
- `[DÁN CV ỨNG VIÊN 1 VÀO ĐÂY]`
- `[GHI NHẬN XÉT CỦA HR VÀO ĐÂY]`

### Tài liệu 3 — Runbook demo Skill + HiLab-HR

Mục đích: hỗ trợ người trình bày chạy demo theo slide hiện có.

Nội dung:

- Chuẩn bị trước buổi demo.
- Kịch bản thao tác từng bước trong khoảng 10–15 phút.
- Lời giải thích non-tech cho từng màn hình và kết quả.
- Các điểm cần nhấn mạnh để chứng minh Skill/agent dùng được thật.
- Kết quả kỳ vọng.
- Tình huống lỗi và phương án dự phòng.
- FAQ cho HR.
- Checklist trước và sau buổi trình bày.

## 4. Luồng trải nghiệm học tập

```text
Hiểu khái niệm
      ↓
Thực hành với Skill
      ↓
Thực hành với Web App
      ↓
Kiểm tra bằng chứng
      ↓
Xuất báo cáo và áp dụng vào quy trình HR
```

Kết quả đầu ra mong muốn của người học:

> Nhập CV + JD → chạy phân tích → kiểm tra bằng chứng → nhận diện điểm cần xác minh → xuất báo cáo → đưa ra nhận xét tuyển dụng có cơ sở.

## 5. Luồng demo chuẩn

1. Giới thiệu bài toán HR phải đọc nhiều CV theo cùng một JD.
2. Hiển thị một JD và một CV đã ẩn danh.
3. Chạy HR Screening Skill bằng yêu cầu ngôn ngữ tự nhiên.
4. Giải thích agent đã đọc dữ liệu, đối chiếu tiêu chí, đưa bằng chứng và tạo báo cáo như thế nào.
5. Chạy cùng CV và JD trên HiLab-HR Web App.
6. Đối chiếu điểm tổng, kỹ năng, kinh nghiệm, điểm mạnh/yếu và câu hỏi phỏng vấn.
7. Cho HR thực hành một lượt bằng workbook.
8. Kết thúc bằng nguyên tắc AI hỗ trợ, HR kiểm tra và HR quyết định.

## 6. Phong cách và quy ước trình bày

- Ngôn ngữ: tiếng Việt đời thường; thuật ngữ tiếng Anh chỉ xuất hiện kèm giải thích ở lần đầu.
- Mỗi phần có bốn ô cố định: **Mục tiêu — Làm gì — Kết quả mong đợi — Cần kiểm tra gì**.
- Visual đồng bộ với slide: tiêu đề đen, màu nhấn đỏ, bảng nền trắng/xám, bố cục dễ đọc và dễ in.
- Có placeholder cho screenshot Skill, screenshot Web App, kết quả phân tích và CV/JD đã ẩn danh.
- Dùng sơ đồ đơn giản thay cho đoạn giải thích kỹ thuật dài.

## 7. An toàn dữ liệu và sử dụng có trách nhiệm

- Chỉ chèn CV/JD thật sau khi đã ẩn danh.
- Không đưa API key hoặc thông tin đăng nhập vào tài liệu.
- Không xem điểm AI là quyết định tuyển dụng cuối cùng.
- Nhận xét quan trọng phải được đối chiếu với bằng chứng trong CV.
- Tách rõ “AI phát hiện” và “HR kết luận”.

## 8. Xử lý tình huống demo

- Nếu Skill không tự kích hoạt, dùng câu lệnh hướng dẫn thủ công trong Runbook.
- Nếu Web App lỗi mạng/API, dùng kết quả đã chuẩn bị trước và tiếp tục giải thích.
- Nếu AI đưa nhận xét thiếu bằng chứng, dùng checklist tìm bằng chứng trong CV.
- Nếu dữ liệu còn thông tin cá nhân, dừng sử dụng và thay bằng bản đã ẩn danh.
- Nếu hai công cụ cho kết quả khác nhau, kiểm tra dữ liệu đầu vào và căn cứ đánh giá thay vì cố làm cho hai kết quả giống nhau.

## 9. Tiêu chí nghiệm thu bộ tài liệu

### Đối với người học

Người học đạt yêu cầu nếu có thể:

1. Giải thích AI agent và Skill bằng ví dụ tuyển dụng.
2. Tự chạy cùng một CV/JD qua Skill và Web App.
3. Đọc các trường kết quả chính.
4. Chỉ ra ít nhất hai nhận xét cần kiểm tra lại bằng chứng.
5. Xuất báo cáo và ghi nhận nhận xét của HR.

### Đối với tài liệu

- Ba tài liệu có thể đọc độc lập và liên kết được với nhau.
- Placeholder CV/JD có thể thay thế mà không phá vỡ bố cục.
- Hướng dẫn không yêu cầu người đọc biết code.
- Runbook có đường chạy chính và đường dự phòng.
- Có thể kiểm thử toàn bộ luồng bằng dữ liệu đã ẩn danh.

## 10. Quyết định thiết kế

- Chọn bộ ba tài liệu thay vì một tài liệu duy nhất để tách rõ nhu cầu của người học và người trình bày.
- Chọn workflow CV screening làm case trung tâm vì HiLab-HR đã có Skill và Web App tương ứng.
- Kết hợp Skill và Web App để giải thích cả cơ chế agent phía sau lẫn trải nghiệm sử dụng thực tế.
- Dùng dữ liệu placeholder để người dùng chèn CV/JD thật sau khi ẩn danh.
- Ưu tiên khả năng HR tự thao tác và kiểm tra kết quả hơn là đào sâu kỹ thuật.
