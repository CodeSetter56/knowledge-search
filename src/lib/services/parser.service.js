import mammoth from "mammoth"; // DOCX parsing
import * as xlsx from "xlsx"; // XLSX parsing

export async function getTextFromLocalFile(fileBase64, fileType) {
  
  let scannedText = "";
  // Convert base64 string back into a Buffer
  const buffer = Buffer.from(fileBase64, "base64");

  // Handle DOCX files
  if (fileType.includes("wordprocessingml")) {
    console.log("[parser.service.js] Parsing DOCX...");
    const { value } = await mammoth.extractRawText({ buffer });
    scannedText = value;
  }
  // Handle XLSX files
  else if (fileType.includes("spreadsheetml")) {
    console.log("[parser.service.js] Parsing XLSX...");
    // Read the workbook from the buffer
    const workbook = xlsx.read(buffer, { type: "buffer" });
    // Get the first sheet's data
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet data to CSV format text
    scannedText = xlsx.utils.sheet_to_csv(worksheet);
  }
  // Handle plain text, JSON, XML, SQL, CSV
  else if (
    fileType.startsWith("text/") ||
    fileType.includes("xml") ||
    fileType.includes("json") ||
    fileType.includes("sql")
  ) {
    console.log("[parser.service.js] Parsing Plain Text...");
    // Convert buffer directly to UTF-8 string
    scannedText = buffer.toString("utf8");
  }
  // Throw error for unsupported types (e.g., binaries, unsupported custom types)
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
