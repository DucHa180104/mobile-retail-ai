# P0 - Phân tích chi tiết lỗi tồn kho đơn hàng và state machine

## Mục tiêu tài liệu

Tài liệu này giải thích cực chi tiết phần code liên quan đến:

- tạo đơn hàng
- trừ tồn kho
- cập nhật trạng thái đơn hàng
- vì sao hiện tại có lỗi
- những đoạn nào sẽ cần sửa

Tài liệu này chưa sửa code.
Nó chỉ giúp đọc hiểu code hiện tại trước khi bắt đầu sửa.

---

## 1. Các file liên quan

### Backend route

- [backend/routes/orderRoutes.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/routes/orderRoutes.js:1)

### Backend controller

- [backend/controllers/orderController.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:1)

### Model đơn hàng

- [backend/models/Order.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/models/Order.js:1)

### Model sản phẩm

- [backend/models/Product.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/models/Product.js:1)

---

## 2. Luồng tổng quát hiện tại

Hiện tại luồng đặt hàng đang diễn ra như sau:

1. Frontend gửi request `POST /api/orders`
2. Route `orderRoutes.js` nhận request
3. Route gọi hàm `createOrder`
4. `createOrder`:
   - đọc dữ liệu từ `req.body`
   - validate dữ liệu
   - load product từ MongoDB
   - kiểm tra stock
   - tạo order
   - sau đó mới trừ stock
5. Backend trả order về cho frontend

Luồng cập nhật trạng thái đơn hiện tại:

1. Admin gửi `PATCH /api/orders/:id/status`
2. Route gọi `updateOrderStatus`
3. `updateOrderStatus` chỉ update trường `status`
4. Không có logic hoàn kho
5. Không có state machine kiểm soát chuyển trạng thái

---

## 3. Giải thích file route trước

File: [backend/routes/orderRoutes.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/routes/orderRoutes.js:1)

### Dòng 1

```js
import express from "express";
```

Tác dụng:

- import thư viện Express
- dùng để tạo router cho module order

Kiến thức:

- ES Module `import`
- Express Router

### Dòng 2 đến 8

```js
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
```

Tác dụng:

- import các hàm xử lý request từ controller
- route không tự xử lý logic nặng
- route chỉ làm nhiệm vụ nối URL với controller

Kiến thức:

- module export/import
- tách route và controller

### Dòng 9

```js
import { protect, protectAdmin, protectOptional } from "../middleware/authMiddleware.js";
```

Tác dụng:

- `protect`: bắt buộc phải có token hợp lệ
- `protectAdmin`: chỉ admin mới được đi tiếp
- `protectOptional`: có token thì đọc user, không có token vẫn cho đi tiếp

Điều này rất quan trọng vì:

- tạo order hiện cho phép guest checkout
- admin route thì phải khóa bằng backend

### Dòng 11

```js
const router = express.Router();
```

Tác dụng:

- tạo object router riêng cho module orders

### Dòng 13

```js
router.post("/", protectOptional, createOrder);
```

Ý nghĩa:

- khi frontend gọi `POST /api/orders`
- request sẽ chạy qua `protectOptional`
- sau đó chạy vào `createOrder`

Đây là route tạo đơn hàng.

### Dòng 14

```js
router.get("/", protect, protectAdmin, getOrders);
```

Ý nghĩa:

- chỉ admin mới xem được tất cả orders

### Dòng 15

```js
router.get("/my-orders", protect, getMyOrders);
```

Ý nghĩa:

- user đăng nhập xem lịch sử đơn của chính mình

### Dòng 16

```js
router.get("/:id", protect, getOrderById);
```

Ý nghĩa:

- xem chi tiết một order
- phải login
- sau đó controller sẽ kiểm tra owner/admin

### Dòng 17

```js
router.patch("/:id/status", protect, protectAdmin, updateOrderStatus);
```

Ý nghĩa:

- chỉ admin được đổi trạng thái order

### Dòng 19

```js
export default router;
```

Tác dụng:

- export router ra để `server.js` mount vào `/api/orders`

---

## 4. Giải thích model Product

File: [backend/models/Product.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/models/Product.js:1)

### Dòng 19 đến 23

```js
stock: {
  type: Number,
  default: 0,
  min: 0
},
```

Đây là field tồn kho.

Ý nghĩa:

