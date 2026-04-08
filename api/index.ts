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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents,
      config
    });

    res.json(response);
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    res.status(error.status || 500).json({ 
      error: error.message || "An error occurred during AI generation.",
      details: error.details || null,
      finishReason: error.finishReason || null
    });
  }
});

// Diagnostics Endpoint
app.get("/api/diagnostics", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ status: 'error', message: 'API Key Missing', details: 'GEMINI_API_KEY is not set on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Say 'OK'"
    });

    if (response.text.includes("OK")) {
      res.json({ status: 'success', message: 'API Connection Successful' });
    } else {
      res.json({ status: 'error', message: 'Unexpected Response', details: response.text });
    }
  } catch (error: any) {
    res.json({ 
      status: 'error', 
      message: error.message || 'Connection Failed',
      details: error.stack,
      finishReason: error.finishReason
    });
  }
});

export default app;
