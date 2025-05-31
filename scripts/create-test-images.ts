import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function createTestImages(): Promise<void> {
  const testDir = path.join(process.cwd(), 'tests', 'features', 'images');

  // Remove existing test images directory completely
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore error if directory doesn't exist
  }

  // Ensure test directory exists
  await fs.mkdir(testDir, { recursive: true });

  // Create a simple 10x10 red square
  const redSquare = await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();

  // Create a simple 10x10 blue square
  const blueSquare = await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 0, g: 0, b: 255 },
    },
  })
    .png()
    .toBuffer();

  // Create a simple 10x10 green square
  const greenSquare = await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 0, g: 255, b: 0 },
    },
  })
    .png()
    .toBuffer();

  // Save test images
  await fs.writeFile(path.join(testDir, 'red-square.png'), redSquare);
  await fs.writeFile(path.join(testDir, 'red-square-duplicate.png'), redSquare); // Exact duplicate
  await fs.writeFile(path.join(testDir, 'blue-square.png'), blueSquare);
  await fs.writeFile(path.join(testDir, 'green-square.png'), greenSquare);

  // Create JPEG versions
  const redSquareJpeg = await sharp(redSquare).jpeg().toBuffer();
  const blueSquareJpeg = await sharp(blueSquare).jpeg().toBuffer();

  await fs.writeFile(path.join(testDir, 'red-square.jpg'), redSquareJpeg);
  await fs.writeFile(path.join(testDir, 'blue-square.jpg'), blueSquareJpeg);

  // Create a slightly different red square (different compression but visually similar)
  const redSquareDifferent = await sharp({
    create: {
      width: 10,
      height: 10,
      channels: 3,
      background: { r: 254, g: 0, b: 0 }, // Slightly different red
    },
  })
    .png()
    .toBuffer();

  await fs.writeFile(
    path.join(testDir, 'red-square-similar.png'),
    redSquareDifferent
  );

  console.log('Test images created successfully in tests/features/images/');
}

createTestImages().catch(console.error);
