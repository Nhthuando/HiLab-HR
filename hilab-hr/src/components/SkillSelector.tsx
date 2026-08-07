"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { Sparkles, Sliders, ExternalLink, ChevronDown } from "lucide-react";
import { SkillConfig } from "@/lib/types/skill";
import { DEFAULT_HR_SKILL } from "@/lib/defaultSkill";
import { getSavedPresets, getActivePreset, setActivePresetId } from "@/lib/skillStorage";

interface SkillSelectorProps {
  onSkillChange?: (skill: SkillConfig) => void;
  selectedSkill?: SkillConfig | null;
}

export function SkillSelector({ onSkillChange, selectedSkill }: SkillSelectorProps) {
  const skillSelectId = useId();
  const [presets, setPresets] = useState<SkillConfig[]>([DEFAULT_HR_SKILL]);
  const [currentSkill, setCurrentSkill] = useState<SkillConfig>(selectedSkill || DEFAULT_HR_SKILL);

  useEffect(() => {
    const loaded = getSavedPresets();
    setPresets(loaded);
    if (!selectedSkill) {
      const active = getActivePreset();
      setCurrentSkill(active);
      onSkillChange?.(active);
    }
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      setCurrentSkill(selectedSkill);
    }
  }, [selectedSkill]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const found = presets.find((p) => p.id === id) || DEFAULT_HR_SKILL;
    setCurrentSkill(found);
    setActivePresetId(found.id);
    onSkillChange?.(found);
  };

  return (
    <div className="bg-indigo-50/60 border border-indigo-100/90 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Label & Selector */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <label htmlFor={skillSelectId} className="text-xs font-bold text-stone-900">Bộ Skill / Tiêu chí áp dụng</label>
              {currentSkill.isDefault && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-stone-200/80 text-stone-700">
                  Chuẩn gốc
                </span>
              )}
            </div>
            <div className="relative mt-1">
              <select
                id={skillSelectId}
                value={currentSkill.id}
                onChange={handleChange}
                className="w-full text-xs font-semibold text-indigo-900 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs appearance-none"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? "(Mặc định hr-cv-screening)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Active Weights Summary & Studio Link */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-stone-600 bg-white/80 px-3 py-1.5 rounded-lg border border-indigo-100/80 shadow-2xs">
            <span className="text-indigo-700 font-bold">Kỹ năng: {currentSkill.weights.skills}%</span>
            <span>•</span>
            <span className="text-violet-700 font-bold">Kinh nghiệm: {currentSkill.weights.experience}%</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">Học vấn: {currentSkill.weights.education}%</span>
            <span>•</span>
            <span className="text-teal-700 font-bold">Ngoại ngữ: {currentSkill.weights.language}%</span>
          </div>

          <Link
            href="/skills"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-white px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tùy chỉnh Skill</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
