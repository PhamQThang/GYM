# QUANG THẮNG GYM — Development Backlog

> Tài liệu triển khai dành cho developer / AI coding agent trong VS Code.
> Repository: https://github.com/PhamQThang/GYM
> Baseline đã khảo sát: `main` tại `cf4f3c083d817cb9497f70da396d82bf5204fd11`.
> Mục tiêu: nâng cấp PULSE / KINETIC từ ứng dụng tracking cá nhân thành nền tảng quản lý PT và học viên Online / Offline / Hybrid, không viết lại dự án.

> Cập nhật 2026-11-25: đang triển khai trên `work/p0-foundation` từ `c58e3d2`.
> SDK/client/types Supabase đã có. Kết quả đợt đầu và giới hạn kiểm thử nằm tại
> [P0_IMPLEMENTATION_REPORT.md](P0_IMPLEMENTATION_REPORT.md).
> P0-03 mới hoàn thành một phần; chưa đạt P0 release gate. Chưa áp dụng migration lên project có dữ liệu thật.

## 0. Hướng dẫn sử dụng tài liệu

- [x] Đặt file này tại `docs/GYM_DEVELOPMENT_BACKLOG.md` trong repository.
- [ ] Kiểm tra branch, commit, working tree và các thay đổi mới nhất trước khi làm. Baseline trên là mốc khảo sát, không phải cam kết rằng branch hiện tại chưa thay đổi.
- [ ] Đối chiếu từng task với code hiện tại; nếu đã triển khai đúng và có test, đánh dấu hoàn thành thay vì viết lại.
- [ ] Làm theo thứ tự P0 → P1 → P2 → P3. Mỗi task nên là một commit hoặc PR nhỏ, có thể review độc lập.
- [ ] Không tự động merge, deploy, chạy migration production hoặc upload dữ liệu cá nhân khi chưa được chủ dự án đồng ý.
- [ ] Không dùng dữ liệu demo để giả lập tính năng production; phân biệt rõ demo/local mode và authenticated mode.

**Quy ước:** P0 = bắt buộc để dữ liệu an toàn; P1 = MVP coaching; P2 = mở rộng chất lượng dịch vụ; P3 = nâng cao. Các checkbox là kế hoạch, không phải xác nhận đã triển khai.

## 1. Bối cảnh và phạm vi

### 1.1 Tech stack giữ nguyên

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router, Recharts, Lucide React, Vitest, GitHub Actions, Vercel. Supabase/PostgreSQL là backend dự kiến dựa trên SQL hiện có. Không chuyển sang Next.js, không dùng microservices cho quy mô dưới 20 học viên.

### 1.2 Những gì đã có ở baseline

| Module | Vị trí / hiện trạng | Hướng xử lý |
|---|---|---|
| Overview, Nutrition, Progress, History, Settings | `src/components/views/` | Giữ lại làm Client Portal |
| Workout logger và rest timer | `src/components/views/workout/`, `src/lib/store.ts`, `src/lib/useRestTimer.ts` | Giữ UX nhanh, bổ sung đồng bộ theo tài khoản |
| Program editor, exercise library | `src/components/views/workout/ProgramEditor.tsx`, `ExerciseLibrary.tsx` | Tái sử dụng cho PT, phân quyền chỉnh sửa |
| Analytics | `src/lib/analytics.ts`, `analytics.test.ts` | Giữ tính toán từ dữ liệu gốc |
| Local persistence | `src/lib/store.ts` | Tách demo, cache và remote data |
| Backup JSON / CSV | `src/lib/data-management.ts`, `Settings.tsx` | Sửa tương thích và xác thực dữ liệu |
| Responsive navigation | `Sidebar.tsx`, `BottomNav.tsx`, `Header.tsx` | Tách navigation theo vai trò |
| SQL schema | `supabase/001_schema.sql`, `002_migration.sql` | Tận dụng, audit RLS và migration bổ sung |
| Docs nghiệp vụ | `docs/data-model.md`, `product-rules.md`, `user-flows.md` | Cập nhật từ single-user sang multi-user |
| CI | `.github/workflows/ci.yml` | Duy trì lint, typecheck, test, build |

### 1.3 Khoảng trống ở baseline

Frontend vẫn là ứng dụng single-user dùng mock user + seed + Zustand persist. Chưa có Supabase JS SDK trong `package.json`, chưa có auth/route guard, PT Portal, Client CRUD, remote data layer hoặc đồng bộ dữ liệu. SQL có nhiều bảng PT/client, gói tập, lịch, workout, dinh dưỡng, body metrics và storage policy nhưng chưa có bằng chứng đã được áp dụng hoặc kiểm thử trên một database chạy thực tế.

### 1.4 Product rules

