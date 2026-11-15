# Cấu trúc dữ liệu lá kịch bản (đã được Lily duyệt kho lá ngày 13/11/2026)

Nguồn nội dung: doc "Kịch bản MVP tầng 1: 40 ngày thử việc" (https://claude.ai/artifact/3PqcPB6JA18nB2VkyyLF6x), tab "Kho 45 lá kịch bản" và "Nội dung 4 ngày mốc".

Mỗi lá là một object trong file `cards.json` (mảng). Thêm lá mới = thêm object, không sửa code.

```json
{
  "id": "T1",
  "title": "File lúc 17:55",
  "type": "normal",              // normal | followup (chỉ hẹn lại) | character_event | invitation | weekend
  "phases": [1, 2, 3],           // giai đoạn được rút: 1 = ngày 1–12, 2 = 15–26, 3 = 29–40
  "weight": 3,                   // ưu tiên 5, thường 3, ít 2, hiếm 1
  "heavy": true,                 // nặng hay nhẹ, dùng để cân nhịp
  "repeatable": false,
  "npc": "tuan",                 // tuan | hang | linh | minh | tung | mai | coba | client | null
  "room": "boss",                // nơi NPC đứng chờ: lobby | intern | boss | canteen | meeting
  "requires": {                  // tất cả đều tùy chọn
    "flags": ["du_an"],          // phải có các sự kiện/huy hiệu này
    "notFlags": ["da_nhan_loi_moi"],
    "stats": { "qh": 40 },       // ngưỡng tối thiểu thanh chung
    "closeness": { "linh": 40 }  // ngưỡng thân thiết với từng NPC
  },
  "intro": "Thứ Sáu 17:55, sếp nhắn: \"Em xem giúp anh file này nhé, không gấp đâu, sáng thứ Hai anh cần.\"",
  "choices": [
    {
      "label": "\"Dạ vâng ạ\", làm xuyên cuối tuần",
      "effects": { "xp": 3, "pin": -15, "ut": 5, "qh": 0 },   // qh cộng vào cả thanh chung và thân thiết của npc của lá
      "addFlags": ["chien_binh_cuoi_tuan"],
      "followup": null,          // ví dụ { "card": "T2", "afterDays": 2 }
      "comment": "Cuối tuần của bạn đã được tái cơ cấu."
    }
  ]
}
```

## Luật rút mỗi sáng (theo thứ tự)
1. Lọc lá: đúng `phases`, thỏa `requires`, chưa rút trong ván (trừ `repeatable`). `followup` không tự rút.
2. Nếu có lá hẹn lại đến hạn: rút lá đó. Nếu có `character_event` vừa mở khóa (thân thiết đạt 40): rút lá đó.
3. Cân nhịp: không cùng `npc` hai ngày liền, không quá hai lá `heavy` liên tiếp.
4. Rút ngẫu nhiên theo `weight`.

## Gắn vào bản 3D
- Lá buổi sáng: NPC của lá đứng chờ ở `room`, có dấu chấm than trên đầu; người chơi đi tới và bấm nói chuyện để mở lá.
- Buổi chiều: 1 lượt tự do, đi tới địa điểm và chọn việc (bàn làm việc: làm task / hỏi senior; căng tin: ăn với cô Ba / tám chuyện; phòng sếp: báo cáo; sảnh: giúp chị Mai).
- Lá có cảnh họp (T3, T6, H4, U2) đặt `room: "meeting"`.
- Các id phòng ở trên là gợi ý; thread hình ảnh đổi cho khớp id trong bản 3D (đã biết `meeting`).

## Trường bổ sung (thêm khi xuất cards.json)
- `qhTarget` trong một lựa chọn: điểm `qh` cộng vào thân thiết của NPC này thay vì `npc` của lá; `null` nghĩa là chỉ cộng thanh Quan hệ chung. Không có trường này thì cộng cho `npc` của lá (lá có `npc: null` chỉ cộng thanh chung).
- `requires.anyFlags`: chỉ cần có một trong các cờ (dùng cho L7).
- `autoResolve` (lá U2): nếu người chơi có `ifFlags` thì lá tự xử lý bằng `effects` và `comment`, không hiện lựa chọn.
- `followup` có thể trỏ về chính lá đó (L7 lựa chọn C), chỉ hẹn lại một lần.
- `type: "character_event"`: rút ngay sáng hôm sau khi thân thiết với `npc` đạt 40, mỗi ván một lần.
- `type: "weekend"`: chỉ rút trên màn hình cuối tuần (khoảng một trong ba cuối tuần).
- Cờ `hoc_macro`: mini-game Chạy deadline có thêm 1 ô giờ.
- Danh sách cờ nằm ở đầu cards.json (`flagsBadges` hiện ở màn kết, `flagsHidden` để mở khóa).
- Sổ nhiệm vụ: handbook.json. Các `action` buổi chiều: lam_task, hoi_senior, an_trua_co_ba, tam_chuyen, bao_cao_sep, giup_chi_mai.
- `when: "night"` (thêm 14/11/2026, Lily duyệt): lá tin nhắn đêm (T7, K5). Không rút buổi sáng; tối ở phòng trọ, sau 17:55, có 1/3 cơ hội rút một lá loại này (không rút tối thứ Sáu vì đã có màn cuối tuần). Engine: `drawNight`, `tonightsCard`; chọn xong không đổi buổi trong ngày.

## Mở dần bản đồ (Lily yêu cầu 14/11/2026)
- `rooms.start` trong cards.json: phòng mở từ ngày 1 (lobby, intern, boss). `rooms.lockedSigns`: chữ trên biển cửa phòng còn khóa; bấm vào không tốn lượt.
- `type: "unlock"` (MO_CANTEEN ngày 5, MO_MEETING ngày 10): chạy lúc 08:29 đúng ngày `day`, trước lá buổi sáng và không thay lá đó; chọn xong thì phòng `unlocks` mở và tính là đã ghé phòng đó (nhiệm vụ 2). Ngày mở phòng chỉ nằm ở trường `day`.
- Phòng còn khóa: bước Lọc bỏ mọi lá có `room` là phòng đó; ẩn việc buổi chiều ở đó (an_trua_co_ba, tam_chuyen trước ngày 5). Cô Ba chưa xuất hiện trước ngày 5.

## Tối ở phòng trọ kiếm XP (Lily duyệt 14/11/2026)
- Tỉ lệ có lá tối (when "night") nâng từ 1/3 lên 1/2.
- 6 lá tự học N1–N6 (`when: "night"`, `type: "normal"`): học thì được XP nhưng trừ Pin nặng (−8 đến −15) để người chơi thấy rõ sự đánh đổi.
- `type: "visit"` (luôn kèm `when: "night"`): đồng nghiệp ghé phòng trọ làm việc cùng, có cảnh riêng (người đó vào phòng, ngồi ở bàn thấp). 6 lá: V_HANG, V_LINH, V_MINH, V_TUNG cần Quan hệ chung ≥ 70; V_MAI, V_TUAN cần thêm thân thiết với chính người đó ≥ 80. `npc` phải là một trong hang, linh, minh, tung, mai, tuan.
  - Lá ghé phòng đầu tiên ra ngay tối đầu tiên đủ điều kiện, chọn người bạn đang thân nhất trong số đủ điều kiện. Các lá sau vào bốc chung với lá tối thường. Mỗi người một lần mỗi ván.
- Cân bằng lại bằng mô phỏng 2×2500 ván: việc chiều "Làm task" giảm XP từ 3 xuống 2, vì tối ở nhà giờ cũng ra XP. Lối chơi chăm chỉ lên Junior khoảng 46% (mục tiêu 42–49%).

## Kho mini-game và buổi đánh giá ngày 40 (Lily duyệt 14/11/2026)
- Mini-game không viết cứng theo ngày nữa: `minigames.json` có danh sách ngày mốc (`days`: 12, 26, 40) và kho game; mỗi game tự khai báo ngày được phép xuất hiện. Sáng ngày mốc rút ngẫu nhiên theo `weight` trong các game được phép, ưu tiên game chưa chơi. Engine: `useMinigames`, `drawMinigame`, `gradeOf`, `playMinigame(s, grade, extras)`.
- Ba kiểu chơi: `sort` (Dọn inbox), `schedule` (Chạy deadline), `quiz` (Thuyết trình). Chơi 1 lần, có hướng dẫn 1 câu và đếm ngược 3 giây. Hạn task: ô cuối của task bắt đầu muộn nhất đúng giờ hạn.
- Nhiệm vụ 8 trong handbook.json xét theo ngày mốc (`days: [12, 26]`), nên game nào ra ở hai ngày đó cũng tính.
- Ngày 40: lật hồ sơ (3 huy hiệu) → mini-game → phán quyết kết cục và màn thống kê. Nội dung ở `danh-gia.json`. Engine: `dossier`, `review`.
- Độ khó nhắm 40% Xuất sắc / 45% Đạt / 15% Trượt cho người chơi chăm chỉ; mô phỏng 2×2500 ván: Junior 47,6% và 46,6%.
- Hướng dẫn thêm mini-game: `huong-dan-minigame.md`.

## Cảnh mới và Pin khi ngủ dậy (Lily 14/11/2026)
- Ngủ dậy mỗi sáng (kể cả sáng thứ Hai sau cuối tuần): Pin +5 (`WAKE_PIN` trong engine.js), hiện thông báo "Ngủ dậy: Pin +5" khi vào văn phòng. Mô phỏng: Junior của lối chăm chỉ lên khoảng 60% nếu mini-game 40/45/15, nên độ khó mini-game đặt lại 25/50/25 (Junior 46,0% và 46,6%).
- Ngày 5 (MO_CANTEEN): chọn "rủ cả phòng" thì cả phòng intern ngồi ăn ở căng tin; chọn khác thì bạn đứng cạnh cô Ba, 2–3 người xếp hàng trước quầy. Khai báo bằng `scene` trong lựa chọn của lá.
- Ngày 10 (MO_MEETING): bắt đầu bằng cảnh mọi người ngồi sẵn trong phòng họp, lời kể và lựa chọn hiện tại đó, xong ai về vị trí người đó. Khai báo bằng `openScene` trong lá.
- Pin về 0 (17:55): người chơi xỉu giữa văn phòng rồi mới hiện kết cục "Về quê nuôi gà" (`early.burnout.faint` trong danh-gia.json).
- Ngày 40: mọi người trừ cô Ba tập trung ở phòng họp trước phán quyết (`gather` trong danh-gia.json).

## Quán trà sữa dưới tòa nhà (Lily 14/11/2026)
- Quán là trang riêng `visual-design/tra-sua.html` (trong bản chơi: cùng thư mục với `index.html`), cùng góc nhìn, bảng màu, nhân vật và HUD với phòng trọ. Có chị Thu chủ quán, quầy gọi món, kệ chờ lấy ly, đúng hai bàn nhỏ bên cửa kính, vỉa hè có xe máy và anh shipper.
- Mở quán bằng sự kiện: lá có `sceneAt: "trasua"` (H1 chị Hằng, TS_LINH, TS_TUNG, TS_MINH, TS_TUAN). Người rủ đứng chờ ở `room` như lá thường; nói chuyện thì hiện `intro` và nút "Xuống quán cùng …", chuyển cảnh sang quán, ở quán hiện `sceneLine` và các lựa chọn. Chọn xong người đó cầm ly đi lên trước, bạn ở lại quán và tự đi ra vỉa hè tới lối vào tòa nhà để lên văn phòng. Lá đầu tiên loại này mở quán cho cả ván (`trasua` vào `rooms`). Mô phỏng: quán mở trung vị ngày 4.
- Sau khi biết quán: thang máy có dòng "T · Quán trà sữa", xuống được từ sau lá buổi sáng đến trước khi về phòng trọ (không phải ngày 40). Mỗi ngày mua một lần, không tốn lượt chiều: mua cho mình Pin +2, mua cho đồng nghiệp Quan hệ chung +1 (không cộng thân thiết). Luật ở `TEA`, `teaOpen`, `buyTea` trong engine.js.
- Thỉnh thoảng (60%) gặp một đồng nghiệp đang xếp hàng hoặc chờ lấy ly; nói chuyện tính vào nhiệm vụ "Chào hỏi cả công ty".
- Mô phỏng 2×2500 ván với bot mua mỗi ngày theo trọng số của nó: chăm chỉ lên Junior 46,2% và 44,3% (mục tiêu 42–49%).
