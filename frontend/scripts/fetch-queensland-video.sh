#!/usr/bin/env bash
# Download ~30s Brisbane CBD aerial skyline (Pexels, free license).
# Tech-style overlay is applied in CSS (AppBackground + index.css).
# Run from repo: bash frontend/scripts/fetch-queensland-video.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../public/videos" && pwd)"
OUT="$DIR/queensland-bg.mp4"
TMP1="/tmp/brisbane-pexels-cityscape.mp4"
TMP2="/tmp/brisbane-pexels-skyline-river.mp4"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
REF1="https://www.pexels.com/video/aerial-view-of-brisbane-cityscape-37183843/"
REF2="https://www.pexels.com/video/aerial-view-of-brisbane-skyline-and-river-37184309/"

mkdir -p "$DIR"
command -v ffmpeg >/dev/null || { echo "ffmpeg required"; exit 1; }

echo "Downloading Brisbane aerial cityscape (skyscrapers + CBD)…"
curl -L --fail -A "$UA" -H "Referer: $REF1" -o "$TMP1" "https://www.pexels.com/download/video/37183843/"
curl -L --fail -A "$UA" -H "Referer: $REF2" -o "$TMP2" "https://www.pexels.com/download/video/37184309/"

echo "Building 30s 1080p loop → $OUT"
ffmpeg -y -i "$TMP1" -i "$TMP2" -filter_complex \
  "[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30[v0];\
   [1:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30[v1];\
   [v0][v1]concat=n=2:v=1:a=0,trim=duration=30,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 24 -movflags +faststart -an "$OUT"

echo "Done ($(du -h "$OUT" | cut -f1), $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT")s). Reload the site."
