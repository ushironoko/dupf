#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import ImageComparator from '../lib/image-comparator.js';
import FileUtils from '../lib/file-utils.js';

interface CliOptions {
  outputDir: string;
  dryRun?: boolean;
  verbose?: boolean;
}

const program = new Command();

program
  .name('duplicate-finder')
  .description('Find and move duplicate images to a duplicate folder')
  .version('1.0.0')
  .argument('<directory>', 'Directory to scan for duplicate images')
  .option(
    '-o, --output-dir <dir>',
    'Name of duplicate folder (default: "duplicate")',
    'duplicate'
  )
  .option(
    '-d, --dry-run',
    'Show what would be moved without actually moving files'
  )
  .option('-v, --verbose', 'Show detailed output')
  .action(async (directory: string, options: CliOptions) => {
    try {
      const targetDir = path.resolve(directory);

      // Check if directory exists
      try {
        const stat = await fs.stat(targetDir);
        if (!stat.isDirectory()) {
          console.error(`Error: ${targetDir} is not a directory.`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: Directory ${targetDir} does not exist.`);
        process.exit(1);
      }

      if (options.verbose) {
        console.log(`Scanning directory: ${targetDir}`);
        console.log(`Duplicate folder: ${options.outputDir}`);
        console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
        console.log('');
      }

      console.log('Finding image files...');
      const imageFiles = await FileUtils.findImageFiles(targetDir);

      if (imageFiles.length === 0) {
        console.log('No image files found in the specified directory.');
        return;
      }

      console.log(`Found ${imageFiles.length} image files.`);
      console.log('Comparing images for duplicates...');

      const comparator = new ImageComparator();
      const duplicates = await comparator.findDuplicates(imageFiles);

      if (duplicates.length === 0) {
        console.log('No duplicate images found.');
        return;
      }

      console.log(`Found ${duplicates.length} duplicate image(s).`);
      console.log('');

      for (const duplicatePair of duplicates) {
        const { original, duplicate } = duplicatePair;
        const duplicatePath = FileUtils.generateDuplicatePath(
          duplicate,
          options.outputDir
        );
        const finalPath = await FileUtils.getUniqueFileName(duplicatePath);

        console.log(`Duplicate found:`);
        console.log(`  Original: ${original}`);
        console.log(`  Duplicate: ${duplicate}`);

        if (options.dryRun) {
          console.log(`  Would move to: ${finalPath}`);
        } else {
          try {
            await FileUtils.moveFile(duplicate, finalPath);
            console.log(`  Moved to: ${finalPath}`);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            console.error(`  Error moving file: ${errorMessage}`);
          }
        }
        console.log('');
      }

      if (options.dryRun) {
        console.log(
          `Dry run completed. ${duplicates.length} duplicate(s) would be moved.`
        );
      } else {
        console.log(
          `Process completed. ${duplicates.length} duplicate(s) moved to ${options.outputDir} folder.`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error:', errorMessage);
      process.exit(1);
    }
  });

program.parse();
