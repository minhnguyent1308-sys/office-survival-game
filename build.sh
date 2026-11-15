#!/usr/bin/env sh
# Gom các file cần để chơi vào dist/ (game đọc JSON cùng thư mục với trang, và trang chính tên index.html).
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp visual-design/tang-intern.html dist/index.html
cp visual-design/phong-tro.html visual-design/tra-sua.html \
   visual-design/engine.js visual-design/world.js visual-design/minigames.js visual-design/placements.js visual-design/mo-dau.js visual-design/ho-so.js visual-design/the-ket-cuc.js dist/
cp kich-ban/cards.json kich-ban/handbook.json kich-ban/minigames.json kich-ban/danh-gia.json kich-ban/nhip-choi.json kich-ban/placements.json kich-ban/mo-dau.json kich-ban/than-thiet.json kich-ban/do-luong.json dist/
echo "Xong: mở dist/ bằng một web server tĩnh (xem README)."
