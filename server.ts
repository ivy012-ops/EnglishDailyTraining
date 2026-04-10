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
      let apiKey = process.env.GEMINI_API_KEY;

      // Clean the API key (remove quotes and whitespace)
      if (apiKey) {
        apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
      }

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("TODO") || !apiKey.startsWith("AIza")) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured correctly.",
          details: "The current API key is either missing, a placeholder, or formatted incorrectly. Ensure it starts with 'AIza' and has no quotes or spaces. Add it to the 'Secrets' panel in AI Studio."
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Normalize contents to the format expected by @google/genai
      let normalizedContents = contents;
      if (typeof contents === 'string') {
        normalizedContents = [{ role: 'user', parts: [{ text: contents }] }];
      }

      const modelToUse = model || "gemini-flash-latest";
      console.log(`Using AI Model: ${modelToUse}`);

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: normalizedContents,
        config
      });

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
        model: "gemini-flash-latest",
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
