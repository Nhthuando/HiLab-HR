#!/usr/bin/env python3
"""
HR CV Screening Agent — Phân tích CV ứng viên dựa trên JD
Sử dụng Gemini API (google-genai SDK)

Usage:
    python analyze_cv.py --cv path/to/cv.pdf --jd "Nội dung JD hoặc path file"
    python analyze_cv.py --cv cv1.pdf cv2.pdf cv3.pdf --jd jd.md
"""

import argparse
import json
import os
import sys
import base64
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ Chưa cài thư viện google-genai. Chạy: pip install google-genai")
    sys.exit(1)


# ─── Schema cho structured output ───────────────────────────────────────────────

ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "candidate_name": {
            "type": "string",
            "description": "Tên ứng viên trích từ CV"
        },
        "candidate_email": {
            "type": "string",
            "description": "Địa chỉ email ứng viên trích từ CV, để trống nếu không tìm thấy"
        },
        "candidate_phone": {
            "type": "string",
            "description": "Số điện thoại ứng viên trích từ CV, để trống nếu không tìm thấy"
        },
        "overall_score": {
            "type": "integer",
            "description": "Điểm tổng phù hợp 0-100"
        },
        "classification": {
            "type": "string",
            "enum": ["pass", "potential", "fail"],
            "description": "Xếp loại: pass (>=70), potential (50-69), fail (<50)"
        },
        "skills_analysis": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "description": "Điểm kỹ năng 0-100"},
                "matched": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách kỹ năng khớp với JD"
                },
                "missing": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách kỹ năng thiếu so với JD"
                },
                "details": {"type": "string", "description": "Nhận xét chi tiết về kỹ năng"}
            },
            "required": ["score", "matched", "missing", "details"]
        },
        "experience_analysis": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "description": "Điểm kinh nghiệm 0-100"},
                "years_total": {"type": "number", "description": "Tổng số năm kinh nghiệm"},
                "years_relevant": {"type": "number", "description": "Số năm kinh nghiệm liên quan"},
                "details": {"type": "string", "description": "Nhận xét chi tiết về kinh nghiệm"}
            },
            "required": ["score", "years_total", "years_relevant", "details"]
        },
        "education_analysis": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "description": "Điểm học vấn 0-100"},
                "details": {"type": "string", "description": "Nhận xét chi tiết về học vấn"}
            },
            "required": ["score", "details"]
        },
        "language_analysis": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "description": "Điểm ngôn ngữ 0-100"},
                "details": {"type": "string", "description": "Nhận xét chi tiết về ngôn ngữ"}
            },
            "required": ["score", "details"]
        },
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Danh sách điểm mạnh của ứng viên"
        },
        "weaknesses": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Danh sách điểm yếu của ứng viên"
        },
        "interview_questions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Danh sách câu hỏi phỏng vấn gợi ý"
        },
        "summary": {
            "type": "string",
            "description": "Tóm tắt đánh giá tổng thể"
        }
    },
    "required": [
        "candidate_name", "candidate_email", "candidate_phone", "overall_score", "classification",
        "skills_analysis", "experience_analysis", "education_analysis",
        "language_analysis", "strengths", "weaknesses",
        "interview_questions", "summary"
    ]
}


# ─── Load scoring rubric ────────────────────────────────────────────────────────

def load_scoring_rubric() -> str:
    """Load tiêu chí chấm điểm từ file resources/scoring_rubric.md"""
    rubric_path = Path(__file__).parent.parent / "resources" / "scoring_rubric.md"
    if rubric_path.exists():
        return rubric_path.read_text(encoding="utf-8")
    return ""


# ─── Gemini API ──────────────────────────────────────────────────────────────────

