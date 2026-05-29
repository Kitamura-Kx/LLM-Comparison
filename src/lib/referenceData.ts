import { promises as fs } from "fs";
import path from "path";

export type ReferenceDocument = {
  id: string;
  title: string;
  content: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const sourceFilePath = path.join(dataDirectory, "source.txt");

export async function loadSourceText() {
  return fs.readFile(sourceFilePath, "utf8");
}

export async function loadReferenceDocuments(): Promise<ReferenceDocument[]> {
  const fileNames = await fs.readdir(dataDirectory);
  const textFileNames = fileNames
    .filter((fileName) => fileName.endsWith(".txt"))
    .sort((a, b) => a.localeCompare(b));

  return Promise.all(
    textFileNames.map(async (fileName) => {
      const filePath = path.join(dataDirectory, fileName);
      const content = await fs.readFile(filePath, "utf8");
      const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
      const title = firstLine.replace(/^タイトル:\s*/, "").trim() || fileName;

      return {
        id: fileName,
        title,
        content,
      };
    }),
  );
}

export function formatDocumentsForPrompt(documents: ReferenceDocument[]) {
  return documents
    .map((document) => `### ${document.title}\n${document.content}`)
    .join("\n\n---\n\n");
}

export function splitDocuments(documents: ReferenceDocument[]) {
  return documents.flatMap((document) => {
    const paragraphs = document.content
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const chunks: ReferenceDocument[] = [];
    let buffer = "";
    let index = 1;

    for (const paragraph of paragraphs) {
      const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

      if (candidate.length > 1200 && buffer) {
        chunks.push({
          id: `${document.id}#${index}`,
          title: document.title,
          content: buffer,
        });
        buffer = paragraph;
        index += 1;
      } else {
        buffer = candidate;
      }
    }

    if (buffer) {
      chunks.push({
        id: `${document.id}#${index}`,
        title: document.title,
        content: buffer,
      });
    }

    return chunks;
  });
}
