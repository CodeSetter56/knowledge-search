// src/lib/services/analyzer.service.js

import * as ai from "./ai.service";
import * as ocr from "./ocr.service";
import * as parser from "./parser.service";

export async function analyzeFile(fileBase64, fileType) {
  console.log(
    `[analyzer.service.js] --- New Job Started (Type: ${fileType}) ---`
  );

  // defaults
  let summary = "File could not be analyzed.";
  let tags = [fileType];
  let scannedText = "";
  let ocrRemaining = null;

  try {

    // CASE 1: IMAGE FILES (Go directly to Vision/AI)
    if (fileType.startsWith("image/")) {
      console.log("[analyzer.service.js] Using Image/Vision Logic");
      const messages = ai.buildImageRequest(fileBase64, fileType);
      const analysis = await ai.getAiAnalysis(messages);

      summary = analysis.summary;
      tags = analysis.tags;
      // For images, the summary is used as the text content for search indexing
      scannedText = analysis.summary;
    }

    // CASE 2: PDF FILES (Go to OCR, then AI)
    else if (fileType === "application/pdf") {
      console.log("[analyzer.service.js] Using PDF/OCR Logic");
      // Use OCR service to extract text from the PDF
      const ocrResult = await ocr.getTextFromPdf(fileBase64);
      scannedText = ocrResult.scannedText;
      ocrRemaining = ocrResult.ocrRemaining;

      if (!scannedText.trim()) {
        summary = "PDF contains no readable text.";
        tags = ["pdf", "no-text"];
      } else {
        // Send the extracted text to AI for summarization and tagging
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
      // Use local parser service (mammoth, xlsx) to extract text
      scannedText = await parser.getTextFromLocalFile(fileBase64, fileType);

      if (!scannedText.trim()) {
        summary = "File contains no readable text.";
        tags = [fileType, "empty"];
      } else {
        // Send the extracted text to AI for summarization and tagging
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
    return {
      summary: `Analysis failed: ${error.message}`,
      tags,
      scannedText: scannedText || "",
      ocrRemaining,
    };
  }
}