def create_client() -> genai.Client:
    """Tạo Gemini API client"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Chưa set GEMINI_API_KEY environment variable.")
        print("   Chạy: $env:GEMINI_API_KEY = 'your-api-key'  (PowerShell)")
        print("   Hoặc: export GEMINI_API_KEY='your-api-key'  (bash)")
        sys.exit(1)
    return genai.Client(api_key=api_key)


def read_cv_file(file_path: str) -> tuple[bytes, str]:
    """Đọc file CV (PDF, TXT, MD) và trả về (bytes, mime_type)"""
    path = Path(file_path)
    if not path.exists():
        print(f"❌ Không tìm thấy file: {file_path}")
        sys.exit(1)
    
    ext = path.suffix.lower()
    if ext == ".pdf":
        return path.read_bytes(), "application/pdf"
    elif ext in [".txt", ".md"]:
        return path.read_bytes(), "text/plain"
    else:
        print(f"❌ Hỗ trợ các định dạng CV: .pdf, .txt, .md. File hiện tại: {file_path}")
        sys.exit(1)


def read_jd(jd_input: str) -> str:
    """Đọc JD từ text hoặc file path"""
    path = Path(jd_input)
    if path.exists() and path.is_file():
        return path.read_text(encoding="utf-8")
    return jd_input


def analyze_single_cv(client: genai.Client, cv_path: str, jd_text: str, rubric: str) -> dict:
    """Phân tích 1 CV với JD"""
    cv_bytes, mime_type = read_cv_file(cv_path)
    cv_filename = Path(cv_path).name

    prompt = f"""Bạn là chuyên gia tuyển dụng HR. Hãy phân tích CV ứng viên dựa trên Job Description (JD) bên dưới.

## Job Description (JD):
{jd_text}

## Tiêu chí chấm điểm:
{rubric if rubric else "Dùng tiêu chí mặc định: Kỹ năng (35%), Kinh nghiệm (30%), Học vấn (20%), Ngôn ngữ (15%)"}

## Yêu cầu BẮT BUỘC:
1. Đọc kỹ CV đính kèm (file: {cv_filename}), bao gồm phần Header và thông tin liên hệ.
2. Trích xuất tên ứng viên (candidate_name).
3. BẮT BUỘC trích xuất chính xác email ứng viên (candidate_email) nếu có trong CV, nếu không tìm thấy để chuỗi rỗng "".
4. BẮT BUỘC trích xuất chính xác số điện thoại ứng viên (candidate_phone) nếu có trong CV (ví dụ: 0385 591 447, 0365472162, +84...), nếu không tìm thấy để chuỗi rỗng "".
5. So sánh CV với JD và chấm điểm từng hạng mục (0-100).
6. Tính điểm tổng theo trọng số.
7. Xếp loại: pass (>=70), potential (50-69), fail (<50).
8. Liệt kê điểm mạnh, điểm yếu.
9. Gợi ý 5 câu hỏi phỏng vấn bằng tiếng Việt.
10. Viết tóm tắt đánh giá bằng tiếng Việt.

Trả lời bằng tiếng Việt. Hãy khách quan và chi tiết."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=cv_bytes, mime_type=mime_type),
            prompt
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ANALYSIS_SCHEMA,
            temperature=0.3,
        )
    )

    try:
        result = json.loads(response.text)
        result["cv_file"] = cv_filename
        return result
    except json.JSONDecodeError:
        print(f"⚠️ Không parse được JSON response cho {cv_filename}")
        print(f"   Raw response: {response.text[:500]}")
        return {
            "candidate_name": "Unknown",
            "candidate_email": "",
            "candidate_phone": "",
            "cv_file": cv_filename,
            "overall_score": 0,
            "classification": "fail",
            "error": "Không parse được response từ AI",
            "raw_response": response.text[:1000]
        }


# ─── Output formatting ──────────────────────────────────────────────────────────

