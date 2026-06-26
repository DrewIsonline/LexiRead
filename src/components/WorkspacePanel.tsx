import React, { useState, useEffect, useRef } from "react";
import { SavedCourse, ScribbleStroke } from "../types";
import { Pencil, FileText, Mic, MicOff, RotateCcw, Eraser, Trash2, Cloud, Download, AlertCircle } from "lucide-react";
import { initAuth, googleSignIn, getAccessToken } from "../lib/auth";
import { fetchNotes, KeepNote } from "../lib/keep";

interface WorkspacePanelProps {
  course: SavedCourse;
  onUpdateCourse: (updated: Partial<SavedCourse>) => void;
}

export default function WorkspacePanel({ course, onUpdateCourse }: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<"write" | "speak" | "scribble" | "keep">("write");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [dictationError, setDictationError] = useState<string | null>(null);

  // Keep state
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [keepError, setKeepError] = useState<string | null>(null);

  useEffect(() => {
    initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setKeepError(null);
    try {
      await googleSignIn();
      setNeedsAuth(false);
    } catch (err) {
      console.error('Login failed:', err);
      setKeepError("Failed to sign in to Google. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadKeepNotes = async () => {
    setIsLoadingNotes(true);
    setKeepError(null);
    try {
      const notes = await fetchNotes();
      setKeepNotes(notes);
    } catch (err: any) {
      setKeepError(err.message || "Failed to load Google Keep notes.");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (activeTab === "keep" && !needsAuth && keepNotes.length === 0) {
      loadKeepNotes();
    }
  }, [activeTab, needsAuth]);

  // Notes state
  const notesText = course.notes || "";


  // Scribble state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>("#4f46e5"); // default indigo
  const [width, setWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<ScribbleStroke[]>([]);
  const isErasing = color === "eraser";

  // Load existing scribbles if any
  useEffect(() => {
    if (course.drawingStrokes) {
      try {
        const loaded = JSON.parse(course.drawingStrokes);
        setStrokes(loaded);
      } catch (err) {
        console.error("Failed to load saved drawings", err);
      }
    } else {
      setStrokes([]);
    }
  }, [course.id]);

  // Save scribbles when they change
  const saveStrokes = (updatedStrokes: ScribbleStroke[]) => {
    setStrokes(updatedStrokes);
    onUpdateCourse({ drawingStrokes: JSON.stringify(updatedStrokes) });
  };

  // Canvas drawing lifecycle
  useEffect(() => {
    if (activeTab === "scribble" && canvasRef.current) {
      drawCanvas();
    }
  }, [activeTab, strokes]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background (match new vibrant layout)
    ctx.fillStyle = "#FEF9EF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.strokeStyle = stroke.color === "eraser" ? "#FEF9EF" : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });
  };

  // Triggered by pointer activity (mouse or touch stylus)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale back to logical coordinates based on canvas internal width/height vs bounds
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coord = getCoordinates(e);
    if (!coord) return;

    setIsDrawing(true);
    const newStroke: ScribbleStroke = {
      points: [coord],
      color: color,
      width: width,
    };
    saveStrokes([...strokes, newStroke]);
  };

  const handleDrawingMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coord = getCoordinates(e);
    if (!coord) return;

    const updated = [...strokes];
    const current = updated[updated.length - 1];
    if (current) {
      current.points.push(coord);
      saveStrokes(updated);
    }
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const remaining = strokes.slice(0, -1);
    saveStrokes(remaining);
  };

  const handleClearCanvas = () => {
    if (window.confirm("Do you want to clear your scribble pad?")) {
      saveStrokes([]);
    }
  };

  // Speech Recognition (Dictation Web Speech API)
  const recognitionRef = useRef<any>(null);

  const toggleDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setDictationError("Speech recognition is not supported in this browser. We suggest trying Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setDictationError(null);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        const currentNotes = course.notes || "";
        onUpdateCourse({ notes: currentNotes + (currentNotes ? " " : "") + transcript });
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error", event);
        setDictationError(`Dictation inactive: ${event.error || "Permission issue"}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Ensure recognition stops on dismantle
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div id="workspace-panel-root" className="bg-[#4285F4] rounded-3xl border-2 border-transparent border-b-8 border-[#3059A3] shadow-sm overflow-hidden flex flex-col h-full text-white">
      {/* Tab Selectors */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#4285F4] shadow-md">
            <Pencil className="w-5 h-5" />
          </div>
          <h3 className="font-black uppercase tracking-wider text-sm">Interactive Workspace</h3>
        </div>

        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-1.5 bg-[#3059A3] p-1.5 rounded-2xl">
          <button
            id="work-tab-write"
            onClick={() => setActiveTab("write")}
            className={`flex-1 px-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "write" ? "bg-white text-[#4285F4] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> Notes
          </button>
          <button
            id="work-tab-speak"
            onClick={() => setActiveTab("speak")}
            className={`flex-1 px-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "speak" ? "bg-white text-[#4285F4] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <Mic className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> Dictate
          </button>
          <button
            id="work-tab-scribble"
            onClick={() => setActiveTab("scribble")}
            className={`flex-1 px-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "scribble" ? "bg-white text-[#4285F4] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <Pencil className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> Scribble
          </button>
          <button
            id="work-tab-keep"
            onClick={() => setActiveTab("keep")}
            className={`flex-1 px-1 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "keep" ? "bg-white text-[#4285F4] shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            <Cloud className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> Keep Sync
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[300px] bg-white rounded-t-3xl border-t-4 border-[#3059A3] text-[#2D3436]">
        {/* Tab 1: NOTE PAD */}
        {activeTab === "write" && (
          <div className="flex-1 flex flex-col p-6 space-y-4 h-full bg-[#FEF9EF]">
            <div className="flex justify-between items-center text-xs text-[#636E72]">
              <span className="font-bold uppercase tracking-widest">Capture your thoughts</span>
              <span className="bg-[#E9ECEF] text-[#2D3436] px-3 py-1 rounded-full font-black border-b-2 border-[#BDC1C6]">Auto-saving</span>
            </div>
            <textarea
              id="notes-textarea"
              value={notesText}
              onChange={(e) => onUpdateCourse({ notes: e.target.value })}
              placeholder="Start writing down your course summaries, memory keys, or questions here..."
              className="flex-1 w-full bg-white rounded-2xl border-2 border-[#DCDDE1] p-6 text-[#2D3436] placeholder-[#BDC1C6] text-[15px] font-medium leading-relaxed focus:outline-none focus:border-[#4285F4] shadow-sm resize-none"
              style={{ letterSpacing: "0.02em" }}
            />
          </div>
        )}

        {/* Tab 2: DICTATE / SPEAK NOTES */}
        {activeTab === "speak" && (
          <div className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8 bg-[#FEF9EF]">
            <div className="max-w-md">
              <h4 className="font-black uppercase tracking-tight text-2xl text-[#2D3436] mb-3">Voice Notebook</h4>
              <p className="text-sm text-[#636E72] font-medium leading-relaxed">
                Dyslexic learners often express their answers, notes, and understanding much better by speaking. Click below and simply describe your key takeaways out loud! We will transcribe them directly into your Note Pad.
              </p>
            </div>

            {/* Micro Indicator button */}
            <button
              id="toggle-dictation-btn"
              onClick={toggleDictation}
              className={`w-28 h-28 rounded-[2rem] border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-2 active:shadow-none transition-all flex flex-col items-center justify-center gap-2 ${
                isListening
                  ? "bg-[#EA4335] text-white border-[#C5221F] animate-pulse"
                  : "bg-white text-[#4285F4] border-[#DCDDE1]"
              }`}
            >
              {isListening ? <Mic className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
            </button>

            <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#DCDDE1] shadow-sm min-w-[250px]">
              <p className={`text-sm font-black uppercase tracking-widest ${isListening ? "text-[#EA4335] animate-pulse" : "text-[#636E72]"}`}>
                {isListening ? "🟢 Listening (Speak now)..." : "⚪ Dictation Inactive"}
              </p>
              <p className="text-[10px] text-[#636E72] font-bold">Captured voice text is appended automatically.</p>
            </div>

            {dictationError && (
              <div className="p-4 bg-[#FCE8E6] text-[#C5221F] border-2 border-[#EA4335] border-b-4 font-bold text-xs rounded-2xl flex items-center gap-3 max-w-sm">
                <MicOff className="w-6 h-6 shrink-0 text-[#EA4335]" />
                <span>{dictationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SCRIBBLE DRAWING PAD */}
        {activeTab === "scribble" && (
          <div className="flex-1 flex flex-col h-full relative">
            {/* Scribble tool selector panel */}
            <div className="bg-[#F1F3F4] p-3 border-b-2 border-[#DCDDE1] flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-4">
                {/* Brush Width */}
                <div className="flex items-center gap-2 bg-white border-2 border-[#DCDDE1] px-3 py-1.5 rounded-xl shadow-sm">
                  <span className="font-black text-[10px] text-[#636E72] uppercase mr-1 tracking-widest">Weight</span>
                  {[2, 4, 8].map((w) => (
                    <button
                      key={w}
                      id={`stroke-width-${w}`}
                      onClick={() => setWidth(w)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono transition-all border-2 ${
                        width === w ? "bg-[#2D3436] text-white border-[#2D3436]" : "bg-white text-[#2D3436] border-[#DCDDE1] hover:border-[#BDC1C6]"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* Colors */}
                <div className="flex items-center gap-2 bg-white border-2 border-[#DCDDE1] px-3 py-1.5 rounded-xl shadow-sm">
                  <span className="font-black text-[10px] text-[#636E72] uppercase mr-1 tracking-widest">Ink</span>
                  {[
                    { hex: "#4285F4", label: "blue" },
                    { hex: "#EA4335", label: "red" },
                    { hex: "#34A853", label: "green" },
                    { hex: "#F9AB00", label: "yellow" },
                    { hex: "#2D3436", label: "dark" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      id={`canvas-color-${c.label}`}
                      onClick={() => setColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        color === c.hex ? "border-[#2D3436] scale-125 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <div className="w-px h-6 bg-[#DCDDE1] mx-1"></div>
                  <button
                    id="canvas-tool-eraser"
                    onClick={() => setColor("eraser")}
                    className={`p-1.5 rounded-lg border-2 transition-all ${
                      isErasing ? "border-[#2D3436] bg-[#F1F3F4] shadow-sm" : "border-[#DCDDE1] bg-white hover:border-[#BDC1C6] text-[#636E72]"
                    }`}
                    title="Eraser Tool"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Utility actions: Undo, Clear */}
              <div className="flex items-center gap-3">
                <button
                  id="canvas-action-undo"
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  className="px-4 py-2 bg-white border-2 border-[#DCDDE1] border-b-4 hover:translate-y-[2px] hover:border-b-2 rounded-xl font-black text-[#2D3436] uppercase tracking-wider disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Undo
                </button>
                <button
                  id="canvas-action-clear"
                  onClick={handleClearCanvas}
                  disabled={strokes.length === 0}
                  className="px-4 py-2 bg-[#EA4335] border-2 border-[#C5221F] border-b-4 hover:translate-y-[2px] hover:border-b-2 rounded-xl font-black text-white uppercase tracking-wider disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              </div>
            </div>

            {/* Drawing surface */}
            <div className="flex-1 bg-[#FEF9EF] relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                onMouseDown={handleStartDrawing}
                onMouseMove={handleDrawingMove}
                onMouseUp={handleStopDrawing}
                onMouseLeave={handleStopDrawing}
                onTouchStart={handleStartDrawing}
                onTouchMove={handleDrawingMove}
                onTouchEnd={handleStopDrawing}
                className="w-full h-full block cursor-crosshair touch-none"
              />
              <span className="absolute bottom-4 right-4 text-[10px] font-black uppercase tracking-widest text-[#636E72] bg-white px-3 py-1.5 rounded-full border-2 border-[#DCDDE1] pointer-events-none shadow-sm">
                ✍️ Draw letters or shapes
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: GOOGLE KEEP SYNC */}
        {activeTab === "keep" && (
          <div className="flex-1 flex flex-col p-6 space-y-6 h-full bg-[#FEF9EF] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-black uppercase tracking-tight text-xl text-[#2D3436]">Google Keep Courses</h4>
                <p className="text-xs text-[#636E72] font-medium leading-relaxed max-w-lg mt-1">
                  Load your courses directly from Google Keep. Your browser storage can hold offline notes easily, but Keep gives you unlimited cloud access anywhere.
                </p>
              </div>
              {!needsAuth && (
                <button
                  onClick={loadKeepNotes}
                  disabled={isLoadingNotes}
                  className="px-4 py-2 bg-[#34A853] text-white border-b-4 border-[#1E8E3E] hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px] rounded-xl font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center gap-2 text-xs"
                >
                  <RotateCcw className={`w-4 h-4 ${isLoadingNotes ? 'animate-spin' : ''}`} /> Refresh
                </button>
              )}
            </div>

            {keepError && (
              <div className="p-4 bg-[#FCE8E6] text-[#C5221F] border-2 border-[#EA4335] border-b-4 font-bold text-xs rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0 text-[#EA4335]" />
                <span>{keepError}</span>
              </div>
            )}

            {needsAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border-2 border-[#DCDDE1] rounded-2xl shadow-sm">
                <Cloud className="w-16 h-16 text-[#BDC1C6] mb-4" />
                <h5 className="font-black text-lg text-[#2D3436] mb-2 uppercase tracking-tight">Connect Google Keep</h5>
                <p className="text-sm text-[#636E72] mb-6 max-w-xs">
                  Sign in with your Google account to access your notes and load course materials in real-time.
                </p>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button bg-white border-2 border-[#DCDDE1] border-b-4 hover:translate-y-[2px] hover:border-b-2 hover:bg-[#F1F3F4] active:translate-y-[4px] active:border-b-0 disabled:opacity-50 transition-all rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-6 h-6 shrink-0">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="font-black text-[#2D3436] uppercase tracking-wider text-sm">
                    {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoadingNotes && keepNotes.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#636E72] font-black uppercase tracking-widest text-sm animate-pulse">
                    Loading your notes...
                  </div>
                ) : keepNotes.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#636E72] font-black uppercase tracking-widest text-sm bg-white border-2 border-dashed border-[#BDC1C6] rounded-2xl">
                    No notes found in Google Keep.
                  </div>
                ) : (
                  keepNotes.map((note, idx) => (
                    <div key={idx} className="bg-white border-2 border-[#DCDDE1] rounded-2xl p-4 shadow-sm hover:border-[#4285F4] transition-all flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-[#2D3436] mb-2 truncate" title={note.title || "Untitled Note"}>
                          {note.title || "Untitled Note"}
                        </h5>
                        <p className="text-xs text-[#636E72] line-clamp-3 leading-relaxed mb-4">
                          {note.body?.text?.text || 
                           note.list?.listItems?.map(item => item.text?.text).join(", ") || 
                           "Empty note"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Append "${note.title || 'this note'}" to your current course notes?`)) {
                            const content = note.body?.text?.text || 
                                          note.list?.listItems?.map(item => `- ${item.text?.text}`).join("\n") || "";
                            onUpdateCourse({ 
                              notes: course.notes ? `${course.notes}\n\n--- From Keep: ${note.title} ---\n${content}` : content 
                            });
                            setActiveTab("write");
                          }
                        }}
                        className="w-full px-4 py-2 bg-[#F1F3F4] text-[#4285F4] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#DCDDE1] hover:bg-[#4285F4] hover:text-white hover:border-[#4285F4] transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Import Note
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
