# dupf (Duplicate Finder)

TypeScriptで構築された高性能な画像重複検出CLIツールです。ディレクトリ内の重複画像を検出し、安全にduplicateフォルダへ移動します。

[English README is available here](../README.md)

## 特徴

- 🚀 **スタンドアロン実行ファイル**: Node.js不要の単一ファイル実行可能
- 🔍 **高精度検出**: ハッシュベース + バイト単位比較による確実な重複検出
- 🎯 **多様な画像形式対応**: JPG, JPEG, PNG, GIF, BMP, WebP, TIFF
- 🛡️ **安全な操作**: ドライラン機能、ファイル名衝突回避、エラーハンドリング
- ⚡ **高性能**: キャッシュ機能、メモリ効率化、大量ファイル対応
- 🧪 **品質保証**: TypeScript、ESLint、包括的テスト、CI/CD対応

## クイックスタート

### 1. プロジェクトのセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd dupf

# 依存関係をインストール
pnpm install

# スタンドアロン実行ファイルをビルド
pnpm build:standalone
```

### 2. 使用方法

```bash
# 基本的な使用方法
./dupf /path/to/images

# ドライラン（実際には移動せず、何が移動されるかを表示）
./dupf /path/to/images --dry-run --verbose

# カスタム重複フォルダ名
./dupf /path/to/images --output-dir duplicates

# ヘルプを表示
./dupf --help
```

## インストール方法

### オプション1: スタンドアロン実行ファイル（推奨）

```bash
# ビルドのみ実行
pnpm install
pnpm build:standalone

# 実行ファイルを他のマシンにコピー可能
cp ./standalone/dupf /usr/local/bin/  # システム全体で使用
```

### オプション2: Node.js環境での実行

```bash
# 開発モード
pnpm dev /path/to/images

# TypeScriptビルド後に実行
pnpm build
node dist/bin/dupf.js /path/to/images
```

## コマンドオプション

| オプション         | 説明                                    | 例                        |
| ------------------ | --------------------------------------- | ------------------------- |
| `<directory>`      | スキャン対象ディレクトリ（必須）        | `./photos`                |
| `--dry-run, -d`    | ドライラン（ファイル移動なし）          | `--dry-run`               |
| `--verbose, -v`    | 詳細な出力                              | `--verbose`               |
| `--output-dir, -o` | 重複フォルダ名（デフォルト: duplicate） | `--output-dir duplicates` |
| `--help, -h`       | ヘルプ表示                              | `--help`                  |
| `--version, -V`    | バージョン表示                          | `--version`               |

## 実行例

```bash
# テスト用の画像フォルダで実行
./standalone/dupf ./test-images --dry-run --verbose

# 出力例:
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

## 技術仕様

### アルゴリズム

1. **ファイル発見**: 対象ディレクトリを再帰的にスキャン
2. **ハッシュ生成**: Sharp使用による8x8グレースケール画像のMD5ハッシュ
3. **高速比較**: ハッシュベースでの初期スクリーニング
4. **厳密検証**: バイト単位でのファイル内容比較
5. **安全移動**: 衝突回避機能付きファイル移動

### 対応画像形式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- TIFF (.tiff, .tif)

### パフォーマンス特性

- **メモリ効率**: ストリーミング処理による低メモリ使用
- **キャッシュ機能**: 画像ハッシュのメモリキャッシュ
- **大量ファイル対応**: 数万枚の画像でも効率的に処理

## 開発者向け情報

### 開発環境構築

```bash
# 依存関係インストール
pnpm install

# 開発モードで実行
pnpm dev /path/to/images

# TypeScriptビルド
pnpm build

# テスト実行
pnpm test:run

# コード品質チェック
pnpm lint
pnpm format
```

### テスト

```bash
# 全テスト実行
pnpm test:run

# ウォッチモード
pnpm test

# テスト UI
pnpm test:ui

# テスト用画像を生成（初回テスト前に必要） - TypeScriptを直接実行
pnpm test:setup

# 完全なテストワークフロー（セットアップ + テスト実行）- より高速
pnpm test:full

# 統合テストのみ
pnpm test tests/integration

# ユニットテストのみ
pnpm test tests/unit
```

## 配布

### スタンドアロン版の利点

- **単一ファイル**: `./standalone/dupf`
- **依存関係なし**: Node.js不要、即座に実行可能
- **ポータブル**: どのマシンにもコピーして実行可能
- **シンプル**: インストール不要、設定不要

### 配布方法

```bash
# ビルド
pnpm build:standalone

# ファイルをターゲットマシンにコピー
scp ./standalone/dupf user@target:/usr/local/bin/

# 実行権限確認
chmod +x /usr/local/bin/dupf
```

## トラブルシューティング

### よくある問題

**Q: Permission denied エラーが発生**

```bash
chmod +x ./standalone/dupf
```

**Q: 大量のファイルでメモリ不足**

```bash
# 一度に処理するディレクトリを分割してください
./standalone/dupf /path/to/photos/2023 --verbose
./standalone/dupf /path/to/photos/2024 --verbose
```

**Q: Sharp関連のエラーが発生**

- ツールは自動的にフォールバック機能を使用します
- Sharpが利用できない場合、ファイルベースハッシュに切り替わります
- 警告メッセージが表示されますが、機能に問題はありません

**Q: 特定の画像形式が検出されない**

- 対応形式を確認: JPG, JPEG, PNG, GIF, BMP, WebP, TIFF
- ファイル拡張子が正しいことを確認
