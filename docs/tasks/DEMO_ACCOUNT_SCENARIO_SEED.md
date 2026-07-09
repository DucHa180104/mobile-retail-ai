## Task Name
Seed dữ liệu demo tài khoản thực tế hơn

## Status
DONE

## Last Updated
2026-07-09

## Mục tiêu
- Tạo một file seed riêng cho dữ liệu demo giống tình huống thật hơn.
- Có user với tên, email, số điện thoại, địa chỉ giao hàng quanh Từ Sơn - Bắc Ninh.
- Có đơn hàng nhiều trạng thái, review, wishlist, cart, support chat và lịch sử chat AI.

## Các file đã sửa
- `backend/seed/demoAccountScenarioSeeder.js`
- `backend/package.json`

## Nội dung thay đổi
- Tạo seed riêng, không ghi đè logic của `productsSeeder.js`.
- Seed 1 admin và 5 khách hàng demo.
- Mỗi khách hàng có shipping info rõ ràng theo địa bàn Từ Sơn.
- Sinh đơn hàng `pending`, `confirmed`, `cancelled`.
- Sinh review chỉ cho các đơn `confirmed`.
- Sinh support conversation + support message giữa user và admin.
- Sinh `ChatHistory` để chatbot admin logs và user chat có dữ liệu sẵn.
- Gán thêm wishlist và cart cho một số user.

## Luồng dữ liệu
- Upsert user demo
- Xóa dữ liệu scenario cũ của nhóm user này
- Tạo order demo
- Tạo review theo order hợp lệ
- Tạo support chat
- Tạo lịch sử chat AI
- Gán wishlist/cart

## Cách chạy
```bash
cd backend
npm run seed:demo-scenario
```

## Kết quả mong đợi
- Đăng nhập các user demo thấy có dữ liệu tài khoản, địa chỉ, đơn hàng, review, chat.
- Admin vào support chat thấy sẵn hội thoại với khách.
- Admin vào chatbot logs có dữ liệu lịch sử chat AI.

## Vấn đề còn tồn tại
- Đây vẫn là dữ liệu demo nội bộ, chưa phải dữ liệu nhập ngẫu nhiên tự động.
- Ảnh review demo hiện để trống để tránh phụ thuộc upload bổ sung.

## Ghi chú phục vụ bảo vệ đồ án
- File seed này phục vụ demo end-to-end, giúp kiểm tra nhiều màn hình mà không phải thao tác tay từ đầu.
- Dữ liệu được nhóm theo “kịch bản thật” chứ không chỉ tạo user rỗng.
