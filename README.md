# Image Duplicate Finder

CLIから特定のディレクトリ配下にある画像ファイルを読み出し、2枚ずつ比較して全く同一の画像の場合にduplicateフォルダへ片方を移動させるコマンドラインツールです。

## インストール

```bash
pnpm install
```

## 使用方法

### 基本的な使用方法

```bash
# ディレクトリ内の重複画像を検出し、duplicateフォルダに移動
node bin/duplicate-finder.js /path/to/images

# または pnpm link 後に
duplicate-finder /path/to/images
```

### オプション

```bash
# ドライラン（実際には移動せず、何が移動されるかを表示）
node bin/duplicate-finder.js /path/to/images --dry-run

# 詳細な出力
node bin/duplicate-finder.js /path/to/images --verbose

# カスタム重複フォルダ名
node bin/duplicate-finder.js /path/to/images --output-dir duplicates

# ヘルプを表示
node bin/duplicate-finder.js --help
```

## 機能

- **対応画像形式**: JPG, JPEG, PNG, GIF, BMP, WebP, TIFF
- **ピクセル単位での完全一致**: ファイルの内容を比較して完全に同一の画像のみを検出
- **安全な移動**: 既存ファイルとの衝突を避けるため、必要に応じてファイル名に番号を追加
- **ドライラン機能**: 実際の処理前に何が移動されるかを確認可能
- **既存の重複フォルダを無視**: 既にduplicateフォルダに移動済みのファイルは検索対象外

## 技術的詳細

- **画像ハッシュ**: 高速な初期比較のためにSharpを使用して8x8のグレースケール画像のハッシュを生成
- **バイト単位比較**: ハッシュが一致した画像についてはファイル全体をバイト単位で比較
- **メモリ効率**: 大量の画像でも効率的に処理できるよう最適化済み

## 例

```bash
# テスト用の画像フォルダで実行
node bin/duplicate-finder.js ./test-images --dry-run --verbose

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
```
