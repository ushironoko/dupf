import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import ImageComparator from '../../lib/image-comparator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ImageComparator', () => {
  let comparator: ImageComparator;
  const testImagesDir = path.join(__dirname, '../features/images');

  beforeAll(() => {
    comparator = new ImageComparator();
  });

  describe('getImageHash', () => {
    it('should generate a hash for a valid image', async () => {
      const imagePath = path.join(testImagesDir, 'red-square.png');
      const hash = await comparator.getImageHash(imagePath);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash!.length).toBe(32); // MD5 hash length
    });

    it('should generate the same hash for identical images', async () => {
      const imagePath1 = path.join(testImagesDir, 'red-square.png');
      const imagePath2 = path.join(testImagesDir, 'red-square-duplicate.png');

      const hash1 = await comparator.getImageHash(imagePath1);
      const hash2 = await comparator.getImageHash(imagePath2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different images', async () => {
      const redSquarePath = path.join(testImagesDir, 'red-square.png');
      const blueSquarePath = path.join(testImagesDir, 'blue-square.png');

      const redHash = await comparator.getImageHash(redSquarePath);
      const blueHash = await comparator.getImageHash(blueSquarePath);

      expect(redHash).not.toBe(blueHash);
    });

    it('should return null for invalid image path', async () => {
      const invalidPath = path.join(testImagesDir, 'nonexistent.png');
      const hash = await comparator.getImageHash(invalidPath);

      expect(hash).toBeNull();
    });

    it('should cache image hashes', async () => {
      const imagePath = path.join(testImagesDir, 'green-square.png');

      // First call
      const hash1 = await comparator.getImageHash(imagePath);

      // Second call should use cache
      const hash2 = await comparator.getImageHash(imagePath);

      expect(hash1).toBe(hash2);
      expect(
        (comparator as unknown as { cache: Map<string, string> }).cache.has(
          imagePath
        )
      ).toBe(true);
    });
  });

  describe('areImagesIdentical', () => {
    it('should return true for identical images', async () => {
      const imagePath1 = path.join(testImagesDir, 'red-square.png');
      const imagePath2 = path.join(testImagesDir, 'red-square-duplicate.png');

      const result = await comparator.areImagesIdentical(
        imagePath1,
        imagePath2
      );

      expect(result).toBe(true);
    });

    it('should return false for different images', async () => {
      const redSquarePath = path.join(testImagesDir, 'red-square.png');
      const blueSquarePath = path.join(testImagesDir, 'blue-square.png');

      const result = await comparator.areImagesIdentical(
        redSquarePath,
        blueSquarePath
      );

      expect(result).toBe(false);
    });

    it('should return false for similar but not identical images', async () => {
      const redSquarePath = path.join(testImagesDir, 'red-square.png');
      const redSquareSimilarPath = path.join(
        testImagesDir,
        'red-square-similar.png'
      );

      const result = await comparator.areImagesIdentical(
        redSquarePath,
        redSquareSimilarPath
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid paths', async () => {
      const validPath = path.join(testImagesDir, 'red-square.png');
      const invalidPath = path.join(testImagesDir, 'nonexistent.png');

      const result = await comparator.areImagesIdentical(
        validPath,
        invalidPath
      );

      expect(result).toBe(false);
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicate images', async () => {
      const imageFiles = [
        path.join(testImagesDir, 'red-square.png'),
        path.join(testImagesDir, 'red-square-duplicate.png'),
        path.join(testImagesDir, 'blue-square.png'),
      ];

      const duplicates = await comparator.findDuplicates(imageFiles);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].original).toBe(
        path.join(testImagesDir, 'red-square.png')
      );
      expect(duplicates[0].duplicate).toBe(
        path.join(testImagesDir, 'red-square-duplicate.png')
      );
    });

    it('should return empty array when no duplicates exist', async () => {
      const imageFiles = [
        path.join(testImagesDir, 'red-square.png'),
        path.join(testImagesDir, 'blue-square.png'),
        path.join(testImagesDir, 'green-square.png'),
      ];

      const duplicates = await comparator.findDuplicates(imageFiles);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle mixed file formats', async () => {
      const imageFiles = [
        path.join(testImagesDir, 'red-square.png'),
        path.join(testImagesDir, 'red-square.jpg'),
        path.join(testImagesDir, 'blue-square.png'),
        path.join(testImagesDir, 'blue-square.jpg'),
      ];

      const duplicates = await comparator.findDuplicates(imageFiles);

      // JPG and PNG versions should not be considered identical due to compression
      expect(duplicates).toHaveLength(0);
    });

    it('should handle invalid image paths gracefully', async () => {
      const imageFiles = [
        path.join(testImagesDir, 'red-square.png'),
        path.join(testImagesDir, 'nonexistent.png'),
        path.join(testImagesDir, 'blue-square.png'),
      ];

      const duplicates = await comparator.findDuplicates(imageFiles);

      expect(duplicates).toHaveLength(0);
    });
  });
});
