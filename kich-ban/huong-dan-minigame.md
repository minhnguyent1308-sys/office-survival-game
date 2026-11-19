# Kho mini-game: cách thêm và đặt lịch

Toàn bộ mini-game nằm trong `kich-ban/minigames.json`. Code chơi nằm ở `visual-design/minigames.js`, luật chấm và thưởng ở `visual-design/engine.js`.

## Game xuất hiện thế nào
- `days` ở đầu file là các **ngày mốc**, hiện tại là `[12, 26, 40]`. Sáng ngày mốc không rút lá kịch bản mà rút một mini-game.
- Mỗi game có `days` riêng: danh sách ngày mốc mà game **được phép** xuất hiện. Ví dụ `"days": [12, 26]` thì game có thể ra ở ngày 12 hoặc 26.
- Sáng ngày mốc: lấy các game có ngày đó trong `days` (và thỏa `requires` nếu có), ưu tiên game chưa chơi trong ván, rồi rút ngẫu nhiên theo `weight` (mặc định 1). Hai game cùng được phép ở ngày 12 với `weight` 1 thì mỗi game ra 50%.
- Thêm một ngày mốc mới (ví dụ 33): thêm 33 vào `days` đầu file và vào `days` của ít nhất một game.
- Ngày 40 luôn có màn lật hồ sơ trước và phán quyết sau, dù mini-game hôm đó là gì.

## Thêm một game cùng kiểu chơi: chỉ sửa JSON
Có 3 kiểu (`kind`):

| kind | Cách chơi | Trường nội dung |
|---|---|---|
| `sort` | Phân loại từng món vào giỏ trước khi hết giờ | `seconds`, `bins` [{id, label, key}], `items` [{from, text, bin}], `shuffle` |
| `schedule` | Xếp task vào ô giờ trước hạn; sếp hối định kỳ | `seconds`, `startHour`, `slots`, `bonusSlot` {flag, slots, label}, `dropEvery`, `boss` {every, penalty, line, from}, `tasks` [{from, text, size, due, points, boss?, effects?, npc?, arriveAt?}] |
| `quiz` | Trả lời câu hỏi có đồng hồ | `secondsPerQuestion`, `shuffle`, `questions` [{q, answers [{text, points, needFlag?}]}] |
| `match` | Đặt từng mảnh vào đúng mục; mảnh giả hay sai mục bị trừ giây | `seconds`, `penalty`, `shuffle`, `slots` [{id, label}], `pieces` [{text, slot}] (slot null = mảnh giả) |

Trường chung của mọi game: `id` (duy nhất), `kind`, `name`, `days`, `weight`, `npc`, `intro` (câu mở đầu), `howto` (1 câu hướng dẫn), `scoreLabel`, `thresholds` {xuat_sac, dat} (điểm tối thiểu), `cost` (mặc định Pin −10), `rewards` {xuat_sac, dat, truot}, `lines` (câu bình luận theo kết quả). Tùy chọn: `requires` (cùng cú pháp lá kịch bản).

Ví dụ game mới "Dọn bàn làm việc" dùng lại kiểu `sort`, có thể ra ngày 12 hoặc 26:
```json
{"id": "don_ban", "kind": "sort", "name": "Dọn bàn làm việc", "days": [12, 26], "weight": 1,
 "intro": "Chị Hằng: \"Chiều nay sếp tổng đi một vòng.\"", "howto": "Bấm đồ vật rồi bấm hộp đúng.",
 "seconds": 45, "bins": [{"id": "giu", "label": "Giữ", "key": "1"}, {"id": "bo", "label": "Bỏ", "key": "2"}],
 "items": [{"from": "Ngăn kéo", "text": "Hóa đơn trà sữa tháng trước", "bin": "bo"}],
 "scoreLabel": "món đúng hộp", "thresholds": {"xuat_sac": 10, "dat": 7}, "cost": {"pin": -10},
 "rewards": {"xuat_sac": {"xp": 15, "ut": 3}, "dat": {"xp": 8}, "truot": {"ut": -3}},
 "lines": {"xuat_sac": "...", "dat": "...", "truot": "..."}}
```

## Game của event
Game có `event` và `days: []` (ví dụ `ghep_bao_cao`) không bao giờ ra ở ngày mốc: nó chạy khi người chơi gom đủ mảnh của event trong `su-kien.json`.

## Kiểu chơi hoàn toàn mới: thêm một hàm
Ví dụ trò "nối cặp" hay "bấm nhanh": thêm một mục vào `KINDS` trong `minigames.js`. Hàm nhận `{body, game, hasFlag, setScore, timer}` và trả về `{score, max, extras?, detail}`. Engine, kho dữ liệu, chấm điểm, phần thưởng và màn kết quả dùng lại nguyên, không phải sửa.

## Kiểm tra dữ liệu
Mở game, mở Console: nếu có lỗi dữ liệu (ngày không có trong danh sách mốc, thiếu ngưỡng, thiếu phần thưởng, giỏ lạ, kiểu chơi chưa có) sẽ hiện cảnh báo `minigames.json`.

## Cân bằng
Sau khi thêm hoặc đổi phần thưởng, chạy `N=2500 node mo-phong.mjs` trong `kich-ban/mo-phong/`. Mục tiêu: lối chăm chỉ lên Junior 42–49%. Biến `MG=25,50,25` (mặc định) là tỉ lệ Xuất sắc/Đạt/Trượt giả định của người chơi.

## Buổi đánh giá ngày 40
Nằm ở `kich-ban/danh-gia.json`: câu nhận xét theo huy hiệu, bảng kết cục (xét từ trên xuống), các câu chốt. Thêm kết cục = thêm một object vào `endings`.
