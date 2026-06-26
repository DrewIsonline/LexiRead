import React, { useState, useEffect, useRef } from "react";
import { ReadingPreferences, SavedCourse } from "../types";
import { Play, Pause, Square, Volume2, ArrowLeft, ArrowRight, ChevronDown, ListMusic } from "lucide-react";

interface ReaderPanelProps {
  course: SavedCourse;
  preferences: ReadingPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReadingPreferences>>;
  onSectionChange: (index: number) => void;
}

export default function ReaderPanel({
  course,
  preferences,
  setPreferences,
  onSectionChange,
}: ReaderPanelProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [rulerTop, setRulerTop] = useState<number>(150);

  const sentences = React.useMemo(() => {
    const rawText = course.sections[course.currentSectionIndex] || "";
    // Regex split sentences while preserving periods/exclamations
    const matches = rawText.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    if (!matches) return [rawText];
    return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  }, [course, course.currentSectionIndex]);

  // Load voices for SpeechSynthesis
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices or high quality voices
      const filtered = allVoices.filter((v) => v.lang.startsWith("en") || v.lang.startsWith("es"));
      setVoices(filtered.length > 0 ? filtered : allVoices);

      // Default voice if none selected
      if (!preferences.voiceName && allVoices.length > 0) {
        const defaultVoice = allVoices.find((v) => v.default && v.lang.startsWith("en")) || allVoices[0];
        setPreferences((prev) => ({ ...prev, voiceName: defaultVoice.name }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [preferences.voiceName, setPreferences]);

  // Handle voice changes or page turns
  useEffect(() => {
    if (isPlaying) {
      stopSpeech();
    }
  }, [course.currentSectionIndex]);

  const playSentence = (index: number) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    setActiveSentenceIndex(index);

    const textToSpeak = sentences[index];
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Apply voice preferences
    if (preferences.voiceName) {
      const selectedVoice = window.speechSynthesis.getVoices().find((v) => v.name === preferences.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.rate = preferences.speechSpeed;
    utterance.pitch = preferences.speechPitch;

    utterance.onend = () => {
      if (index < sentences.length - 1) {
        playSentence(index + 1);
      } else {
        stopSpeech();
      }
    };

    utterance.onerror = () => {
      stopSpeech();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startSpeech = () => {
    const startIndex = activeSentenceIndex !== null ? activeSentenceIndex : 0;
    playSentence(startIndex);
  };

  const pauseSpeech = () => {
    if (!window.speechSynthesis) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIndex(null);
  };

  // Adjust parameters live if playing
  const handlePreferenceChange = <K extends keyof ReadingPreferences>(key: K, val: ReadingPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!preferences.showRuler || !textContainerRef.current) return;
    const rect = textContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    setRulerTop(relativeY);
  };

  // Contrast CSS themes mapping
  const getThemeClass = (theme: typeof preferences.theme) => {
    switch (theme) {
      case "cream": return "bg-[#FDFBF7] text-[#2D3436] border-[#DCDDE1]";
      case "warm-peach": return "bg-[#FAF0E6] text-[#3C2F2F] border-[#E8DCC8]";
      case "pastel-yellow": return "bg-[#FFFDF0] text-[#2B2A22] border-[#EAE8D9]";
      case "soft-blue": return "bg-[#F0F4F8] text-[#1A2B4C] border-[#D9E2EC]";
      case "dark-navy": return "bg-[#0F172A] text-[#F1F5F9] border-[#1E293B]";
      case "charcoal": return "bg-[#1E1E1E] text-[#E2E8F0] border-[#333333]";
      default: return "bg-white text-[#2D3436] border-[#DCDDE1]";
    }
  };

  const getFontFamilyStyle = (font: typeof preferences.fontFamily) => {
    switch (font) {
      case "comic-neue": return "font-comic-neue";
      case "lexend": return "font-lexend";
      case "andika": return "font-andika";
      case "system-dyslexic": return "font-comic-neue";
      case "arial": return "font-sans";
      default: return "font-sans";
    }
  };

  const isDark = preferences.theme === "dark-navy" || preferences.theme === "charcoal";

  return (
    <div id="reader-panel-root" className="flex flex-col h-full bg-white rounded-3xl border-2 border-[#DCDDE1] shadow-sm overflow-hidden">
      {/* Playback Control Bar */}
      <div className="bg-[#F1F3F4] p-4 lg:p-5 border-b-4 border-[#BDC1C6] flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {isPlaying ? (
            <button
              id="tts-pause-btn"
              onClick={pauseSpeech}
              className="bg-[#EA4335] text-white p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[4px] active:shadow-none transition-all"
              title="Pause reading"
            >
              <Pause className="w-6 h-6 fill-current" />
            </button>
          ) : (
            <button
              id="tts-play-btn"
              onClick={startSpeech}
              className="bg-[#4285F4] text-white p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[4px] active:shadow-none transition-all"
              title="Play out loud"
            >
              <Play className="w-6 h-6 fill-current ml-1" />
            </button>
          )}

          {isPaused && (
            <button
              id="tts-resume-btn"
              onClick={pauseSpeech}
              className="bg-[#34A853] text-white px-5 py-3 rounded-2xl text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Resume
            </button>
          )}

          {(isPlaying || isPaused || activeSentenceIndex !== null) && (
            <button
              id="tts-stop-btn"
              onClick={stopSpeech}
              className="bg-white border-2 border-[#DCDDE1] text-[#636E72] p-3.5 rounded-2xl hover:bg-[#E9ECEF] transition-all"
              title="Stop reading"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          )}

          <div className="flex items-center gap-2 ml-0 sm:ml-2 bg-white px-3 py-1.5 rounded-xl border-2 border-[#DCDDE1]">
            <Volume2 className="w-4 h-4 text-[#4285F4]" />
            <span className="text-xs font-black uppercase text-[#2D3436]">Audio Reader</span>
          </div>
        </div>

        {/* Speed, Pitch, Voice Selection */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Speed */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-[#DCDDE1] shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#636E72]">SPEED</span>
            <select
              id="select-speech-speed"
              value={preferences.speechSpeed}
              onChange={(e) => handlePreferenceChange("speechSpeed", parseFloat(e.target.value))}
              className="text-xs font-bold text-[#2D3436] bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
            >
              <option value="0.5">0.5x (Very Slow)</option>
              <option value="0.7">0.7x (Slow)</option>
              <option value="0.85">0.85x (Dyslexia Friendly)</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="1.15">1.15x (Slightly Fast)</option>
              <option value="1.3">1.3x (Fast)</option>
              <option value="1.5">1.5x (Very Fast)</option>
            </select>
          </div>

          {/* Voice List */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border-2 border-[#DCDDE1] shadow-sm max-w-xs overflow-hidden">
            <ListMusic className="w-4 h-4 text-[#4285F4] shrink-0" />
            <select
              id="select-speech-voice"
              value={preferences.voiceName}
              onChange={(e) => handlePreferenceChange("voiceName", e.target.value)}
              className="text-xs font-bold text-[#2D3436] bg-transparent border-none outline-none focus:ring-0 cursor-pointer truncate max-w-[130px] sm:max-w-none"
            >
              <option value="">Default Voice</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Reading Canvas */}
      <div className="relative flex-1 p-8 overflow-hidden flex flex-col bg-[#FEF9EF]">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#E9ECEF]">
          <div>
            <h4 className="text-[10px] font-black text-[#4285F4] uppercase tracking-widest mb-1">Course Chapter</h4>
            <span className="text-lg font-black text-[#2D3436] line-clamp-1">{course.title}</span>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border-2 border-[#DCDDE1] shadow-sm">
            <button
              id="nav-section-prev"
              disabled={course.currentSectionIndex === 0}
              onClick={() => onSectionChange(course.currentSectionIndex - 1)}
              className="p-2.5 rounded-xl text-[#2D3436] hover:bg-[#F1F3F4] disabled:opacity-30 disabled:hover:bg-transparent transition-all border-2 border-transparent hover:border-[#DCDDE1]"
              title="Previous Bite"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-black uppercase tracking-wider px-3 text-[#2D3436]">
              Bite {course.currentSectionIndex + 1} / {course.sections.length}
            </span>
            <button
              id="nav-section-next"
              disabled={course.currentSectionIndex === course.sections.length - 1}
              onClick={() => onSectionChange(course.currentSectionIndex + 1)}
              className="p-2.5 rounded-xl text-[#2D3436] hover:bg-[#F1F3F4] disabled:opacity-30 disabled:hover:bg-transparent transition-all border-2 border-transparent hover:border-[#DCDDE1]"
              title="Next Bite"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer with custom settings */}
        <div
          ref={textContainerRef}
          onMouseMove={handleMouseMove}
          className={`flex-1 overflow-y-auto p-10 rounded-3xl border-2 border-[#DCDDE1] relative shadow-sm transition-colors duration-200 ${getThemeClass(
            preferences.theme
          )}`}
          style={{
            fontSize: `${preferences.fontSize}px`,
            letterSpacing: `${preferences.letterSpacing}px`,
            wordSpacing: `${preferences.wordSpacing}px`,
            lineHeight: preferences.lineHeight,
          }}
        >
          {/* Visual Focus Reading Ruler */}
          {preferences.showRuler && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 transition-all duration-75"
              style={{
                top: `${rulerTop - preferences.rulerHeight / 2}px`,
                height: `${preferences.rulerHeight}px`,
                backgroundColor: isDark ? `${preferences.rulerColor}40` : `${preferences.rulerColor}30`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${isDark ? "0.6" : "0.2"})`,
                borderTop: `2px solid ${preferences.rulerColor}80`,
                borderBottom: `2px solid ${preferences.rulerColor}80`,
              }}
            />
          )}

          <div className={`relative z-5 space-y-6 ${getFontFamilyStyle(preferences.fontFamily)}`}>
            {sentences.map((sentence, sIdx) => {
              const isActive = activeSentenceIndex === sIdx;
              return (
                <span
                  key={sIdx}
                  onClick={() => playSentence(sIdx)}
                  className={`inline-block cursor-pointer transition-all duration-150 rounded-xl px-2 py-1 hover:bg-[#E6F4EA] ${
                    isActive
                      ? "bg-[#FFFBCC] !text-[#2D3436] border-l-8 border-[#FFD93D] shadow-sm italic font-black scale-[1.01]"
                      : ""
                  }`}
                  title="Click to read from here"
                >
                  {sentence}{" "}
                </span>
              );
            })}
          </div>
        </div>

        {/* Pro-Tips footer */}
        <div className="mt-6 bg-[#E6F4EA] border-l-4 border-[#34A853] p-4 rounded-r-xl">
          <p className="text-xs text-[#1E8E3E] font-medium flex items-center gap-2">
            <span className="font-black uppercase tracking-wider bg-[#34A853] text-white px-2 py-0.5 rounded-md">Pro-Tip</span>
            Click on <span className="font-bold underline cursor-pointer hover:text-[#4285F4] transition-colors">any sentence</span> inside the reading canvas above to immediately read from that line!
          </p>
        </div>
      </div>
    </div>
  );
}