- `type: Number`: số lượng tồn là số
- `default: 0`: nếu chưa có dữ liệu thì mặc định bằng 0
- `min: 0`: Mongoose validate không cho lưu giá trị âm

Lưu ý rất quan trọng:

- `min: 0` chỉ giúp validate khi lưu document theo cơ chế validator
- nó **không tự chống race condition**
- tức là vẫn có thể phát sinh lỗi nghiệp vụ nếu code trừ kho không an toàn

Kiến thức:

- Mongoose schema validation
- validation khác với business logic safety

---

## 5. Giải thích model Order

File: [backend/models/Order.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/models/Order.js:1)

### Dòng 3 đến 32: `orderItemSchema`

Đây là schema cho từng item bên trong order.

### Dòng 5 đến 8

```js
productId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true
},
```

Ý nghĩa:

- mỗi item phải biết nó thuộc sản phẩm nào
- lưu `_id` của product

### Dòng 9 đến 18

```js
name
price
```

Ý nghĩa:

- tại thời điểm tạo order, backend copy snapshot thông tin sản phẩm vào order
- sau này dù product thay đổi, order cũ vẫn giữ tên/giá lúc mua

### Dòng 19 đến 23

```js
quantity
```

Ý nghĩa:

- số lượng mua của item đó

### Dòng 24 đến 27

```js
image
```

Ý nghĩa:

- lưu ảnh đại diện của sản phẩm trong order

### Dòng 34 đến 147: `orderSchema`

Đây là schema tổng của order.

### Dòng 36 đến 40

```js
user
```

Ý nghĩa:

- nếu là user đăng nhập thì order gắn với `User`
- nếu là guest thì `default: null`

### Dòng 41 đến 77

```js
shippingInfo
```

Ý nghĩa:

- lưu thông tin giao hàng có cấu trúc

### Dòng 104 đến 113

```js
items: {
  type: [orderItemSchema],
  required: true,
  validate: {
    validator: function (value) {
      return value.length > 0;
    }
  }
}
```

Ý nghĩa:

- order phải có ít nhất 1 item

### Dòng 114 đến 118

```js
totalAmount
```

Ý nghĩa:

- tổng tiền đơn hàng
- hiện backend đã tự tính lại từ DB, không tin frontend

### Dòng 138 đến 142

```js
status: {
  type: String,
  enum: ["pending", "confirmed", "cancelled"],
  default: "pending"
}
```

Đây là phần cực quan trọng.

Ý nghĩa:

- order chỉ có 3 trạng thái
- khi tạo order, mặc định là `pending`

Lưu ý:

- `enum` chỉ kiểm tra “status có thuộc 3 giá trị này không”
- nó **không kiểm tra chuyển trạng thái hợp lệ**

Ví dụ:

- `cancelled -> confirmed`

Mongoose vẫn cho nếu chỉ xét `enum`, vì `confirmed` là giá trị hợp lệ.

Cho nên:

- schema **chưa đủ**
- phải có thêm state machine trong controller

---

## 6. Giải thích chi tiết `createOrder`

File: [backend/controllers/orderController.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:7)

## 6.1 Khai báo hàm

### Dòng 7

```js
export const createOrder = async (req, res, next) => {
```

Ý nghĩa:

- export hàm ra ngoài để route gọi
- `async` vì bên trong có nhiều `await`
- tham số:
  - `req`: request từ frontend
  - `res`: response trả về
  - `next`: chuyển lỗi cho middleware error handler

Kiến thức:

- Express controller
- async/await
- middleware chain

## 6.2 Đọc dữ liệu từ request body

### Dòng 9 đến 18

```js
const {
  customerName,
  phoneNumber,
  address,
  note,
  contactEmail,
  shippingInfo,
  items,
  paymentMethod = "cod"
} = req.body;
```

Ý nghĩa:

- destructuring object từ `req.body`
- backend lấy các field frontend gửi sang
- `paymentMethod = "cod"` nghĩa là:
  - nếu frontend không gửi paymentMethod
  - backend tự mặc định là `cod`

Kiến thức:

- object destructuring
- default parameter value trong destructuring

## 6.3 Danh sách payment method hợp lệ

### Dòng 19

```js
const allowedPaymentMethods = ["cod", "bank_transfer", "online_mock"];
```

Ý nghĩa:

- whitelist giá trị payment method được chấp nhận

## 6.4 Chuẩn hóa email

### Dòng 20 đến 22