- Một PT chính, dưới 20 học viên; vẫn thiết kế dữ liệu có `pt_id` để phân tách theo coach.
- Hai role hiện có trong SQL: `pt` và `client`. Không tạo thêm role `coach` trùng nghĩa.
- Học viên được mời; PT có thể quản lý hồ sơ chưa có tài khoản. Không tự đăng ký thành PT.
- Online: coaching theo thời hạn, giáo án, logs và check-in. Offline: lịch PT, gói theo buổi, giáo án. Hybrid: kết hợp.
- PT có thể tự dùng fitness tracker; giữ hỗ trợ self-owned client như schema hiện có nếu phù hợp, không hiển thị lẫn với danh sách học viên trả phí.
- Giao diện client ưu tiên điện thoại; PT ưu tiên desktop và vẫn responsive.
- Giữ dark premium / glassmorphism, accent xanh hiện tại, bảo toàn trải nghiệm 4 màn hình cốt lõi. Thương hiệu Quang Thắng GYM là tên sản phẩm đề xuất; đổi branding riêng sau khi duyệt.
- Tiếng Việt, thuật ngữ fitness tiếng Anh khi hữu ích. Đơn vị chuẩn kg, cm, kcal, g, VND. Ngày nghiệp vụ theo Asia/Ho_Chi_Minh, timestamp UTC.
- Các số 65 kg, 70 kg, 3.000 kcal và macros trong tài liệu cũ chỉ là dữ liệu mẫu/cá nhân, không áp dụng mặc định cho mọi học viên.

## 2. P0 — Foundation & Security

### P0-01 — Kiểm tra baseline và bảo toàn dữ liệu

- [x] Chạy `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- [x] Ghi nhận lỗi có sẵn trước khi sửa, kiểm tra phiên bản Node phù hợp với dependencies và CI.
- [ ] Kiểm tra `git status`, branch, commit; sao lưu dữ liệu cá nhân cục bộ trước khi thử migration.
- [ ] Kiểm tra Vercel rewrite SPA tại `vercel.json` và reload các URL con.
- [x] Chọn npm/package-lock là nguồn lockfile chuẩn hoặc thống nhất công cụ khác; không tự xóa `bun.lock` khi chưa thống nhất.

**Done khi:** Có baseline report, kết quả 5 lệnh validation, không mất dữ liệu và có branch riêng.

### P0-02 — Sửa lỗi persistence, backup và định danh

**Files:** `src/lib/store.ts`, `src/lib/store.test.ts`, `src/lib/data-management.ts`, `src/components/views/Settings.tsx`, `src/lib/seed.ts`.

- [x] `startWorkout()` dùng ID của `get().user`, không dùng `MOCK_USER.id` cố định.
- [x] `resetApp()` xóa `activeSession`, `activeSets` và toàn bộ timer, không để lại buổi tập cũ.
- [x] Bổ sung `foods` vào `partialize` nếu còn thiếu; hiện backup validator yêu cầu foods nhưng bản persist ở baseline bỏ qua trường này.
- [x] Hỗ trợ backup v1 cũ thiếu foods bằng seed catalog phù hợp, thông báo nếu dữ liệu tùy chỉnh đã không được export và không thể phục hồi.
- [x] Allowlist các trường dữ liệu import; không cho JSON ghi đè store actions (`resetApp`, `saveWorkout`, ...).
- [x] Validate toàn bộ schema: object/array types, ID duy nhất, FK giữa session/set, meal/item, user ownership, enum, số hữu hạn, date, active session và timer.
- [x] Kiểm tra `persist.version = 3` trong khi có nhánh migrate `< 4`; nếu tăng version phải test migration dữ liệu v0–v3 và bảo toàn `is_system`, `is_modified`.
- [x] Kiểm tra seed sync và ngày nghiệp vụ khi reload/chuyển ngày; không ghi đè tùy chỉnh của người dùng.
- [x] Test backup hiện tại, backup cũ, dữ liệu malformed, reset giữa buổi tập, đổi profile, lưu/hydrate lịch sử.

**Done khi:** Export → import round-trip chính xác với dữ liệu mẫu không nhạy cảm; reset không còn session; không thể ghi đè action bằng file JSON. Backup cũ không bị mất dữ liệu có thể phục hồi.

### P0-03 — Audit và củng cố schema Supabase

**Files:** `supabase/001_schema.sql`, `supabase/002_migration.sql`; bổ sung migration tuần tự mới (chọn số sau migration mới nhất), `supabase/tests/`.

- [ ] Không sửa migration đã áp dụng. Kiểm tra migration history thực tế trên môi trường dev trước.
- [ ] Review tất cả bảng và views hiện có, nhất là `profiles`, `clients`, `programs`, `program_days`, `program_exercises`, `workout_logs`, `workout_sets`, `nutrition_profiles`, `training_sessions`, `client_packages`, `payments`, `body_metrics`, `daily_water`, `meal_slots`.
- [ ] Tách RLS `pday_access`, `pex_access` thành SELECT cho PT/client hợp lệ và write policy chỉ cho PT sở hữu giáo án. Ở baseline `FOR ALL` dùng điều kiện read ở `USING`; DELETE không kiểm tra `WITH CHECK`, có nguy cơ client xóa dữ liệu được giao.
- [ ] Review toàn bộ `FOR ALL`, DELETE, UPDATE, INSERT, grants, security-definer helpers, `search_path` và quyền gọi functions; áp dụng least privilege.
- [ ] Sửa onboarding: `handle_new_user()` baseline nối `clients.user_id` bằng email ngay khi tạo auth user. Không tự liên kết trước khi xác minh email/invite; xử lý email trùng giữa các PT và race condition. Tạo RPC/Edge Function xác thực lời mời cụ thể, dùng transaction và khóa phù hợp.
- [ ] Chặn liên kết trái quyền: session ↔ package cùng client; workout log ↔ program day được giao; set ↔ workout log và exercise đúng phạm vi; meal plan ↔ client.
- [ ] Kiểm tra trường nội bộ (ví dụ health notes / coach notes), không giả định RLS theo dòng bảo vệ được từng cột. Ghi chú riêng của PT lưu bảng riêng hoặc projection hạn chế quyền.
- [ ] Kiểm tra chính sách private bucket `progress-photos`, đường dẫn theo client ID, truy cập signed URL, quyền upload/delete, giới hạn MIME/size.
- [ ] Kiểm tra constraint ngăn buổi dùng vượt gói, lịch PT trùng, trạng thái bất hợp lệ và ghi trùng. Dùng transaction/RPC khi có invariant nhiều dòng.
- [ ] Thêm index trên khóa ngoại và các cặp client/date thường query; xem xét unique constraints và versioning.
- [ ] Sinh database types từ schema dev đã áp dụng; không duy trì hai schema không đồng bộ.

**Done khi:** Migration chạy trên database dev sạch và bản dev nâng cấp từ schema cũ; test quyền bằng PT A, PT B, Client A, Client B và anonymous. Client A chỉ đọc giáo án của mình, không tạo/sửa/xóa giáo án PT giao; không đọc/sửa client B. Kiểm tra row count và trạng thái DB sau DELETE, không chỉ dựa vào HTTP status. Không có migration production ở task này.

### P0-04 — Supabase SDK, cấu hình và authentication

**Files đề xuất:** `src/lib/supabase/client.ts`, `src/lib/supabase/database.types.ts`, `src/features/auth/`, `.env.example`, `src/App.tsx`, `src/lib/navigation.ts`.

- [ ] Thêm `@supabase/supabase-js` và cập nhật lockfile bằng package manager chuẩn.
- [ ] Cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` (hoặc anon key nếu project dùng loại cũ); xác thực cấu hình, không để service-role key trong client bundle.
- [ ] Rà soát `.env.example` cũ có cấu hình Gemini/AI Studio; giữ nếu thực sự còn dùng, loại bỏ phần lỗi thời sau khi xác nhận.
- [ ] Auth provider: loading, signed in, signed out, error, session refresh, auth-state subscription cleanup.
- [ ] Login, logout, forgot/reset password, callback, xác minh email/invite.
- [ ] Bootstrap PT qua quy trình admin an toàn; client không thể tự nâng role bằng metadata hoặc localStorage.
- [ ] `RequireAuth` / `RequireRole` bảo vệ route; lấy role từ profile đáng tin cậy, không dùng role người dùng nhập.
- [ ] Tách trạng thái chưa liên kết hồ sơ, tài khoản bị vô hiệu hóa và lỗi mạng; không fallback sang mock user khi auth lỗi.
- [ ] Bật MFA cho PT trước khi dùng dữ liệu thật. Thiết lập redirect allowlist cho localhost, staging và production.

