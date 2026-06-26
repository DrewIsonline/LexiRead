import React, { useState, useEffect } from "react";
import { SavedCourse, ReadingPreferences, SectionAnalysis } from "./types";
import DyslexiaControls from "./components/DyslexiaControls";
import ReaderPanel from "./components/ReaderPanel";
import CompanionPanel from "./components/CompanionPanel";
import WorkspacePanel from "./components/WorkspacePanel";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Plus,
  Sparkles,
  Globe,
  FileText,
  Trash2,
  Settings,
  Brain,
  Compass,
  GraduationCap,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

// Initial Demo Courses to provide immediate value
const DEMO_COURSES: SavedCourse[] = [
  {
    id: "gemma-course-demo",
    title: "Introduction to Google Gemma Open Models",
    sections: [
      "What is Google's Gemma model family? Gemma is a family of lightweight, state-of-the-art open models built from the same research and technology used to create Google's flagship Gemini models. Developed by Google DeepMind and other teams across Google, Gemma is inspired by the Latin word gemma, which means 'precious stone'. Gemma models are designed to enable developers, researchers, and creators to build intelligent software, run fast serverless workloads, and analyze complex reading contents securely on standard computers or enterprise cloud infrastructure.",
      "Enterprise Scaling with Google Cloud. To bring lightweight Gemma models to scale in production environments, developers deploy them on modern Vertex AI systems or Google Kubernetes Engine (GKE). This allows businesses to harness Gemini-level smart capabilities while maintaining full authoritative control over their private databases, training guidelines, latency parameters, and cost envelopes. By combining custom open models like Gemma with Google Cloud's highly optimized hardware, creators can build specialized search architectures, contextual documentation summarizers, and highly personalized accessibility frameworks.",
    ],
    currentSectionIndex: 0,
    sourceUrl: "https://ai.google.dev/gemma",
    dateAdded: "2026-06-25",
    notes: "",
    drawingStrokes: "",
  },
  {
    id: "dyslexia-guide-demo",
    title: "Guide: Optimizing Your Reading for Dyslexia",
    sections: [
      "Welcome to LexiRead! Did you know that standard fonts and layouts make reading unnecessarily stressful for dyslexic brains? Many traditional letters are near-mirror images of one another. For example, the letters b and d, or p and q. When scanned rapidly, a dyslexic visual processor can inadvertently rotate, swap, or crowd these letters together. This is known as the crowding effect. Fortunately, simple design alterations can bypass this friction completely.",
      "Aesthetic and Spacing Solutions. Science shows that selecting typefaces with distinct visual anchors (such as Comic Neue, Andika, or Lexend), heavier baselines, and generous spacing reduces visual confusion significantly. By expanding the gaps between letters, words, and paragraph lines, the brain is given the horizontal and vertical breathing room it needs to isolate characters. Furthermore, high-contrast background themes (like soft off-whites, creams, and pastel yellows) reduce harsh blue-light screen glare, preventing eye strain and letting readers learn for hours with joy.",
    ],
    currentSectionIndex: 0,
    sourceUrl: "https://www.dyslexiaia.org",
    dateAdded: "2026-06-25",
    notes: "",
    drawingStrokes: "",
  },
];

const DEFAULT_PREFS: ReadingPreferences = {
  fontFamily: "comic-neue",
  fontSize: 20,
  letterSpacing: 2,
  wordSpacing: 4,
  lineHeight: 1.8,
  theme: "cream",
  speechSpeed: 0.85, // recommended dyslexia-friendly pace (slightly slower)
  speechPitch: 1.0,
  voiceName: "",
  showRuler: false,
  rulerColor: "#fde047",
  rulerHeight: 50,
};