```js
const normalizedEmail = String(contactEmail || req.user?.email || "")
  .trim()
  .toLowerCase();
```

Phân tích rất kỹ:

- `contactEmail || req.user?.email || ""`
  - ưu tiên email frontend gửi lên
  - nếu không có thì lấy email của user đăng nhập
  - nếu vẫn không có thì dùng chuỗi rỗng
- `String(...)`
  - ép chắc chắn về chuỗi
- `.trim()`
  - bỏ khoảng trắng đầu/cuối
- `.toLowerCase()`
  - chuẩn hóa về chữ thường

Kiến thức:

- optional chaining `?.`
- logical OR `||`
- normalize input

## 6.5 Chuẩn hóa shipping info

### Dòng 23 đến 31

Đoạn này build object `normalizedShippingInfo`.

Ví dụ:

```js
fullName: shippingInfo?.fullName?.trim() || customerName?.trim() || ""
```

Ý nghĩa:

- nếu frontend gửi `shippingInfo.fullName` thì dùng nó
- nếu không có thì fallback sang `customerName`
- nếu vẫn không có thì dùng `""`

Đây là cách backend hỗ trợ tương thích với dữ liệu cũ và dữ liệu mới.

## 6.6 Validate dữ liệu bắt buộc

### Dòng 33 đến 59

Các đoạn `if (...) return res.status(400)...`

Ý nghĩa:

- chặn request xấu ngay từ đầu
- nếu thiếu email / địa chỉ / phone / items / paymentMethod sai
- backend trả lỗi 400

Kiến thức:

- input validation
- early return

## 6.7 Chuẩn hóa `items` từ frontend

### Dòng 61 đến 64

```js
const normalizedRequestItems = items.map((item) => ({
  productId: String(item.productId || "").trim(),
  quantity: Number(item.quantity || 0)
}));
```

Ý nghĩa:

- backend không tin dữ liệu gốc frontend gửi
- backend ép:
  - `productId` thành string sạch
  - `quantity` thành number

Kiến thức:

- array `.map()`
- normalize input

## 6.8 Validate từng item

### Dòng 66 đến 74

```js
for (const item of normalizedRequestItems) {
```

Đây là vòng lặp duyệt từng item trong giỏ hàng.

### Dòng 67 đến 69

- nếu thiếu `productId` thì báo lỗi

### Dòng 71 đến 73

- nếu `quantity` không phải số nguyên dương >= 1 thì báo lỗi

Kiến thức:

- `for...of`
- `Number.isInteger`

## 6.9 Load product thật từ MongoDB

### Dòng 76

```js
const productIds = normalizedRequestItems.map((item) => item.productId);
```

Ý nghĩa:

- lấy danh sách tất cả productId để query DB

### Dòng 77

```js
const products = await Product.find({ _id: { $in: productIds } });
```

Ý nghĩa:

- load tất cả product có `_id` nằm trong danh sách `productIds`

Kiến thức:

- Mongo query `$in`

### Dòng 78

```js
const productMap = new Map(products.map((product) => [String(product._id), product]));
```

Ý nghĩa:

- biến mảng product thành `Map`
- để tra product theo `_id` nhanh hơn

Kiến thức:

- JavaScript `Map`
- key-value lookup

## 6.10 Build `orderItems` và tính tổng tiền

### Dòng 79 đến 80

```js
const orderItems = [];
let calculatedTotalAmount = 0;
```

Ý nghĩa:

- `orderItems`: mảng item chuẩn để lưu vào order
- `calculatedTotalAmount`: tổng tiền do backend tự tính

### Dòng 82 đến 107

Đây là vòng lặp rất quan trọng.

### Dòng 83

```js
const product = productMap.get(String(item.productId));
```

Ý nghĩa:

- lấy product thật từ DB ra

### Dòng 85 đến 89

- nếu không có product thì báo lỗi

### Dòng 91 đến 95

```js
if ((product.stock ?? 0) < item.quantity) {
```

Ý nghĩa:

- kiểm tra stock hiện tại có đủ không

Nhưng đây chính là một trong các điểm lỗi.

Vì:

- đây mới chỉ là bước “nhìn thấy còn hàng”
- chưa phải bước “khóa hàng và trừ hàng”
- giữa lúc check xong và lúc trừ thật, user khác có thể chen vào

Đây là chỗ gây race condition / oversell.

### Dòng 97 đến 103

