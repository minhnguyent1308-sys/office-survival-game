# Mô phỏng cân bằng tầng Intern

Chạy từ thư mục này (Node 22+): `N=2500 node mo-phong.mjs` và `N=2500 SEED=77 node mo-phong.mjs`.
Hai lần chạy đó là "2×2500 ván": chăm chỉ lên Junior **46,2%** (SEED=0) và **45,9%** (SEED=77) với dữ liệu ngày 14/11 (có lá tối N1–N6, V_*; Làm task XP 2).
Script đọc thẳng `../../visual-design/engine.js`, `../cards.json`, `../handbook.json`, nên chạy lại sau khi sửa dữ liệu là có số mới.

## Điều kiện lên Junior (theo doc kịch bản)
XP ≥ 100, Uy tín ≥ 60 (cộng 5 nếu Quan hệ ≥ 70), Quan hệ ≥ 50, xong đủ 10 nhiệm vụ sổ tay, và không burnout/bị đuổi trước ngày 40.

## Mini-game
Ngày mốc và phần thưởng đọc từ `../minigames.json` (kho mini-game). Kết quả người chơi rút theo biến `MG` (mặc định `25,50,25` = Xuất sắc/Đạt/Trượt %). Sau khi Lily thêm Pin +5 mỗi sáng ngủ dậy (14/11), với 40/45/15 Junior tăng lên khoảng 60%, nên độ khó mini-game được đặt lại 25/50/25: Junior 46,0% (SEED=0) và 46,6% (SEED=77). Tỉ lệ này vẫn là giả định, chưa đo trên người chơi thật.

## Bot "chăm chỉ" (`chamchi`)
- **Chọn lá:** tính điểm mỗi lựa chọn = 3·XP + 1,6·Uy tín + 0,6·Quan hệ + 0,25·Pin (trọng số Pin ×4 khi Pin < 35), cộng 4 nếu lựa chọn cho cờ `ghi_diem_voi_sep`; chọn điểm cao nhất. Nhưng với xác suất `NOISE` = 0,65 thì chọn ngẫu nhiên (mô phỏng người chơi thật không tối ưu). NOISE và SLACK được chỉnh để bản dữ liệu trước ngày 14/11 cho ~47%, khớp số 49% của lần cân bằng trước.
- **Việc chiều:** Pin < 30 và căng tin mở thì ăn trưa với cô Ba. Còn lại, nếu số việc nhiệm vụ còn thiếu (ăn trưa 3, báo cáo 3, giúp chị Mai 2, làm task 5, tám chuyện đủ 3 người và có một người thân 40) ≥ số ngày làm việc còn lại − SLACK (4) thì làm việc nhiệm vụ đó. Sau ngày 18, Quan hệ < 50 thì tám chuyện. Mặc định: báo cáo sếp nếu Uy tín < 62 vào ngày lẻ, còn lại làm task.
- **Chào hỏi / đi phòng:** coi như nói chuyện với đủ 7 người trong 12 ngày đầu và ghé mọi phòng đã mở (hai nhiệm vụ gần như miễn phí).
- **Tối ở phòng trọ:** rút lá tối bằng `drawNight` và chọn theo cùng công thức.

## Bot "lo quan hệ" (`xahoi`)
Chọn lá với trọng số 1·XP + 1·Uy tín + 3·Quan hệ + 0,3·Pin. Chiều nào cũng tám chuyện (trước khi căng tin mở thì hỏi senior), ăn trưa khi Pin < 30, sau ngày 20 làm nốt báo cáo nếu còn thiếu. Bot này không lên Junior (thiếu XP và nhiệm vụ), dùng để xem nhánh quan hệ.

## Biến môi trường
`N`, `SEED`, `MG`, `NOISE`, `SLACK`, `CARDS` (đường dẫn cards.json khác, tính từ thư mục này), `TASKXP` (ghi đè XP của Làm task), `PF`/`XF` (nhân Pin âm / XP của các lá tối N*, V*).

## Quán trà sữa (14/11)
Bot mua trà sữa một lần mỗi ngày sau việc chiều, khi quán đã mở: `TEA=smart` (mặc định) chọn theo trọng số của bot (thường là mua cho đồng nghiệp, Pin < 35 thì mua cho mình); `TEA=off|self|colleague` để so sánh. Với dữ liệu có 5 lá mở quán: chăm chỉ lên Junior 46,2% (SEED=0) và 44,3% (SEED=77); `off` 44,9%/44,6%, `self` 43,4%/44,4%, `colleague` 45,3%/46,1%. Quán mở trung vị ngày 4.
