# Mobile Retail AI

Website bán lẻ điện thoại cũ/mới và dịch vụ thu cũ đổi mới, xây dựng trên nền tảng **MERN Stack** gồm:

- **MongoDB**
- **Express**
- **React**
- **Node.js**

Dự án tập trung vào mô hình cửa hàng điện thoại quy mô nhỏ:

- bán điện thoại cũ và điện thoại mới
- quản lý giỏ hàng, đơn hàng, người dùng
- hỗ trợ admin quản trị sản phẩm, đơn hàng, người dùng
- có chatbot AI tư vấn chọn máy
- có module thu cũ đổi mới dạng rule-based demo

## 1. Công nghệ sử dụng

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- React Markdown

### Backend
- Node.js
- Express
- Mongoose
- JWT
- bcryptjs
- multer
- nodemailer

### Testing
- Vitest
- Supertest
- mongodb-memory-server
- Testing Library

### AI
- Gemini API

---

## 2. Chức năng chính

### Phía người dùng
- Xem danh sách sản phẩm
- Tìm kiếm, lọc, sắp xếp, phân trang sản phẩm
- Xem chi tiết sản phẩm
- Thêm vào giỏ hàng
- Giỏ hàng đồng bộ theo tài khoản
- Đăng ký, đăng nhập, đăng xuất
- Cập nhật hồ sơ cá nhân
- Đặt hàng với:
  - thông tin giao hàng
  - email nhận xác nhận đơn
  - nhiều phương thức thanh toán demo
- Xem lịch sử đơn hàng
- Xem chi tiết từng đơn hàng
- Yêu thích sản phẩm
- Đánh giá sản phẩm
- Chatbot AI tư vấn chọn máy
- Thu cũ đổi mới

### Phía quản trị
- Dashboard quản trị
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý người dùng
- Phân quyền user/admin
- Khóa / mở khóa tài khoản
- Xem chi tiết hoạt động của user
- Xem log chatbot
- Theo dõi tồn kho và cảnh báo sắp hết hàng

---

## 3. Các module nổi bật

### 3.1. Sản phẩm
- Product schema đã tách:
  - thông tin chung
  - `specs`
  - `usedDetails`
- Phù hợp hơn với web bán điện thoại cũ

### 3.2. Đơn hàng
- Hỗ trợ guest checkout
- Hỗ trợ order gắn với user nếu đã đăng nhập
- Backend tự tính lại giá từ database
- Có kiểm tra tồn kho
- Có transaction khi tạo đơn
- Có hoàn kho khi hủy đơn
- Có state machine cơ bản cho trạng thái đơn hàng

### 3.3. Bảo mật
- Đã làm nhiều task bảo mật theo file spec riêng
- Có test tái hiện và test chứng minh đã chặn cho một số lỗi quan trọng

### 3.4. Chatbot AI
- Widget chat nổi ở góc màn hình
- Gọi backend `/api/chat`
- Backend gọi Gemini API
- Có lịch sử chat lưu MongoDB theo user
- Có gợi ý sản phẩm theo ngữ cảnh

### 3.5. Trade-in
- Module thu cũ đổi mới hiện là **rule-based demo**
- Chưa phải AI/ML thật

---

## 4. Cấu trúc thư mục

```text
mobile-retail-ai/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    seed/
    services/
    uploads/
    server.js

  client/
    src/
      components/
      context/
      layouts/
      lib/
      pages/
      App.jsx
      main.jsx

  docs/
    tasks/
    SECURITY_SPEC/
    screenshots/
```

---

## 5. Yêu cầu môi trường

- Node.js 20+
- npm
- MongoDB local hoặc MongoDB Atlas

---

## 6. Cài đặt dự án

### 6.1. Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend` dựa trên `backend/.env.example`.

Ví dụ:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mobile-retail-ai
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
JWT_SECRET=change-this-secret-before-production
JWT_EXPIRES_IN=7d
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-mailtrap-user
MAILTRAP_PASS=your-mailtrap-pass
MAIL_FROM=no-reply@example.com
GEMINI_API_KEY=your_gemini_api_key_here
```

Chạy backend:

```bash
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

### 6.2. Frontend

```bash
cd client
npm install
```

Tạo file `.env` trong thư mục `client` dựa trên `client/.env.example`.

```env
VITE_API_BASE_URL=http://localhost:5000
```

Chạy frontend:

```bash
npm run dev
```

Frontend thường chạy tại:

```text
http://localhost:5173
```

Lưu ý:
- Nếu cổng `5173` đã bận, Vite có thể tự chuyển sang `5174`
- Khi đó cần chắc chắn `ALLOWED_ORIGINS` của backend có chứa `http://localhost:5174`

---

## 7. Script quan trọng

### Backend

