import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import PostModel from "../models/Post.model";

console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isGeminiBusy = (err: any) => {
  const status = err?.status || err?.response?.status;
  const msg = String(err?.message || "");
  return (
    status === 503 ||
    msg.includes('"code":503') ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE")
  );
};

// ניקוי תגובה כדי ש-JSON.parse לא ייפול אם Gemini מחזיר ```json ... ```
const cleanGeminiJson = (raw: string) =>
  raw.replace(/```json/gi, "").replace(/```/g, "").trim();

// ----------------------------------------------------
// 1) Generate description (AI)
// ----------------------------------------------------
export const generateDescription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!ai) {
      res
        .status(500)
        .json({ message: "GEMINI_API_KEY is missing in backend .env" });
      return;
    }

    const { title } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      res.status(400).json({ message: "title is required" });
      return;
    }

    const prompt =
      "You write short movie descriptions for an app. " +
      "Keep it spoiler-free, 2-3 sentences, engaging, plain text only.\n\n" +
      `Movie title: ${title.trim()}`;

    const callGemini = async () => {
      return ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });
    };

    let response;
    try {
      response = await callGemini();
    } catch (err: any) {
      if (isGeminiBusy(err)) {
        await sleep(700);
        response = await callGemini();
      } else {
        throw err;
      }
    }

    const description = response.text?.trim();

    if (!description) {
      res.status(502).json({ message: "AI returned empty response" });
      return;
    }

    res.json({ description });
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const message = err?.message || err?.response?.data?.error?.message;

    console.error("=== Gemini generateDescription error ===");
    console.error("message:", message);
    console.error("name:", err?.name);
    console.error("status:", status);
    console.error("code:", err?.code);
    console.error("response:", err?.response?.data);
    console.error("stack:", err?.stack);
    console.error("=======================================");

    if (status === 429) {
      res.status(429).json({
        message: "AI rate limit/quota reached. Please try again later.",
      });
      return;
    }

    if (status === 503) {
      res.status(503).json({
        message: "AI is busy right now. Please try again in a moment.",
      });
      return;
    }

    res.status(500).json({ message: "AI service failed" });
  }
};

// ----------------------------------------------------
// 2) Smart search (AI) - freeSearchPosts
// ----------------------------------------------------
export const freeSearchPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!ai) {
      res
        .status(500)
        .json({ message: "GEMINI_API_KEY is missing in backend .env" });
      return;
    }

    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      res.status(400).json({ message: "query is required" });
      return;
    }

    const q = query.trim();

    // 1) חיפוש "זול" קודם (חוסך שימוש ב-AI)
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cheapRx = new RegExp(escaped, "i");

    const cheapResults = await PostModel.find({
      $or: [
        { title: { $regex: cheapRx } },
        { description: { $regex: cheapRx } },
        { review: { $regex: cheapRx } },
      ],
    }).sort({ _id: -1 });

    if (cheapResults.length > 0) {
      res.json({ results: cheapResults, ai: { mode: "cheap-regex" } });
      return;
    }

    // 2) אם לא מצאנו בזול — Semantic search עם AI:
    const candidates = await PostModel.find({})
      .sort({ _id: -1 })
      .limit(50)
      .select("_id title description review");

    if (candidates.length === 0) {
      res.json({ results: [], ai: { mode: "semantic", pickedIds: [] } });
      return;
    }

    const items = candidates.map((p) => ({
      id: String(p._id),
      title: (p.title || "").slice(0, 120),
      description: (p.description || "").slice(0, 220),
      review: (p.review || "").slice(0, 220),
    }));

    // חשוב: מחזירים JSON בלבד + בלי markdown
    const prompt = `
Return ONLY valid JSON. No markdown. No code fences. No extra text.
Schema: {"ids":["..."],"reason":"..."}

Rules:
- Pick up to 10 post ids that best match the query.
- Use semantic understanding (synonyms/related meaning).
- If nothing matches, return {"ids":[],"reason":"no match"}.

User query: ${q}

Posts:
${JSON.stringify(items)}
`.trim();

    const callGemini = async () => {
      return ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });
    };

    let aiResp;
    try {
      aiResp = await callGemini();
    } catch (err: any) {
      if (isGeminiBusy(err)) {
        await sleep(700);
        aiResp = await callGemini();
      } else {
        throw err;
      }
    }

    const raw = (aiResp.text || "").trim();
    console.log("AI semantic raw response:", raw);

    const cleaned = cleanGeminiJson(raw);

    let pickedIds: string[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.ids)) {
        pickedIds = parsed.ids.map((x: any) => String(x));
      }
    } catch {
      pickedIds = [];
    }

    pickedIds = pickedIds.filter(Boolean).slice(0, 10);
    console.log("AI semantic picked ids:", pickedIds);

    if (pickedIds.length === 0) {
      res.json({ results: [], ai: { mode: "semantic", pickedIds: [] } });
      return;
    }

    // שליפה לפי הסדר שה-AI החזיר
    const docs = await PostModel.find({ _id: { $in: pickedIds } });
    const docMap = new Map(docs.map((d) => [String(d._id), d]));
    const ordered = pickedIds.map((id) => docMap.get(id)).filter(Boolean);

    res.json({ results: ordered, ai: { mode: "semantic", pickedIds } });
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const message = err?.message || err?.response?.data?.error?.message;

    console.error("=== Gemini freeSearchPosts error ===");
    console.error("message:", message);
    console.error("status:", status);
    console.error("stack:", err?.stack);

    if (status === 429) {
      res.status(429).json({
        message: "AI rate limit/quota reached. Please try again later.",
      });
      return;
    }

    if (status === 503) {
      res.status(503).json({
        message: "AI is busy right now. Please try again in a moment.",
      });
      return;
    }

    res.status(500).json({ message: "AI search failed" });
  }
};