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

## Sự kiện có cảnh, ngày đặc biệt, KPI tuần (Lily duyệt 15/11/2026)
**Trường `stage`** (dùng chung cho mọi lá có cảnh): `{map: "office"|"home", spot, time, people?, mood?, eyebrow?, button?}`. Khi lá chạy: bong bóng "!" hiện trên đầu nhân vật khoảng 1,3 giây, màn chuyển cảnh, mọi người đứng vào chỗ (`spot` là tên chỗ trong bảng SPOTS của từng trang), rồi mới hiện lời kể và lựa chọn. `people` là id nhân vật (kể cả 4 nhân vật phụ mới: `sep_tong`, `chu_tro`, `shipper`, `hang_xom`, dùng lại mẫu người có sẵn, đổi màu). `mood: "dark"` làm tối phòng (cúp điện). `MO_MEETING.openScene` cũ đã chuyển sang `stage`; trang vẫn đọc `openScene` cho save cũ.

**Sự kiện** (`type: "event"`):
- `when: "night"`: sự kiện ở nhà (EN_*), rút chung kho lá tối. Tỉ lệ một đêm có lá: `nhip-choi.json events.night`.
- `when: "midday"`: sự kiện ở công ty (EO_*), rút lúc 08:29 với xác suất `events.midday`, xảy ra sau khi xong chuyện buổi sáng, trước việc buổi chiều. Trong lúc chờ xử lý, việc buổi chiều bị khóa.
- Lá có `when` không vào kho rút buổi sáng.

**Ngày đặc biệt** (`type: "special_day"`): mỗi tuần trong `specialDays.weeks` có xác suất `chance` rơi vào một ngày thường (không phải ngày mở phòng, mini-game, ngày 40). Không báo trước. `weekday` (0 = thứ Hai) ghim vào thứ đó. `rules`:
- `npc`: buổi sáng chỉ rút lá của người này.
- `skipMorningCard`: bỏ chuyện buổi sáng, vào thẳng buổi chiều.
- `actions.<việc>.off`: đóng việc đó (chuỗi là lý do hiện cho người chơi); `.mult`: nhân hiệu ứng (`close` = thân thiết); `.add`: cộng thêm.
- `shirt`: màu áo cả văn phòng (người chơi chỉ đổi nếu chọn lựa chọn đầu).
- `note`: dòng ghi chú trên HUD.

**KPI tuần** (`nhip-choi.json kpi`): giao sáng thứ Hai các tuần trong `kpi.weeks` (2–5; 40 ngày chỉ có 6 tuần làm việc), chấm tối thứ Sáu. Ba dạng `goal`: `action_count` (làm việc X n lần), `stat_min` (chỉ số không xuống dưới n cả tuần), `stat_gain` (chỉ số tăng thêm n). Đạt thì nhận `reward` (không bao giờ có XP) và câu `lineOk`; trượt chỉ nghe `lineFail`, không bị phạt. Đạt `badge.min` tuần thì có huy hiệu `nhan_vien_kpi` (danh-gia.json).

**Chỗ đặt đối tác** (`placements.json`, chưa bật): `slots` là các chỗ có thể hiện liên kết (bảng tin sảnh, màn hình laptop), `items` để trống. Luật cố định trong `placements.js`: luôn ghi nhãn "Liên kết đối tác", lưu game trước khi mở tab mới, và không bao giờ thưởng gì trong game cho việc bấm.

## Phần mở đầu và tutorial (Lily duyệt 15/11/2026)
- Nội dung chữ: `mo-dau.json` (welcome, Ảnh thẻ hồ sơ, Phiếu thông tin nhân viên mới, 4 thẻ dẫn truyện, tutorial Ngày 1, mẹo lần đầu). Code: `visual-design/mo-dau.js`.
- Giao diện theo hướng B "Tòa nhà bảy tầng" (Lily chọn 15/11): màn chào là tòa nhà 7 tầng, Ảnh thẻ là gương trong thang máy (một khung 3D nhỏ chỉ có nhân vật, kéo để xoay), Phiếu là bìa kẹp hồ sơ trên quầy lễ tân, chị Mai phản ứng với tên trong bong bóng thoại. Mỗi màn phủ kín trang, map 3D không hiện phía sau. Máy tính xếp hai cột, điện thoại xếp một cột.
- Trang mở mới (không phải từ phòng trọ hay quán trà sữa về) hiện welcome: chưa có ván thì "Bắt đầu thử việc", có ván thì "Đi làm tiếp" kèm "Ván mới" (bấm hai lần). Chơi lại từ màn kết hoặc Sổ tay đi lại Ảnh thẻ, Phiếu (giữ lựa chọn cũ) và dẫn truyện.
- Ngoại hình chỉ đổi hình, không đổi chỉ số: kiểu tóc, màu tóc, phụ kiện (`LOOKS` trong world.js). Áo sơ mi trắng và dây thẻ intern cố định. Ván lưu `name` và `look`; ván cũ chỉ có `female` thì tự đổi sang tóc dài/ngắn. Nút Nam/Nữ trên HUD đã bỏ ở cả 3 trang.
- Tên: viết `{ten}` (hoặc `{TEN}` viết hoa) trong bất kỳ câu nào của lá, câu thoại, KPI, đánh giá; game tự thay bằng tên người chơi (`G.fillName`). Đang dùng ở lá D1, câu Sổ tay, lời giới thiệu lần đầu của anh Tuấn, giấy nhớ KPI, lật hồ sơ ngày 40, nút chia sẻ kết cục và dòng "Intern · tên" trên HUD.
- Tutorial Ngày 1 do chị Mai dẫn, chỉ hiện khi không có hộp thoại nào đang mở; tắt được ở bước đầu. Chỉ chạy một lần mỗi trình duyệt (`localStorage` khóa `ssns-huong-dan`), bước cuối ở phòng trọ tối ngày 1. Mẹo lần đầu (căng tin, quán trà sữa, KPI, ngày đặc biệt, Pin dưới 20, thân thiết 40) mỗi mẹo hiện một lần.

