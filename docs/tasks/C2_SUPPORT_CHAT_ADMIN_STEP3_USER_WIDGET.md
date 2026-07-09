# Task Name
C2 - Chat với admin - Bước 3 tích hợp phía user trong ChatbotWidget

# Status
DONE

# Last Updated
2026-07-09

# Mục tiêu
- Thêm tab `Chat với admin` bên cạnh `Chat với AI`.
- Cho user đã đăng nhập xem lịch sử hỗ trợ và gửi tin nhắn cho admin ngay trong widget.
- Không phá chatbot AI hiện tại.

# Các file đã sửa
- `client/src/components/ChatbotWidget.jsx`

# Nội dung thay đổi
- Viết lại `ChatbotWidget.jsx` theo hướng sạch hơn.
- Tách 2 tab:
  - `Chat với AI`
  - `Chat với admin`
- Tab AI giữ nguyên chức năng cũ:
  - lịch sử chat AI
  - gợi ý câu hỏi
  - gửi câu hỏi tới `/api/chat`
- Tab admin mới:
  - nếu chưa đăng nhập: hiện thông báo yêu cầu đăng nhập
  - nếu đã đăng nhập: gọi `GET /api/support-chat/me`
  - gửi tin bằng `POST /api/support-chat/me/messages`
  - hiển thị message của user và admin theo kiểu 2 phía

# Luồng dữ liệu
## Tab AI
- giữ nguyên luồng cũ qua `/api/chat` và `/api/chat/history`

## Tab admin
- user mở tab `Chat với admin`
- frontend gọi `GET /api/support-chat/me`
- backend trả conversation + messages
- user nhập nội dung
- frontend gọi `POST /api/support-chat/me/messages`
- backend lưu `SupportMessage`
- frontend append message mới vào danh sách

# Các bước test thủ công
- Mở widget chat
- Chuyển qua lại giữa 2 tab
- Chưa đăng nhập:
  - mở tab admin
  - thấy thông báo yêu cầu đăng nhập
- Đã đăng nhập:
  - mở tab admin
  - thấy hội thoại hỗ trợ
  - gửi 1 tin nhắn mới
  - thấy tin nhắn hiển thị trong widget

# Kết quả test
- Chưa chạy test tự động ở bước này.
- Cần build frontend và test tay ở bước sau.

# Vấn đề còn tồn tại
- Chưa có trang inbox phía admin.
- Chưa có polling để user tự thấy admin trả lời mới.
- Chưa có badge unread.

# Ghi chú phục vụ bảo vệ đồ án
- Ở bước này widget đã trở thành 2 kênh hỗ trợ:
  - AI tư vấn tự động
  - chat thật với admin
- Đây là nền tảng tốt để nâng tiếp sang inbox admin hoặc realtime sau này.