```js
const orderItem = {
  productId: product._id,
  name: product.name,
  price: Number(product.price || 0),
  quantity: item.quantity,
  image: product.images?.[0] || ""
};
```

Ý nghĩa:

- snapshot item từ DB
- backend tự lấy:
  - tên
  - giá
  - ảnh
- không tin giá từ client

Điểm này là tốt, giúp chống price tampering.

### Dòng 105 đến 106

- push item vào `orderItems`
- cộng dồn tiền

## 6.11 Lấy thông tin payment

### Dòng 109

```js
const paymentData = getPaymentData(paymentMethod);
```

Ý nghĩa:

- tách rule payment ra hàm riêng

## 6.12 Tạo order trong DB

### Dòng 111 đến 125

```js
const order = await Order.create({...});
```

Ý nghĩa:

- tạo document order trong MongoDB

Đây là một vấn đề thiết kế hiện tại:

- order được tạo trước
- stock bị trừ sau

Nếu stock update fail ở bước sau:
- order có thể đã tồn tại
- nhưng kho trừ dang dở

Tức là dữ liệu có thể lệch.

## 6.13 Trừ kho sau khi đã tạo order

### Dòng 127 đến 131

```js
for (const item of orderItems) {
  await Product.findByIdAndUpdate(item.productId, {
    $inc: { stock: -item.quantity }
  });
}
```

Đây là đoạn quan trọng nhất cần nhìn rõ.

Ý nghĩa:

- sau khi tạo order thành công
- backend mới đi từng sản phẩm và trừ stock

Vì sao nguy hiểm:

1. Không atomic
   - kiểm tra stock xảy ra ở dòng 91
   - trừ stock xảy ra ở dòng 127
   - giữa 2 bước này có khoảng hở

2. Không transaction
   - nếu trừ sản phẩm 1 thành công
   - trừ sản phẩm 2 lỗi
   - order vẫn đã tạo

3. Không có điều kiện `stock >= quantity` ngay trong update
   - nên không chống được 2 request đồng thời

Đây là chỗ chính sẽ phải sửa.

## 6.14 Gửi email xác nhận đơn

### Dòng 133 đến 137

Ý nghĩa:

- order tạo xong thì thử gửi email
- nếu email fail thì chỉ log lỗi
- không rollback order

Điểm này hợp lý với flow nghiệp vụ.

## 6.15 Trả response

### Dòng 139

```js
res.status(201).json(order);
```

Ý nghĩa:

- backend trả order vừa tạo về client

---

## 7. Giải thích chi tiết `updateOrderStatus`

File: [backend/controllers/orderController.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:190)

## 7.1 Khai báo hàm

### Dòng 190

```js
export const updateOrderStatus = async (req, res, next) => {
```

Đây là controller admin đổi trạng thái order.

## 7.2 Đọc status mới

### Dòng 192

```js
const { status } = req.body;
```

Ý nghĩa:

- lấy status frontend/admin gửi lên

## 7.3 Validate status có thuộc enum không

### Dòng 194 đến 196

```js
if (!allowedOrderStatuses.includes(status)) {
  return res.status(400).json({ message: "Invalid order status" });
}
```

Ý nghĩa:

- chỉ cho phép 3 giá trị hợp lệ

Nhưng đây chưa đủ.

Vì:

- nó chỉ kiểm tra “status mới có hợp lệ không”
- nó chưa kiểm tra “đi từ status cũ sang status mới có hợp lệ không”

Ví dụ:

- `cancelled -> confirmed`

vẫn lọt qua được đoạn này.

## 7.4 Update thẳng vào DB

### Dòng 198 đến 205

```js
const order = await Order.findByIdAndUpdate(
  req.params.id,
  { status },
  {
    new: true,
    runValidators: true
  }
);
```

Ý nghĩa:

- tìm order theo id
- update luôn field `status`
- trả document mới

Vì sao đây là vấn đề:

1. Không đọc trạng thái cũ
   - nên không biết order đang từ đâu đi sang đâu

2. Không hoàn kho
   - nếu đổi sang `cancelled` thì stock vẫn bị thiếu

3. Không chống chuyển trạng thái bậy
   - có thể revive đơn đã hủy

4. Sau này nếu thêm hoàn kho mà không cẩn thận
   - rất dễ hoàn kho 2 lần

## 7.5 404 nếu không có order

### Dòng 207 đến 209

