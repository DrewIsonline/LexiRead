import React from "react";
import { ReadingPreferences, FontOption, ContrastTheme } from "../types";
import { Sliders, Type, Check, Eye, HelpCircle } from "lucide-react";

interface DyslexiaControlsProps {
  preferences: ReadingPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReadingPreferences>>;
}

const fonts: { value: FontOption; label: string; desc: string; preview: string }[] = [
  {
    value: "comic-neue",
    label: "Comic Neue",
    desc: "Rounded letters, high spacing; helps prevent letter rotation.",
    preview: "ab d q p",
  },
  {
    value: "lexend",
    label: "Lexend",
    desc: "Scientifically proven to reduce visual fatigue and increase fluid reading.",
    preview: "abcde",
  },
  {
    value: "andika",
    label: "Andika Literacy",
    desc: "Designed specifically for adult and child literacy; very clean letterforms.",
    preview: "xyz mn",
  },
  {
    value: "system-dyslexic",
    label: "Dyslexi-Spacing",
    desc: "Combines Comic Neue with extreme letter/word gaps to maximize isolation.",
    preview: "a b c d",
  },
  {
    value: "arial",
    label: "Arial",
    desc: "Standard high-legibility clean sans-serif typeface.",
    preview: "Arial",
  },
];

const themes: { value: ContrastTheme; label: string; bg: string; text: string; desc: string }[] = [
  { value: "cream", label: "Soft Cream", bg: "#FDFBF7", text: "#2D3748", desc: "Gentle off-white, drastically reduces harsh blue-light glare." },
  { value: "warm-peach", label: "Warm Peach", bg: "#FAF0E6", text: "#3C2F2F", desc: "Relaxing natural organic paper hue." },
  { value: "pastel-yellow", label: "Pastel Canary", bg: "#FFFDF0", text: "#2B2A22", desc: "Clinically recommended contrast for low-light situations." },
  { value: "soft-blue", label: "Sky Pastel", bg: "#F0F4F8", text: "#1A2B4C", desc: "Cool, calm wavelength that stabilizes visual scanning." },
  { value: "dark-navy", label: "Deep Cosmos", bg: "#0F172A", text: "#F1F5F9", desc: "Dark mode designed specifically with low-luminance glowing text." },
  { value: "charcoal", label: "Midnight Carbon", bg: "#1E1E1E", text: "#E2E8F0", desc: "Maximum contrast dark mode for photophobia / extreme eye strain." },
];

