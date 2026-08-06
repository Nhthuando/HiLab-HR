import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SkillConfig, AICopilotRequest, AICopilotResponse, SkillWeights } from "@/lib/types/skill";
import { DEFAULT_HR_SKILL } from "@/lib/defaultSkill";

const aiCopilotResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    replyMessage: {
      type: Type.STRING,
      description: "Tin nhắn phản hồi thân thiện, súc tích bằng tiếng Việt giải thích cho người dùng về các thay đổi vừa thực hiện.",
    },
    changes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách tóm tắt từng thay đổi cụ thể đã thực hiện (ví dụ: 'Tăng trọng số Kỹ năng từ 35% lên 40%', 'Bổ sung tiêu chí chứng chỉ AWS').",
    },
    updatedSkill: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Tên của bộ skill (được cập nhật nếu người dùng muốn đổi tên hoặc định hướng vị trí mới).",
        },
        description: {
          type: Type.STRING,
          description: "Mô tả ngắn gọn về bộ skill.",
        },
        roleInstructions: {
          type: Type.STRING,
          description: "Chỉ dẫn vai trò và nguyên tắc chung của AI khi chấm điểm CV.",
        },
        scoringRubric: {
          type: Type.STRING,
          description: "Nội dung Markdown chi tiết của bộ tiêu chí chấm điểm (scoring_rubric.md bao gồm 4 mục và các thang điểm).",
        },
        skillDocument: {
          type: Type.STRING,
          description: "Nội dung Markdown đầy đủ của file SKILL.md (bao gồm frontmatter, role, quy trình 3 bước, bảng xếp hạng).",
        },
        weights: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.INTEGER, description: "Trọng số phần Kỹ năng (0-100)" },
            experience: { type: Type.INTEGER, description: "Trọng số phần Kinh nghiệm (0-100)" },
            education: { type: Type.INTEGER, description: "Trọng số phần Học vấn (0-100)" },
            language: { type: Type.INTEGER, description: "Trọng số phần Ngôn ngữ (0-100)" },
          },
          required: ["skills", "experience", "education", "language"],
        },
      },
      required: ["name", "description", "roleInstructions", "scoringRubric", "skillDocument", "weights"],
    },
  },
  required: ["replyMessage", "changes", "updatedSkill"],
};