**Done khi:** PT/client đăng nhập và đi đúng portal; logout không để dữ liệu cũ trên giao diện; truy cập URL role khác bị từ chối; quyền DB vẫn được thực thi khi gọi API trực tiếp.

**Mở rộng sau P0-04 — Đăng nhập bằng Google**

- [ ] Thêm Google OAuth qua Supabase Auth. Giữ email/mật khẩu trong giai đoạn đầu.
- [ ] Cấu hình Google OAuth và redirect cho môi trường dev trước khi bật trên production. Lưu OAuth Client Secret trong cấu hình Supabase Auth.
- [ ] Sau đăng nhập Google, lấy role từ hồ sơ trên server. Học viên mới vẫn xác nhận lời mời hợp lệ bằng email đã xác minh để liên kết hồ sơ.
- [ ] Kiểm tra tài khoản hiện có dùng Google cùng email vẫn giữ đúng ID và dữ liệu. Kiểm tra hủy OAuth, chọn nhầm email và quay lại lời mời sau redirect.

### P0-05 — Data access layer và cache theo tài khoản

**Files đề xuất:** `src/lib/repositories/`, `src/features/`, `src/lib/store.ts`, `src/lib/types.ts`.

- [ ] Tách interface domain khỏi database row, viết mapper có test; không coi local `user_id` hoặc ID dạng `session-...` là UUID Supabase.
- [ ] Tách Zustand UI/timer/active workout draft khỏi dữ liệu server. Giữ Zustand; TanStack Query là tùy chọn nếu cần query cache/invalidation.
- [ ] Tạo repository modules cho clients, programs, workouts, nutrition, measurements, packages, calendar.
- [ ] Mọi query scoped theo client đã xác thực, RLS là lớp bảo vệ cuối; không dựa vào ID từ URL để cấp quyền.
- [ ] Authenticated mode không seed cân nặng, meal logs, water hoặc workout logs của mock user. Empty state thật cho tài khoản mới.
- [ ] Cách ly cache/local draft theo auth user và client ID; hủy request cũ, clear cache khi đổi account/logout; không tái sử dụng key `pulse-kinetic-storage` cho nhiều người.
- [ ] Loading/error/empty/retry rõ ràng, không báo lưu thành công khi server chưa xác nhận.
- [ ] Idempotency cho save workout, log meal và các mutation có retry; xử lý race và offline draft, không cần offline sync toàn diện ở MVP.
- [ ] Không cache ảnh hình thể hoặc dữ liệu nhạy cảm không cần thiết trong browser storage/service worker.

