import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Gemini API Proxy
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;

    // Clean the API key (remove quotes and whitespace)
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    }

    // Security check: If key is missing or placeholder, return a clear error
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("TODO") || !apiKey.startsWith("AIza")) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured correctly.",
        details: "The current API key is either missing, a placeholder, or formatted incorrectly. Ensure it starts with 'AIza' and has no quotes or spaces."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Normalize contents to the format expected by @google/genai
    let normalizedContents = contents;
    if (typeof contents === 'string') {
      normalizedContents = [{ role: 'user', parts: [{ text: contents }] }];
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents: normalizedContents,
      config
    });

    // Return the text directly to simplify frontend parsing
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    res.status(error.status || 500).json({ 
      error: error.message || "An error occurred during AI generation.",
      details: error.details || null
    });
  }
});

// Diagnostics Endpoint
app.get("/api/diagnostics", async (req, res) => {
  try {
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    }

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("TODO") || !apiKey.startsWith("AIza")) {
      return res.json({ 
        status: 'error', 
        message: 'API Key Invalid', 
        details: `GEMINI_API_KEY is missing, using a placeholder, or formatted incorrectly. Key starts with: ${apiKey ? apiKey.substring(0, 4) : 'null'}` 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: "Say 'OK'" }] }]
    });

    if (response.text?.includes("OK")) {
      res.json({ status: 'success', message: 'API Connection Successful' });
    } else {
      res.json({ status: 'error', message: 'Unexpected Response', details: response.text });
    }
  } catch (error: any) {
    res.json({ 
      status: 'error', 
      message: error.message || 'Connection Failed',
      details: error.stack
    });
  }
});

export default app;
