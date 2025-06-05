import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

describe("CLI Integration Tests", () => {
  const testDir = path.join(__dirname, "../temp-cli");
  const cliPath = path.join(__dirname, "../../dist/bin/dupf.js");

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (error) {
      // Ignore errors
    }
  });

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      const files = await fs.readdir(testDir);
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(testDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            await fs.rm(filePath, { recursive: true });
          } else {
            await fs.unlink(filePath);
          }
        }),
      );
    } catch (error) {
      // Ignore errors
    }
  });

  const runCLI = (args: string[] = [], input = ""): Promise<CliResult> => {
    return new Promise((resolve, reject) => {
      const child: ChildProcess = spawn("node", [cliPath, ...args], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          code,
          stdout,
          stderr,
        });
      });

      child.on("error", reject);

      if (input && child.stdin) {
        child.stdin.write(input);
      }
      child.stdin?.end();
    });
  };

  const createTestImage = async (
    filename: string,
    isIdentical = false,
  ): Promise<string> => {
    const filePath = path.join(testDir, filename);

    // Create actual image data using Sharp
    const sharp = (await import("sharp")).default;

    let imageBuffer: Buffer;
    if (isIdentical) {
      // Create identical image for duplicate testing
      imageBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();
    } else {
      // Create unique image with random color
      const randomColor = {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
      };
      imageBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: randomColor,
        },
      })
        .png()
        .toBuffer();
    }

    await fs.writeFile(filePath, imageBuffer);
    return filePath;
  };

  describe("Help and Version", () => {
    it("should display help when --help is used", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("dupf");
      expect(result.stdout).toContain("Find and move duplicate images");
    });

    it("should display version when --version is used", async () => {
      const result = await runCLI(["--version"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("1.0.0");
    });
  });

  describe("Error Handling", () => {
    it("should show error for missing directory argument", async () => {
      const result = await runCLI([]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("error");
    });

    it("should handle non-existent directory gracefully", async () => {
      const result = await runCLI(["/nonexistent/directory"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error");
    });
  });

  describe("Dry Run Mode", () => {
    it("should perform dry run without moving files", async () => {
      // Create test images (same content = identical)
      await createTestImage("image1.png", true);
      await createTestImage("image2.png", true);
      await createTestImage("image3.png", false);

      const result = await runCLI([testDir, "--dry-run"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Dry run completed");

      // Verify files were not moved
      const files = await fs.readdir(testDir);
      expect(files).toContain("image1.png");
      expect(files).toContain("image2.png");
      expect(files).toContain("image3.png");
      expect(files).not.toContain("duplicate");
    });
  });

  describe("Duplicate Detection and Moving", () => {
    it("should detect and move duplicate images", async () => {
      // Create test images
      await createTestImage("original.png", true);
      await createTestImage("duplicate.png", true);
      await createTestImage("unique.png", false);

      const result = await runCLI([testDir]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Found 1 duplicate");
      expect(result.stdout).toContain("Process completed");

      // Verify original files remain
      const files = await fs.readdir(testDir);
      expect(files).toContain("original.png");
      expect(files).toContain("unique.png");
      expect(files).toContain("duplicate");

      // Verify duplicate was moved
      const duplicateDir = await fs.readdir(path.join(testDir, "duplicate"));
      expect(duplicateDir).toContain("duplicate.png");
    });

    it("should handle custom output directory name", async () => {
      await createTestImage("file1.png", true);
      await createTestImage("file2.png", true);

      const result = await runCLI([testDir, "--output-dir", "duplicates"]);

      expect(result.code).toBe(0);

      // Verify custom directory was created
      const files = await fs.readdir(testDir);
      expect(files).toContain("duplicates");

      const duplicatesDir = await fs.readdir(path.join(testDir, "duplicates"));
      expect(duplicatesDir.length).toBeGreaterThan(0);
      expect(duplicatesDir.some((file) => file.endsWith(".png"))).toBe(true);
    });

    it("should handle no duplicates found", async () => {
      await createTestImage("unique1.png", false);
      await createTestImage("unique2.png", false);

      const result = await runCLI([testDir]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("No duplicate images found");
    });

    it("should handle empty directory", async () => {
      const result = await runCLI([testDir]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("No image files found");
    });
  });

  describe("Verbose Mode", () => {
    it("should provide detailed output in verbose mode", async () => {
      await createTestImage("test1.png", true);
      await createTestImage("test2.png", true);

      const result = await runCLI([testDir, "--verbose", "--dry-run"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Scanning directory:");
      expect(result.stdout).toContain("Duplicate folder:");
      expect(result.stdout).toContain("Dry run: Yes");
    });
  });

  describe("File Name Collision Handling", () => {
    it("should handle file name collisions when moving duplicates", async () => {
      // Create duplicate folder with existing file
      const duplicateDir = path.join(testDir, "duplicate");
      await fs.mkdir(duplicateDir, { recursive: true });
      await createTestImage("collision.png");
      await fs.rename(
        path.join(testDir, "collision.png"),
        path.join(duplicateDir, "collision.png"),
      );

      // Create duplicates with same name
      await createTestImage("original.png", true);
      await createTestImage("collision.png", true);

      const result = await runCLI([testDir]);

      expect(result.code).toBe(0);

      // Check that file was renamed to avoid collision
      const duplicateFiles = await fs.readdir(duplicateDir);
      expect(duplicateFiles).toContain("collision.png"); // Original existing file
      expect(duplicateFiles.some((file) => file.startsWith("collision_"))).toBe(
        true,
      ); // Renamed duplicate
    });
  });
});