**Done khi:** Hai account trên cùng browser không thấy dữ liệu nhau; cùng account trên hai thiết bị thấy dữ liệu đã lưu server; lỗi mạng không tạo bản ghi trùng.

### P0-06 — Di chuyển dữ liệu local sang cloud

- [ ] Giữ công cụ backup/restore local cho demo; không tự động upload dữ liệu khi login.
- [ ] Tạo luồng import có preview (số records, phạm vi ngày, client đích, lỗi tham chiếu) và xác nhận rõ ràng từ PT.
- [ ] Map legacy IDs sang UUID ổn định, dùng `src/lib/legacyIds.ts` nếu phù hợp; bảo toàn liên kết workout program/session/set và meal/item.
- [ ] Bỏ hoặc đánh dấu seed/demo rõ ràng; không nhập nhầm dữ liệu mẫu vào hồ sơ thật.
- [ ] Import theo transaction hoặc batch có khả năng retry/idempotency; rollback hoặc báo cáo lỗi từng phần, không xóa local source sau upload.
- [ ] So sánh tổng số bản ghi, volume, nutrition totals và weight history trước/sau.

**Done khi:** Import lặp không tạo duplicate, dữ liệu gốc được giữ nguyên, kết quả đối soát đúng, không thể nhập vào client không thuộc quyền.

**P0 Release Gate:** Không đưa học viên thật vào hệ thống trước khi P0-01 đến P0-06 đạt hoặc có quyết định rõ ràng về task không áp dụng. RLS, account isolation và verified invitation là bắt buộc.

## 3. P1 — Coaching MVP

### P1-01 — Tách PT Portal và Client Portal

**Files:** `src/App.tsx`, `src/lib/navigation.ts`, `src/lib/nav.ts`, `src/components/Sidebar.tsx`, `BottomNav.tsx`, `Header.tsx`; layouts mới.

- [ ] Tạo `/login`, `/auth/callback`, `/invite`, `/pt/*`, `/client/*`; giữ/redirect route cũ có kiểm soát.
- [ ] PT layout riêng: Dashboard, Học viên, Giáo án, Lịch PT, Gói tập, Thanh toán, Check-in, Cài đặt.
- [ ] Client layout: Tổng quan, Tập luyện, Dinh dưỡng, Tiến độ, Hồ sơ; lịch/gói/check-in truy cập từ Home/Profile.
- [ ] Tái sử dụng màn hình fitness cũ; không tạo bản sao UI lớn nếu chỉ cần role-aware props/data provider.
- [ ] PT có luồng riêng mở tracker của mình; khi xem học viên phải hiển thị rõ client đang thao tác.
- [ ] Mobile navigation, route guard, 404, back navigation, scroll restoration.

**Done khi:** Hai role có layout đúng, routes hoạt động khi reload và không làm hỏng workout flow hiện có.

### P1-02 — PT Dashboard

- [ ] Hiển thị active clients, lịch hôm nay, check-in chờ review, gói sắp hết hạn/số buổi thấp, công nợ và tiền đã thu theo kỳ.
- [ ] Danh sách công việc cần xử lý, link tới hồ sơ học viên/lịch/gói liên quan.
- [ ] Query dữ liệu thật qua repository; dùng `client_package_summary` nếu đủ điều kiện.
- [ ] Không hardcode KPI hoặc số phần trăm tiến độ tự đặt.
- [ ] Khi dữ liệu rỗng, có empty state và CTA tạo học viên/gói/lịch.

**Done khi:** Số liệu cập nhật sau thay đổi và chỉ tính dữ liệu PT phụ trách; phân biệt doanh thu thực thu với giá trị gói/công nợ.

### P1-03 — Client Management & Onboarding

- [ ] Thêm/sửa/xem/archive hồ sơ học viên, tìm kiếm và lọc theo trạng thái/hình thức coaching.
- [ ] Bổ sung trường coaching type (`online`, `offline`, `hybrid`) bằng migration nếu chưa có; không lẫn với package type.
- [ ] Hồ sơ gồm thông tin cơ bản, mục tiêu, ngày bắt đầu, chiều cao, giới hạn vận động, ghi chú, trạng thái invite.
- [ ] PT tạo hồ sơ chưa có account, gửi/resend/revoke invite; invitation có hết hạn và không dùng lại được.
- [ ] Trang chi tiết với tabs Overview, Training, Nutrition, Progress, Check-in, Sessions, Packages, Payments, Private Notes.
- [ ] Archive không xóa lịch sử; quyết định rõ hành vi truy cập của archived client và quyền xuất dữ liệu.

**Done khi:** PT quản lý được hồ sơ chưa đăng nhập; client kích hoạt đúng hồ sơ đã mời; không truy cập hồ sơ khác; archive giữ lịch sử.

### P1-04 — Exercise Library & Workout Program Builder

**Tái sử dụng:** `ProgramEditor.tsx`, `ExerciseLibrary.tsx`, `WorkoutDetail.tsx`, `src/lib/types.ts`.

