import { SkillConfig } from "./types/skill";
import { DEFAULT_HR_SKILL } from "./defaultSkill";

const STORAGE_KEY_PRESETS = "hilab_hr_skill_presets_v1";
const STORAGE_KEY_ACTIVE_ID = "hilab_hr_active_skill_id_v1";

/**
 * Lấy tất cả các Preset đã lưu từ LocalStorage, luôn bao gồm Preset Mặc định.
 */
export function getSavedPresets(): SkillConfig[] {
  if (typeof window === "undefined") {
    return [DEFAULT_HR_SKILL];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (!raw) {
      return [DEFAULT_HR_SKILL];
    }
    const parsed: SkillConfig[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_HR_SKILL];
    }

    // Ensure default skill always exists and is marked as default
    const hasDefault = parsed.some((p) => p.id === DEFAULT_HR_SKILL.id);
    if (!hasDefault) {
      return [DEFAULT_HR_SKILL, ...parsed];
    }

    return parsed;
  } catch (err) {
    console.warn("Lỗi khi đọc danh sách presets từ localStorage:", err);
    return [DEFAULT_HR_SKILL];
  }
}

/**
 * Lấy ID Preset đang được chọn hoạt động.
 */
export function getActivePresetId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_HR_SKILL.id;
  }
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || DEFAULT_HR_SKILL.id;
}

/**
 * Thiết lập Preset đang hoạt động.
 */
export function setActivePresetId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

/**
 * Lấy Preset đang hoạt động.
 */
export function getActivePreset(): SkillConfig {
  const activeId = getActivePresetId();
  const presets = getSavedPresets();
  const found = presets.find((p) => p.id === activeId);
  return found || DEFAULT_HR_SKILL;
}

/**
 * Lưu hoặc cập nhật một Preset.
 */
export function savePreset(skill: SkillConfig): SkillConfig {
  if (typeof window === "undefined") return skill;

  const presets = getSavedPresets();
  const existingIndex = presets.findIndex((p) => p.id === skill.id);

  const updatedSkill: SkillConfig = {
    ...skill,
    updatedAt: new Date().toISOString(),
    isDefault: skill.id === DEFAULT_HR_SKILL.id,
  };

  let newPresets: SkillConfig[];
  if (existingIndex >= 0) {
    newPresets = [...presets];
    newPresets[existingIndex] = updatedSkill;
  } else {
    newPresets = [...presets, updatedSkill];
  }

  localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(newPresets));
  setActivePresetId(updatedSkill.id);
  return updatedSkill;
}

/**
 * Xóa một Preset (không cho xóa Preset mặc định).
 */
export function deletePreset(id: string): boolean {
  if (typeof window === "undefined") return false;
  if (id === DEFAULT_HR_SKILL.id) return false;

  const presets = getSavedPresets();
  const filtered = presets.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(filtered));

  if (getActivePresetId() === id) {
    setActivePresetId(DEFAULT_HR_SKILL.id);
  }
  return true;
}

/**
 * Nhân bản (clone) một Preset để tạo Preset mới.
 */
export function duplicatePreset(source: SkillConfig): SkillConfig {
  const newId = `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cloned: SkillConfig = {
    ...source,
    id: newId,
    name: `${source.name} (Bản sao)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return savePreset(cloned);
}

/**
 * Tạo mới Preset trắng/mặc định.
 */
export function createNewPreset(name = "Preset Mới"): SkillConfig {
  const newId = `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newPreset: SkillConfig = {
    ...DEFAULT_HR_SKILL,
    id: newId,
    name,
    description: "Bộ tiêu chí tuyển dụng tùy chỉnh",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return savePreset(newPreset);
}