export default function DyslexiaControls({ preferences, setPreferences }: DyslexiaControlsProps) {
  const updatePref = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div id="dyslexia-controls-panel" className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between border-b-4 border-[#BDC1C6] pb-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-6 h-6 text-[#4285F4]" />
          <h3 className="font-black text-[#2D3436] text-xl uppercase tracking-tight">Dyslexia Reading Tools</h3>
        </div>
        <span className="text-[10px] text-[#636E72] font-black uppercase tracking-widest bg-[#F1F3F4] px-3 py-1 rounded-full border-2 border-[#DCDDE1]">Real-time Adjustments</span>
      </div>

      {/* 1. Theme Picker */}
      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-[#2D3436] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EA4335]"></span>
          Reading Background Contrast Theme
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              id={`theme-btn-${t.value}`}
              onClick={() => updatePref("theme", t.value)}
              className={`relative h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                preferences.theme === t.value
                  ? "border-4 border-[#2D3436] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] scale-[1.03] font-black"
                  : "border-2 border-[#DCDDE1] hover:border-[#BDC1C6] hover:bg-[#F1F3F4] font-bold"
              }`}
              style={{ backgroundColor: t.bg, color: t.text }}
              title={t.desc}
            >
              <span className="text-[11px] leading-tight px-1 text-center">{t.label}</span>
              {preferences.theme === t.value && (
                <div className="absolute -top-2 -right-2 bg-[#34A853] text-white rounded-full p-1 shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dyslexia-friendly Font Picker */}
      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-wider text-[#2D3436] flex items-center gap-2">
          <Type className="w-4 h-4 text-[#4285F4]" />
          High-Legibility Typeface
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {fonts.map((f) => (
            <button
              key={f.value}
              id={`font-btn-${f.value}`}
              onClick={() => updatePref("fontFamily", f.value)}
              className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between h-28 ${
                preferences.fontFamily === f.value
                  ? "border-4 border-[#4285F4] bg-[#F1F3F4] shadow-[4px_4px_0px_0px_rgba(66,133,244,0.15)]"
                  : "border-2 border-[#DCDDE1] bg-white hover:border-[#BDC1C6] hover:bg-[#F1F3F4]"
              }`}
            >
              <div>
                <span className={`text-sm block leading-tight ${preferences.fontFamily === f.value ? 'font-black text-[#4285F4]' : 'font-bold text-[#2D3436]'}`}>{f.label}</span>
                <span className="text-[10px] text-[#636E72] font-medium leading-tight block mt-1 truncate" title={f.desc}>
                  {f.desc}
                </span>
              </div>
              <span
                className={`text-sm mt-3 block border-t-2 border-[#DCDDE1] pt-2 font-black ${preferences.fontFamily === f.value ? 'text-[#4285F4]' : 'text-[#2D3436]'} font-${f.value}`}
                style={{
                  fontFamily:
                    f.value === "comic-neue"
                      ? "Comic Neue"
                      : f.value === "lexend"
                      ? "Lexend"
                      : f.value === "andika"
                      ? "Andika"
                      : f.value === "system-dyslexic"
                      ? "Comic Neue"
                      : "Arial",
                  letterSpacing: f.value === "system-dyslexic" ? "0.15em" : "normal",
                }}
              >
                {f.preview}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Text & Spacing Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t-4 border-[#BDC1C6]">
        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black uppercase tracking-wider text-[#636E72]">Font Size (px)</span>
            <span className="font-mono text-[#2D3436] font-black bg-[#FFD93D] px-2 py-1 rounded-lg border-2 border-[#F9AB00] shadow-sm">{preferences.fontSize}px</span>
          </div>
          <input
            id="slider-font-size"
            type="range"
            min="15"
            max="32"
            value={preferences.fontSize}
            onChange={(e) => updatePref("fontSize", parseInt(e.target.value))}
            className="w-full h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
          />
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black uppercase tracking-wider text-[#636E72]">Line Height</span>
            <span className="font-mono text-[#2D3436] font-black bg-[#FFD93D] px-2 py-1 rounded-lg border-2 border-[#F9AB00] shadow-sm">{preferences.lineHeight}x</span>
          </div>
          <input
            id="slider-line-height"
            type="range"
            min="1.4"
            max="2.6"
            step="0.1"
            value={preferences.lineHeight}
            onChange={(e) => updatePref("lineHeight", parseFloat(e.target.value))}
            className="w-full h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black uppercase tracking-wider text-[#636E72]">Letter Isolation</span>
            <span className="font-mono text-[#2D3436] font-black bg-[#FFD93D] px-2 py-1 rounded-lg border-2 border-[#F9AB00] shadow-sm">+{preferences.letterSpacing}px</span>
          </div>
          <input
            id="slider-letter-spacing"
            type="range"
            min="0"
            max="6"
            value={preferences.letterSpacing}
            onChange={(e) => updatePref("letterSpacing", parseInt(e.target.value))}
            className="w-full h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
          />
        </div>

        {/* Word Spacing */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black uppercase tracking-wider text-[#636E72]">Word Isolation</span>
            <span className="font-mono text-[#2D3436] font-black bg-[#FFD93D] px-2 py-1 rounded-lg border-2 border-[#F9AB00] shadow-sm">+{preferences.wordSpacing}px</span>
          </div>
          <input
            id="slider-word-spacing"
            type="range"
            min="0"
            max="12"
            value={preferences.wordSpacing}
            onChange={(e) => updatePref("wordSpacing", parseInt(e.target.value))}
            className="w-full h-2 bg-[#E9ECEF] rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
          />
        </div>
      </div>

      {/* 4. Reading Ruler Helper Options */}
      <div className="bg-[#FEF7E0] rounded-2xl p-5 border-2 border-[#F9AB00] border-b-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-white p-2.5 rounded-xl text-[#F9AB00] border-2 border-[#F9AB00] shadow-sm mt-0.5">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-[#2D3436] uppercase tracking-wider">Reading Focus Ruler</h4>
            <p className="text-xs font-medium text-[#B06000] mt-1">
              Draws a high-visibility, transparent visual overlay to help isolate a single line of text at a time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="checkbox-show-ruler"
              type="checkbox"
              checked={preferences.showRuler}
              onChange={(e) => updatePref("showRuler", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-[#BDC1C6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DCDDE1] after:border-2 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34A853]"></div>
            <span className={`ml-3 text-xs font-black uppercase tracking-wider ${preferences.showRuler ? 'text-[#1E8E3E]' : 'text-[#636E72]'}`}>
              {preferences.showRuler ? 'Active' : 'Inactive'}
            </span>
          </label>

          {preferences.showRuler && (
            <div className="flex items-center gap-4 border-l-2 border-[#F9AB00] pl-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#B06000]">Height</span>
                <input
                  id="slider-ruler-height"
                  type="range"
                  min="30"
                  max="120"
                  value={preferences.rulerHeight}
                  onChange={(e) => updatePref("rulerHeight", parseInt(e.target.value))}
                  className="w-20 h-2 bg-white rounded-lg accent-[#F9AB00] border border-[#F9AB00]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#B06000]">Color</span>
                <div className="flex gap-2">
                  {["#fde047", "#60a5fa", "#4ade80", "#f87171"].map((color) => (
                    <button
                      key={color}
                      id={`ruler-color-${color}`}
                      onClick={() => updatePref("rulerColor", color)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        preferences.rulerColor === color ? "border-[#2D3436] scale-125 shadow-sm" : "border-transparent opacity-80"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