- [ ] PT quản lý exercise catalog hệ thống + bài tập riêng (tên, nhóm cơ, thiết bị, hướng dẫn, media URL nếu có).
- [ ] Tạo template, clone, đổi tên, thêm/sửa/sắp xếp ngày và bài tập; chọn client, ngày hiệu lực, trạng thái active/archive.
- [ ] Hỗ trợ planned sets, rep min/max, rest, notes; bổ sung RIR/RPE, tempo, set type bằng migration/types khi cần.
- [ ] Kiểm tra dữ liệu: reps min ≤ max, sets > 0, rest không âm, thứ tự ổn định; không dùng `||` nếu 0 là giá trị hợp lệ.
- [ ] Giao giáo án theo phiên bản/snapshot; khi PT sửa template không thay đổi lịch sử đã tập hoặc assignment cũ.
- [ ] Client đọc giáo án được giao, không chỉnh sửa/xóa; PT self-tracking có thể sửa giáo án của mình theo quyền.
- [ ] Giữ soft delete cho item còn được tham chiếu; không cho hard delete làm đứt lịch sử.

**Done khi:** PT tạo template, giao cho hai client, sửa phiên bản mới mà lịch sử cũ không đổi; client chỉ thấy chương trình đúng của mình.

### P1-05 — Workout Logger + Cloud History

**Tái sử dụng:** `Workout.tsx`, `SetRow.tsx`, `ActiveWorkoutHeader.tsx`, `WorkoutSummary.tsx`, `WorkoutHistory.tsx`, `useRestTimer.ts`, analytics.

- [ ] Load workout theo chương trình client đang được giao; planned vs actual tách biệt.
- [ ] Start → record sets → finish → review → save/discard. Hạn chế double-start, double-save, giữ draft khi reload.
- [ ] Ghi weight/reps, completed/skipped, RIR/RPE (nếu schema hỗ trợ), notes; nhanh chóng dùng giá trị buổi trước đúng client/exercise.
- [ ] Một global rest timer, dựa trên timestamp; hoạt động khi chuyển màn hình và tab background; giữ cấu hình sound.
- [ ] Lưu session + sets atomic/idempotent; dùng server-generated hoặc UUID ổn định, retry không trùng.
- [ ] PT có thể ghi hộ học viên khi tập offline, lưu thông tin người thao tác.
- [ ] History/summary lấy dữ liệu đúng phạm vi, giữ snapshot tên bài/chỉ tiêu lịch sử; PR/volume/e1RM tính từ logs, không lưu cờ PR dư thừa.

**Done khi:** Client tập trên mobile, đóng/reload trang và khôi phục draft đúng; save một lần hoặc retry đều chỉ có một buổi trên server; PT xem được kết quả.

### P1-06 — Nutrition Targets & Daily Logging

**Tái sử dụng:** `Nutrition.tsx`, `Overview.tsx`, `analytics.ts`, các bảng nutrition/foods/dishes/meal plans/meal logs/water/slots hiện có.

- [ ] PT đặt calorie/protein/carbs/fat targets và ngày hiệu lực; giữ lịch sử thay đổi target.
- [ ] Client xem target và log bữa/food/portion, quick add, chỉnh/xóa log theo quyền; ghi nước theo ngày.
- [ ] Xác định mapping rõ giữa lifecycle local `PLANNED/CONSUMED/MISSED` và enum/status SQL trước khi tích hợp.
- [ ] Không tự tính bữa chưa log là đã ăn; xử lý ngày hôm trước và timezone Việt Nam.
- [ ] Không tự gán target mặc định của PT cho client mới; nếu chưa có target, hiển thị chưa thiết lập.
- [ ] Tổng kcal/macros dựa trên actual logs, không đếm trùng; hiển thị target của đúng ngày.
- [ ] Review sai lệch kcal so với macros như cảnh báo kiểm tra, không tự ý sửa mục tiêu PT đã lưu.

**Done khi:** PT đổi target, client nhận đúng giá trị; nhập bữa ở ngày quá khứ không ảnh hưởng hôm nay; nutrition chart/history đúng.

### P1-07 — Calendar & Offline PT Sessions

- [ ] Lịch tuần/ngày/danh sách, tạo buổi tập gắn client + gói (nếu buổi tính vào gói), thời gian bắt đầu/kết thúc, địa điểm/online link.
- [ ] Trạng thái dựa trên enum SQL hiện có; map các luồng scheduled/attended/cancelled/no_show/reschedule tương ứng schema thực tế.
- [ ] Ngăn trùng lịch PT và client tại DB hoặc RPC; validate start < end.
- [ ] PT xác nhận attendance; client xem lịch và trạng thái, chưa cho client tự xác nhận trừ buổi.
- [ ] Chính sách hủy/vắng mặt cấu hình hoặc tài liệu hóa. Schema baseline đếm `attended` + `no_show`; xác nhận chủ dự án đồng ý trước khi áp dụng production.
- [ ] Không trừ buổi cho online check-in hoặc workout log tự tập nếu không thuộc gói buổi PT.

**Done khi:** Tạo/đổi/hủy lịch chính xác; thao tác xác nhận lặp không trừ hai buổi; không lịch chồng nhau hoặc gắn sai gói.

### P1-08 — Packages, Session Accounting & Payments

**Tận dụng:** `package_templates`, `client_packages`, `package_extensions`, `training_sessions`, `payments`, `client_package_summary`.

