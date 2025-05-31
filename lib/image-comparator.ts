import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';

interface DuplicatePair {
  original: string;
  duplicate: string;
}

class ImageComparator {
  private cache: Map<string, string>;

  constructor() {
    this.cache = new Map();
  }

  async getImageHash(imagePath: string): Promise<string | null> {
    if (this.cache.has(imagePath)) {
      return this.cache.get(imagePath)!;
    }

    try {
      const buffer = await sharp(imagePath)
        .resize(8, 8, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer();

      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      this.cache.set(imagePath, hash);
      return hash;
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
