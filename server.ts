import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