- [ ] Tạo gói theo buổi/thời hạn/hybrid với giá VND, số buổi, start/end, trạng thái.
- [ ] Giao gói cho client, theo dõi buổi đã dùng/còn lại, ngày còn lại, giá trị gói, đã thanh toán, công nợ.
- [ ] Chọn một nguồn sự thật cho số buổi: baseline summary view từ training_sessions. Không vừa đếm session vừa trừ counter độc lập. Nếu cần ledger mới, migration/đối soát và chuyển đổi rõ ràng.
- [ ] Transaction khóa gói khi xác nhận buổi để tránh vượt giới hạn. Sửa/hủy attendance có audit hoặc reversal theo quy tắc đã chọn.
- [ ] Gia hạn giữ lịch sử; kiểm tra trigger `apply_package_extension()` và ngày mới hợp lệ.
- [ ] Ghi thanh toán từng lần, ngày, phương thức, reference; dùng integer VND, không dùng float. Thiết kế adjustment/refund nếu cần, không xóa giao dịch tùy tiện.
- [ ] Client chỉ xem gói/thanh toán của mình, không xem doanh thu tổng hay công nợ người khác.

**Done khi:** Gói 20 buổi, 8 attendance tính phí = 12 còn lại; xác nhận retry không đổi số buổi; thanh toán nhiều lần/gia hạn đối soát được; client không tự sửa giá hoặc trạng thái thanh toán.

### P1-09 — Body Metrics & Basic Weekly Check-in

- [ ] Kết nối weight log và số đo hiện có vào `body_metrics`; unique per client/date theo loại metric nếu phù hợp.
- [ ] Biểu đồ cân nặng và trung bình 7 ngày từ dữ liệu thật, có trạng thái thiếu dữ liệu, không tự điền số mẫu.
- [ ] Bổ sung bảng weekly check-in và review (nếu chưa có) với client_id, tuần, status, submitted/reviewed timestamps, weight, sleep, energy, stress, adherence, notes.
- [ ] Client lưu draft/gửi; PT review và phản hồi; client xem phản hồi. Một check-in/tuần/client hoặc policy version rõ ràng.
- [ ] Dashboard PT hiển thị pending check-ins; client biết lịch gửi và trạng thái review.
- [ ] Không bắt buộc ảnh hoặc cân nặng nếu không phù hợp mục tiêu; không đưa nhận định y khoa tự động.

**Done khi:** Online client hoàn thành vòng giao giáo án → log → check-in → PT review; dữ liệu được giữ riêng và có timestamps.

### P1-10 — MVP QA & pilot

- [ ] Chạy đủ validation, test auth/RLS trên dev, E2E luồng PT và client (Playwright hoặc công cụ tương đương).
- [ ] Kiểm tra mobile viewport, thao tác one-hand, keyboard numeric, focus, contrast, touch targets.
- [ ] Kiểm tra lỗi mạng, logout trong lúc fetch, refresh giữa workout, hai tab/hai thiết bị, dữ liệu trống.
- [ ] Kiểm tra backup/restore DB và storage riêng, rollback migration và deployment trên staging.
- [ ] Pilot với 2–3 học viên tự nguyện sau khi quyền truy cập và chính sách dữ liệu đạt yêu cầu.
- [ ] Ghi feedback, sửa blocker trước khi mở cho toàn bộ học viên.

**MVP Done:** PT đăng nhập → tạo/mời client → giao giáo án/target → lên lịch/gói → client đăng nhập/log/check-in → PT review/đối soát. Mọi thao tác lưu thật trên Supabase, không lẫn tài khoản và không thay thế dữ liệu bằng mock.

## 4. P2 — Advanced Coaching & Branding

### P2-01 — Progress Photos & private coach notes

- [ ] Upload ảnh front/side/back tùy chọn; private bucket và signed URL ngắn hạn.
- [ ] Metadata theo client/check-in/date; giới hạn file, kiểm tra MIME, cleanup file orphan, consent trước khi thu thập.
- [ ] So sánh ảnh theo ngày, không public URL, không lưu token/ảnh vào analytics hoặc error logs.
- [ ] Private notes riêng PT, client không thể đọc qua API. Thêm quy trình export/xóa và thời hạn lưu trữ.
- [ ] Xin phép riêng khi sử dụng ảnh/feedback cho landing page; không mặc định consent coaching = consent marketing.

### P2-02 — Advanced analytics

- [ ] PR, e1RM ước tính, progression cùng exercise/thiết bị/reps, weekly working sets theo nhóm cơ, volume load.
- [ ] Workout completion rate, nutrition adherence theo dữ liệu có log, check-in completion và recovery trends.
- [ ] Filter client/date/exercise, loading/empty/error, lazy-load chart; test missing data, timezone và boundary tuần.
- [ ] Không coi thiếu log là 0 hoặc tự tạo % đạt mục tiêu không có công thức rõ ràng.

### P2-03 — Notifications & renewals

- [ ] In-app notifications cho giáo án mới, lịch sắp đến, check-in chưa gửi, gói sắp hết hạn và phản hồi PT.
- [ ] Scheduled job/Edge Function dùng timezone VN, deduplicate, không gửi lặp; hỗ trợ preferences.
- [ ] Email nếu cần; chưa tích hợp Zalo tự động nếu không có API/quyền phù hợp.
- [ ] Không đưa ảnh, cân nặng, health notes hoặc thông tin nhạy cảm vào nội dung thông báo không cần thiết.

### P2-04 — Branding & Public Landing Page