function normalizeWeights(raw: SkillWeights): SkillWeights {
  let sk = Number(raw.skills) || 0;
  let ex = Number(raw.experience) || 0;
  let ed = Number(raw.education) || 0;
  let la = Number(raw.language) || 0;

  const sum = sk + ex + ed + la;
  if (sum === 100) return { skills: sk, experience: ex, education: ed, language: la };

  if (sum <= 0) {
    return { skills: 35, experience: 30, education: 20, language: 15 };
  }

  // Proportionally scale to 100
  sk = Math.round((sk / sum) * 100);
  ex = Math.round((ex / sum) * 100);
  ed = Math.round((ed / sum) * 100);
  la = 100 - (sk + ex + ed);

  if (la < 0) {
    ed += la;
    la = 0;
  }

  return { skills: sk, experience: ex, education: ed, language: la };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY chưa được cấu hình trên server." },
        { status: 500 }
      );
    }

    const body: AICopilotRequest = await req.json();
    const { currentSkill, userMessage, chatHistory } = body;

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung yêu cầu chỉnh sửa." },
        { status: 400 }
      );
    }

    const baseSkill: SkillConfig = currentSkill || DEFAULT_HR_SKILL;

    const systemPrompt = `Bạn là Chuyên gia Tuyển dụng Cao cấp (Lead Technical Talent Acquisition Partner) và Kỹ sư Thiết kế Hệ thống Đánh giá Nhân sự (Enterprise HR Screening Architect) hàng đầu.
Nhiệm vụ của bạn là lắng nghe ý tưởng, yêu cầu tuyển dụng hoặc điều chỉnh từ người dùng để thiết kế hoặc nâng cấp BỘ SKILL SÀNG LỌC CV ĐẠT CHUẨN DOANH NGHIỆP CỰC KỲ CHI TIẾT, CHUYÊN NGHIỆP VÀ UY TÍN.

⚠️ NGUYÊN TẮC CHẤT LƯỢNG CAO CẤP (BẮT BUỘC):
- TUYỆT ĐỐI KHÔNG VIẾT SƠ SÀI, KHÔNG TÓM TẮT CỤT LỦN 2-3 DÒNG.
- Mọi nội dung tạo ra (cả Scoring Rubric lẫn SKILL.md) phải là tài liệu Markdown đầy đủ, chuẩn chỉnh, có chiều sâu chuyên môn thực tế của ngành/vị trí tương ứng (ví dụ: Business Analyst, Frontend, Backend, DevOps, Data Scientist, QA/QC, Product Manager...).

================================================================================
YÊU CẦU CHI TIẾT TỪNG PHẦN:
================================================================================

1. PHÂN BỔ TRỌNG SỐ (WEIGHTS) — TỔNG BẮT BUỘC 100%:
   - Phải tự động suy luận phân bổ 4 trọng số (skills, experience, education, language) phù hợp với cấp bậc và vị trí:
     * Business Analyst (BA): Kỹ năng 35-40%, Kinh nghiệm 30-35%, Ngoại ngữ 15-20%, Học vấn 10-15%.
     * Tech Lead / Senior Dev: Kinh nghiệm 40%, Kỹ năng 35%, Ngoại ngữ 15%, Học vấn 10%.
     * Fresher / Junior: Kỹ năng 40%, Học vấn 30%, Kinh nghiệm 15%, Ngoại ngữ 15%.
     * Product Manager (PM): Kinh nghiệm 35%, Kỹ năng 35%, Ngoại ngữ 20%, Học vấn 10%.

2. NỘI DUNG SCORING RUBRIC (scoring_rubric.md) — BỘ TIÊU CHUẨN PHÁP LỆNH CHI TIẾT (TỐI THIỂU 40-70 DÒNG):
   Trình bày dạng Markdown chuyên nghiệp gồm cấu trúc chuẩn:
   - # Tiêu Chuẩn Đánh Giá & Chấm Điểm CV [Tên Vị Trí] — Scoring Rubric
   - ## 1. Phân bổ Trọng số Mặc định (Weights)
   - ## 2. Tiêu chuẩn Chấm điểm Chi tiết Từng Hạng mục (Thang 0-100):
     * ### 🛠️ Kỹ năng Chuyên môn (Skills) — Trọng số X%:
       - Liệt kê cụ thể [🔴 Must-Have (Bắt buộc)] và [🟡 Preferred (Điểm cộng)] đặc thù cho vị trí (Ví dụ BA: SQL, Jira, BPMN, UML, BRD/SRS, Wireframing, Data Modeling; ví dụ Dev: React, Node, Docker, CI/CD...).
       - Đủ 4 khung điểm: 90-100 (Xuất sắc), 70-89 (Đạt chuẩn), 50-69 (Tiềm năng), <50 (Không đạt).
     * ### 💼 Kinh nghiệm Thực chiến (Experience) — Trọng số X%:
       - Số năm kinh nghiệm, quy mô dự án (Doanh nghiệp, E-commerce, Banking, Startup...), vai trò và thành tích định lượng (metrics, KPI, impact).
       - Đủ 4 khung điểm (90-100, 70-89, 50-69, <50).
     * ### 🎓 Học vấn & Chứng chỉ (Education & Certifications) — Trọng số X%:
       - Bằng cấp chính quy (CNTT, HTTT, Kinh tế, QTKD...) và các CHỨNG CHỈ NGHỀ NGHIỆP QUỐC TẾ giá trị cao (Ví dụ BA: CBAP, CCBA, ECBA, PMI-PBA, CSPO; ví dụ Cloud: AWS SAA, GCP, Azure...).
       - Đủ 4 khung điểm.
     * ### 🌐 Ngoại ngữ & Kỹ năng Mềm (Language & Soft Skills) — Trọng số X%:
       - Khả năng giao tiếp, viết tài liệu nghiệp vụ/kỹ thuật bằng tiếng Anh, kỹ năng làm việc với Stakeholders, kỹ năng đàm phán và giải quyết xung đột.
       - Đủ 4 khung điểm.
   - ## 3. Quy tắc Đánh giá & Xử lý Ngoại lệ (Disqualification & Penalty Rules):
     - Quy tắc bằng chứng thực tế (Evidence Rule).
     - Quy tắc phạt điểm thiếu Must-Have và ghi nhận must_have_gaps.

3. NỘI DUNG FILE SKILL (SKILL.md) — QUY TRÌNH AGENT HOÀN CHỈNH (TỐI THIỂU 45-70 DÒNG):
   - YAML frontmatter: \`name\` (dạng slug kebab-case) và \`description\` súc tích.
   - Tiêu đề: # HR CV Screening Agent — [Tên Vị Trí]
   - Giới thiệu Persona Chuyên gia Tuyển dụng AI chuyên sâu cho vị trí.
   - Mục "Khi nào dùng Skill này" (4-5 bullet points).
   - Mục "Nguyên Tắc Hoạt Động Cốt Lõi" (3 nguyên tắc: Tuân thủ Rubric, Bằng chứng thực tế, Phân tách Must-Have/Preferred).
   - Mục "Quy trình 4 Bước Phân Tích Chuẩn":
     * Bước 1: Tiếp nhận & Bóc tách Yêu cầu JD đặc thù vị trí.
     * Bước 2: Đối soát & Đánh giá theo Scoring Rubric.
     * Bước 3: Tính toán Điểm số & Xếp loại Ứng viên (Pass >= 70, Potential 50-69, Fail < 50).
     * Bước 4: Lập Báo cáo Đánh giá & Bộ câu hỏi phỏng vấn (Chuyên môn + Case Study tình huống).
   - Mục "Mẫu Báo Cáo Đầu Ra Chuẩn" (Bao gồm bảng điểm 4 mục, điểm mạnh, lỗ hổng gaps, câu hỏi phỏng vấn, tóm tắt).

4. PHẢN HỒI THÂN THIỆN:
   - Trong \`replyMessage\`: giải thích súc tích, chuyên nghiệp bằng tiếng Việt về định hướng và lý do điều chỉnh cho vị trí.
   - Trong \`changes\`: liệt kê gạch đầu dòng rõ từng điểm cải tiến chuyên môn đã áp dụng.`;

    const userPromptContent = `## BỘ SKILL HIỆN TẠI:
- Tên: ${baseSkill.name}
- Mô tả: ${baseSkill.description}
- Trọng số hiện tại: Kỹ năng ${baseSkill.weights.skills}%, Kinh nghiệm ${baseSkill.weights.experience}%, Học vấn ${baseSkill.weights.education}%, Ngôn ngữ ${baseSkill.weights.language}%

## NỘI DUNG SCORING RUBRIC HIỆN TẠI (scoring_rubric.md):
${baseSkill.scoringRubric}

## NỘI DUNG SKILL.MD HIỆN TẠI:
${baseSkill.skillDocument || DEFAULT_HR_SKILL.skillDocument}

## CHỈ DẪN VAI TRÒ HIỆN TẠI:
${baseSkill.roleInstructions}

${
  chatHistory && chatHistory.length > 0
    ? `## LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n` +
      chatHistory.slice(-4).map((h) => `${h.role === "user" ? "Người dùng" : "Co-pilot"}: ${h.content}`).join("\n") +
      "\n\n"
    : ""
}
## YÊU CẦU MỚI TỪ NGƯỜI DÙNG:
"${userMessage}"

