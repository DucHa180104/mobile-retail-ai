# S3 - Thu hẹp CORS theo whitelist origin

- Task Name: Chặn backend mở CORS cho mọi nguồn
- Status: DONE
- Last Updated: 2026-06-23

## Mục tiêu

- Loại bỏ cấu hình `app.use(cors())` mở quá rộng trong backend.
- Chỉ cho phép frontend hợp lệ gọi API từ browser.
- Giữ local dev hoạt động bình thường.
- Không chặn các request không có `Origin` như Postman hoặc Supertest.

## File đã sửa

- `backend/server.js`
- `backend/.env.example`

## File đã tạo

- `backend/config/corsOptions.js`
- `backend/config/corsOptions.test.js`

## Hiện trạng cũ

Trong `backend/server.js`, backend đang dùng:

```js
app.use(cors());
```

Với cấu hình này:

- backend mở CORS quá rộng
- chưa giới hạn origin hợp lệ
- chưa có whitelist cho frontend của hệ thống

## Logic cũ

Luồng cũ:

1. request từ browser gửi đến backend
2. middleware `cors()` cho phép rất rộng
3. không có bước kiểm tra origin có thuộc frontend hệ thống hay không

## Logic mới

Luồng mới:

1. backend đọc `ALLOWED_ORIGINS` từ biến môi trường
2. parse chuỗi env thành mảng whitelist origin
3. request không có `Origin` -> cho qua
4. request có `Origin`:
   - nếu nằm trong whitelist -> cho qua
   - nếu không nằm trong whitelist -> chặn

## Nội dung thay đổi chi tiết

### 1. Thêm biến môi trường `ALLOWED_ORIGINS`

Trong `backend/.env.example` đã thêm:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

Ý nghĩa:

- local dev có thể cho phép nhiều port frontend
- tránh hardcode origin trong code

### 2. Tách logic CORS ra file riêng

Đã tạo:

- `backend/config/corsOptions.js`

File này có 2 hàm:

- `parseAllowedOrigins(value)`
- `createCorsOptions(allowedOrigins)`

Ý nghĩa:

- tách logic CORS khỏi `server.js`
- giúp code dễ đọc hơn
- dễ viết test hơn

### 3. Đổi cấu hình `server.js`

Đã thay:

```js
app.use(cors());
```

bằng:

```js
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors(createCorsOptions(allowedOrigins)));
```

Ý nghĩa:

- backend không còn mở CORS cho mọi nguồn nữa
- chỉ origin hợp lệ mới được browser cho phép đọc response

### 4. Cho request không có origin đi qua

Trong `createCorsOptions(...)`, nếu request không có `origin`:

- `callback(null, true)`

Ý nghĩa:

- không làm hỏng Postman
- không làm hỏng Supertest
- không làm hỏng một số request nội bộ hoặc tool dev

## Test tự động đã thêm

File:

- `backend/config/corsOptions.test.js`

### Case 1 - Parse env string đúng

Kiểm tra:

- chuỗi `http://localhost:5173, http://localhost:5174, `
- được parse thành mảng:
  - `http://localhost:5173`
  - `http://localhost:5174`

### Case 2 - Origin hợp lệ được cho qua

Kiểm tra:

- origin `http://localhost:5173`
- callback nhận `(null, true)`

### Case 3 - Request không có origin được cho qua

Kiểm tra:

- `origin = undefined`
- callback nhận `(null, true)`

### Case 4 - Origin lạ bị chặn

Kiểm tra:

- `origin = http://evil-site.com`
- callback nhận `Error("CORS origin is not allowed")`

## Kết quả test

Đã chạy:

```bash
cd backend
npm test
```

Kết quả:

- `4 test files passed`
- `19 tests passed`

Bao gồm:

- `tradeInService.test.js`
- `orderRoutes.security.test.js`
- `orderRoutes.priceTampering.test.js`
- `corsOptions.test.js`

## Manual Test Checklist

- [x] Request không có `Origin` vẫn chạy được trong test backend
- [x] Origin hợp lệ được middleware CORS cho qua
- [x] Origin không hợp lệ bị từ chối
- [x] Parse whitelist origin từ env đúng
- [x] Các test backend cũ vẫn pass sau khi sửa S3

## Giá trị bảo mật đạt được

Sau task này:

- backend không còn mở CORS cho mọi website
- chỉ frontend hợp lệ trong whitelist mới được browser cấp quyền đọc response
- local dev vẫn hoạt động ổn
- tool test như Postman / Supertest không bị phá

## Ghi chú phục vụ bảo vệ đồ án

- CORS không phải là auth, nhưng là một lớp cấu hình bảo mật quan trọng.
- Nếu để `app.use(cors())` mặc định, backend sẽ mở quá rộng cho browser từ mọi origin.
- Cách sửa đúng là đưa origin hợp lệ vào whitelist qua env, không hardcode và không mở toàn bộ.
