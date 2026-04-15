import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const escapePdf = (value: string) => value.replace(/\(/g, "[").replace(/\)/g, "]");

export const exportPdf = async (title: string, body: string, brandColor = "#4f46e5") => {
  const safeBody = escapePdf(body.slice(0, 180));
  const content = `%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 180>>stream\nBT /F1 18 Tf 72 760 Td (${escapePdf(title)}) Tj 0 -22 Td /F1 10 Tf (Brand ${escapePdf(brandColor)}) Tj 0 -22 Td (${safeBody}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\n0000000241 00000 n\n0000000440 00000 n\ntrailer<</Root 1 0 R/Size 6>>\nstartxref\n520\n%%EOF`;
  const path = join(tmpdir(), `framework-${Date.now()}.pdf`);
  await writeFile(path, content, "utf8");
  return path;
};

export const exportDocx = async (title: string, body: string, brandColor = "4F46E5") => {
  const root = await mkdtemp(join(tmpdir(), "framework-docx-"));
  await mkdir(join(root, "_rels"));
  await mkdir(join(root, "word"));
  await writeFile(
    join(root, "[Content_Types].xml"),
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  await writeFile(
    join(root, "_rels/.rels"),
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  );
  await writeFile(
    join(root, "word/document.xml"),
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${title}</w:t></w:r></w:p><w:p><w:r><w:t>Brand Color #${brandColor}</w:t></w:r></w:p><w:p><w:r><w:t>${body}</w:t></w:r></w:p></w:body></w:document>`
  );

  const out = join(tmpdir(), `framework-${Date.now()}.docx`);
  await execFileAsync("zip", ["-q", "-r", out, "."], { cwd: root });
  return out;
};