Đúng, không có vấn đề.

## 7.6 Trả response

### Dòng 211

Trả order mới về cho frontend.

---

## 8. Lỗi nghiệp vụ hiện tại được tạo ra như thế nào

## 8.1 Lỗi hủy đơn không hoàn kho

Kịch bản:

1. Product A có `stock = 5`
2. User đặt 1 máy
3. `createOrder` tạo order và trừ stock còn `4`
4. Admin đổi status order sang `cancelled`
5. `updateOrderStatus` chỉ update `status`
6. stock vẫn là `4`

Đáng lẽ:

- khi hủy đơn, stock phải quay lại `5`

## 8.2 Lỗi oversell

Kịch bản:

1. Product A còn `stock = 1`
2. User A và User B cùng bấm mua gần như cùng lúc
3. Cả hai request đều chạy tới dòng 91
4. Cả hai đều thấy `stock >= 1`
5. Cả hai đều tạo order
6. Cả hai đều tới dòng 127 để trừ kho

Kết quả:

- cả 2 đơn cùng thành công
- món cuối bị bán cho 2 người

Đây là race condition.

---

## 9. Những đoạn code sẽ phải sửa

## 9.1 Bắt buộc sửa trong `createOrder`

Hiện đoạn cần thay đổi mạnh nhất là:

- [backend/controllers/orderController.js:76](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:76)
- [backend/controllers/orderController.js:127](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:127)

Lý do:

- hiện đang:
  - load product
  - check stock
  - tạo order
  - rồi mới trừ stock rời rạc

Sẽ phải đổi sang:

- transaction
- trừ stock atomic bằng điều kiện `stock >= quantity`
- nếu fail thì rollback toàn bộ

## 9.2 Bắt buộc sửa trong `updateOrderStatus`

Đoạn sẽ phải thay đổi:

- [backend/controllers/orderController.js:190](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js:190)

Lý do:

- hiện chỉ update `status`
- chưa có state machine
- chưa hoàn kho

Sẽ phải đổi sang:

1. đọc order hiện tại
2. kiểm tra chuyển trạng thái hợp lệ
3. nếu sang `cancelled` thì hoàn kho
4. lưu trong transaction

---

## 10. Những logic mới sẽ thêm

## 10.1 State machine

Rule dự kiến:

- `pending -> confirmed`
- `pending -> cancelled`
- `confirmed -> cancelled`
- `cancelled -> không đi đâu nữa`

## 10.2 Hoàn kho khi hủy đơn

Chỉ hoàn kho nếu:

- status mới là `cancelled`
- và status cũ chưa phải `cancelled`

## 10.3 Trừ kho atomic khi tạo order

Thay vì:

- kiểm tra riêng
- update riêng

Sẽ đổi sang kiểu:

- chỉ update nếu `stock >= quantity`

Nếu update không match:

- coi như hết hàng
- fail order
- rollback transaction

---

## 11. Test sẽ cần viết

## 11.1 Cho `updateOrderStatus`

1. `pending -> cancelled`
   - stock tăng lại đúng

2. `confirmed -> cancelled`
   - stock tăng lại đúng

3. `cancelled -> confirmed`
   - bị chặn

4. `cancelled -> pending`
   - bị chặn

5. cancel 2 lần
   - không hoàn kho 2 lần

## 11.2 Cho `createOrder`

1. stock đủ
   - tạo order thành công
   - stock giảm đúng

2. stock không đủ
   - không tạo order
   - stock không đổi

3. nhiều item, 1 item fail
   - rollback toàn bộ

---

## 12. Kết luận ngắn gọn cho người mới

Nếu nói rất dễ hiểu thì lỗi hiện tại là:

- code đang “tạo đơn xong mới đi trừ kho”
- và “hủy đơn chỉ đổi chữ status chứ không trả hàng lại kho”

Cho nên:

- kho có thể bị hụt vĩnh viễn khi hủy đơn
- và có thể bán trùng món cuối nếu 2 người mua cùng lúc

Muốn sửa đúng thì phải:

- có state machine cho status
- có logic hoàn kho khi hủy
- có transaction
- có trừ kho atomic

---

## 13. Bước tiếp theo

Sau tài liệu này, bước code hợp lý nhất là:

1. sửa `updateOrderStatus` trước
2. test state machine + hoàn kho
3. sau đó mới sửa `createOrder`
4. test chống oversell