- [ ] Duyệt tên: Quang Thắng GYM / QT GYM, giữ PULSE / KINETIC nếu chủ dự án muốn duy trì sub-brand.
- [ ] Chuẩn hóa design tokens trong `src/index.css`, components `ui/`, typography và trạng thái tương tác.
- [ ] Màu tham khảo: Carbon #101419, Graphite #20262E, Lime #C6F432; kiểm tra contrast, không đổi toàn bộ theme trước khi duyệt.
- [ ] Landing page: giới thiệu PT, Online/Offline services, quy trình, kết quả được phép công khai, FAQ, form tư vấn, login.
- [ ] Form lead có server-side validation, rate limit/spam protection và chính sách dữ liệu.
- [ ] SEO title/meta, favicon, logo, domain, Vietnamese copy; không tạo thành tích hoặc feedback giả.

### P2-05 — PWA & production operations

- [ ] Manifest, icons, installability, safe service worker update, offline shell; chỉ cache dữ liệu được phép.
- [ ] Draft offline có owner, sync queue/idempotency nếu triển khai; tránh cache dữ liệu client khác khi logout.
- [ ] Monitoring/error tracking với PII redaction, backup DB và storage, restore drill, migration runbook.
- [ ] Review domain/HTTPS, hosting phù hợp sử dụng thương mại, chi phí Supabase/Vercel/email theo gói hiện hành.
- [ ] Hoàn thiện điều khoản, chính sách bảo mật, consent, lưu trữ và quyền dữ liệu phù hợp quy định áp dụng; xác minh pháp lý trước production.

## 5. P3 — Tính năng chưa cần làm ngay

- [ ] In-app chat và trao đổi video kỹ thuật (chỉ khi workflow hiện tại cần).
- [ ] Đồng bộ Google Calendar hai chiều, sau khi định nghĩa source of truth và xử lý conflict.
- [ ] Thanh toán online tự động; chỉ triển khai sau khi chốt provider, webhook verification và reconciliation.
- [ ] Food database/API lớn, barcode scanning, meal suggestions.
- [ ] AI tổng hợp check-in và đề xuất giáo án/dinh dưỡng cho PT review, không tự thay đổi kế hoạch hoặc gửi dữ liệu nhạy cảm chưa được phép.
- [ ] Multi-coach SaaS, subscription, staff roles, native mobile app: ngoài phạm vi hiện tại dưới 20 client.

## 6. Kiến trúc thư mục mục tiêu (đề xuất, triển khai dần)

```text
src/
  App.tsx
  components/
    views/                  # giữ tracker hiện tại
    ui/
  layouts/
    PtLayout.tsx
    ClientLayout.tsx
  features/
    auth/
    clients/
    dashboard/
    programs/
    workouts/
    nutrition/
    progress/
    check-ins/
    scheduling/
    billing/
  lib/
    supabase/
      client.ts
      database.types.ts
    repositories/
    store.ts                # UI state / local workout draft, giảm dần domain persistence
    types.ts
    analytics.ts
    data-management.ts
supabase/
  001_schema.sql            # lịch sử hiện có
  002_migration.sql         # lịch sử hiện có
  ...                       # migration mới, số thứ tự không trùng
  tests/
docs/
  data-model.md
  product-rules.md
  user-flows.md
  GYM_DEVELOPMENT_BACKLOG.md
```

Không di chuyển tất cả file cùng lúc. Thêm module mới và refactor khi có lý do/test đi kèm.

## 7. Quyền truy cập mục tiêu

| Dữ liệu / chức năng | PT | Client |
|---|---|---|
| Hồ sơ học viên | CRUD trong phạm vi phụ trách | Xem hồ sơ mình, sửa trường được cho phép |
| Exercise catalog | Quản lý bài riêng, xem bài hệ thống | Xem bài được phép |
| Giáo án được giao | Tạo/sửa/giao phiên bản | Chỉ đọc |
| Workout logs | Xem/ghi hộ client phụ trách | Ghi/xem của mình |
| Nutrition targets | Thiết lập và cập nhật | Chỉ đọc |
| Nutrition/body logs | Xem/ghi trong phạm vi được phép | Ghi/xem của mình |
| Check-in | Review, phản hồi | Tạo/gửi/xem của mình |
| Lịch PT | Tạo/sửa/xác nhận attendance | Xem lịch mình |
| Gói, thanh toán | Quản lý, đối soát | Chỉ xem thông tin mình |
| Ghi chú nội bộ | Riêng PT | Không truy cập |
| Ảnh hình thể | Client phụ trách, có consent | Ảnh của mình |
| Role, liên kết tài khoản | Quy trình admin/invite bảo mật | Không tự thay đổi |

Quyền phải được enforce trên server/database, không chỉ trên UI. Không dùng service-role key để bypass RLS ở browser.

## 8. Test matrix bắt buộc

