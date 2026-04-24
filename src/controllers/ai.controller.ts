import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import PostModel from "../models/Post.model";

console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isGeminiBusy = (err: unknown) => {
  const errObj = err as { status?: number; response?: { status?: number }; message?: string };
  const status = errObj?.status || errObj?.response?.status;
  const msg = String(errObj?.message || "");
  return (
    status === 503 ||
    msg.includes('"code":503') ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE")
  );
};


const cleanGeminiJson = (raw: string) =>
  raw.replace(/```json/gi, "").replace(/```/g, "").trim();

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
    } catch (err: unknown) {
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
  } catch (err: unknown) {
    const errObj = err as { status?: number; response?: { status?: number; data?: { error?: { message?: string } } }; message?: string; name?: string; code?: string; stack?: string };
    const status = errObj?.status || errObj?.response?.status;
    const message = errObj?.message || errObj?.response?.data?.error?.message;

    console.error("=== Gemini generateDescription error ===");
    console.error("message:", message);
    console.error("name:", errObj?.name);
    console.error("status:", status);
    console.error("code:", errObj?.code);
    console.error("response:", errObj?.response?.data);
    console.error("stack:", errObj?.stack);
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

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cheapRx = new RegExp(escaped, "i");

    const cheapResults = await PostModel.find({
      $or: [
        { title: { $regex: cheapRx } },
        { description: { $regex: cheapRx } },
        { review: { $regex: cheapRx } },
      ],
    }).sort({ _id: -1 });

    const candidates = await PostModel.find({})
      .sort({ _id: -1 })
      .limit(150)
      .select("_id title description review");

    let semanticOrdered: typeof candidates = [];
    let pickedIds: string[] = [];

    if (candidates.length > 0) {
      const items = candidates.map((p) => ({
        id: String(p._id),
        title: (p.title || "").slice(0, 120),
        description: (p.description || "").slice(0, 220),
        review: (p.review || "").slice(0, 220),
      }));

      const prompt = `
Return ONLY valid JSON. No markdown. No code fences. No extra text.
Schema: {"ids":["..."],"reason":"..."}

Rules:
- Pick up to 10 post ids that best match the query.
- Use semantic understanding (synonyms, related concepts, themes, genres, characters, settings).
- Include posts that are related by meaning even if the exact query word does not appear.
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
      } catch (err: unknown) {
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

      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.ids)) {
          pickedIds = parsed.ids.map((x: string | number) => String(x));
        }
      } catch {
        pickedIds = [];
      }

      pickedIds = pickedIds.filter(Boolean).slice(0, 10);

      if (pickedIds.length > 0) {
        const docs = await PostModel.find({ _id: { $in: pickedIds } });
        const docMap = new Map(docs.map((d) => [String(d._id), d]));
        semanticOrdered = pickedIds
          .map((id) => docMap.get(id))
          .filter((doc): doc is Exclude<typeof doc, undefined> => !!doc);
      }
    }

    const merged = [...cheapResults, ...semanticOrdered];
    const seen = new Set<string>();

    const uniqueResults = merged.filter((post) => {
      const id = String(post._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.json({
      results: uniqueResults,
      ai: {
        mode: "combined",
        regexCount: cheapResults.length,
        pickedIds,
      },
    });
  } catch (err: unknown) {
    const errObj = err as { status?: number; response?: { status?: number; data?: { error?: { message?: string } } }; message?: string; stack?: string };
    const status = errObj?.status || errObj?.response?.status;
    const message = errObj?.message || errObj?.response?.data?.error?.message;

    console.error("=== Gemini freeSearchPosts error ===");
    console.error("message:", message);
    console.error("status:", status);
    console.error("stack:", errObj?.stack);

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