## Đợt 1 của plan "ván thứ hai" (16/11)
- `danh-gia.json` → `endings[].when` thêm hai điều kiện: `closeCount: {min, count}` (ít nhất `count` người có độ thân ≥ `min`) và `actions: {id: n}` (đã làm việc chiều đó ≥ n lần). Kết cục mới: `phu_bep`, `ca_phong`.
- `danh-gia.json` → `collection.hints`: câu gợi ý cho mục chưa mở trong Bộ sưu tập, khóa theo id kết cục / cờ huy hiệu / id lá. Thêm kết cục, huy hiệu hay sự kiện mới thì thêm một dòng gợi ý ở đây.
- `danh-gia.json` → `share.url`: địa chỉ in ở chân thẻ chia sẻ (để trống đến khi deploy).
- Hồ sơ người chơi nằm ở `ho-so.js`, lưu ở khóa riêng `ssns-profile` (ván mới không xóa nó). Save một ván thêm `played` (các lá đã trả lời) và `dayLog` (mỗi ngày: có tăng không, Pin cuối ngày dưới 20 không).
- `than-thiet.json`: đặc quyền thân thiết. Mỗi đặc quyền: `id`, `npc`, `at` (40 hoặc 60), `name`, `line` (câu hiển thị trong màn Thân thiết), `effect.kind` (action_add, no_extra, heads_up, forgive_loss, minigame_upgrade, kpi_head, kpi_rescue, wake_bonus; `once: true` = một lần trong ván). `headsUp` là câu tin nhắn báo trước, `eventHints` là gợi ý của chị Mai cho 6 sự kiện giữa buổi (thêm sự kiện giữa buổi mới thì thêm một dòng). Ngưỡng 80 chỉ đổi danh hiệu (`title80`).
- `than-thiet.json` → `gifts`: quà mang sang ván sau (`needs`: best / ending / ever; `effect`: close_start, stat_start, wake_days). Màn chọn quà hiện sau bước Ký tên, từ ván thứ hai nếu hồ sơ đã mở khóa ít nhất một quà. Mỗi ván một quà, không cho XP, không tick sẵn nhiệm vụ.
- `do-luong.json`: bộ đếm ẩn danh. `endpoint` để trống = chỉ đếm trong trình duyệt, không gửi đi đâu.
- `the-ket-cuc.js`: vẽ thẻ chia sẻ 1080×1350 bằng canvas. Chân thẻ lấy `share.url` trong `danh-gia.json` (đang trống, hỏi Lily khi deploy).

## Event theo ngày thật: Giếng thần kho hồ sơ (Lily 19/11/2026)
- Lịch nằm ở `su-kien.json`: `from` 2026-11-19, `to` 2026-12-01, tính cả hai đầu theo giờ máy người chơi (giả định: "đến 1/12" là hết 23:59 ngày 1/12). Ngoài khoảng đó mọi thứ của event tự ẩn; bot mô phỏng không nạp file này nên kết quả cân bằng y như cũ. Thử ngày khác: thêm `?ngay=2026-12-02` vào địa chỉ trang. Engine: `useEvents`, `eventOn`, `eventLines`, `eventGameToPlay`, `playEventGame`, `validateEvents`.
- Trường mới trong lá: `event` (lá chỉ ra khi event đang chạy) và `deck` (lá không vào kho rút thường, chỉ rút vào ngày đặc biệt có `rules.deck` cùng tên).
- Ngày đặc biệt `SD_GIENG_THAN`: trong event, tuần nào có ngày đặc biệt (tuần 2–6) sẽ chọn ngày này trước, không qua xác suất `chance`, mỗi ván một lần. `rules.look: "2005"` làm cả tầng ngả màu ảnh cũ, `rules.shirt` cho đồng phục kiểu xưa, `rules.deck` cho 5 lá chuyện lạ (G_TUAN_2005, G_BUZZ, G_DIA_MEM, G_FAX, G_RAN_SAN_MOI), `rules.shard` cho chắc chắn một mảnh. Nếu event hết trước ngày đã hẹn thì ngày đó thành ngày thường.
- Mảnh báo cáo (`shards`): mỗi sáng ngày làm việc thường (không phải ngày 1, ngày mở phòng, ngày mini-game, ngày 40) có 35% nhặt một mảnh, báo bằng thông báo nhỏ; HUD văn phòng và phòng trọ có dòng "Event Giếng thần · đến hết 1/12 · Mảnh báo cáo n/5". Lưu trong ván: `events.gieng_than = {shards, game}`.
- Đủ 5 mảnh: sáng đó (sau ngày đặc biệt và KPI, trước lá buổi sáng) chơi mini-game `ghep_bao_cao` (kiểu mới `match`), một lần mỗi ván, không dùng đặc quyền thân thiết. Xuất sắc hoặc Đạt thì có huy hiệu `bao_cao_ngoc` (group `su_kien`: mục "Event" riêng trong Bộ sưu tập, không vào hồ sơ ngày 40). Thưởng chỉ có Uy tín, không có XP.
- Bộ sưu tập: lá có `event` nằm ở mục "Event" của tab Câu chuyện thay vì mục thường.
- Mô phỏng 2×2000 ván với event bật (bot không chơi phần ghép): chăm chỉ lên Junior 39,2% so với 40,5% khi tắt.
