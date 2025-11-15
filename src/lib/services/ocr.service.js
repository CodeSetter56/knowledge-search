// src/lib/services/ocr.service.js

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;

export async function getTextFromPdf(fileBase64) {
  console.log("[ocr.service.js] PDF detected. Sending to free OCR API...");

  if (!OCR_SPACE_API_KEY) throw new Error("OCR_SPACE_API_KEY is not set.");

  const formData = new FormData();
  formData.append("apikey", OCR_SPACE_API_KEY);
  formData.append("base64Image", `data:application/pdf;base64,${fileBase64}`);
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");

  const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });

  let ocrRemaining = null;
  try {
    ocrRemaining = ocrResponse.headers.get("X-RateLimit-Remaining");
    if (ocrRemaining) {
      console.log(`[ocr.service.js] OCR requests remaining: ${ocrRemaining}`);
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
  const scannedText = ocrResult.ParsedResults.map((p) => p.ParsedText).join(
    "\n"
  );
  console.log("[ocr.service.js] OCR Success");

  return { scannedText, ocrRemaining };
}