Hãy thiết kế một bản cập nhật HOÀN CHỈNH, CHUYÊN SÂU, ĐẦY ĐỦ CÁC MỤC VÀ KHUNG ĐIỂM (không tóm tắt ngắn, không lược bỏ chi tiết) theo đúng tiêu chuẩn Doanh nghiệp cấp cao.`;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { text: `${systemPrompt}\n\n${userPromptContent}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: aiCopilotResponseSchema,
        temperature: 0.35,
      },
    });

    if (!response.text) {
      throw new Error("Không nhận được phản hồi từ AI Co-pilot.");
    }

    const parsed = JSON.parse(response.text);

    // Normalize weights to guarantee 100%
    const normalizedWeights = normalizeWeights(parsed.updatedSkill.weights);

    const updatedSkill: SkillConfig = {
      id: baseSkill.id,
      name: parsed.updatedSkill.name || baseSkill.name,
      description: parsed.updatedSkill.description || baseSkill.description,
      roleInstructions: parsed.updatedSkill.roleInstructions || baseSkill.roleInstructions,
      scoringRubric: parsed.updatedSkill.scoringRubric || baseSkill.scoringRubric,
      skillDocument: parsed.updatedSkill.skillDocument || baseSkill.skillDocument || DEFAULT_HR_SKILL.skillDocument,
      weights: normalizedWeights,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };

    const result: AICopilotResponse = {
      success: true,
      replyMessage: parsed.replyMessage,
      changes: parsed.changes || [],
      updatedSkill,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API] /api/skills/ai-edit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Đã xảy ra lỗi khi xử lý yêu cầu chỉnh sửa Skill.",
      },
      { status: 500 }
    );
  }
}
