"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Sliders,
  FileCode,
  RotateCcw,
  Save,
  Plus,
  Copy,
  Trash2,
  Send,
  Loader2,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Undo2,
  Wand2,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Info,
} from "lucide-react";
import { SkillConfig, SkillWeights, AICopilotMessage, AICopilotResponse } from "@/lib/types/skill";
import { DEFAULT_HR_SKILL } from "@/lib/defaultSkill";
import {
  getSavedPresets,
  savePreset,
  deletePreset,
  duplicatePreset,
  createNewPreset,
  getActivePresetId,
  setActivePresetId,
} from "@/lib/skillStorage";

const QUICK_SUGGESTIONS = [
  "Tạo bộ tiêu chí Senior Fullstack React/Node.js (5+ năm kinh nghiệm)",
  "Tối ưu cho Fresher AI Engineer / Data Science mới ra trường",
  "Tăng trọng số Kỹ năng lên 40%, giảm học vấn xuống 15%",
  "Bổ sung tiêu chí bắt buộc về Docker, Kubernetes và Microservices",
  "Bộ tiêu chí Global Developer yêu cầu IELTS 7.0+ & Agile/Scrum",
  "Ưu tiên ứng viên có chứng chỉ AWS Solution Architect hoặc CKA",
];

export default function SkillStudioPage() {
  const [presets, setPresets] = useState<SkillConfig[]>([]);
  const [activeSkill, setActiveSkill] = useState<SkillConfig>(DEFAULT_HR_SKILL);
  const [previousSkill, setPreviousSkill] = useState<SkillConfig | null>(null);

  // Tabs (Weights & Documents)
  const [activeTab, setActiveTab] = useState<"weights" | "rubric">("weights");
  const [activeDocTab, setActiveDocTab] = useState<"rubric" | "skill">("rubric");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: "success" | "warning" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "warning" | "error" | "info" = "info") => {
    setToastNotification({ message, type });
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Chat State
  const [messages, setMessages] = useState<AICopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là AI Co-pilot hỗ trợ biên tập bộ tiêu chí tuyển dụng. Bạn muốn điều chỉnh trọng số %, bổ sung yêu cầu bắt buộc hay tối ưu tiêu chí cho vị trí nào?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load Presets on Mount
  useEffect(() => {
    const loadedPresets = getSavedPresets();
    setPresets(loadedPresets);
    const activeId = getActivePresetId();
    const current = loadedPresets.find((p) => p.id === activeId) || loadedPresets[0] || DEFAULT_HR_SKILL;
    setActiveSkill(current);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  // Handle Preset Switching
  const handleSelectPreset = (id: string) => {
    const selected = presets.find((p) => p.id === id);
    if (selected) {
      setActiveSkill(selected);
      setActivePresetId(id);
      setPreviousSkill(null);
      setSaveStatus("idle");
    }
  };

  // Handle Weight Change
  const handleWeightChange = (key: keyof SkillWeights, val: number) => {
    const newWeights = { ...activeSkill.weights, [key]: Math.max(0, Math.min(100, val)) };
    setActiveSkill({
      ...activeSkill,
      weights: newWeights,
    });
    setSaveStatus("idle");
  };

  // Auto-Balance Weights to 100%
  const handleAutoBalance = () => {
    const { skills, experience, education, language } = activeSkill.weights;
    const sum = skills + experience + education + language;
    if (sum === 0) {
      handleWeightChange("skills", 35);
      handleWeightChange("experience", 30);
      handleWeightChange("education", 20);
      handleWeightChange("language", 15);
      return;
    }
    const sk = Math.round((skills / sum) * 100);
    const ex = Math.round((experience / sum) * 100);
    const ed = Math.round((education / sum) * 100);
    const la = 100 - (sk + ex + ed);
    setActiveSkill({
      ...activeSkill,
      weights: { skills: sk, experience: ex, education: ed, language: Math.max(0, la) },
    });
    setSaveStatus("idle");
    showToast("✓ Đã tự động cân đối trọng số về chuẩn 100%.", "success");
  };

  // Save Preset
  const handleSaveCurrent = () => {
    const saved = savePreset(activeSkill);
    const updatedPresets = getSavedPresets();
    setPresets(updatedPresets);
    setActiveSkill(saved);
    setSaveStatus("saved");
    showToast("✓ Đã lưu thay đổi bộ tiêu chí thành công!", "success");
    setTimeout(() => setSaveStatus("idle"), 2500);
  };

  // Create New Preset
  const handleCreateNew = () => {
    setNewSkillName(`Bộ tiêu chí #${presets.length + 1}`);
    setNewSkillDesc("");
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập tên cho bộ tiêu chí.", "warning");
      return;
    }
    const created = createNewPreset(trimmed);
    if (newSkillDesc.trim()) {
      created.description = newSkillDesc.trim();
      savePreset(created);
    }
    setPresets(getSavedPresets());
    setActiveSkill(created);
    setPreviousSkill(null);
    setIsCreateModalOpen(false);
    showToast(`✓ Đã tạo bộ tiêu chí "${created.name}" thành công!`, "success");
  };

  // Duplicate Preset
  const handleDuplicate = () => {
    const cloned = duplicatePreset(activeSkill);
    setPresets(getSavedPresets());
    setActiveSkill(cloned);
    setPreviousSkill(null);
    showToast(`✓ Đã nhân bản thành "${cloned.name}"!`, "success");
  };

  // Delete Preset
  const handleDelete = () => {
    if (activeSkill.isDefault) {
      showToast("⚠️ Không thể xóa Bộ tiêu chí mặc định của hệ thống.", "warning");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const name = activeSkill.name;
    deletePreset(activeSkill.id);
    const remaining = getSavedPresets();
    setPresets(remaining);
    setActiveSkill(remaining[0] || DEFAULT_HR_SKILL);
    setPreviousSkill(null);
    setIsDeleteModalOpen(false);
    showToast(`✓ Đã xóa bộ tiêu chí "${name}".`, "info");
  };

  // Reset to Default
  const handleResetToDefault = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    setActiveSkill({
      ...DEFAULT_HR_SKILL,
      id: activeSkill.id,
      name: activeSkill.name,
    });
    setSaveStatus("idle");
    setIsResetModalOpen(false);
    showToast("✓ Đã khôi phục nội dung về chuẩn ban đầu.", "success");
  };

  // Undo AI Change
  const handleUndo = () => {
    if (previousSkill) {
      setActiveSkill(previousSkill);
      setPreviousSkill(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `undo_${Date.now()}`,
          role: "assistant",
          content: "↩️ Đã hoàn tác lại cấu hình trước đó.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      showToast("↩️ Đã hoàn tác lại phiên bản trước.", "info");
    }
  };

  // Send AI Chat Message
  const handleSendAiMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim() || isAiLoading) return;

    const userMsg: AICopilotMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!msgText) setChatInput("");
    setIsAiLoading(true);

    // Save previous state for undo
    setPreviousSkill({ ...activeSkill });

    try {
      const chatHistory = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/skills/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSkill: activeSkill,
          userMessage: textToSend,
          chatHistory,
        }),
      });

      const data: AICopilotResponse = await res.json();

      if (!res.ok || !data.success || !data.updatedSkill) {
        throw new Error(data.error || "Không thể xử lý yêu cầu chỉnh sửa.");
      }

      // Update skill draft
      setActiveSkill(data.updatedSkill);
      setSaveStatus("idle");

      const aiMsg: AICopilotMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.replyMessage,
        changes: data.changes,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Co-pilot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          role: "assistant",
          content: `❌ Gặp lỗi: ${err.message || "Không thể kết nối với Gemini AI."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const totalWeight =
    (activeSkill.weights.skills || 0) +
    (activeSkill.weights.experience || 0) +
    (activeSkill.weights.education || 0) +
    (activeSkill.weights.language || 0);

  const isBalanced = totalWeight === 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50/50 pb-12">
      {/* Top Header & Toolbar */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Title & Preset Selector */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900 leading-none">HR Skill Studio</h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">Tùy biến tiêu chí & trọng số chấm điểm CV</p>
            </div>

            {/* Preset Selector Dropdown */}
            <div className="ml-2 pl-4 border-l border-stone-200 flex items-center gap-2">
              <select
                value={activeSkill.id}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="text-sm font-medium text-stone-800 bg-stone-100 hover:bg-stone-200/70 border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Mặc định)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {previousSkill && (
              <button
                onClick={handleUndo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-xs"
                title="Hoàn tác thay đổi vừa thực hiện"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Hoàn tác
              </button>
            )}

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-300 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo mới
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-300 transition-colors shadow-xs"
              title="Nhân bản bộ Skill này"
            >
              <Copy className="w-3.5 h-3.5" />
              Nhân bản
            </button>

            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-300 transition-colors shadow-xs"
              title="Khôi phục về nội dung gốc từ hr-cv-screening"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục
            </button>

            {!activeSkill.isDefault && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                title="Xóa bộ Skill này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleSaveCurrent}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                saveStatus === "saved"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
              }`}
            >
              {saveStatus === "saved" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã lưu!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Body: Split-View Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ═══════════ LEFT PANE: Skill Inspector & Editor (7 cols) ═══════════ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Meta Information Card (Preset Name) */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                Tên bộ tiêu chí (Preset Name)
              </label>
              <input
                type="text"
                value={activeSkill.name}
                onChange={(e) => {
                  setActiveSkill({ ...activeSkill, name: e.target.value });
                  setSaveStatus("idle");
                }}
                placeholder="Nhập tên bộ tiêu chí..."
                className="w-full text-sm font-bold text-stone-900 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Navigation Tabs - 2 Segments 50-50 */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-stone-200/60 rounded-xl border border-stone-200">
              <button
                onClick={() => setActiveTab("weights")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "weights"
                    ? "bg-white text-indigo-700 shadow-xs border border-stone-200/80"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Sliders className="w-4 h-4 text-indigo-600" />
                Trọng số % ({totalWeight}%)
              </button>
              <button
                onClick={() => setActiveTab("rubric")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "rubric"
                    ? "bg-white text-indigo-700 shadow-xs border border-stone-200/80"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <FileCode className="w-4 h-4 text-indigo-600" />
                Tiêu chí & File Skill
              </button>
            </div>

            {/* Tab 1: Weights Sliders & Visual Progress */}
            {activeTab === "weights" && (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-5">
                {/* Total Balance Status Bar */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    isBalanced
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-amber-50/80 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold">
                        {isBalanced
                          ? "✓ Tỷ lệ trọng số chuẩn xác (Tổng: 100%)"
                          : `⚠️ Tổng trọng số hiện tại là ${totalWeight}% (Cần điều chỉnh = 100%)`}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {isBalanced
                          ? "Hệ thống sẽ nhân điểm từng hạng mục theo đúng tỷ lệ bên dưới."
                          : "Bạn có thể chỉnh thủ công hoặc bấm nút bên cạnh để tự động cân đối."}
                      </p>
                    </div>
                  </div>
                  {!isBalanced && (
                    <button
                      onClick={handleAutoBalance}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3" />
                      Cân bằng 100%
                    </button>
                  )}
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${Math.max(0, activeSkill.weights.skills)}%` }}
                    className="bg-indigo-500 transition-all duration-300"
                    title={`Kỹ năng: ${activeSkill.weights.skills}%`}
                  />
                  <div
                    style={{ width: `${Math.max(0, activeSkill.weights.experience)}%` }}
                    className="bg-violet-500 transition-all duration-300"
                    title={`Kinh nghiệm: ${activeSkill.weights.experience}%`}
                  />
                  <div
                    style={{ width: `${Math.max(0, activeSkill.weights.education)}%` }}
                    className="bg-amber-500 transition-all duration-300"
                    title={`Học vấn: ${activeSkill.weights.education}%`}
                  />
                  <div
                    style={{ width: `${Math.max(0, activeSkill.weights.language)}%` }}
                    className="bg-teal-500 transition-all duration-300"
                    title={`Ngoại ngữ: ${activeSkill.weights.language}%`}
                  />
                </div>

                {/* 4 Weight Controls */}
                <div className="space-y-4 pt-1">
                  {/* 1. Skills */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        🛠️ Kỹ năng (Skills)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeSkill.weights.skills}
                          onChange={(e) => handleWeightChange("skills", parseInt(e.target.value) || 0)}
                          className="w-14 text-right text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-stone-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeSkill.weights.skills}
                      onChange={(e) => handleWeightChange("skills", parseInt(e.target.value) || 0)}
                      className="w-full accent-indigo-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 2. Experience */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                        💼 Kinh nghiệm (Experience)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeSkill.weights.experience}
                          onChange={(e) => handleWeightChange("experience", parseInt(e.target.value) || 0)}
                          className="w-14 text-right text-xs font-bold text-violet-700 bg-white border border-violet-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-violet-500"
                        />
                        <span className="text-xs font-bold text-stone-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeSkill.weights.experience}
                      onChange={(e) => handleWeightChange("experience", parseInt(e.target.value) || 0)}
                      className="w-full accent-violet-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 3. Education */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        🎓 Học vấn (Education)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeSkill.weights.education}
                          onChange={(e) => handleWeightChange("education", parseInt(e.target.value) || 0)}
                          className="w-14 text-right text-xs font-bold text-amber-700 bg-white border border-amber-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-stone-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeSkill.weights.education}
                      onChange={(e) => handleWeightChange("education", parseInt(e.target.value) || 0)}
                      className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 4. Language */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        🌐 Ngôn ngữ (Language)
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeSkill.weights.language}
                          onChange={(e) => handleWeightChange("language", parseInt(e.target.value) || 0)}
                          className="w-14 text-right text-xs font-bold text-teal-700 bg-white border border-teal-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-teal-500"
                        />
                        <span className="text-xs font-bold text-stone-500">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeSkill.weights.language}
                      onChange={(e) => handleWeightChange("language", parseInt(e.target.value) || 0)}
                      className="w-full accent-teal-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Direct Dual Document Editor (scoring_rubric.md & SKILL.md) */}
            {activeTab === "rubric" && (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3.5">
                {/* File Switcher Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                  {/* Sub-tab pills: scoring_rubric.md vs SKILL.md */}
                  <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
                    <button
                      onClick={() => setActiveDocTab("rubric")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeDocTab === "rubric"
                          ? "bg-white text-indigo-700 shadow-xs border border-indigo-100"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      scoring_rubric.md
                    </button>
                    <button
                      onClick={() => setActiveDocTab("skill")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeDocTab === "skill"
                          ? "bg-white text-violet-700 shadow-xs border border-violet-100"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-violet-600" />
                      SKILL.md
                    </button>
                  </div>

                  <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/80">
                    Soạn thảo trực tiếp
                  </span>
                </div>

                {/* Document Information Banner */}
                <div className="text-[11px] text-stone-500 flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200/60">
                  <span className="font-semibold text-stone-700">
                    {activeDocTab === "rubric" ? "📄 scoring_rubric.md:" : "📋 SKILL.md:"}
                  </span>
                  <span>
                    {activeDocTab === "rubric"
                      ? "Quy định thang điểm 4 hạng mục & tiêu chí must-have/preferred."
                      : "Quy định Persona tuyển dụng, quy trình 3 bước & định dạng báo cáo xếp loại."}
                  </span>
                </div>

                {/* Direct Textarea Editor */}
                {activeDocTab === "rubric" ? (
                  <textarea
                    value={activeSkill.scoringRubric}
                    onChange={(e) => {
                      setActiveSkill({ ...activeSkill, scoringRubric: e.target.value });
                      setSaveStatus("idle");
                    }}
                    className="w-full h-[460px] text-xs font-mono text-stone-800 bg-stone-50/70 border border-stone-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto"
                    placeholder="Nhập nội dung Markdown cho scoring_rubric.md..."
                  />
                ) : (
                  <textarea
                    value={activeSkill.skillDocument || DEFAULT_HR_SKILL.skillDocument}
                    onChange={(e) => {
                      setActiveSkill({ ...activeSkill, skillDocument: e.target.value });
                      setSaveStatus("idle");
                    }}
                    className="w-full h-[460px] text-xs font-mono text-stone-800 bg-stone-50/70 border border-stone-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed resize-none overflow-y-auto"
                    placeholder="Nhập nội dung Markdown cho SKILL.md..."
                  />
                )}
              </div>
            )}
          </div>

          {/* ═══════════ RIGHT PANE: AI Co-pilot Chat Assistant (5 cols) ═══════════ */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[650px] sticky top-28 overflow-hidden">
            {/* Chat Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-white border-b border-stone-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    AI Skill Co-pilot
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[10px] text-stone-500 font-mono">Gemini 3.1 Flash Lite</p>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100/60 text-indigo-700">
                Tự động áp dụng
              </span>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-stone-100/90 text-stone-800 rounded-tl-xs border border-stone-200/60"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Render AI Changes Badge if any */}
                    {msg.changes && msg.changes.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          ⚡ Thay đổi đã áp dụng:
                        </span>
                        <ul className="space-y-0.5">
                          {msg.changes.map((change, idx) => (
                            <li key={idx} className="text-[11px] text-stone-700 flex items-start gap-1">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.timestamp && (
                      <span
                        className={`text-[9px] block mt-1 text-right ${
                          msg.role === "user" ? "text-indigo-200" : "text-stone-400"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-md bg-stone-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isAiLoading && (
                <div className="flex gap-2.5 items-center text-xs text-indigo-700 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>AI đang phân tích và tối ưu lại bộ Skill...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-3 py-2 bg-stone-50 border-t border-stone-200/80 overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
              {QUICK_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiMessage(sug)}
                  disabled={isAiLoading}
                  className="text-[11px] font-medium bg-white hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 border border-stone-200 px-2.5 py-1 rounded-full transition-colors shadow-2xs shrink-0"
                >
                  ⚡ {sug}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập mong muốn để AI sửa Skill..."
                disabled={isAiLoading}
                className="flex-1 text-xs text-stone-900 bg-stone-100/80 border border-stone-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ═══════════ MODAL: TẠO BỘ TIÊU CHÍ MỚI ═══════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/80 via-white to-white border-b border-stone-200/80 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Tạo Bộ Tiêu Chí Mới</h3>
                  <p className="text-xs text-stone-500">Thiết lập cấu hình sàng lọc CV riêng biệt</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleConfirmCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Tên bộ tiêu chí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Ví dụ: Tuyển dụng Senior Flutter Developer..."
                  className="w-full text-xs font-semibold text-stone-900 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Mô tả mục đích <span className="text-stone-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  placeholder="Ví dụ: Đánh giá ứng viên từ 3 năm kinh nghiệm, ưu tiên GraphQL..."
                  className="w-full text-xs text-stone-700 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/70 text-[11px] text-indigo-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Preset mới sẽ được khởi tạo với cấu hình mẫu chuẩn. Bạn có thể sử dụng AI Co-pilot bên phải để tự động tối ưu hóa.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newSkillName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo Bộ Tiêu Chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: XÁC NHẬN XÓA PRESET ═══════════ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-rose-50/80 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Xóa Bộ Tiêu Chí</h3>
                  <p className="text-xs text-rose-700">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-stone-700 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn bộ tiêu chí{" "}
                <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {activeSkill.name}
                </span>{" "}
                khỏi danh sách cấu hình không?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa Vĩnh Viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: KHÔI PHỤC VỀ MẶC ĐỊNH ═══════════ */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Khôi Phục Về Mặc Định</h3>
                  <p className="text-xs text-amber-700">Nội dung chuẩn của hr-cv-screening</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-amber-400 hover:text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-stone-700 leading-relaxed">
                Tất cả trọng số (%) và nội dung tiêu chí rubric của{" "}
                <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {activeSkill.name}
                </span>{" "}
                sẽ được hoàn trả về chuẩn ban đầu của hệ thống.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Xác Nhận Khôi Phục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ FLOATING TOAST NOTIFICATION ═══════════ */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toastNotification.type === "success"
                ? "bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-900/20"
                : toastNotification.type === "warning"
                ? "bg-amber-900/90 text-white border-amber-700 shadow-amber-900/20"
                : toastNotification.type === "error"
                ? "bg-rose-900/90 text-white border-rose-700 shadow-rose-900/20"
                : "bg-stone-900/90 text-white border-stone-700 shadow-stone-900/20"
            }`}
          >
            {toastNotification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastNotification.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastNotification.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastNotification.type === "info" && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toastNotification.message}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="ml-2 p-0.5 text-stone-300 hover:text-white rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
