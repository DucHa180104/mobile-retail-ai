# Task Name
C2 - Chat với admin - Bước 1 tạo model dữ liệu

# Status
DONE

# Last Updated
2026-07-08

# Mục tiêu
- Chốt cấu trúc dữ liệu MongoDB cho chat hỗ trợ giữa user và admin.
- Tách rõ `conversation` và `message` để dễ quản lý hơn về sau.

# Các file đã sửa
- `backend/models/SupportConversation.js`
- `backend/models/SupportMessage.js`

# Nội dung thay đổi
- Tạo model `SupportConversation` để đại diện cho một cuộc trò chuyện hỗ trợ của user.
- Tạo model `SupportMessage` để lưu từng tin nhắn trong cuộc trò chuyện đó.

# Thiết kế dữ liệu
## SupportConversation
- `user`: user sở hữu cuộc chat
- `status`: trạng thái cuộc chat (`open` / `closed`)
- `lastMessage`: nội dung tin nhắn cuối
- `lastMessageAt`: thời điểm tin nhắn cuối
- `lastSenderType`: người gửi cuối (`user` / `admin`)

## SupportMessage
- `conversation`: thuộc cuộc chat nào
- `sender`: ai gửi tin nhắn
- `senderType`: loại người gửi (`user` / `admin`)
- `content`: nội dung tin nhắn
- `isRead`: đã đọc chưa

# Luồng dữ liệu
- Một user có một `SupportConversation` chính.
- Mỗi khi có tin nhắn mới, hệ thống sẽ lưu một `SupportMessage`.
- `SupportConversation` được dùng để hiển thị danh sách hội thoại.
- `SupportMessage` được dùng để hiển thị lịch sử tin nhắn chi tiết.

# Các bước test thủ công
- Chưa có API nên chưa test tay ở bước này.
- Ở bước sau có thể test bằng tạo document từ controller hoặc Postman.

# Kết quả test
- Chưa chạy test tự động ở bước này.

# Vấn đề còn tồn tại
- Chưa có controller, route và giao diện.
- Chưa có logic admin reply hoặc polling.

# Ghi chú phục vụ bảo vệ đồ án
- Lý do tách 2 model:
  - dễ lấy danh sách hội thoại
  - dễ lấy lịch sử tin nhắn
  - dễ mở rộng unread, trạng thái, thống kê về sau