def format_single_result(result: dict) -> str:
    """Format kết quả đơn lẻ thành markdown"""
    classification_map = {
        "pass": "✅ Đạt",
        "potential": "⚠️ Tiềm năng",
        "fail": "❌ Không đạt"
    }
    cls = classification_map.get(result.get("classification", "fail"), "❓ Không xác định")

    contact_info = []
    if result.get("candidate_email"):
        contact_info.append(f"📧 **Email**: {result['candidate_email']}")
    if result.get("candidate_phone"):
        contact_info.append(f"📱 **SĐT**: {result['candidate_phone']}")
    contact_line = ("\n" + " | ".join(contact_info)) if contact_info else ""

    output = f"""
## 📋 Kết quả phân tích CV: {result.get('candidate_name', 'N/A')}
**File**: {result.get('cv_file', 'N/A')}{contact_line}

### 🎯 Điểm tổng: {result.get('overall_score', 0)}/100 — {cls}

| Hạng mục | Điểm | Nhận xét |
|----------|------|----------|
| 🛠️ Kỹ năng | {result.get('skills_analysis', {}).get('score', 0)}/100 | {result.get('skills_analysis', {}).get('details', 'N/A')} |
| 💼 Kinh nghiệm | {result.get('experience_analysis', {}).get('score', 0)}/100 | {result.get('experience_analysis', {}).get('details', 'N/A')} |
| 🎓 Học vấn | {result.get('education_analysis', {}).get('score', 0)}/100 | {result.get('education_analysis', {}).get('details', 'N/A')} |
| 🌐 Ngôn ngữ | {result.get('language_analysis', {}).get('score', 0)}/100 | {result.get('language_analysis', {}).get('details', 'N/A')} |
"""

    # Kỹ năng matched/missing
    skills = result.get("skills_analysis", {})
    if skills.get("matched"):
        output += f"\n**Kỹ năng khớp JD**: {', '.join(skills['matched'])}\n"
    if skills.get("missing"):
        output += f"**Kỹ năng thiếu**: {', '.join(skills['missing'])}\n"

    # Điểm mạnh
    output += "\n### ✅ Điểm mạnh\n"
    for s in result.get("strengths", []):
        output += f"- {s}\n"

    # Điểm yếu
    output += "\n### ⚠️ Điểm yếu\n"
    for w in result.get("weaknesses", []):
        output += f"- {w}\n"

    # Câu hỏi phỏng vấn
    output += "\n### 🔍 Gợi ý câu hỏi phỏng vấn\n"
    for i, q in enumerate(result.get("interview_questions", []), 1):
        output += f"{i}. {q}\n"

    # Tóm tắt
    output += f"\n### 📝 Tóm tắt\n{result.get('summary', 'N/A')}\n"

    return output


