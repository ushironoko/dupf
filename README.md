# dupf (Duplicate Finder)

A high-performance image duplicate detection CLI tool built with TypeScript. Scans directories for duplicate images and safely moves them to a duplicate folder.

[日本語版 README はこちら](./docs/README-ja.md)

## Features

- 🚀 **Standalone Executable**: Single-file executable without Node.js dependency (~397KB)
- 🔍 **High-Precision Detection**: Reliable duplicate detection using hash-based + byte-level comparison
- 🎯 **Multiple Image Format Support**: JPG, JPEG, PNG, GIF, BMP, WebP, TIFF
- 🛡️ **Safe Operations**: Dry-run mode, filename collision avoidance, error handling
- ⚡ **High Performance**: Caching, memory optimization, large file support
- 🧪 **Quality Assurance**: TypeScript, ESLint, comprehensive tests (42 tests), CI/CD ready
- 🔧 **Robustness**: Automatic fallback functionality for Sharp dependencies

## Quick Start

### 1. Project Setup

```bash
# Clone repository
git clone <repository-url>
cd dupf

# Install dependencies
pnpm install

# Build standalone executable
pnpm build:standalone
```

### 2. Usage

```bash
# Basic usage
./dupf /path/to/images

# Dry run (show what would be moved without actually moving)
./dupf /path/to/images --dry-run --verbose

# Custom duplicate folder name
./dupf /path/to/images --output-dir duplicates

# Show help
./dupf --help
```

## Installation Methods

### Option 1: Standalone Executable (Recommended)

```bash
# Build only
pnpm install
pnpm build:standalone

# Copy executable to other machines
cp ./standalone/dupf /usr/local/bin/  # For system-wide use
```

### Option 2: Node.js Environment Execution

```bash
# Development mode
pnpm dev /path/to/images

# Run after TypeScript build
pnpm build
node dist/bin/dupf.js /path/to/images
```

## Command Options

| Option             | Description                                | Example                   |
| ------------------ | ------------------------------------------ | ------------------------- |
| `<directory>`      | Target directory to scan (required)        | `./photos`                |
| `--dry-run, -d`    | Dry run (no file movement)                 | `--dry-run`               |
| `--verbose, -v`    | Detailed output                            | `--verbose`               |
| `--output-dir, -o` | Duplicate folder name (default: duplicate) | `--output-dir duplicates` |
| `--help, -h`       | Show help                                  | `--help`                  |
| `--version, -V`    | Show version                               | `--version`               |

## Usage Examples

```bash
# Run on test image folder
./standalone/dupf ./test-images --dry-run --verbose

# Output example:
# Scanning directory: /home/user/test-images
# Duplicate folder: duplicate
# Dry run: Yes
#
# Found 10 image files.
# Comparing images for duplicates...
# Found 2 duplicate image(s).
#
# Duplicate found:
#   Original: /home/user/test-images/photo1.jpg
#   Duplicate: /home/user/test-images/photo1_copy.jpg
#   Would move to: /home/user/test-images/duplicate/photo1_copy.jpg
#
# Dry run completed. 2 duplicate(s) would be moved.
```

## Technical Specifications

### Algorithm

1. **File Discovery**: Recursively scan target directory
2. **Hash Generation**:
   - **Primary method**: 8x8 grayscale image MD5 hash using Sharp (high precision)
   - **Fallback method**: File-based MD5 hash for Sharp-incompatible environments
3. **Fast Comparison**: Initial screening using hash-based comparison
4. **Strict Verification**: Byte-level file content comparison
5. **Safe Moving**: File movement with collision avoidance functionality

### Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- TIFF (.tiff, .tif)

### Performance Characteristics

- **Memory Efficiency**: Low memory usage through streaming processing
- **Cache Functionality**: Memory cache for image hashes
- **Large File Support**: Efficient processing of tens of thousands of images

## Developer Information

### Development Environment Setup

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev /path/to/images

# TypeScript build
pnpm build

# Run tests
pnpm test:run

# Code quality checks
pnpm lint
pnpm format
```

### Testing

```bash
# Run all tests
pnpm test:run

# Watch mode
pnpm test

# Test UI
pnpm test:ui

# Generate test images (required before first test run) - runs TypeScript directly
pnpm test:setup

# Complete test workflow (setup + test execution) - faster
pnpm test:full

# Integration tests only
pnpm test tests/integration

# Unit tests only
pnpm test tests/unit
```

## Distribution

### Standalone Version Benefits

- **Single File**: `./standalone/dupf`
- **No Dependencies**: No Node.js required, runs immediately
- **Portable**: Can be copied and run on any machine
- **Simple**: No installation or configuration required
- **Robustness**: Automatic fallback functionality for Sharp-incompatible environments

### Distribution Methods

```bash
# Build
pnpm build:standalone

# Copy file to target machine
scp ./standalone/dupf user@target:/usr/local/bin/

# Verify execution permissions
chmod +x /usr/local/bin/dupf
```

## Troubleshooting

### Common Issues

**Q: Permission denied error occurs**

```bash
chmod +x ./standalone/dupf
```

**Q: Memory shortage with large number of files**

```bash
# Split directories to process one at a time
./standalone/dupf /path/to/photos/2023 --verbose
./standalone/dupf /path/to/photos/2024 --verbose
```

**Q: Sharp-related errors occur**

- The tool automatically uses fallback functionality
- When Sharp is unavailable, it switches to file-based hashing
- Warning messages will be displayed, but functionality is not affected

**Q: Specific image formats are not detected**

- Check supported formats: JPG, JPEG, PNG, GIF, BMP, WebP, TIFF
- Verify file extensions are correct
