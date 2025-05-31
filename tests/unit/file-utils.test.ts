import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import FileUtils from '../../lib/file-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileUtils', () => {
  const testImagesDir = path.join(__dirname, '../features/images');
  const tempTestDir = path.join(__dirname, '../temp');

  beforeAll(async () => {
    // Create temporary test directory
    await fs.mkdir(tempTestDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up temporary test directory
    try {
      await fs.rm(tempTestDir, { recursive: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  });

  beforeEach(async () => {
    // Clean up temp directory before each test
    try {
      const files = await fs.readdir(tempTestDir);
      await Promise.all(
        files.map((file) =>
          fs.unlink(path.join(tempTestDir, file)).catch(() => {})
        )
      );
    } catch (error) {
      // Ignore errors
    }
  });

  describe('getSupportedImageExtensions', () => {
    it('should return an array of supported image extensions', () => {
      const extensions = FileUtils.getSupportedImageExtensions();

      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain('.jpg');
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.gif');
    });
  });

  describe('findImageFiles', () => {
    it('should find all image files in a directory', async () => {
      const imageFiles = await FileUtils.findImageFiles(testImagesDir);

      expect(Array.isArray(imageFiles)).toBe(true);
      expect(imageFiles.length).toBeGreaterThan(0);

      // Check that all returned files have supported extensions
      const extensions = FileUtils.getSupportedImageExtensions();
      imageFiles.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        expect(extensions).toContain(ext);
      });
    });

    it('should return absolute paths', async () => {
      const imageFiles = await FileUtils.findImageFiles(testImagesDir);

      imageFiles.forEach((file) => {
        expect(path.isAbsolute(file)).toBe(true);
      });
    });

    it('should exclude duplicate directories', async () => {
      // Create a test structure with duplicate folder
      const testDir = path.join(tempTestDir, 'test-exclude');
      const duplicateDir = path.join(testDir, 'duplicate');

      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(duplicateDir, { recursive: true });

      // Create test images
      await fs.writeFile(path.join(testDir, 'test.jpg'), 'fake image content');
      await fs.writeFile(
        path.join(duplicateDir, 'duplicate.jpg'),
        'fake duplicate content'
      );

      const imageFiles = await FileUtils.findImageFiles(testDir);

      // Should find the main image but not the one in duplicate folder
      expect(imageFiles).toHaveLength(1);
      expect(imageFiles[0]).toMatch(/test\.jpg$/);
    });

    it('should return empty array for non-existent directory', async () => {
      const nonExistentDir = path.join(tempTestDir, 'nonexistent');
      const imageFiles = await FileUtils.findImageFiles(nonExistentDir);

      expect(imageFiles).toEqual([]);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = path.join(tempTestDir, 'new-directory');

      await FileUtils.ensureDirectoryExists(newDir);

      const stats = await fs.stat(newDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      const existingDir = path.join(tempTestDir, 'existing-directory');
      await fs.mkdir(existingDir);

      await expect(
        FileUtils.ensureDirectoryExists(existingDir)
      ).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(tempTestDir, 'level1', 'level2', 'level3');

      await FileUtils.ensureDirectoryExists(nestedDir);

      const stats = await fs.stat(nestedDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('generateDuplicatePath', () => {
    it('should generate duplicate path with default folder name', () => {
      const originalPath = '/path/to/image.jpg';
      const duplicatePath = FileUtils.generateDuplicatePath(originalPath);

      expect(duplicatePath).toBe('/path/to/duplicate/image.jpg');
    });

    it('should generate duplicate path with custom folder name', () => {
      const originalPath = '/path/to/image.jpg';
      const duplicatePath = FileUtils.generateDuplicatePath(
        originalPath,
        'duplicates'
      );

      expect(duplicatePath).toBe('/path/to/duplicates/image.jpg');
    });

    it('should handle paths with different extensions', () => {
      const originalPath = '/path/to/image.png';
      const duplicatePath = FileUtils.generateDuplicatePath(originalPath);

      expect(duplicatePath).toBe('/path/to/duplicate/image.png');
    });
  });

  describe('getUniqueFileName', () => {
    it('should return original path if file does not exist', async () => {
      const filePath = path.join(tempTestDir, 'nonexistent.jpg');
      const uniquePath = await FileUtils.getUniqueFileName(filePath);

      expect(uniquePath).toBe(filePath);
    });

    it('should return numbered path if file exists', async () => {
      const filePath = path.join(tempTestDir, 'existing.jpg');
      await fs.writeFile(filePath, 'content');

      const uniquePath = await FileUtils.getUniqueFileName(filePath);

      expect(uniquePath).toBe(path.join(tempTestDir, 'existing_1.jpg'));
    });

    it('should increment number for multiple existing files', async () => {
      const basePath = path.join(tempTestDir, 'multiple.jpg');
      const path1 = path.join(tempTestDir, 'multiple_1.jpg');
      const path2 = path.join(tempTestDir, 'multiple_2.jpg');

      await fs.writeFile(basePath, 'content');
      await fs.writeFile(path1, 'content');
      await fs.writeFile(path2, 'content');

      const uniquePath = await FileUtils.getUniqueFileName(basePath);

      expect(uniquePath).toBe(path.join(tempTestDir, 'multiple_3.jpg'));
    });

    it('should handle files without extensions', async () => {
      const filePath = path.join(tempTestDir, 'noextension');
      await fs.writeFile(filePath, 'content');

      const uniquePath = await FileUtils.getUniqueFileName(filePath);

      expect(uniquePath).toBe(path.join(tempTestDir, 'noextension_1'));
    });
  });

  describe('moveFile', () => {
    it('should move file to destination', async () => {
      const sourcePath = path.join(tempTestDir, 'source.txt');
      const destPath = path.join(tempTestDir, 'destination.txt');

      await fs.writeFile(sourcePath, 'test content');
      await FileUtils.moveFile(sourcePath, destPath);

      // Source should not exist
      await expect(fs.access(sourcePath)).rejects.toThrow();

      // Destination should exist with correct content
      const content = await fs.readFile(destPath, 'utf8');
      expect(content).toBe('test content');
    });

    it('should create destination directory if it does not exist', async () => {
      const sourcePath = path.join(tempTestDir, 'source.txt');
      const destDir = path.join(tempTestDir, 'new-folder');
      const destPath = path.join(destDir, 'destination.txt');

      await fs.writeFile(sourcePath, 'test content');
      await FileUtils.moveFile(sourcePath, destPath);

      // Destination directory should exist
      const stats = await fs.stat(destDir);
      expect(stats.isDirectory()).toBe(true);

      // File should be moved
      const content = await fs.readFile(destPath, 'utf8');
      expect(content).toBe('test content');
    });

    it('should throw error if source file does not exist', async () => {
      const sourcePath = path.join(tempTestDir, 'nonexistent.txt');
      const destPath = path.join(tempTestDir, 'destination.txt');

      await expect(FileUtils.moveFile(sourcePath, destPath)).rejects.toThrow();
    });
  });
});
