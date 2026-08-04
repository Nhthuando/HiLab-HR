import Link from "next/link";
import { 
  FileSearch, 
  Files, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  ArrowRight,
  Terminal,
  Brain
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-zinc-800/80">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Trợ Lý Tuyển Dụng & Sàng Lọc CV Thông Minh</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Trợ lý AI Lọc CV & <br />
            <span className="gradient-text">Chấm Điểm Ứng Viên Khớp JD</span>
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
            Giải pháp dành cho nhân sự Back Office (HR): Upload CV PDF, nhập Job Description và nhận kết quả phân tích chuyên sâu tự động bằng AI trong vài giây.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white gradient-button shadow-lg shadow-indigo-500/20"
            >
              <FileSearch className="w-5 h-5" />
              <span>Phân tích 1 CV ngay</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/analyze/batch"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors"
            >
              <Files className="w-5 h-5 text-indigo-400" />
              <span>Phân tích Hàng loạt (Batch)</span>
            </Link>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800/80 text-xs">
            <div>
              <span className="block text-zinc-500">Tốc độ xử lý</span>
              <span className="text-sm font-semibold text-white">5 - 15 giây/CV</span>
            </div>
            <div>
              <span className="block text-zinc-500">Tiêu chí đánh giá</span>
              <span className="text-sm font-semibold text-white">4 Hạng mục chuẩn</span>
            </div>
            <div>
              <span className="block text-zinc-500">Định dạng file</span>
              <span className="text-sm font-semibold text-white">PDF Native</span>
            </div>
            <div>
              <span className="block text-zinc-500">Tính năng nâng cao</span>
              <span className="text-sm font-semibold text-white">Gợi ý 5 câu hỏi PV</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Solution Section (Agent/Skill vs Web UI) */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white">2 Cách Tiếp Cận Linh Hoạt</h2>
          <p className="text-zinc-400 text-sm">
            Hỗ trợ vừa chạy trực tiếp qua công cụ dòng lệnh (CLI/IDE) cho kỹ thuật viên, vừa có Web App trực quan cho chuyên viên tuyển dụng HR.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: IDE Agent Skill */}
          <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                Skill trong IDE
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">1. Chế Độ CLI & IDE Skill (`SKILL.md`)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Skill độc lập nằm tại thư mục <code className="text-indigo-400 font-mono">.agents/skills/hr-cv-screening</code>. Developer chỉ cần chỉ định file CV và JD trong chat IDE để Agent tự đọc file, gọi Python script và xuất bảng markdown.
            </p>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 space-y-1">
              <div className="text-zinc-500"># Chạy script Python từ Agent:</div>
              <div className="text-indigo-300">python analyze_cv.py --cv candidate.pdf --jd jd.md</div>
            </div>
          </div>

          {/* Card 2: Web App */}
          <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700 text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
                Web App (Vercel)
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">2. Giao Diện Web App Cho Non-Tech</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Giao diện người dùng trực quan cho nhân sự HR. Upload kéo thả CV PDF, xem biểu đồ điểm số 4 hạng mục, phân tích điểm mạnh/yếu, xếp hạng ứng viên và xuất file CSV dễ dàng.
            </p>

            <div className="flex gap-2">
              <Link
                href="/analyze"
                className="flex-1 py-2 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Trải nghiệm Web App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Các Tính Năng Cốt Lõi</h2>
          <p className="text-zinc-400 text-sm">
            Quy trình sàng lọc CV hoàn chỉnh với tiêu chuẩn đánh giá minh bạch
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Chấm Điểm 4 Hạng Mục</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Đánh giá chi tiết Kỹ năng (35%), Kinh nghiệm (30%), Học vấn (20%) và Ngôn ngữ (15%) với điểm số từ 0 đến 100.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Highlight Điểm Mạnh & Yếu</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tự động bóc tách các kỹ năng khớp JD và các khoảng trống (gaps) ứng viên còn thiếu để HR dễ ra quyết định.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Gợi Ý Câu Hỏi Phỏng Vấn</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tự động sinh ra 5 câu hỏi phỏng vấn đào sâu vào kinh nghiệm và điểm yếu riêng của từng CV ứng viên.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Files className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Phân Tích Hàng Loạt (Batch)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload cùng lúc nhiều CV PDF để AI tự động chấm điểm, tạo bảng xếp hạng Ranking và chọn ứng viên tốt nhất.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Xuất Báo Cáo CSV</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Xuất dữ liệu kết quả chấm điểm ra file CSV / Excel chỉ với 1 cú click để gửi cho Trưởng phòng Tuyển dụng.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Lịch Sử & Xuất CSV</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tự động lưu mọi kết quả phân tích vào trình duyệt. Xuất báo cáo CSV đầy đủ thông tin (Email, SĐT, điểm số) chỉ với 1 click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
