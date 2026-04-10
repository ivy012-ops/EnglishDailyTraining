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

    // Security check: If key is missing, return a clear error
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is missing.",
        details: "Please set your Gemini API Key in the environment variables (Vercel) or AI Studio Secrets panel."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Normalize contents to the format expected by @google/genai
    let normalizedContents = contents;
    if (typeof contents === 'string') {
      normalizedContents = [{ role: 'user', parts: [{ text: contents }] }];
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-2.0-flash",
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ status: 'error', message: 'API Key Missing', details: 'GEMINI_API_KEY is not set. Please add it to your project secrets.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
