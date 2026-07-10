## B3 Trade-In Pricing User Sync

### Trạng thái
- DONE

### Mục tiêu
- Nối phần `TradeInPage.jsx` ở frontend với bảng giá thu cũ thật trong MongoDB.
- Không để user chọn model/dung lượng từ danh sách hardcode riêng ở frontend nữa.
- Đảm bảo admin cấu hình rule giá ở trang quản trị xong thì user thấy ngay đúng danh sách máy được hỗ trợ thu cũ.

### Hiện trạng trước khi sửa
- Backend đã có `TradeInPricingRule`.
- Backend đã có logic định giá đọc `basePrice` từ database.
- Admin đã có giao diện CRUD rule giá.
- Tuy nhiên frontend `TradeInPage.jsx` vẫn dùng danh sách máy hardcode riêng.

### Vấn đề của cách cũ
- Dữ liệu ở frontend và database có thể lệch nhau.
- Admin thêm rule mới nhưng user không chọn được ngay trên trang thu cũ.
- Có nguy cơ user chọn model tồn tại ở UI nhưng không có rule active trong DB.
- Luồng “admin cấu hình giá -> user dùng đúng dữ liệu đó” chưa khép kín.

### Phần đã triển khai

#### 1. Tạo API public lấy danh sách rule đang active
- Endpoint: `GET /api/tradein/pricing-rules`
- Chỉ trả về các rule có `isActive: true`
- Có sắp xếp theo:
  - `brand`
  - `modelName`
  - `storage`
- Chỉ trả các field cần cho frontend:
  - `id`
  - `brand`
  - `modelName`
  - `storage`
  - `basePrice`

#### 2. Sửa `TradeInPage.jsx` để dùng dữ liệu thật
- Khi mở trang, frontend gọi API `GET /api/tradein/pricing-rules`
- Từ danh sách rule trả về, frontend tự sinh:
  - danh sách hãng
  - danh sách model theo hãng
  - danh sách dung lượng theo model
- User không còn nhập/chọn từ dữ liệu cứng cũ nữa.

#### 3. Đồng bộ dữ liệu theo chuỗi chọn
- Khi user đổi `brand`
  - frontend tự reset `model`
  - frontend tự reset `storage`
- Khi user đổi `model`
  - frontend tự reset `storage`
- Điều này giúp tránh chọn sai tổ hợp như:
  - hãng A nhưng model của hãng B
  - model X nhưng storage không có rule tương ứng

#### 4. Gửi estimate đúng dữ liệu từ DB
- Khi user bấm định giá, frontend gửi:
  - `brand`
  - `modelName`
  - `storage`
  - các thông tin tình trạng máy
- Backend tiếp tục dùng service hiện tại để tính giá theo rule trong DB.

### File đã sửa
- `backend/controllers/tradeInController.js`
- `backend/routes/tradeInRoutes.js`
- `client/src/pages/TradeInPage.jsx`

### Luồng dữ liệu mới
1. Admin tạo hoặc chỉnh sửa rule giá trong trang quản trị.
2. Rule được lưu vào collection `TradeInPricingRule`.
3. User vào trang `TradeInPage`.
4. Frontend gọi `GET /api/tradein/pricing-rules`.
5. Backend trả về danh sách rule đang active.
6. Frontend render dropdown hãng, model, dung lượng từ dữ liệu đó.
7. User chọn máy và nhập tình trạng.
8. Frontend gọi `POST /api/tradein/estimate`.
9. Backend đọc đúng rule từ DB để tính giá thu cũ.

### Lợi ích sau khi sửa
- Frontend và backend dùng chung một nguồn dữ liệu.
- Admin chỉnh rule xong thì user dùng được ngay.
- Giảm rủi ro lệch dữ liệu giữa UI và DB.
- Luồng thu cũ đổi mới đúng hơn với mô hình thực tế của shop.

### Manual Test Checklist
- [ ] Admin tạo một rule giá mới và bật active
- [ ] User vào trang thu cũ thấy hãng của rule đó
- [ ] Chọn hãng đúng thì chỉ hiện các model tương ứng
- [ ] Chọn model đúng thì chỉ hiện các dung lượng tương ứng
- [ ] Gửi estimate thành công với model có rule
- [ ] Rule inactive không xuất hiện ở frontend
- [ ] Khi không có rule active, frontend hiển thị trạng thái phù hợp

### Ghi chú bảo vệ đồ án
- Phần này hoàn thiện nốt mắt xích cuối của module trade-in pricing.
- Điểm quan trọng để trình bày:
  - Admin không chỉ CRUD rule giá ở backend
  - mà frontend user cũng đã dùng trực tiếp danh sách rule đó
  - nên dữ liệu đã đồng bộ end-to-end
- Đây là bước chuyển từ “demo hardcode UI” sang “flow thật dùng dữ liệu từ database”.
