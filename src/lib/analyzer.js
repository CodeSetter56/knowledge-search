import OpenAI from "openai";
import mammoth from "mammoth";
import * as xlsx from "xlsx";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const visionModel = "qwen/qwen2.5-vl-32b-instruct:free";

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;

// Prompt when input is plain TEXT (DOCX, XLSX, TXT, PDF OCR output)
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

// Prompt when input is an IMAGE
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

//   1. Read file content
//   2. Extract text (via OCR or parsing)
//   3. Call AI to generate summary + tags
// ------------------------------------------------------------
export async function analyzeFile(fileBase64, fileType) {
  console.log(`[analyzer.js] --- New Job Started ---`);
  console.log(`[analyzer.js] File Type: ${fileType}`);

  // Defaults 
  let summary = "File could not be analyzed.";
  let tags = [fileType];
  let scannedText = "";
  let messages = []; 
  let ocrRemaining = null; 

  try {
    
    // CASE 1 — IMAGE FILES go directly to OpenRouter VISION model.
    if (fileType.startsWith("image/")) {
      console.log("[analyzer.js] Using Image/Vision Logic (OpenRouter)");

      messages = [
        {
          role: "user",
          content: [
            // Vision model sees the image using base64
            {
              type: "image_url",
              image_url: { url: `data:${fileType};base64,${fileBase64}` },
            },
            { type: "text", text: imagePrompt() },
          ],
        },
      ];
    }

    // CASE 2 — PDF FILES hese go to OCR.space to extract text FIRST.
    else if (fileType === "application/pdf") {
      console.log("[analyzer.js] PDF detected. Sending to free OCR API...");

      if (!OCR_SPACE_API_KEY) throw new Error("OCR_SPACE_API_KEY is not set.");

      // Prepare PDF for OCR.space
      const formData = new FormData();
      formData.append("apikey", OCR_SPACE_API_KEY);
      formData.append(
        "base64Image",
        `data:application/pdf;base64,${fileBase64}`
      );

      // for better OCR accuracy
      formData.append("isOverlayRequired", "false"); 
      formData.append("detectOrientation", "true"); 
      formData.append("scale", "true");
      formData.append("OCREngine", "2");

      const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      // Read remaining credits header 
      try {
        ocrRemaining = ocrResponse.headers.get("X-RateLimit-Remaining");
        if (ocrRemaining) {
          console.log(`[analyzer.js] OCR requests remaining: ${ocrRemaining}`);
        }
      } catch {}

      const ocrResult = await ocrResponse.json();
      if (
        !ocrResponse.ok ||
        !ocrResult.ParsedResults ||
        ocrResult.ParsedResults.length === 0
      ) {
        throw new Error(ocrResult.ErrorMessage || "OCR API failed");
      }

      // Combine all OCR pages into one string
      scannedText = ocrResult.ParsedResults.map((p) => p.ParsedText).join("\n");
      console.log("[analyzer.js] OCR Success");

      if (!scannedText.trim()) {
        summary = "PDF contains no readable text.";
        tags = ["pdf", "no-text"];
        return { summary, tags, scannedText: "", ocrRemaining };
      }

      // Prepare prompt for OpenRouter
      messages = [
        {
          role: "user",
          content: textPrompt(
            scannedText.substring(0, 3000), // Cap input size
            " This is from a PDF document."
          ),
        },
      ];
    }

    // CASE 3 — TEXT-BASED FILES (DOCX, XLSX, TXT, JSON, XML) that are parsed using packages.
    else {
      console.log("[analyzer.js] Using Text/Conversion Logic (Local)");

      const buffer = Buffer.from(fileBase64, "base64");

      // DOCX → extract text
      if (fileType.includes("wordprocessingml")) {
        console.log("[analyzer.js] Parsing DOCX...");
        const { value } = await mammoth.extractRawText({ buffer });
        scannedText = value;
      }

      // XLSX → convert spreadsheet to CSV text
      else if (fileType.includes("spreadsheetml")) {
        console.log("[analyzer.js] Parsing XLSX...");
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        scannedText = xlsx.utils.sheet_to_csv(worksheet);
      }

      // Plain text / JSON / XML / SQL
      else if (
        fileType.startsWith("text/") ||
        fileType.includes("xml") ||
        fileType.includes("json") ||
        fileType.includes("sql")
      ) {
        console.log("[analyzer.js] Parsing Plain Text...");
        scannedText = buffer.toString("utf8");
      }

      // Unsupported formats
      else {
        console.warn(`[analyzer.js] Unsupported file type: ${fileType}`);
        summary = "This file type cannot be analyzed.";
        tags = [fileType, "unsupported"];
        return { summary, tags, scannedText, ocrRemaining };
      }

      // If nothing was extracted
      if (!scannedText.trim()) {
        summary = "File contains no readable text.";
        tags = [fileType, "empty"];
        return { summary, tags, scannedText, ocrRemaining };
      }

      console.log(
        `[analyzer.js] Extracted Text Preview: ${scannedText.substring(0, 200)}`
      );

      // Prepare OpenRouter prompt
      messages = [
        {
          role: "user",
          content: textPrompt(scannedText.substring(0, 3000)),
        },
      ];
    }

    //  Send Summary + Tag Request to OpenRouter AI
    console.log(`[analyzer.js] Sending to AI model: ${visionModel}`);

    if (!messages.length) {
      throw new Error("No messages were prepared for the AI.");
    }

    const completion = await openrouter.chat.completions.create({
      model: visionModel,
      messages,
      response_format: { type: "json_object" }, // Forces pure JSON
    });

    const jsonResponse = completion.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "");
    console.log(`[analyzer.js] AI Response: ${jsonResponse}`);

    const parsed = JSON.parse(jsonResponse);
    summary = parsed.summary;
    tags = parsed.tags;

    // Image files use AI summary as scannedText
    if (fileType.startsWith("image/")) {
      scannedText = parsed.summary;
    }
    console.log("[analyzer.js] --- Analysis SUCCESS ---");

    return { summary, tags, scannedText, ocrRemaining };

  } catch (error) {
    console.error("[analyzer.js] --- FAILED ---", error);

    return {
      summary: `Analysis failed: ${error.message}`,
      tags,
      scannedText: scannedText || "",
      ocrRemaining,
    };
  }
}
