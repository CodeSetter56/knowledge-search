// src/lib/services/analyzer.service.js

import * as ai from "./ai.service";
import * as ocr from "./ocr.service";
import * as parser from "./parser.service";

/**
 * Analyzes a file by extracting text (via parsing or OCR)
 * and then sending it to an AI for summary and tagging.
 *
 * @param {string} fileBase64 The base64-encoded file content.
 * @param {string} fileType The MIME type of the file.
 * @returns {Promise<{summary: string, tags: string[], scannedText: string, ocrRemaining: string|null}>}
 */
export async function analyzeFile(fileBase64, fileType) {
  console.log(
    `[analyzer.service.js] --- New Job Started (Type: ${fileType}) ---`
  );

  // Defaults
  let summary = "File could not be analyzed.";
  let tags = [fileType];
  let scannedText = "";
  let ocrRemaining = null;

  try {
    // CASE 1: IMAGE FILES (Go directly to AI)
    if (fileType.startsWith("image/")) {
      console.log("[analyzer.service.js] Using Image/Vision Logic");
      const messages = ai.buildImageRequest(fileBase64, fileType);
      const analysis = await ai.getAiAnalysis(messages);

      summary = analysis.summary;
      tags = analysis.tags;
      // For images, we use the summary as the "scanned text" for search
      scannedText = analysis.summary;
    }

    // CASE 2: PDF FILES (Go to OCR, then AI)
    else if (fileType === "application/pdf") {
      console.log("[analyzer.service.js] Using PDF/OCR Logic");
      const ocrResult = await ocr.getTextFromPdf(fileBase64);
      scannedText = ocrResult.scannedText;
      ocrRemaining = ocrResult.ocrRemaining;

      if (!scannedText.trim()) {
        summary = "PDF contains no readable text.";
        tags = ["pdf", "no-text"];
      } else {
        const messages = ai.buildTextRequest(
          scannedText,
          " This is from a PDF document."
        );
        const analysis = await ai.getAiAnalysis(messages);
        summary = analysis.summary;
        tags = analysis.tags;
      }
    }

    // CASE 3: TEXT-BASED FILES (Parse locally, then AI)
    else {
      console.log("[analyzer.service.js] Using Text/Parser Logic");
      scannedText = await parser.getTextFromLocalFile(fileBase64, fileType);

      if (!scannedText.trim()) {
        summary = "File contains no readable text.";
        tags = [fileType, "empty"];
      } else {
        const messages = ai.buildTextRequest(scannedText);
        const analysis = await ai.getAiAnalysis(messages);
        summary = analysis.summary;
        tags = analysis.tags;
      }
    }

    console.log("[analyzer.service.js] --- Analysis SUCCESS ---");
    return { summary, tags, scannedText, ocrRemaining };
  } catch (error) {
    console.error("[analyzer.service.js] --- FAILED ---", error);
    // Return a failed state but still include any text we managed to scan
    return {
      summary: `Analysis failed: ${error.message}`,
      tags, // return default tags
      scannedText: scannedText || "", // return any text we got before the failure
      ocrRemaining,
    };
  }
}
