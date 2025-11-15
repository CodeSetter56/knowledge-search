// src/lib/services/ai.service.js

import OpenAI from "openai";

// 1. Initialize the AI client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const visionModel = "qwen/qwen2.5-vl-32b-instruct:free";

// 2. Define the prompts
const textPrompt = (text, pageInfo = "") => `
  You will perform two steps.

  Step 1: Analyze the following document text and write a concise 1–2 line summary.${pageInfo}
  The summary MUST include important names or organizations if present.

  Step 2: Generate exactly 3 English tags.
   - The first tag MUST be the document type (e.g., "Invoice", "Report", "ID Card")
   - The remaining tags should be key subjects or entities.

  Return ONLY a JSON object:
  { "summary": "...", "tags": ["...","...","..."] }

  TEXT: ${text}
`;

const imagePrompt = (pageInfo = "") => `
  You will perform two steps.

  Step 1: Analyze this image, read visible text, and write a concise 1–2 line summary.${pageInfo}
  The summary MUST contain important names or organizations if they appear.

  Step 2: Generate exactly 3 English tags.
   - First tag MUST be the general document type.
   - Two more tags must describe the content.

  Return ONLY JSON:
  { "summary": "...", "tags": ["...","...","..."] }
`;

// 3. Create helper functions to build the messages
export function buildImageRequest(fileBase64, fileType, pageInfo = "") {
  return [
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${fileType};base64,${fileBase64}` },
        },
        { type: "text", text: imagePrompt(pageInfo) },
      ],
    },
  ];
}

export function buildTextRequest(text, pageInfo = "") {
  return [
    {
      role: "user",
      content: textPrompt(
        text.substring(0, 3000), // Cap input size
        pageInfo
      ),
    },
  ];
}

// 4. Create the main exported function to call the AI
export async function getAiAnalysis(messages) {
  if (!messages || messages.length === 0) {
    throw new Error("No messages provided to AI service.");
  }

  console.log(`[ai.service.js] Sending to AI model: ${visionModel}`);

  const completion = await openrouter.chat.completions.create({
    model: visionModel,
    messages,
    response_format: { type: "json_object" }, // Forces pure JSON
  });

  const jsonResponse = completion.choices[0].message.content
    .replace(/```json/g, "")
    .replace(/```/g, "");

  console.log(`[ai.service.js] AI Response: ${jsonResponse}`);
  const parsed = JSON.parse(jsonResponse);

  return {
    summary: parsed.summary,
    tags: parsed.tags,
  };
}
