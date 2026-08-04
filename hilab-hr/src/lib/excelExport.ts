import ExcelJS from "exceljs";
import { StoredAnalysis, extractJdInfo } from "./localStorage";

/**
 * Xuất dữ liệu đánh giá CV ra file Excel (.xlsx) chuyên nghiệp
 * - Bảng màu hiện đại (Indigo/Navy Header)
 * - Đường viền (Border) mỏng sắc nét trên toàn bộ các ô
 * - Phân loại màu sắc trực quan: Đạt (Xanh lá), Tiềm năng (Vàng hổ phách), Không đạt (Hồng đỏ)
 * - Khối tóm tắt thông tin Job Description (JD Summary Box)
 * - 2 Sheet: Sheet 1 (Bảng Xếp Hạng & Đánh Giá Tổng Quan), Sheet 2 (Gợi Ý Câu Hỏi Phỏng Vấn & Chi Tiết)
 */
export async function exportAnalysesToExcel(
  analyses: StoredAnalysis[],
  defaultJdText?: string
): Promise<void> {
  if (!analyses || analyses.length === 0) {
    alert("Không có dữ liệu ứng viên để xuất báo cáo.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HiLab-HR AI Screening System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ───────────────────────────────────────────────────────────────────────────
  // Tính toán các chỉ số thống kê tổng hợp
  // ───────────────────────────────────────────────────────────────────────────
  const totalCount = analyses.length;
  const passCount = analyses.filter((a) => a.result.classification === "pass").length;
  const potentialCount = analyses.filter((a) => a.result.classification === "potential").length;
  const failCount = analyses.filter((a) => a.result.classification === "fail").length;
  const passRate = Math.round((passCount / totalCount) * 100);
  const avgScore = Math.round(
    analyses.reduce((acc, curr) => acc + (curr.result.overall_score || 0), 0) / totalCount
  );

  // Lấy thông tin JD tổng hợp từ bản ghi đầu tiên hoặc tham số truyền vào
  const representativeJd =
    analyses.find((a) => a.jdText)?.jdText ||
    defaultJdText ||
    analyses.find((a) => a.jdSummary)?.jdSummary ||
    "";
  const parsedJd = extractJdInfo(representativeJd);
  const displayJdTitle =
    analyses.find((a) => a.jdTitle)?.jdTitle || parsedJd.jdTitle || "Vị trí chuyên môn";
  const displayJdSummary =
    analyses.find((a) => a.jdSummary)?.jdSummary ||
    parsedJd.jdSummary ||
    "Đánh giá năng lực ứng viên dựa trên 4 tiêu chí cốt lõi: Kỹ năng (35%), Kinh nghiệm (30%), Học vấn (20%), Ngôn ngữ (15%).";

  // Palette màu chuẩn Corporate / Executive
  const PALETTE = {
    navyDark: "FF0F172A",     // Slate 900
    navyMedium: "FF1E293B",   // Slate 800
    navyLight: "FF334155",    // Slate 700
    indigoPrimary: "FF4338CA",// Indigo 700
    indigoLight: "FFE0E7FF",  // Indigo 100
    indigoDarkText: "FF3730A3", // Indigo 800
    bgZebra: "FFF8FAFC",      // Slate 50
    bgWhite: "FFFFFFFF",
    borderColor: "FFCBD5E1",  // Slate 300
    borderHeader: "FF94A3B8", // Slate 400
    // Status colors
    passBg: "FFDCFCE7",       // Green 100
    passText: "FF166534",     // Green 800
    potentialBg: "FFFEF3C7",  // Amber 100
    potentialText: "FF92400E",// Amber 800
    failBg: "FFFEE2E2",       // Red 100
    failText: "FF991B1B",     // Red 800
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: PALETTE.borderColor } },
    left: { style: "thin", color: { argb: PALETTE.borderColor } },
    bottom: { style: "thin", color: { argb: PALETTE.borderColor } },
    right: { style: "thin", color: { argb: PALETTE.borderColor } },
  };

  const classificationLabel = (cls: string) => {
    switch (cls) {
      case "pass":
        return "ĐẠT (PASS)";
      case "potential":
        return "TIỀM NĂNG";
      default:
        return "KHÔNG ĐẠT";
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: BẢNG XẾP HẠNG & ĐÁNH GIÁ TỔNG QUAN
  // ═══════════════════════════════════════════════════════════════════════════
  const ws1 = workbook.addWorksheet("1. Xếp Hạng Ứng Viên", {
    views: [{ showGridLines: true }],
  });

  // Định nghĩa độ rộng cột (18 cột từ A đến R)
  ws1.columns = [
    { key: "stt", width: 7 },              // A
    { key: "analyzedAt", width: 18 },       // B
    { key: "jdTitle", width: 22 },          // C: Vị trí JD
    { key: "name", width: 24 },             // D: Tên ứng viên
    { key: "email", width: 26 },            // E: Email
    { key: "phone", width: 16 },            // F: SĐT
    { key: "fileName", width: 22 },         // G: File CV
    { key: "overallScore", width: 13 },     // H: Điểm tổng
    { key: "classification", width: 16 },   // I: Xếp loại
    { key: "skillScore", width: 14 },       // J: Kỹ năng (35%)
    { key: "expScore", width: 16 },         // K: Kinh nghiệm (30%)
    { key: "eduScore", width: 14 },         // L: Học vấn (20%)
    { key: "langScore", width: 14 },        // M: Ngôn ngữ (15%)
    { key: "matchedSkills", width: 30 },    // N: Kỹ năng khớp
    { key: "missingSkills", width: 26 },    // O: Kỹ năng thiếu
    { key: "strengths", width: 34 },        // P: Điểm mạnh
    { key: "weaknesses", width: 34 },       // Q: Điểm yếu
    { key: "summary", width: 44 },          // R: Tóm tắt đánh giá
  ];

  const totalColLetter = "R";

  // Row 1: Title Banner
  ws1.mergeCells(`A1:${totalColLetter}1`);
  const titleCell = ws1.getCell("A1");
  titleCell.value = "BÁO CÁO KẾT QUẢ SÀNG LỌC & ĐÁNH GIÁ CV ỨNG VIÊN — HILAB HR";
  titleCell.font = { name: "Segoe UI", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.navyDark } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws1.getRow(1).height = 38;

  // Row 2: Subtitle & KPI Metrics
  ws1.mergeCells(`A2:${totalColLetter}2`);
  const metaCell = ws1.getCell("A2");
  metaCell.value = `Thời gian xuất: ${new Date().toLocaleString("vi-VN")}  |  Tổng số hồ sơ: ${totalCount}  |  Tỷ lệ Đạt: ${passRate}% (${passCount} Đạt, ${potentialCount} Tiềm năng, ${failCount} Loại)  |  Điểm trung bình: ${avgScore}/100`;
  metaCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FFE2E8F0" } };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.navyMedium } };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };
  ws1.getRow(2).height = 24;

  // Row 3: Blank separator
  ws1.getRow(3).height = 8;

  // Row 4 & 5: Job Description Summary Box
  ws1.mergeCells(`A4:${totalColLetter}4`);
  const jdHeaderCell = ws1.getCell("A4");
  jdHeaderCell.value = `📋 THÔNG TIN VỊ TRÍ TUYỂN DỤNG & YÊU CẦU CÔNG VIỆC (JOB DESCRIPTION)`;
  jdHeaderCell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: PALETTE.indigoDarkText } };
  jdHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.indigoLight } };
  jdHeaderCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws1.getRow(4).height = 24;

  ws1.mergeCells(`A5:${totalColLetter}5`);
  const jdContentCell = ws1.getCell("A5");
  jdContentCell.value = `• Vị trí trọng tâm: ${displayJdTitle}\n• Tóm tắt yêu cầu JD: ${displayJdSummary}`;
  jdContentCell.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1E293B" } };
  jdContentCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  jdContentCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true, indent: 1 };
  jdContentCell.border = thinBorder;
  ws1.getRow(5).height = 36;

  // Row 6: Blank separator
  ws1.getRow(6).height = 8;

  // Row 7: Main Table Headers
  const headers = [
    "STT",
    "Ngày phân tích",
    "Vị trí tuyển dụng",
    "Họ & Tên ứng viên",
    "Email liên hệ",
    "Số điện thoại",
    "File CV gốc",
    "Điểm tổng",
    "Xếp loại",
    "Kỹ năng (35%)",
    "Kinh nghiệm (30%)",
    "Học vấn (20%)",
    "Ngôn ngữ (15%)",
    "Kỹ năng khớp JD",
    "Kỹ năng còn thiếu",
    "Điểm mạnh nổi bật",
    "Điểm cần cải thiện",
    "Tóm tắt nhận xét HR",
  ];

  const headerRow = ws1.getRow(7);
  headerRow.height = 32;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.indigoPrimary } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: PALETTE.borderHeader } },
      bottom: { style: "medium", color: { argb: PALETTE.borderHeader } },
      left: { style: "thin", color: { argb: PALETTE.borderHeader } },
      right: { style: "thin", color: { argb: PALETTE.borderHeader } },
    };
  });

  // Populate Data Rows
  let currentRowIdx = 8;
  analyses.forEach((item, index) => {
    const r = item.result;
    const isEven = index % 2 === 0;
    const rowBg = isEven ? PALETTE.bgWhite : PALETTE.bgZebra;
    const row = ws1.getRow(currentRowIdx);
    row.height = 42;

    const rowJdTitle = item.jdTitle || extractJdInfo(item.jdText || "").jdTitle || displayJdTitle;

    const rowValues = [
      index + 1,
      new Date(item.analyzedAt).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rowJdTitle,
      r.candidate_name || "Chưa rõ",
      r.candidate_email || "—",
      r.candidate_phone || "—",
      item.cvFileName,
      r.overall_score || 0,
      classificationLabel(r.classification),
      r.skills_analysis?.score ?? 0,
      r.experience_analysis?.score ?? 0,
      r.education_analysis?.score ?? 0,
      r.language_analysis?.score ?? 0,
      (r.skills_analysis?.matched ?? []).join("; "),
      (r.skills_analysis?.missing ?? []).join("; "),
      (r.strengths ?? []).join("; "),
      (r.weaknesses ?? []).join("; "),
      r.summary || "—",
    ];

    rowValues.forEach((val, valIdx) => {
      const cell = row.getCell(valIdx + 1);
      cell.value = val;
      cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1E293B" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = thinBorder;

      // Căn chỉnh theo loại cột
      if ([0, 1, 5, 7, 8, 9, 10, 11, 12].includes(valIdx)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      }

      // Format đặc biệt cho STT
      if (valIdx === 0) {
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF475569" } };
      }

      // Format Tên ứng viên
      if (valIdx === 3) {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
      }

      // Format Điểm tổng
      if (valIdx === 7) {
        const score = Number(val);
        cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: score >= 70 ? "FF166534" : score >= 50 ? "FF92400E" : "FF991B1B" } };
      }

      // Format Xếp loại (Status Badge Fill)
      if (valIdx === 8) {
        const cls = r.classification;
        let badgeBg = PALETTE.failBg;
        let badgeText = PALETTE.failText;
        if (cls === "pass") {
          badgeBg = PALETTE.passBg;
          badgeText = PALETTE.passText;
        } else if (cls === "potential") {
          badgeBg = PALETTE.potentialBg;
          badgeText = PALETTE.potentialText;
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: badgeBg } };
        cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: badgeText } };
      }
    });

    currentRowIdx++;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: CHI TIẾT & GỢI Ý CÂU HỎI PHỎNG VẤN
  // ═══════════════════════════════════════════════════════════════════════════
  const ws2 = workbook.addWorksheet("2. Gợi Ý Phỏng Vấn", {
    views: [{ showGridLines: true }],
  });

  ws2.columns = [
    { key: "stt", width: 7 },             // A
    { key: "name", width: 24 },            // B
    { key: "classification", width: 16 },  // C
    { key: "score", width: 12 },           // D
    { key: "jdTitle", width: 22 },         // E
    { key: "questions", width: 65 },       // F: 5 câu hỏi phỏng vấn
    { key: "notes", width: 45 },           // G: Gợi ý trọng tâm phỏng vấn
  ];

  // Header Sheet 2
  ws2.mergeCells("A1:G1");
  const s2Title = ws2.getCell("A1");
  s2Title.value = "BẢNG GỢI Ý CÂU HỎI PHỎNG VẤN & TRỌNG TÂM ĐÁNH GIÁ ỨNG VIÊN";
  s2Title.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  s2Title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.navyDark } };
  s2Title.alignment = { vertical: "middle", horizontal: "center" };
  ws2.getRow(1).height = 36;

  ws2.mergeCells("A2:G2");
  const s2Sub = ws2.getCell("A2");
  s2Sub.value = "Tài liệu phục vụ Hội đồng Tuyển dụng và HR đặt câu hỏi chuyên sâu kiểm chứng năng lực thực tế.";
  s2Sub.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FFE2E8F0" } };
  s2Sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.navyMedium } };
  s2Sub.alignment = { vertical: "middle", horizontal: "center" };
  ws2.getRow(2).height = 22;

  ws2.getRow(3).height = 8;

  const s2Headers = [
    "STT",
    "Ứng viên",
    "Xếp loại",
    "Điểm",
    "Vị trí ứng tuyển",
    "Gợi ý 5 câu hỏi phỏng vấn chuyên sâu (Từ AI)",
    "Trọng tâm cần làm rõ khi phỏng vấn",
  ];

  const s2HeaderRow = ws2.getRow(4);
  s2HeaderRow.height = 30;
  s2Headers.forEach((h, idx) => {
    const cell = s2HeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.indigoPrimary } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = thinBorder;
  });

  let s2RowIdx = 5;
  analyses.forEach((item, index) => {
    const r = item.result;
    const isEven = index % 2 === 0;
    const rowBg = isEven ? PALETTE.bgWhite : PALETTE.bgZebra;
    const row = ws2.getRow(s2RowIdx);
    row.height = 80;

    const questionsFormatted = (r.interview_questions || [])
      .map((q, qIdx) => `${qIdx + 1}. ${q.replace(/^\d+[\.\)]\s*/, "")}`)
      .join("\n\n");

    const notesFormatted = `• Điểm mạnh: ${(r.strengths || []).join(", ")}\n• Cần kiểm chứng: ${(r.weaknesses || []).join(", ")}`;
    const rowJdTitle = item.jdTitle || extractJdInfo(item.jdText || "").jdTitle || displayJdTitle;

    const values = [
      index + 1,
      r.candidate_name || "Chưa rõ",
      classificationLabel(r.classification),
      r.overall_score,
      rowJdTitle,
      questionsFormatted || "Chưa có danh sách câu hỏi phỏng vấn.",
      notesFormatted,
    ];

    values.forEach((val, valIdx) => {
      const cell = row.getCell(valIdx + 1);
      cell.value = val;
      cell.font = { name: "Segoe UI", size: 9.5, color: { argb: "FF1E293B" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = thinBorder;

      if ([0, 2, 3].includes(valIdx)) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      }

      if (valIdx === 1) {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      if (valIdx === 2) {
        const cls = r.classification;
        const badgeBg = cls === "pass" ? PALETTE.passBg : cls === "potential" ? PALETTE.potentialBg : PALETTE.failBg;
        const badgeText = cls === "pass" ? PALETTE.passText : cls === "potential" ? PALETTE.potentialText : PALETTE.failText;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: badgeBg } };
        cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: badgeText } };
      }
    });

    s2RowIdx++;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Xuất file tải xuống trình duyệt
  // ───────────────────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `HiLab-HR_BaoCao_SangLocCV_${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