export default function App() {
  // Load initial settings
  const [courses, setCourses] = useState<SavedCourse[]>(() => {
    const saved = localStorage.getItem("lexiread_courses");
    return saved ? JSON.parse(saved) : DEMO_COURSES;
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    const saved = localStorage.getItem("lexiread_active_course_id");
    return saved && JSON.parse(saved) ? JSON.parse(saved) : DEMO_COURSES[0].id;
  });

  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    const saved = localStorage.getItem("lexiread_prefs");
    return saved ? JSON.parse(saved) : DEFAULT_PREFS;
  });

  const [cachedAnalyses, setCachedAnalyses] = useState<{ [key: string]: SectionAnalysis }>(() => {
    const saved = localStorage.getItem("lexiread_cached_analyses");
    return saved ? JSON.parse(saved) : {};
  });

  // UI States
  const [ingestTab, setIngestTab] = useState<"url" | "paste">("url");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [inputPasteTitle, setInputPasteTitle] = useState<string>("");
  const [inputPasteText, setInputPasteText] = useState<string>("");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  
  const [rightPanelTab, setRightPanelTab] = useState<"companion" | "workspace">("companion");
  const [showConfigSettings, setShowConfigSettings] = useState<boolean>(true);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("lexiread_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("lexiread_active_course_id", JSON.stringify(activeCourseId));
  }, [activeCourseId]);

  useEffect(() => {
    localStorage.setItem("lexiread_prefs", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem("lexiread_cached_analyses", JSON.stringify(cachedAnalyses));
  }, [cachedAnalyses]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || null;

  // Ingest URL Action
  const handleScrapeUrl = async () => {
    if (!inputUrl.trim()) {
      setIngestError("Please type or paste a valid URL.");
      return;
    }

    setIsIngesting(true);
    setIngestError(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to parse website.");
      }

      const parsed: { title: string; sections: string[] } = await res.json();

      const newCourse: SavedCourse = {
        id: "course-" + Date.now(),
        title: parsed.title,
        sections: parsed.sections,
        currentSectionIndex: 0,
        sourceUrl: inputUrl,
        dateAdded: new Date().toISOString().split("T")[0],
        notes: "",
        drawingStrokes: "",
      };

      setCourses((prev) => [newCourse, ...prev]);
      setActiveCourseId(newCourse.id);
      setInputUrl("");
      setIngestError(null);
    } catch (err: any) {
      console.error(err);
      setIngestError(err.message || "An error occurred while analyzing the URL.");
    } finally {
      setIsIngesting(false);
    }
  };

  // Ingest Pasted Text Action
  const handleIngestPaste = async () => {
    if (!inputPasteText.trim()) {
      setIngestError("Please paste some course text content first.");
      return;
    }

    setIsIngesting(true);
    setIngestError(null);

    try {
      const res = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputPasteText,
          title: inputPasteTitle.trim() || "Pasted Lecture Study Material",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to segment pasted text.");
      }

      const parsed = await res.json();

      const newCourse: SavedCourse = {
        id: "course-" + Date.now(),
        title: parsed.title,
        sections: parsed.sections,
        currentSectionIndex: 0,
        dateAdded: new Date().toISOString().split("T")[0],
        notes: "",
        drawingStrokes: "",
      };

      setCourses((prev) => [newCourse, ...prev]);
      setActiveCourseId(newCourse.id);
      setInputPasteText("");
      setInputPasteTitle("");
      setIngestError(null);
    } catch (err: any) {
      console.error(err);
      setIngestError(err.message || "An error occurred while segmenting text.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this course from your library?")) {
      const filtered = courses.filter((c) => c.id !== id);
      setCourses(filtered);
      if (activeCourseId === id && filtered.length > 0) {
        setActiveCourseId(filtered[0].id);
      }
    }
  };

  // Update active course details live
  const handleUpdateCourse = (updatedData: Partial<SavedCourse>) => {
    if (!activeCourse) return;
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourse.id ? { ...c, ...updatedData } : c))
    );
  };

  const handleSectionIndexChange = (newIdx: number) => {
    if (!activeCourse) return;
    handleUpdateCourse({ currentSectionIndex: newIdx });
  };

  // Gemini Companion tools analyzer callback
  const handleAnalysisGenerated = (cId: string, sIndex: number, analysis: SectionAnalysis) => {
    const key = `${cId}-${sIndex}`;
    setCachedAnalyses((prev) => ({ ...prev, [key]: analysis }));
  };

  const activeAnalysisKey = activeCourse ? `${activeCourse.id}-${activeCourse.currentSectionIndex}` : "";
  const currentAnalysis = cachedAnalyses[activeAnalysisKey] || null;

  return (
    <div className="min-h-screen bg-[#FEF9EF] flex flex-col font-sans antialiased text-[#2D3436]" style={{ letterSpacing: "0.02em" }}>
      {/* 1. App Navigation Bar */}
      <header className="bg-white border-b-4 border-[#FFD93D] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#4285F4] text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-[#2D3436] text-xl tracking-tight uppercase flex items-center gap-2">
              LexiRead <span className="text-xs bg-[#E9ECEF] text-[#4285F4] border-b-2 border-[#BDC1C6] px-2 py-0.5 rounded-full font-bold uppercase">TTS Workspace</span>
            </h1>
            <p className="text-xs text-[#636E72] font-bold">Inclusive AI & Text-to-Speech Companion</p>
          </div>
        </div>

        {/* Global Toolbar Toggle */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-prefs-btn"
            onClick={() => setShowConfigSettings(!showConfigSettings)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-2 ${
              showConfigSettings
                ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#34A853] border-b-4"
                : "bg-white hover:bg-[#F1F3F4] text-[#2D3436] border-[#DCDDE1] border-b-4"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {showConfigSettings ? "Hide Custom Styling" : "Dyslexia Style Panel"}
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        
        {/* Left Side: Library & Ingestion Panel (Col-span-3) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* A. Load/Import Materials Form */}
          <div className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-[#4285F4] font-black" />
              <h3 className="font-black text-[#2D3436] text-sm uppercase tracking-wider">Import Study Courses</h3>
            </div>

            {/* URL vs Paste tabs */}
            <div className="flex bg-[#F1F3F4] p-1.5 rounded-2xl text-xs font-bold border-b-4 border-[#BDC1C6]">
              <button
                id="tab-ingest-url"
                onClick={() => setIngestTab("url")}
                className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                  ingestTab === "url" ? "bg-white text-[#4285F4] shadow-sm border-b-2 border-[#BDC1C6]" : "text-[#5F6368] hover:text-[#2D3436]"
                }`}
              >
                <Globe className="w-4 h-4" /> Web Link
              </button>
              <button
                id="tab-ingest-paste"
                onClick={() => setIngestTab("paste")}
                className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                  ingestTab === "paste" ? "bg-white text-[#4285F4] shadow-sm border-b-2 border-[#BDC1C6]" : "text-[#5F6368] hover:text-[#2D3436]"
                }`}
              >
                <FileText className="w-4 h-4" /> Copy & Paste
              </button>
            </div>

            {/* Ingest Content Form fields */}
            <div className="space-y-3 pt-2">
              {ingestTab === "url" ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#636E72] font-medium">
                    Paste any course lecture, article, wiki, or lesson page link from Google, Coursera, etc.
                  </p>
                  <div className="flex flex-col xl:flex-row gap-3">
                    <input
                      id="input-scrape-url"
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="e.g. cloud.google.com/blog/gemma-models"
                      className="flex-1 bg-[#F1F3F4] text-xs px-4 py-3 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#4285F4] focus:bg-white text-[#2D3436] font-medium transition-all"
                    />
                    <button
                      id="btn-scrape-url"
                      disabled={isIngesting}
                      onClick={handleScrapeUrl}
                      className="bg-[#4285F4] hover:bg-[#3059A3] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-1.5 shrink-0 transition-all border-b-4 border-[#3059A3] active:border-b-0 active:translate-y-1"
                    >
                      {isIngesting ? "Scraping..." : "Scrape"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    id="input-paste-title"
                    type="text"
                    value={inputPasteTitle}
                    onChange={(e) => setInputPasteTitle(e.target.value)}
                    placeholder="Enter Course/Lecture Title..."
                    className="w-full bg-[#F1F3F4] text-xs px-4 py-3 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#4285F4] focus:bg-white text-[#2D3436] font-medium transition-all"
                  />
                  <textarea
                    id="textarea-paste-content"
                    value={inputPasteText}
                    onChange={(e) => setInputPasteText(e.target.value)}
                    placeholder="Paste the course, textbook, or lecture paragraphs here..."
                    className="w-full bg-[#F1F3F4] text-xs px-4 py-3 h-28 rounded-xl border-2 border-transparent focus:outline-none focus:border-[#4285F4] focus:bg-white text-[#2D3436] font-medium resize-none transition-all"
                  />
                  <button
                    id="btn-ingest-paste"
                    disabled={isIngesting}
                    onClick={handleIngestPaste}
                    className="w-full bg-[#34A853] hover:bg-[#1E8E3E] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-1.5 border-b-4 border-[#1E8E3E] active:border-b-0 active:translate-y-1"
                  >
                    {isIngesting ? "Segmenting..." : "✨ Format & Chunk Text"}
                  </button>
                </div>
              )}

              {/* Ingest error feedback */}
              {ingestError && (
                <div className="p-4 bg-[#FFFBCC] border-l-4 border-[#FFD93D] rounded-r-xl text-xs text-[#2D3436] flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#F9AB00]" />
                  <div>
                    <p className="font-black uppercase tracking-wider text-[#B06000] mb-1">Notice</p>
                    <p className="text-[11px] leading-relaxed font-medium">{ingestError}</p>
                    <button
                      onClick={() => setIngestTab("paste")}
                      className="text-xs uppercase font-black mt-2 text-[#4285F4] hover:text-[#3059A3]"
                    >
                      Or switch to Copy & Paste →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* B. Course Library List */}
          <div className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-6 shadow-sm flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#F1F3F4] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#2D3436]" />
                <h3 className="font-black text-[#2D3436] text-sm uppercase tracking-wider">Your Course Library</h3>
              </div>
              <span className="text-[10px] bg-[#E9ECEF] text-[#636E72] px-3 py-1 rounded-full font-black uppercase tracking-wider border-b-2 border-[#BDC1C6]">
                {courses.length} Saved
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] lg:max-h-none pr-1">
              {courses.map((c) => {
                const isActive = c.id === activeCourseId;
                return (
                  <div
                    key={c.id}
                    id={`course-item-${c.id}`}
                    onClick={() => setActiveCourseId(c.id)}
                    className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex justify-between items-start gap-3 group relative ${
                      isActive
                        ? "bg-[#E6F4EA] border-[#34A853] shadow-[4px_4px_0px_0px_rgba(52,168,83,0.15)]"
                        : "bg-white border-[#DCDDE1] hover:border-[#BDC1C6] hover:bg-[#F1F3F4]"
                    }`}
                  >
                    <div className="space-y-1.5 pr-6">
                      <h4 className={`font-black text-sm leading-snug line-clamp-2 ${isActive ? 'text-[#1E8E3E]' : 'text-[#2D3436]'}`}>
                        {c.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#636E72] uppercase tracking-wider">
                        <span className={`px-2 py-0.5 rounded-md ${isActive ? 'bg-[#34A853] text-white' : 'bg-[#E9ECEF]'}`}>
                          Bite {c.currentSectionIndex + 1} / {c.sections.length}
                        </span>
                        <span>{c.dateAdded}</span>
                      </div>
                    </div>
                    
                    <button
                      id={`delete-course-btn-${c.id}`}
                      onClick={(e) => handleDeleteCourse(c.id, e)}
                      className="text-[#BDC1C6] hover:text-[#EA4335] p-1.5 rounded-lg transition-all absolute right-2 top-3 group-hover:opacity-100 bg-white border-2 border-transparent hover:border-[#EA4335]"
                      title="Remove Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {courses.length === 0 && (
                <div className="text-center py-10 bg-[#F1F3F4] rounded-2xl border-2 border-dashed border-[#BDC1C6]">
                  <p className="text-xs text-[#636E72] font-bold uppercase tracking-wider">No active courses.<br/>Paste or scrape above to begin!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Core Learning Frame (Col-span-9) */}
        <div className="xl:col-span-9 flex flex-col gap-6 xl:gap-8">
          
          {/* Collapsible Dyslexia Preference adjustments */}
          <AnimatePresence initial={false}>
            {showConfigSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <DyslexiaControls preferences={preferences} setPreferences={setPreferences} />
              </motion.div>
            )}
          </AnimatePresence>

          {activeCourse ? (
            <div className="flex flex-col gap-8">
              
              {/* Primary Dyslexic Reader Canvas */}
              <div className="w-full h-auto min-h-[500px]">
                <ReaderPanel
                  course={activeCourse}
                  preferences={preferences}
                  setPreferences={setPreferences}
                  onSectionChange={handleSectionIndexChange}
                />
              </div>

              {/* Auxiliary Panel: Gemini Companion & Sensory Workspace */}
              <div className="w-full flex flex-col gap-6">
                
                {/* Secondary Column Tab Navigator */}
                <div className="flex bg-[#F1F3F4] p-2 rounded-2xl border-b-4 border-[#BDC1C6] max-w-2xl mx-auto w-full">
                  <button
                    id="right-panel-tab-companion"
                    onClick={() => setRightPanelTab("companion")}
                    className={`flex-1 py-4 rounded-xl text-sm font-black uppercase transition-all flex items-center justify-center gap-2 ${
                      rightPanelTab === "companion"
                        ? "bg-white text-[#4285F4] border-b-4 border-[#BDC1C6] shadow-sm scale-[1.02]"
                        : "text-[#5F6368] hover:text-[#2D3436]"
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-[#4285F4]" />
                    Gemini AI Companion
                  </button>
                  <button
                    id="right-panel-tab-workspace"
                    onClick={() => setRightPanelTab("workspace")}
                    className={`flex-1 py-4 rounded-xl text-sm font-black uppercase transition-all flex items-center justify-center gap-2 ${
                      rightPanelTab === "workspace"
                        ? "bg-white text-[#F9AB00] border-b-4 border-[#BDC1C6] shadow-sm scale-[1.02]"
                        : "text-[#5F6368] hover:text-[#2D3436]"
                    }`}
                  >
                    <Compass className="w-5 h-5 text-[#F9AB00]" />
                    Interactive Workspace
                  </button>
                </div>

                {/* Switchable Display components */}
                <div className="flex-1 min-h-[480px]">
                  {rightPanelTab === "companion" ? (
                    <CompanionPanel
                      courseId={activeCourse.id}
                      sectionIndex={activeCourse.currentSectionIndex}
                      sectionText={activeCourse.sections[activeCourse.currentSectionIndex] || ""}
                      analysis={currentAnalysis}
                      onAnalysisGenerated={handleAnalysisGenerated}
                    />
                  ) : (
                    <WorkspacePanel
                      course={activeCourse}
                      onUpdateCourse={handleUpdateCourse}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
              <HelpCircle className="w-16 h-16 text-[#4285F4] mb-6 animate-bounce" />
              <h3 className="text-2xl font-black text-[#2D3436] mb-3 uppercase tracking-tight">No Active Study Course</h3>
              <p className="text-sm font-medium text-[#636E72] max-w-md leading-relaxed mb-6">
                To start learning, please choose one of our preset courses in the Library on the left, or input your own course link or pasted lecture details!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer copyright block */}
      <footer className="bg-[#2D3436] py-6 px-10 text-center text-xs text-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-bold opacity-80 uppercase tracking-widest">LexiRead TTS Workspace — Empowering inclusive education.</p>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#4285F4] rounded-full flex items-center justify-center shadow-xl">
               <GraduationCap className="w-4 h-4 text-white" />
             </div>
             <p className="font-mono text-[10px] font-bold opacity-60">100% Client-Safe Native Web Speech & Google Gemma Powered models.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
