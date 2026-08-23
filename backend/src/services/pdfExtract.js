const { PDFParse } = require("pdf-parse");

/**
 * Extracts plain text from a PDF file buffer.
 *
 * pdf-parse v2 changed its API from a plain function (v1) to a class you
 * instantiate and call methods on -- a good real-world reminder that
 * npm package APIs aren't fixed forever, and it's worth checking a
 * package's actual installed version/docs rather than assuming.
 */
async function extractTextFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    // Releases the parser's internal resources -- always run this,
    // success or failure, same reason db.js always calls client.release().
    await parser.destroy();
  }
}

module.exports = { extractTextFromPdf };