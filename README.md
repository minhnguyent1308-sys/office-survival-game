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

## Đưa game lên mạng (Cloudflare)

Game là file tĩnh nên chạy trên Cloudflare Workers gói miễn phí (tải file tĩnh không giới hạn lượt). `wrangler.jsonc` đã cấu hình sẵn: `npx wrangler deploy` tự chạy `build.sh` để tạo `dist/`, rồi đưa `dist/` lên mạng. Mỗi lần merge vào `main`, Cloudflare tự build và deploy lại.

Thiết lập một lần (làm trên trang Cloudflare, không cần token hay mật khẩu nào trong repo):

1. Tạo tài khoản miễn phí ở https://dash.cloudflare.com/sign-up và xác nhận email.
2. Vào **Workers & Pages** → **Create application** → **Import a repository** (hoặc **Connect to Git**), chọn **GitHub**, cho phép Cloudflare đọc repo `office-survival-game` (chọn "Only select repositories" cho gọn).
3. Điền:
   - **Project name**: `song-sot-noi-cong-so` (phải trùng `name` trong `wrangler.jsonc`)
   - **Production branch**: `main`
   - **Build command**: để trống (wrangler tự chạy `build.sh`)
   - **Deploy command**: `npx wrangler deploy` (mặc định)
   - Để trống Root directory, không cần biến môi trường.
4. Bấm **Deploy**. Khoảng 1 đến 2 phút sau, game có ở `https://song-sot-noi-cong-so.<tên-miền-con>.workers.dev`.

Muốn thử trên máy đúng như trên Cloudflare: `npx wrangler dev` rồi mở http://localhost:8787.

Lưu ý: địa chỉ `phong-tro.html` sẽ hiện thành `/phong-tro` (Cloudflare tự bỏ đuôi `.html`); game vẫn chạy bình thường. Save nằm trong trình duyệt của người chơi, nên đổi tên miền sau này thì save cũ không theo sang.

## Số liệu người chơi và góp ý

Game đếm lượt chơi ẩn danh (không tên, không IP, không cookie) và có hộp góp ý. Máy nhận là `worker/index.js`, dữ liệu nằm trong database D1 `so-lieu` của tài khoản Cloudflare. Xem số liệu ở trang `/so-lieu` (cần khóa).

- Game gửi gì: xem chú thích đầu `visual-design/ho-so.js`. Địa chỉ nhận đặt trong `kich-ban/do-luong.json` (để trống = không gửi gì, không hiện hộp góp ý).
- Người chơi tắt đếm được trong Bộ sưu tập. Màn chào có một dòng báo.
- Bảng D1 tự tạo ở lần gọi đầu, không cần chạy migration.

Thiết lập một lần (làm trên trang Cloudflare, không đưa mật khẩu vào repo):

1. **Tạo database:** **Storage & Databases** → **D1 SQL database** → **Create**, đặt tên `so-lieu`. Chép **Database ID** vào `database_id` trong `wrangler.jsonc` (ID không phải mật khẩu, để trong repo được).
2. **Đặt khóa dashboard:** **Workers & Pages** → `song-sot-noi-cong-so` → **Settings** → **Variables and Secrets** → **Add**, chọn kiểu **Secret**, tên `KHOA_DASHBOARD`, giá trị là mật khẩu bạn tự nghĩ. Chưa đặt thì dashboard khóa cửa.
3. Mở `https://song-sot-noi-cong-so.<tên-miền-con>.workers.dev/so-lieu` và nhập khóa đó.

Thử trên máy: tạo file `.dev.vars` (đã có trong `.gitignore`) với dòng `KHOA_DASHBOARD=mat-khau-thu`, chạy `npx wrangler dev`, rồi mở http://localhost:8787/so-lieu. D1 lúc này là bản trên máy, không đụng dữ liệu thật.

Giới hạn gói miễn phí D1: 100.000 dòng ghi và 5 triệu dòng đọc mỗi ngày. Một ván chơi trọn 40 ngày ghi khoảng 60 dòng.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `visual-design/` | Mã game: `tang-intern.html` (màn chính), `phong-tro.html`, `tra-sua.html`, `engine.js` (luật chơi), `world.js` (dựng thế giới 3D), `minigames.js`, `noi-that.js` (đồ trong phòng trọ), `gop-y.js` (hộp góp ý), `so-lieu.html` (dashboard); cùng ảnh mẫu thiết kế và câu thoại NPC |
| `kich-ban/` | Dữ liệu kịch bản: `cards.json` (lá kịch bản), `handbook.json`, `minigames.json`, `danh-gia.json`, tài liệu cấu trúc |
| `kich-ban/mo-phong/` | Bot chơi thử để cân bằng game: `node kich-ban/mo-phong/mo-phong.mjs` (cần Node 18+) |
| `build.sh` | Tạo thư mục `dist/` chơi được |
| `worker/index.js` | Máy chủ nhỏ: nhận sự kiện ẩn danh, góp ý, trả số liệu cho trang `/so-lieu` |
| `wrangler.jsonc` | Cấu hình deploy lên Cloudflare |