```bash
npm run dev
npm start
npm run seed
npm run seed:review-test
npm test
npm run test:watch
npm run test:coverage
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run test:coverage
```

---

## 8. Seed dữ liệu demo

Seeder hiện phục vụ chủ yếu cho local demo và test nhanh.

Chạy:

```bash
cd backend
npm run seed
```

Seeder sẽ tạo lại dữ liệu demo như:
- `39` sản phẩm mẫu
- `1` tài khoản admin demo
- `1` tài khoản user demo

Tài khoản mẫu:

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin123` |
| User | `user@example.com` | `user123` |

Ngoài ra còn có:

```bash
npm run seed:review-test
```

Script này phục vụ tạo dữ liệu test cho review, order history và một số luồng demo liên quan.

Sau khi chạy `npm run seed:review-test`, hệ thống sẽ bổ sung thêm:
- `4` tài khoản user test review
- `8` đơn hàng demo đa dạng trạng thái để test:
  - lịch sử đơn hàng
  - đánh giá sản phẩm
  - phân quyền xem đơn
  - admin theo dõi user activity

---

## 9. API chính

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`

### Products
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

### Wishlist
- `GET /api/wishlist`
- `POST /api/wishlist/toggle`

### Reviews
- `POST /api/reviews`
- `PUT /api/reviews/:reviewId`
- `GET /api/reviews/product/:productId`
- `GET /api/reviews`

### Cart
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/sync`
- `PUT /api/cart/:productId`
- `DELETE /api/cart/:productId`
- `DELETE /api/cart`

### Trade-in
- `POST /api/tradein/estimate`

### Chatbot
- `POST /api/chat`
- `GET /api/chat/history`
- `GET /api/admin/chatbot-logs`

### Admin users
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/users/:id/details`

---

## 10. Luồng demo nên dùng khi bảo vệ

### Demo user
1. Đăng ký hoặc đăng nhập user
2. Vào trang điện thoại
3. Lọc theo hãng / tình trạng / dung lượng
4. Xem chi tiết sản phẩm
5. Thêm vào giỏ hoặc mua ngay từ trang chi tiết
6. Checkout
7. Vào "Đơn hàng của tôi"
8. Nếu có dữ liệu phù hợp, thử đánh giá sản phẩm
9. Mở chatbot để hỏi gợi ý máy

### Demo admin
1. Đăng nhập admin
2. Vào dashboard
3. Xem quản lý sản phẩm
4. Xem quản lý đơn hàng
5. Xem quản lý user
6. Thử đổi role hoặc khóa user
7. Xem chatbot logs

---

## 11. Testing và bảo mật

### Testing
- Backend đã có một số test tự động cho:
  - trade-in service
  - order security
  - stock/state machine
  - rate limit
  - error handling
  - regex injection
- Frontend đã cài sẵn bộ test cơ bản để mở rộng tiếp

### Bảo mật
Một số vấn đề đã được xử lý hoặc đang theo dõi qua tài liệu riêng:
- IDOR đơn hàng
- price tampering
- CORS
- brute force login
- mass assignment
- lộ `error.message`
- regex injection

Xem thêm:
- `docs/SECURITY_SPEC/`
- `docs/tasks/`

---

## 12. Hạn chế hiện tại

- Trade-in hiện là rule-based demo, chưa phải AI/ML thật
- Chatbot phụ thuộc Gemini API key và quota
- Email xác nhận đơn phụ thuộc cấu hình Mailtrap/SMTP
- Một số task polish cuối vẫn đang tiếp tục hoàn thiện

---

## 13. Ghi chú quan trọng khi chấm demo

- Nên seed dữ liệu trước khi demo:

```bash
cd backend
npm run seed
```

- Nếu dùng chatbot:
  - cần `GEMINI_API_KEY` hợp lệ
- Nếu demo email:
  - cần cấu hình Mailtrap/SMTP hợp lệ
- Nếu frontend chạy sang `5174`:
  - backend phải cho phép origin đó trong `ALLOWED_ORIGINS`

---

## 14. Định hướng tiếp tục

Các hướng hoàn thiện tiếp theo:
- dọn README và tài liệu đồng bộ hơn nữa với tiến độ thật
- hoàn thiện nốt các task trong action plan của mentor
- tăng coverage test backend/frontend
- polish UI cuối trước ngày demo

---

## 15. Tác giả và mục đích

Dự án phục vụ đồ án web bán hàng theo hướng:
- có luồng mua hàng thật
- có quản trị
- có bảo mật
- có test
- có AI chatbot hỗ trợ tư vấn

Trọng tâm của dự án là:
- phù hợp với mô hình cửa hàng điện thoại cũ
- dễ demo
- dễ giải thích luồng kỹ thuật khi bảo vệ