| Case | Kết quả kỳ vọng |
|---|---|
| Anonymous gọi private API | Không trả dữ liệu |
| Client A đổi URL/ID sang client B | Không trả dữ liệu, không mutation |
| PT B sửa dữ liệu PT A | Bị từ chối |
| Client A DELETE program day/exercise được giao | Không xóa dòng nào |
| Client tự đổi role, giá gói, paid status | Bị từ chối |
| Invite hết hạn / sai email / đã sử dụng | Không liên kết account |
| Logout A, login B cùng browser | Không thấy cache/draft A |
| Save workout hai lần/retry | Chỉ một session đúng |
| Xác nhận attendance hai lần | Chỉ tính một buổi |
| Hai request đồng thời dùng buổi cuối | Không vượt số buổi cho phép |
| Gắn session vào package của client khác | Bị từ chối |
| Sửa template sau khi client tập | Lịch sử không đổi |
| Log nutrition ngày quá khứ | Tổng đúng ngày, không cộng hôm nay |
| Backup v1 thiếu foods | Khôi phục phần hợp lệ có cảnh báo phù hợp |
| Backup chứa store action/invalid references | Không ghi đè actions; từ chối dữ liệu sai |
| Refresh trong active workout | Khôi phục draft đúng owner |
| Mạng lỗi khi lưu | Có trạng thái chưa sync/retry; không giả báo success |
| Client B đọc ảnh client A | Bị từ chối |
| Restore database + storage | Dữ liệu/ảnh liên kết đúng |

## 9. Definition of Done chung

- [ ] Task có acceptance criteria và test phù hợp.
- [ ] UI hoạt động với dữ liệu thật, loading, empty, error, retry; demo được tách riêng.
- [ ] TypeScript không có lỗi mới; không dùng `any` hoặc `@ts-ignore` chỉ để vượt lỗi.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` đạt; nếu lỗi baseline chưa xử lý, ghi rõ và không tuyên bố pass.
- [ ] Migration tương thích dữ liệu cũ, thử trên môi trường dev/staging; không chứa secret.
- [ ] RLS, ownership, input validation, idempotency được kiểm tra với mutation liên quan.
- [ ] README/docs cập nhật khi thay đổi behavior/schema/env.
- [ ] Commit/PR nhỏ, mô tả files, test đã chạy, hạn chế còn lại và rollback nếu cần.

## 10. Prompt dùng với AI coding agent trong VS Code

Copy prompt này vào agent và gắn file backlog làm context:

```text
Đọc docs/GYM_DEVELOPMENT_BACKLOG.md, README.md, package.json,
source code và SQL migration hiện tại của repository GYM.

Mục tiêu: nâng cấp PULSE/KINETIC thành Quang Thắng GYM cho PT freelancer
và client Online/Offline/Hybrid, giữ React + Vite + TypeScript + Zustand
và giao diện tracker đang có. Không rewrite toàn bộ dự án.

Chỉ thực hiện task [TASK_ID] trong backlog. Trước khi sửa:
1. Kiểm tra branch, working tree, commit và tình trạng task thực tế.
2. Đọc đầy đủ file liên quan, đối chiếu schema và docs.
3. Nêu ngắn gọn root cause, kế hoạch, files sẽ sửa và rủi ro.

Sau đó triển khai thay đổi tối thiểu nhưng hoàn chỉnh, viết regression test.
Không tạo mock data để giả vờ backend hoạt động. Không làm task ngoài phạm vi.
Không thay đổi migration đã chạy; không chạy SQL production; không commit secrets.
Không đọc hoặc upload dữ liệu cá nhân của học viên khi không cần thiết.
Không push, merge, deploy hoặc reset dữ liệu khi chưa được tôi yêu cầu.
Giữ UX hiện tại và backward compatibility của dữ liệu nếu có thể.

Chạy npm run lint, npm run typecheck, npm test, npm run build.
Nếu task liên quan Supabase, kiểm thử RLS bằng các role riêng trên DB dev.
Báo rõ lệnh nào đã chạy, kết quả thực tế, blocker, files thay đổi và
acceptance criteria đạt/chưa đạt. Chỉ tick task khi đã xác minh.

Bắt đầu với P0-01 nếu chưa xác minh baseline.
```

Ví dụ lệnh yêu cầu agent từng bước:

```text
Thực hiện P0-01, chỉ audit và báo cáo baseline, không sửa code.
Thực hiện P0-02 theo backlog, viết test hồi quy và giữ backup tương thích.
Thực hiện P0-03, ưu tiên sửa RLS và verified invitation trên DB dev.
Thực hiện P0-04, tích hợp Supabase Auth và role guards.
```

## 11. Các quyết định cần chủ dự án xác nhận trước production

- [ ] Chính sách no-show/hủy muộn có tính buổi không? Cho phép âm số buổi hay phải chặn?
- [ ] Gói online tính theo tháng/ngày hay theo chu kỳ; ngày hết hạn và gia hạn tính thế nào?
- [ ] Client có quyền tự chỉnh goal/meal slots không, hay PT quản lý toàn bộ target?
- [ ] Archived client vẫn xem lịch sử hay khóa toàn bộ truy cập?
- [ ] Có cần cho PT tự tracking trong cùng tài khoản không?
- [ ] Có đổi hẳn branding PULSE/KINETIC sang Quang Thắng GYM không?
- [ ] Quy định lưu ảnh, health notes, dữ liệu tài chính, consent và xóa hồ sơ.
- [ ] Supabase project dev/staging/production, domain và ngân sách hosting.

**Lưu ý khảo sát:** Tài liệu dựa trên cây repository, README, docs, store, types, data management, một số views/tests và SQL đã đọc tại baseline. Chưa phải audit toàn bộ từng dòng của mọi component, chưa chạy build/test hoặc xác thực database/deployment thực tế. Kiểm tra lại code mới nhất trong VS Code trước khi áp dụng. Không giả định các bản sửa được đề xuất trong chat trước đã tồn tại trên GitHub.
