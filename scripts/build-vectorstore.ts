import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { existsSync } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { embedText } from "../src/lib/embeddings";
import type { LocalVectorstore } from "../src/lib/vectorstore";

const sourcePath = path.join(process.cwd(), "data", "source.txt");
const vectorstoreDirectory = path.join(process.cwd(), "vectorstore");
const vectorstorePath = path.join(vectorstoreDirectory, "store.json");

async function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const content = await fs.readFile(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  return apiKey;
}

function splitSections(sourceText: string) {
  const sections = sourceText
    .split(/(?=^タイトル:\s*)/m)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return [
      {
        content: sourceText,
        title: "source.txt",
      },
    ];
  }

  return sections.map((section, index) => {
    const title = section.match(/^タイトル:\s*(.+)$/m)?.[1]?.trim();

    return {
      content: section,
      title: title || `source-${index + 1}`,
    };
  });
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const embeddingModel =
    process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
  const sourceText = await fs.readFile(sourcePath, "utf8");
  const sections = splitSections(sourceText);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: 160,
    chunkSize: 1200,
  });
  const documents = (
    await Promise.all(
      sections.map((section) =>
        splitter.createDocuments([section.content], [
          {
            source: "data/source.txt",
            title: section.title,
          },
        ]),
      ),
    )
  ).flat();
  getGeminiApiKey();

  const vectors: number[][] = [];

  for (const document of documents) {
    vectors.push(await embedText(document.pageContent, "RETRIEVAL_DOCUMENT"));
  }
  const vectorstore: LocalVectorstore = {
    chunks: documents.map((document, index) => ({
      content: document.pageContent,
      embedding: vectors[index],
      id: `chunk-${String(index + 1).padStart(4, "0")}`,
      source: String(document.metadata.source ?? "data/source.txt"),
      title: String(document.metadata.title ?? "source.txt"),
    })),
    createdAt: new Date().toISOString(),
    embeddingModel,
    sourcePath: "data/source.txt",
  };

  await fs.mkdir(vectorstoreDirectory, { recursive: true });
  await fs.writeFile(vectorstorePath, JSON.stringify(vectorstore, null, 2));

  console.log(
    `Saved ${vectorstore.chunks.length} chunks to ${path.relative(
      process.cwd(),
      vectorstorePath,
    )}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
