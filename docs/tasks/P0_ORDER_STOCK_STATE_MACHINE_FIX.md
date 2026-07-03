# P0 - Sửa tồn kho đơn hàng và state machine

## Task Name

P0 - Order stock rollback + state machine

## Status

DONE

## Last Updated

2026-07-03

## Mục tiêu

- Hủy đơn phải hoàn kho
- Không cho revive đơn đã hủy
- Tạo đơn không được trừ kho rời rạc như trước
- Nếu một sản phẩm không đủ kho thì rollback toàn bộ đơn

---

## Các file đã sửa

- [backend/controllers/orderController.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/controllers/orderController.js)
- [backend/routes/orderRoutes.priceTampering.test.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/routes/orderRoutes.priceTampering.test.js)
- [backend/routes/orderRoutes.stockStateMachine.test.js](/C:/Users/Admin/Desktop/mobile-retail-ai/backend/routes/orderRoutes.stockStateMachine.test.js)

## Tài liệu liên quan

- [P0_ORDER_STOCK_STATE_MACHINE_ANALYSIS.md](/C:/Users/Admin/Desktop/mobile-retail-ai/docs/tasks/P0_ORDER_STOCK_STATE_MACHINE_ANALYSIS.md)

---

## Logic cũ

### Tạo đơn

- Kiểm tra stock trước
- Tạo order trước
- Sau đó mới lặp qua từng item để trừ kho

Rủi ro:

- Có khoảng hở giữa lúc check stock và lúc trừ stock
- Dễ oversell
- Nếu trừ kho dở dang thì order vẫn có thể đã tạo

### Cập nhật trạng thái đơn

- Chỉ update field `status`
- Không hoàn kho khi `cancelled`
- Không có state machine kiểm soát chuyển trạng thái

Rủi ro:

- Hủy đơn xong mất kho vĩnh viễn
- Có thể chuyển `cancelled -> confirmed`

---

## Logic mới

### Tạo đơn

- Dùng `mongoose.startSession()`
- Chạy `withTransaction(...)`
- Với mỗi item:
  - load product
  - trừ kho bằng `findOneAndUpdate` có điều kiện `stock >= quantity`
- Nếu một item fail:
  - throw lỗi
  - rollback toàn bộ transaction
- Chỉ khi transaction thành công mới có order thật trong DB

### Cập nhật trạng thái đơn

- Dùng transaction
- Đọc order hiện tại trước
- Kiểm tra state machine:
  - `pending -> confirmed`
  - `pending -> cancelled`
  - `confirmed -> cancelled`
  - `cancelled -> không đi đâu nữa`
- Nếu sang `cancelled`:
  - cộng lại kho theo `order.items`

---

## Manual Test Checklist

- [ ] Tạo order với sản phẩm đủ kho -> thành công
- [ ] Sau khi tạo order, stock giảm đúng
- [ ] Hủy order `pending` -> stock tăng lại đúng
- [ ] Hủy order `confirmed` -> stock tăng lại đúng
- [ ] Order đã `cancelled` không đổi lại `confirmed`
- [ ] Order đã `cancelled` không đổi lại `pending`
- [ ] Tạo đơn có 2 sản phẩm, 1 sản phẩm hết hàng -> toàn bộ order fail
- [ ] Khi fail, các sản phẩm khác không bị trừ kho dở dang

---

## Test tự động đã thêm

### `orderRoutes.priceTampering.test.js`

- Đổi sang `MongoMemoryReplSet` để hỗ trợ transaction

### `orderRoutes.stockStateMachine.test.js`

Đã có các case:

- Hủy đơn `pending` hoàn kho đúng
- Chặn `cancelled -> confirmed`
- Nếu một sản phẩm không đủ kho thì rollback toàn bộ order

---

## Kết quả đạt được

- Đã chặn được lỗi mất kho khi hủy đơn
- Đã thêm state machine cơ bản cho order
- Đã tránh được kiểu tạo order xong mới trừ kho rời rạc
- Đã có test chứng minh luồng mới

---

## Vấn đề còn tồn tại

- Chưa có test mô phỏng 2 request đồng thời thật sự
- Chưa mở rộng thêm trạng thái giao hàng như `shipping`, `completed`
- Message lỗi hiện vẫn là tiếng Anh/không dấu ở một số đoạn để tránh lệch encoding terminal

---

## Ghi chú phục vụ bảo vệ đồ án

- Điểm quan trọng để trình bày:
  - trước đây hệ thống check stock và trừ stock tách rời, nên có race condition
  - sau khi sửa, đã dùng transaction + stock update có điều kiện
  - khi hủy đơn, hệ thống hoàn kho lại đúng số lượng
  - order status giờ có state machine cơ bản để tránh chuyển trạng thái vô lý
