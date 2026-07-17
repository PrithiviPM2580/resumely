import { PDFParse } from "pdf-parse";
import { APIError } from "../utils/api-error";

export async function extractTextFromPdf(buffer: Buffer) {
  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({ data: buffer });

    const result = await parser.getText();

    const text = (result.text || "").trim();

    if (!text || text.length < 50) {
      throw APIError.BadRequest(
        "The PDF file is empty or contains no extractable text",
      );
    }

    return {
      text,
      meta: {
        numPages: result.pages?.length ?? result.total ?? null,
      },
    };
  } catch (error: unknown) {
    if (error instanceof APIError) {
      throw error;
    }

    throw APIError.BadRequest("Failed to extract text from the PDF file");
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (err) {
        console.error("Failed to destroy PDF parser", err);
      }
    }
  }
}
