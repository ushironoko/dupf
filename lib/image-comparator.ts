import crypto from 'crypto';
import fs from 'fs/promises';

interface DuplicatePair {
  original: string;
  duplicate: string;
}

class ImageComparator {
  private cache: Map<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sharp: any = null;
  private sharpInitialized: boolean = false;

  constructor() {
    this.cache = new Map();
  }

  private async initSharp(): Promise<void> {
    if (this.sharpInitialized) return;

    try {
      this.sharp = (await import('sharp')).default;
    } catch (error) {
      console.warn('Sharp not available, using fallback hash method');
      this.sharp = null;
    }
    this.sharpInitialized = true;
  }

  async getImageHash(imagePath: string): Promise<string | null> {
    if (this.cache.has(imagePath)) {
      return this.cache.get(imagePath)!;
    }

    await this.initSharp();

    try {
      if (this.sharp) {
        // Use Sharp for high-quality image hashing
        const buffer = await this.sharp(imagePath)
          .resize(8, 8, { fit: 'fill' })
          .greyscale()
          .raw()
          .toBuffer();

        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        this.cache.set(imagePath, hash);
        return hash;
      } else {
        // Fallback to file-based hash when Sharp is not available
        const buffer = await fs.readFile(imagePath);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        this.cache.set(imagePath, hash);
        return hash;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to process image ${imagePath}: ${errorMessage}`);
      return null;
    }
  }

  async areImagesIdentical(
    imagePath1: string,
    imagePath2: string
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

  async findDuplicates(imageFiles: string[]): Promise<DuplicatePair[]> {
    const hashMap = new Map<string, string>();
    const duplicates: DuplicatePair[] = [];

    for (const imagePath of imageFiles) {
      const hash = await this.getImageHash(imagePath);
      if (!hash) continue;

      if (hashMap.has(hash)) {
        const originalPath = hashMap.get(hash)!;
        const isIdentical = await this.areImagesIdentical(
          originalPath,
          imagePath
        );

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
}

export default ImageComparator;
export type { DuplicatePair };
