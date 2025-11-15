// src/lib/services/parser.service.js

import mammoth from "mammoth";
import * as xlsx from "xlsx";

export async function getTextFromLocalFile(fileBase64, fileType) {
  let scannedText = "";
  const buffer = Buffer.from(fileBase64, "base64");

  // DOCX
  if (fileType.includes("wordprocessingml")) {
    console.log("[parser.service.js] Parsing DOCX...");
    const { value } = await mammoth.extractRawText({ buffer });
    scannedText = value;
  }
  // XLSX
  else if (fileType.includes("spreadsheetml")) {
    console.log("[parser.service.js] Parsing XLSX...");
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
    console.log("[parser.service.js] Parsing Plain Text...");
    scannedText = buffer.toString("utf8");
  }
  // Unsupported
  else {
    console.warn(`[parser.service.js] Unsupported file type: ${fileType}`);
    throw new Error(`File type ${fileType} cannot be analyzed.`);
  }

  console.log(
    `[parser.service.js] Extracted Text Preview: ${scannedText.substring(
      0,
      200
    )}`
  );
  return scannedText;
}
