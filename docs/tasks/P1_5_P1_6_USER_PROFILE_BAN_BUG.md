# Báo Cáo Phân Tích: Lỗi Ghi Đè Profile (P1.5) & Lỗi Banned User Không Có Hiệu Lực Ngay (P1.6)

Tài liệu này phân tích hai lỗi nghiệp vụ liên quan đến quản lý thông tin tài khoản người dùng và bảo mật hệ thống khi tài khoản bị khóa.

---

## 1. Lỗi P1.5: Cập nhật Profile gây mất dữ liệu cũ

### 1.1 Bản chất và Nguyên nhân gây lỗi
Lỗi này nằm trong hàm `updateProfile` tại [authController.js](file:///c:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/authController.js#L170-L181):
```javascript
if (shippingInfo && typeof shippingInfo === "object") {
  user.shippingInfo = {
    fullName: typeof shippingInfo.fullName === "string" ? shippingInfo.fullName.trim() : "",
    phoneNumber:
      typeof shippingInfo.phoneNumber === "string" ? shippingInfo.phoneNumber.trim() : "",
    address: typeof shippingInfo.address === "string" ? shippingInfo.address.trim() : "",
    city: typeof shippingInfo.city === "string" ? shippingInfo.city.trim() : "",
    district: typeof shippingInfo.district === "string" ? shippingInfo.district.trim() : "",
    ward: typeof shippingInfo.ward === "string" ? shippingInfo.ward.trim() : "",
    note: typeof shippingInfo.note === "string" ? shippingInfo.note.trim() : ""
  };
}
```

**Nguyên nhân:**
Khi Frontend gửi request cập nhật thông tin vận chuyển, ví dụ chỉ cập nhật địa chỉ nhà:
`{ shippingInfo: { address: "123 Đường mới" } }`

Hàm `updateProfile` sẽ chạy và thấy trường `fullName`, `city`, `district`... không được gửi lên (có kiểu dữ liệu là `undefined`). Hệ thống sẽ đánh giá `typeof shippingInfo.fullName === "string"` là `false`, và gán giá trị của chúng về chuỗi rỗng `""`.
**Kết quả:** Thông tin cũ lưu trong Database bị ghi đè sạch sẽ bằng chuỗi rỗng, gây mất mát dữ liệu nghiêm trọng cho người dùng.

### 1.2 Giải pháp khắc phục
Chúng ta cần kiểm tra nếu trường nào không được gửi lên hoặc không hợp lệ, hệ thống phải **giữ lại giá trị cũ** đang có trong Database thay vì xóa về rỗng.

```javascript
if (shippingInfo && typeof shippingInfo === "object") {
  const currentShippingInfo = user.shippingInfo || {};
  user.shippingInfo = {
    fullName: typeof shippingInfo.fullName === "string" ? shippingInfo.fullName.trim() : currentShippingInfo.fullName || "",
    phoneNumber:
      typeof shippingInfo.phoneNumber === "string" ? shippingInfo.phoneNumber.trim() : currentShippingInfo.phoneNumber || "",
    address: typeof shippingInfo.address === "string" ? shippingInfo.address.trim() : currentShippingInfo.address || "",
    city: typeof shippingInfo.city === "string" ? shippingInfo.city.trim() : currentShippingInfo.city || "",
    district: typeof shippingInfo.district === "string" ? shippingInfo.district.trim() : currentShippingInfo.district || "",
    ward: typeof shippingInfo.ward === "string" ? shippingInfo.ward.trim() : currentShippingInfo.ward || "",
    note: typeof shippingInfo.note === "string" ? shippingInfo.note.trim() : currentShippingInfo.note || ""
  };
}
```

---

## 2. Lỗi P1.6: Khóa tài khoản (Ban) không có hiệu lực ngay lập tức

### 2.1 Bản chất và Nguyên nhân gây lỗi
Khi Admin thực hiện khóa tài khoản của một người dùng thông qua hàm `updateUserStatus` tại [userAdminController.js](file:///c:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/userAdminController.js#L192-L202), trường `isActive` của User trong Database sẽ được chuyển sang `false`.

Tuy nhiên, trong các middleware bảo vệ route như `protect` và `protectOptional` tại [authMiddleware.js](file:///c:/Users/Admin/Desktop/mobile-retail-ai/backend/middleware/authMiddleware.js#L23-L37):
```javascript
const user = await User.findById(decoded.userId).select("-password");

if (!user) {
  return res.status(401).json({
    message: "Not authorized, user not found"
  });
}

// BỊ THIẾU: Không kiểm tra user.isActive
req.user = user;
next();
```

**Nguyên nhân:**
Vì JWT (JSON Web Token) là phi trạng thái (stateless) và được lưu ở trình duyệt khách hàng, một khi người dùng đã đăng nhập thành công và sở hữu token hợp lệ (thường có hiệu lực trong 1 giờ hoặc hơn):
- Cho dù Admin đã nhấn **Khóa tài khoản** trong Database, token đó vẫn chưa hết hạn.
- Khi người dùng gửi request, middleware giải mã token thành công, tìm được User trong DB, nhưng **hoàn toàn bỏ qua kiểm tra trường `isActive`**.
- Người dùng bị khóa vẫn có thể tiếp tục xem hồ sơ, đặt đơn hàng, chat bot như bình thường cho đến khi token của họ hết hạn. Điều này là lỗ hổng bảo mật nghiêm trọng.

### 2.2 Giải pháp khắc phục
Chúng ta cần chặn ngay lập tức request của người dùng nếu trường `isActive` của họ trong Database có giá trị là `false`.

#### Sửa đổi trong `protect`:
```javascript
const user = await User.findById(decoded.userId).select("-password");

if (!user) {
  return res.status(401).json({
    message: "Not authorized, user not found"
  });
}

// Kiểm tra nếu tài khoản bị khóa
if (!user.isActive) {
  return res.status(403).json({
    message: "Tài khoản của bạn đã bị khóa."
  });
}

req.user = user;
next();
```

#### Sửa đổi trong `protectOptional` (Để tránh người dùng dùng token bị khóa để thực hiện hành vi lách luật):
```javascript
const user = await User.findById(decoded.userId).select("-password");

if (user) {
  if (!user.isActive) {
    return res.status(403).json({
      message: "Tài khoản của bạn đã bị khóa."
    });
  }
  req.user = user;
}
```
