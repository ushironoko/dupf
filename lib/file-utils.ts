import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";

export function getSupportedImageExtensions(): string[] {
  return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".tif"];
}

export async function findImageFiles(directory: string): Promise<string[]> {
  const extensions = getSupportedImageExtensions();
  const patterns = extensions.map((ext) => `**/*${ext}`);

  const files: string[] = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: directory,
        absolute: true,
        ignore: ["**/duplicate/**", "**/duplicates/**"],
      });
      files.push(...matches);
    } catch (error) {
      // Continue with other patterns if one fails
      console.warn(`Warning: Failed to search for pattern ${pattern}`);
    }
  }

  return [...new Set(files)];
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function moveFile(
  sourcePath: string,
  destinationPath: string,
): Promise<void> {
  await ensureDirectoryExists(path.dirname(destinationPath));
  await fs.rename(sourcePath, destinationPath);
}

export function generateDuplicatePath(
  originalPath: string,
  duplicateDir = "duplicate",
): string {
  const dir = path.dirname(originalPath);
  const fileName = path.basename(originalPath);
  return path.join(dir, duplicateDir, fileName);
}

export async function getUniqueFileName(filePath: string): Promise<string> {
  let counter = 1;
  let newPath = filePath;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fs.access(newPath);
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      newPath = path.join(dir, `${baseName}_${counter}${ext}`);
      counter++;
    } catch (error) {
      break;
    }
  }

  return newPath;
}