def format_batch_results(results: list) -> str:
    """Format kết quả batch thành markdown ranking table"""
    classification_map = {
        "pass": "✅ Đạt",
        "potential": "⚠️ Tiềm năng",
        "fail": "❌ Không đạt"
    }

    # Sort by score descending
    sorted_results = sorted(results, key=lambda x: x.get("overall_score", 0), reverse=True)

    output = "## 📊 Bảng xếp hạng ứng viên\n\n"
    output += "| # | Ứng viên | Email / SĐT | File CV | Điểm | Xếp loại | Kỹ năng | Kinh nghiệm | Học vấn | Ngôn ngữ |\n"
    output += "|---|----------|-------------|---------|------|----------|---------|-------------|---------|----------|\n"

    for i, r in enumerate(sorted_results, 1):
        cls = classification_map.get(r.get("classification", "fail"), "❓")
        contacts = []
        if r.get("candidate_email"):
            contacts.append(r["candidate_email"])
        if r.get("candidate_phone"):
            contacts.append(r["candidate_phone"])
        contact_str = "<br>".join(contacts) if contacts else "N/A"

        output += f"| {i} | {r.get('candidate_name', 'N/A')} | {contact_str} | {r.get('cv_file', 'N/A')} | **{r.get('overall_score', 0)}** | {cls} | {r.get('skills_analysis', {}).get('score', 0)} | {r.get('experience_analysis', {}).get('score', 0)} | {r.get('education_analysis', {}).get('score', 0)} | {r.get('language_analysis', {}).get('score', 0)} |\n"

    output += f"\n**Tổng cộng**: {len(results)} ứng viên\n"
    output += f"- ✅ Đạt: {sum(1 for r in results if r.get('classification') == 'pass')}\n"
    output += f"- ⚠️ Tiềm năng: {sum(1 for r in results if r.get('classification') == 'potential')}\n"
    output += f"- ❌ Không đạt: {sum(1 for r in results if r.get('classification') == 'fail')}\n"

    for i, r in enumerate(sorted_results, 1):
        cls = classification_map.get(r.get("classification", "fail"), "❓")
        output += f"| {i} | {r.get('candidate_name', 'N/A')} | {r.get('cv_file', 'N/A')} | **{r.get('overall_score', 0)}** | {cls} | {r.get('skills_analysis', {}).get('score', 0)} | {r.get('experience_analysis', {}).get('score', 0)} | {r.get('education_analysis', {}).get('score', 0)} | {r.get('language_analysis', {}).get('score', 0)} |\n"

    output += f"\n**Tổng cộng**: {len(results)} ứng viên\n"
    output += f"- ✅ Đạt: {sum(1 for r in results if r.get('classification') == 'pass')}\n"
    output += f"- ⚠️ Tiềm năng: {sum(1 for r in results if r.get('classification') == 'potential')}\n"
    output += f"- ❌ Không đạt: {sum(1 for r in results if r.get('classification') == 'fail')}\n"

    # Chi tiết từng ứng viên
    output += "\n---\n"
    for r in sorted_results:
        output += format_single_result(r)
        output += "\n---\n"

    return output


# ─── Main ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="HR CV Screening Agent — Phân tích CV ứng viên dựa trên JD"
    )
    parser.add_argument(
        "--cv", nargs="+", required=True,
        help="Đường dẫn file CV (PDF). Có thể truyền nhiều file cho batch mode."
    )
    parser.add_argument(
        "--jd", required=True,
        help="Nội dung JD (text trực tiếp) hoặc đường dẫn file JD."
    )
    parser.add_argument(
        "--output", default=None,
        help="Đường dẫn file output (JSON). Mặc định in ra stdout."
    )
    parser.add_argument(
        "--format", choices=["json", "markdown"], default="json",
        help="Format output: json hoặc markdown. Mặc định: json"
    )

    args = parser.parse_args()

    # Init
    client = create_client()
    jd_text = read_jd(args.jd)
    rubric = load_scoring_rubric()

    print(f"🔍 Đang phân tích {len(args.cv)} CV...\n", file=sys.stderr)

    # Analyze
    results = []
    for i, cv_path in enumerate(args.cv, 1):
        print(f"  [{i}/{len(args.cv)}] Phân tích: {Path(cv_path).name}...", file=sys.stderr)
        result = analyze_single_cv(client, cv_path, jd_text, rubric)
        results.append(result)
        print(f"  ✓ {result.get('candidate_name', 'N/A')} — {result.get('overall_score', 0)}/100", file=sys.stderr)

    print(f"\n✅ Hoàn tất phân tích {len(results)} CV.\n", file=sys.stderr)

    # Output
    if args.format == "markdown":
        if len(results) == 1:
            output_text = format_single_result(results[0])
        else:
            output_text = format_batch_results(results)
    else:
        output_text = json.dumps(
            results if len(results) > 1 else results[0],
            ensure_ascii=False,
            indent=2
        )

    if args.output:
        Path(args.output).write_text(output_text, encoding="utf-8")
        print(f"📁 Kết quả đã lưu vào: {args.output}", file=sys.stderr)
    else:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        print(output_text)


if __name__ == "__main__":
    main()

