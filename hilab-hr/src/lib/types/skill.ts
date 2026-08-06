export interface SkillWeights {
  skills: number;      // e.g. 35
  experience: number;  // e.g. 30
  education: number;   // e.g. 20
  language: number;    // e.g. 15
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  roleInstructions: string;
  scoringRubric: string;
  skillDocument?: string;
  weights: SkillWeights;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AICopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  changes?: string[];
}

export interface AICopilotRequest {
  currentSkill: SkillConfig;
  userMessage: string;
  chatHistory?: { role: "user" | "assistant"; content: string }[];
}

export interface AICopilotResponse {
  success: boolean;
  replyMessage: string;
  changes?: string[];
  updatedSkill?: SkillConfig;
  error?: string;
}

export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  weights: SkillWeights;
}
