# Task Name
C2 - Support Chat Admin - Bước 4: Hộp thư admin

# Status
DONE

# Last Updated
2026-07-09

# Mục tiêu
- Tạo trang admin để xem danh sách hội thoại hỗ trợ.
- Cho admin mở từng cuộc trò chuyện và trả lời khách hàng trực tiếp.
- Nối trang mới vào route và menu admin.

# File đã sửa
- `client/src/pages/AdminSupportChatPage.jsx`
- `client/src/App.jsx`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/components/admin/AdminSidebar.jsx`

# Nội dung thay đổi
- Tạo trang `AdminSupportChatPage` với layout 2 cột:
  - cột trái: danh sách hội thoại
  - cột phải: nội dung tin nhắn + form phản hồi
- Gọi API `GET /api/support-chat/admin/conversations`
- Gọi API `GET /api/support-chat/admin/conversations/:conversationId/messages`
- Gọi API `POST /api/support-chat/admin/conversations/:conversationId/messages`
- Thêm route `/admin/support-chat`
- Thêm link điều hướng ở `AdminLayout` và `AdminSidebar`

# Luồng dữ liệu
1. Admin vào `/admin/support-chat`
2. Frontend gọi API lấy danh sách hội thoại
3. Admin chọn 1 hội thoại
4. Frontend gọi API lấy toàn bộ tin nhắn của hội thoại đó
5. Admin nhập phản hồi và bấm gửi
6. Frontend gọi API gửi tin nhắn admin
7. Backend lưu tin nhắn mới
8. Frontend cập nhật lại khung chat và thông tin hội thoại

# Manual Test Checklist
- [ ] Admin vào được `/admin/support-chat`
- [ ] Danh sách hội thoại hiển thị đúng
- [ ] Chọn hội thoại tải được lịch sử tin nhắn
- [ ] Admin gửi phản hồi thành công
- [ ] Tin nhắn mới hiển thị ngay trong khung chat
- [ ] Hội thoại bên trái cập nhật tin nhắn cuối
- [ ] Không có hội thoại thì hiện empty state
- [ ] Lỗi API thì hiện error state

# Vấn đề còn tồn tại
- Chưa có realtime hoặc polling tự động.
- Chưa có badge unread count.
- Chưa có chức năng đóng/mở hội thoại từ UI admin.
- Chưa có giao diện mobile tối ưu sâu cho màn admin chat.

# Ghi chú phục vụ bảo vệ đồ án
- Bước này chứng minh hệ thống đã có luồng chat 2 phía: khách hàng và admin.
- Kiến trúc vẫn là REST API cơ bản, chưa cần WebSocket nên dễ demo và dễ giải thích.
- Đây là bản MVP phù hợp đồ án: đủ tạo hội thoại, xem lịch sử, phản hồi trực tiếp.
