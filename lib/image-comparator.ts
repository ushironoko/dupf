import crypto from "node:crypto";
import fs from "node:fs/promises";

interface DuplicatePair {
  original: string;
  duplicate: string;
}

// Global cache for image hashes
const hashCache = new Map<string, string>();

// Sharp type definitions for dynamic import
interface SharpInstance {
  resize: (width: number, height: number, options?: { fit?: string }) => SharpInstance;
  greyscale: () => SharpInstance;
  raw: () => SharpInstance;
  toBuffer: () => Promise<Buffer>;
}

type SharpStatic = (
  input?: string | Buffer | Uint8Array | Uint8ClampedArray,
  options?: any,
) => SharpInstance;

// Sharp module lazy loading state
let sharpModule: SharpStatic | null = null;
let sharpInitialized = false;

async function initSharp(): Promise<void> {
  if (sharpInitialized) return;

  try {
    const sharpModule_ = await import("sharp");
    sharpModule = sharpModule_.default as SharpStatic;
  } catch (error) {
    console.warn("Sharp not available, using fallback hash method");
    sharpModule = null;
  }
  sharpInitialized = true;
}

export async function getImageHash(imagePath: string): Promise<string | null> {
  if (hashCache.has(imagePath)) {
    const cachedHash = hashCache.get(imagePath);
    if (cachedHash) {
      return cachedHash;
    }
  }

  await initSharp();

  try {
    if (sharpModule) {
      // Use Sharp for high-quality image hashing
      const buffer = await sharpModule(imagePath)
        .resize(8, 8, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer();

      const hash = crypto.createHash("md5").update(buffer).digest("hex");
      hashCache.set(imagePath, hash);
      return hash;
    }
    // Fallback to file-based hash when Sharp is not available
    const buffer = await fs.readFile(imagePath);
    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    hashCache.set(imagePath, hash);
    return hash;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.warn(`Failed to process image ${imagePath}: ${errorMessage}`);
    return null;
  }
}

export async function areImagesIdentical(
  imagePath1: string,
  imagePath2: string,
): Promise<boolean> {
  try {
    const [buffer1, buffer2] = await Promise.all([
      fs.readFile(imagePath1),
      fs.readFile(imagePath2),
    ]);

    return buffer1.equals(buffer2);
  } catch (error) {
    return false;
  }
}

export async function findDuplicates(
  imageFiles: string[],
): Promise<DuplicatePair[]> {
  const hashMap = new Map<string, string>();
  const duplicates: DuplicatePair[] = [];

  for (const imagePath of imageFiles) {
    const hash = await getImageHash(imagePath);
    if (!hash) continue;

    if (hashMap.has(hash)) {
      const originalPath = hashMap.get(hash);
      if (!originalPath) continue;
      const isIdentical = await areImagesIdentical(originalPath, imagePath);

      if (isIdentical) {
        duplicates.push({
          original: originalPath,
          duplicate: imagePath,
        });
      }
    } else {
      hashMap.set(hash, imagePath);
    }
  }

  return duplicates;
}

export type { DuplicatePair };
