# Sống sót nơi công sở

Game nhập vai 3D trên trình duyệt: bạn là intern, có 40 ngày để sống sót và thăng tiến ở công ty. Ban ngày ở tầng Intern, buổi tối về phòng trọ, thỉnh thoảng ghé quán trà sữa.

## Cách mở game

Game đọc file JSON nên cần mở qua một web server tĩnh (mở thẳng file `.html` bằng double-click sẽ không chạy).

```sh
./build.sh                      # gom file cần chơi vào dist/
cd dist && python3 -m http.server 8000
```

Rồi mở http://localhost:8000. Không cần cài gì thêm: thư viện 3D (three.js) và font tải từ CDN, nên máy cần có mạng.

Trên Windows không có `sh`: chép thủ công các file liệt kê trong `build.sh` vào một thư mục, đổi `tang-intern.html` thành `index.html`.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `visual-design/` | Mã game: `tang-intern.html` (màn chính), `phong-tro.html`, `tra-sua.html`, `engine.js` (luật chơi), `world.js` (dựng thế giới 3D), `minigames.js`; cùng ảnh mẫu thiết kế và câu thoại NPC |
| `kich-ban/` | Dữ liệu kịch bản: `cards.json` (lá kịch bản), `handbook.json`, `minigames.json`, `danh-gia.json`, tài liệu cấu trúc |
| `kich-ban/mo-phong/` | Bot chơi thử để cân bằng game: `node kich-ban/mo-phong/mo-phong.mjs` (cần Node 18+) |
| `build.sh` | Tạo thư mục `dist/` chơi được |
