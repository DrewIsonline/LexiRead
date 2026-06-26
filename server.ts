import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to handle pasted texts
app.use(express.json({ limit: "15mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Utility to strip HTML tags and extract clean, readable text
 */
function cleanHtml(html: string): { title: string; sections: string[] } {
  // Strip head, script, style, header, footer, nav, and svg contents entirely
  let clean = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");
  clean = clean.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  clean = clean.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  clean = clean.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  clean = clean.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Extract a Title
  let title = "Extracted Course Material";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].replace(/<[^>]*>/g, "").trim();
    }
  }

  // Replace common container close tags with newlines to keep structure
  clean = clean.replace(/<\/p>/gi, "\n\n");
  clean = clean.replace(/<\/h[1-6]>/gi, "\n\n");
  clean = clean.replace(/<\/li>/gi, "\n");
  clean = clean.replace(/<br\s*\/?>/gi, "\n");

  // Remove remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, " ");

  // Decode basic HTML entities
  clean = clean
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"');

  // Collapse multiple whitespaces/newlines
  clean = clean.replace(/[ \t]+/g, " ");
  const lines = clean
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 15); // Filter out tiny short layout crumbs or buttons

  // Re-group text into paragraphs
  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (const line of lines) {
    if (currentParagraph.length + line.length > 500) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = line;
    } else {
      currentParagraph += (currentParagraph ? " " : "") + line;
    }
  }
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  // Group paragraphs into dyslexic-friendly digestible sections (about 300-450 words each)
  const sections: string[] = [];
  let currentSection = "";
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (currentWordCount + words > 380 && currentSection) {
      sections.push(currentSection.trim());
      currentSection = para;
      currentWordCount = words;
    } else {
      currentSection += (currentSection ? "\n\n" : "") + para;
      currentWordCount += words;
    }
  }
  if (currentSection) {
    sections.push(currentSection.trim());
  }

  // If we couldn't find good content, return a descriptive error
  if (sections.length === 0 || (sections.length === 1 && sections[0].length < 50)) {
    throw new Error(
      "We fetched the page, but were unable to extract clean main text content. The site may be built dynamically or require authentication. We highly recommend copying and pasting the text directly into LexiRead instead!"
    );
  }

  // Sanitize title
  title = title.replace(/<[^>]*>/g, "").trim();
  if (title.length > 100) {
    title = title.substring(0, 97) + "...";
  }

  return { title, sections };
}

// API Routes
app.post("/api/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A valid URL parameter is required." });
  }

  try {
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page. Server returned status code: ${response.status}`);
    }

    const html = await response.text();
    const result = cleanHtml(html);

    res.json(result);
  } catch (error: any) {
    console.error("Scrape Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while fetching and processing the URL content.",
      suggestPaste: true,
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "A valid 'text' parameter is required for analysis." });
  }

  try {
    const prompt = `You are a learning companion specifically trained to support people with dyslexia and reading comprehension difficulties.
Analyze the following section of course text and generate three helpful companion tools to aid comprehension:
1. "biteSizedSummary": A simplified, highly readable, structured summary using 3 to 5 bullet points. Write in short sentences, avoid complex jargon, and ensure a low cognitive reading load.
2. "topicNotes": A list of key terms, acronyms, or potentially confusing vocabulary found in the text, accompanied by simple, intuitive, real-world explanations or analogies.
3. "quiz": A set of 2 to 3 multiple-choice questions to test their comprehension. Keep the tone warm, positive, and encouraging. Each question must have exactly 4 choices, a correct index, and a highly encouraging 'encouragement' feedback string that explains the correct answer.

Here is the text to analyze:
"${text}"`;

    let response;
    let attempt = 0;
    const maxRetries = 3;
    
    while (attempt < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a warm, extremely supportive, and specialized educator helping individuals with dyslexia read and learn with confidence. Keep all language clear, plain, and encouraging.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                biteSizedSummary: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 to 5 easy-to-read, simplified bullet points summarizing the text."
                },
                topicNotes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING, description: "The term, keyword, or concept." },
                      definition: { type: Type.STRING, description: "A simple, non-jargon, intuitive definition." }
                    },
                    required: ["term", "definition"]
                  },
                  description: "A glossary of complex words or topics defined in simple language."
                },
                quiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING, description: "Clear, simple quiz question." },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Exactly 4 options."
                      },
                      correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of correct option." },
                      encouragement: { type: Type.STRING, description: "A warm, supportive explanation of the answer, celebrating correct choices and encouraging learning." }
                    },
                    required: ["question", "options", "correctAnswerIndex", "encouragement"]
                  },
                  description: "2 or 3 supportive multiple-choice questions with encouraging solutions."
                }
              },
              required: ["biteSizedSummary", "topicNotes", "quiz"]
            }
          }
        });
        break; // Success
      } catch (e: any) {
        attempt++;
        const is503 = e?.message?.includes("503") || e?.status === 503 || e?.status === "UNAVAILABLE";
        if (is503 && attempt < maxRetries) {
          console.log(`503 error. Retrying... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          throw e;
        }
      }
    }

    const textOutput = response?.text;
    if (!textOutput) {
      throw new Error("Empty response returned from the model.");
    }

    const result = JSON.parse(textOutput.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating learning tools using Gemini AI.",
    });
  }
});

// Segment pasted text into readable chunks directly
app.post("/api/segment", (req, res) => {
  const { text, title } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Valid text content is required." });
  }

  const cleanTitle = (title && typeof title === "string" && title.trim()) ? title.trim() : "Pasted Material";

  // Re-group text into paragraphs
  const rawParagraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (const p of rawParagraphs) {
    if (currentParagraph.length + p.length > 500) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = p;
    } else {
      currentParagraph += (currentParagraph ? " " : "") + p;
    }
  }
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  // Group paragraphs into digestible sections of 300-450 words
  const sections: string[] = [];
  let currentSection = "";
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (currentWordCount + words > 380 && currentSection) {
      sections.push(currentSection.trim());
      currentSection = para;
      currentWordCount = words;
    } else {
      currentSection += (currentSection ? "\n\n" : "") + para;
      currentWordCount += words;
    }
  }
  if (currentSection) {
    sections.push(currentSection.trim());
  }

  if (sections.length === 0) {
    sections.push(text);
  }

  res.json({ title: cleanTitle, sections });
});

// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
