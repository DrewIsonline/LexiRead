import React, { useState } from "react";
import { SectionAnalysis, QuizQuestion } from "../types";
import { Sparkles, Brain, CheckCircle, AlertCircle, RefreshCw, HelpCircle, BookMarked, Lightbulb } from "lucide-react";

interface CompanionPanelProps {
  courseId: string;
  sectionIndex: number;
  sectionText: string;
  analysis: SectionAnalysis | null;
  onAnalysisGenerated: (courseId: string, sectionIndex: number, analysis: SectionAnalysis) => void;
}

export default function CompanionPanel({
  courseId,
  sectionIndex,
  sectionText,
  analysis,
  onAnalysisGenerated,
}: CompanionPanelProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track selected quiz answers: { [questionIndex]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [activeTab, setActiveTab] = useState<"summary" | "glossary" | "quiz">("summary");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setQuizAnswers({});

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sectionText }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze learning material.");
      }

      const data: SectionAnalysis = await response.json();
      onAnalysisGenerated(courseId, sectionIndex, data);
      setActiveTab("summary");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while calling the Gemini AI service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
  };

  // Rendering state: Not analyzed yet
  if (!analysis && !loading) {
    return (
      <div id="companion-no-analysis" className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-10 shadow-sm text-center flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="bg-[#FEF7E0] border-4 border-[#F9AB00] p-5 rounded-full text-[#B06000] mb-6 shadow-sm">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-[#2D3436] mb-4 uppercase tracking-tight">AI Learning Assistants</h3>
        <p className="text-sm font-medium text-[#636E72] max-w-sm mb-8 leading-relaxed">
          Let Gemma analyze this section of text. It will instantly translate complex concepts into bullet points, design a glossary of key terms with real-world analogies, and build a non-threatening interactive quiz.
        </p>
        <button
          id="btn-trigger-ai"
          onClick={handleGenerate}
          className="bg-[#4285F4] hover:bg-[#3059A3] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 border-b-4 border-[#3059A3] active:border-b-0"
        >
          <Sparkles className="w-5 h-5 fill-current" />
          Generate Tools
        </button>
        {error && (
          <div className="mt-6 p-4 bg-[#FFFBCC] text-[#2D3436] font-medium text-xs rounded-2xl border-2 border-[#FFD93D] flex items-center gap-2 max-w-md">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#EA4335]" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Rendering state: Loading
  if (loading) {
    return (
      <div id="companion-loading" className="bg-white rounded-3xl border-2 border-[#DCDDE1] p-10 shadow-sm text-center flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-8 border-[#F1F3F4] animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-8 border-t-[#4285F4] animate-spin"></div>
        </div>
        <h3 className="text-xl font-black text-[#2D3436] mb-2 uppercase tracking-tight">Gemma is crafting...</h3>
        <p className="text-[10px] text-[#34A853] font-black tracking-widest uppercase mb-6 bg-[#E6F4EA] px-3 py-1 rounded-full border border-[#34A853]">Educator Mode Active</p>
        <div className="text-xs text-[#636E72] font-medium space-y-2 max-w-xs leading-relaxed italic bg-[#F1F3F4] px-5 py-4 rounded-2xl border-2 border-[#DCDDE1]">
          <p>✨ "Simplifying vocabularies..."</p>
          <p>✨ "Isolating core concepts..."</p>
          <p>✨ "Formulating encouraging memory exercises..."</p>
        </div>
      </div>
    );
  }

  // Safe Fallback
  if (!analysis) return null;

  return (
    <div id="companion-workspace-panel" className="bg-white rounded-3xl border-2 border-[#DCDDE1] shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header and Tool Selection Tabs */}
      <div className="bg-[#F1F3F4] p-5 border-b-4 border-[#BDC1C6] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4285F4] rounded-xl flex items-center justify-center text-white shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="font-black text-[#2D3436] text-sm uppercase tracking-wider">AI Companion</h3>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap bg-[#E9ECEF] p-1.5 rounded-2xl border-b-4 border-[#BDC1C6] gap-1">
          <button
            id="tab-btn-summary"
            onClick={() => setActiveTab("summary")}
            className={`flex-1 min-w-[80px] px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "summary" ? "bg-white text-[#4285F4] shadow-sm border-b-2 border-[#BDC1C6]" : "text-[#5F6368] hover:text-[#2D3436]"
            }`}
          >
            Summary
          </button>
          <button
            id="tab-btn-glossary"
            onClick={() => setActiveTab("glossary")}
            className={`flex-1 min-w-[80px] px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "glossary" ? "bg-white text-[#4285F4] shadow-sm border-b-2 border-[#BDC1C6]" : "text-[#5F6368] hover:text-[#2D3436]"
            }`}
          >
            Glossary
          </button>
          <button
            id="tab-btn-quiz"
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 min-w-[80px] px-2 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "quiz" ? "bg-white text-[#4285F4] shadow-sm border-b-2 border-[#BDC1C6]" : "text-[#5F6368] hover:text-[#2D3436]"
            }`}
          >
            Quiz
          </button>
        </div>
      </div>

      {/* Main Companion Body */}
      <div className="flex-1 overflow-y-auto p-8 font-sans" style={{ letterSpacing: "0.03em" }}>
        {/* TAB 1: Bite-Sized Summary */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2 bg-[#F1F3F4] w-max px-4 py-2 rounded-full border-2 border-[#BDC1C6]">
              <div className="w-3 h-3 rounded-full bg-[#4285F4]"></div>
              <h4 className="font-black uppercase text-[#5F6368] text-xs">AI Summary</h4>
            </div>
            <div className="space-y-4">
              {analysis.biteSizedSummary.map((item, idx) => (
                <div key={idx} className="bg-[#FEF9EF] p-5 rounded-2xl border-l-8 border-2 border-[#4285F4] flex items-start gap-4 shadow-sm">
                  <span className="bg-[#4285F4] text-white text-sm font-black px-3 py-1 rounded-lg mt-0.5 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    {idx + 1}
                  </span>
                  <p className="text-[#2D3436] text-[15px] font-medium leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Glossary & Analogies */}
        {activeTab === "glossary" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2 bg-[#E6F4EA] w-max px-4 py-2 rounded-full border-2 border-[#34A853]">
              <div className="w-3 h-3 rounded-full bg-[#34A853]"></div>
              <h4 className="font-black uppercase text-[#1E8E3E] text-xs">Topic Notes</h4>
            </div>

            {analysis.topicNotes.length === 0 ? (
              <div className="text-center py-10 bg-[#F1F3F4] rounded-2xl border-2 border-dashed border-[#BDC1C6]">
                <p className="text-sm font-bold text-[#636E72] uppercase">No complex jargon detected. Way to go!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {analysis.topicNotes.map((note, idx) => (
                  <details
                    key={idx}
                    className="group bg-[#E6F4EA] rounded-2xl border-2 border-[#34A853] border-b-4 p-5 [&_summary::-webkit-details-marker]:hidden transition-all shadow-sm"
                  >
                    <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                      <span className="font-black text-[#2D3436] text-sm flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-[#34A853]"></span>
                        {note.term}
                      </span>
                      <span className="transition group-open:rotate-180 bg-white p-1 rounded-lg border-2 border-[#34A853]">
                        <ChevronDown className="w-5 h-5 text-[#34A853]" />
                      </span>
                    </summary>
                    <p className="mt-4 text-[#2D3436] text-sm font-medium border-t-2 border-[#34A853] border-opacity-30 pt-4 leading-relaxed bg-white/50 p-4 rounded-xl">
                      {note.definition}
                    </p>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Interactive Quiz */}
        {activeTab === "quiz" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-[#F1F3F4] pb-4">
              <div className="flex items-center gap-3 bg-[#FEF7E0] px-4 py-2 rounded-full border-2 border-[#F9AB00]">
                <div className="w-3 h-3 rounded-full bg-[#F9AB00]"></div>
                <h4 className="font-black uppercase text-[#B06000] text-xs">Check Your Learning</h4>
              </div>
              <button
                id="reset-quiz-btn"
                onClick={handleResetQuiz}
                className="text-[10px] text-[#636E72] font-black uppercase tracking-wider flex items-center gap-1.5 hover:text-[#2D3436] bg-[#F1F3F4] px-3 py-1.5 rounded-lg border-2 border-[#DCDDE1]"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-8">
              {analysis.quiz.map((q, qIdx) => {
                const selectedAns = quizAnswers[qIdx];
                const isCorrect = selectedAns === q.correctAnswerIndex;
                const answered = selectedAns !== undefined;

                return (
                  <div key={qIdx} className="bg-[#FEF7E0] border-2 border-[#F9AB00] rounded-3xl p-6 shadow-sm border-b-4 flex flex-col space-y-5">
                    <p className="font-black text-[#2D3436] text-lg leading-tight">{q.question}</p>

                    <div className="flex flex-col gap-3">
                      {q.options.map((opt, oIdx) => {
                        const isThisSelected = selectedAns === oIdx;
                        const isThisCorrect = oIdx === q.correctAnswerIndex;
                        
                        let optBtnStyle = "border-[#F9AB00] bg-white hover:bg-[#F9AB00] hover:text-white";
                        if (answered) {
                          if (isThisCorrect) {
                            optBtnStyle = "border-[#34A853] bg-[#E6F4EA] text-[#1E8E3E]";
                          } else if (isThisSelected) {
                            optBtnStyle = "border-[#EA4335] bg-[#FCE8E6] text-[#C5221F]";
                          } else {
                            optBtnStyle = "border-[#F9AB00] bg-white opacity-60";
                          }
                        } else if (isThisSelected) {
                          optBtnStyle = "border-[#F9AB00] bg-[#F9AB00] text-white shadow-sm";
                        }

                        return (
                          <button
                            key={oIdx}
                            id={`q-${qIdx}-opt-${oIdx}`}
                            disabled={answered}
                            onClick={() => handleSelectOption(qIdx, oIdx)}
                            className={`p-4 text-left text-sm font-bold rounded-2xl border-2 transition-all flex items-center gap-4 ${optBtnStyle}`}
                          >
                            <span className={`font-black text-xs w-7 h-7 rounded-xl flex items-center justify-center shrink-0 uppercase border-2 ${
                              answered && isThisCorrect ? 'border-[#34A853] text-[#34A853] bg-white' : 
                              answered && isThisSelected ? 'border-[#EA4335] text-[#EA4335] bg-white' :
                              'border-current'
                            }`}>
                              {String.fromCharCode(97 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory Positive Feedback panel */}
                    {answered && (
                      <div className={`p-5 rounded-2xl text-sm font-medium flex items-start gap-3 leading-relaxed border-2 border-b-4 ${
                        isCorrect ? "bg-white border-[#34A853] text-[#2D3436]" : "bg-white border-[#4285F4] text-[#2D3436]"
                      }`}>
                        {isCorrect ? (
                          <div className="w-8 h-8 rounded-full bg-[#34A853] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className={`font-black uppercase tracking-wider mb-2 text-xs ${isCorrect ? 'text-[#34A853]' : 'text-[#4285F4]'}`}>
                            {isCorrect ? "Wonderful Job!" : "Let's learn together"}
                          </p>
                          <p>{q.encouragement}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Regene-AI Action Footer */}
      <div className="bg-[#2D3436] p-5 flex items-center justify-between text-xs rounded-b-2xl">
        <span className="text-white opacity-80 font-bold flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#F9AB00]" /> Powered by Gemma
        </span>
        <button
          id="btn-re-trigger-ai"
          onClick={handleGenerate}
          className="bg-[#4285F4] text-white px-4 py-2 rounded-lg font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5"
          title="Re-generate content analysis"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-create
        </button>
      </div>
    </div>
  );
}

// Arrow helper icon
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
