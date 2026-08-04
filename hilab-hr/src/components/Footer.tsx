import { Bot, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 mt-auto text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-300">HiLab HR CV Screening Agent</span>
          <span>— Learning Sprint Tuần 1</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>Powered by Gemini 2.5 Flash</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Antigravity Spec-Driven AI
          </span>
        </div>
      </div>
    </footer>
  );
}
