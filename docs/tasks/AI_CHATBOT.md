# AI Chatbot

- **Trạng thái:** IN PROGRESS
- **Cập nhật lần cuối:** 2026-06-19

## Mục tiêu

- Xây chatbot tư vấn dùng Gemini API.
- Trả lời dựa trên dữ liệu sản phẩm thật trong MongoDB.
- Hiển thị câu trả lời dễ đọc hơn bằng Markdown.
- Gắn chatbot chặt hơn với luồng xem sản phẩm của shop.

## File đã tạo

- `backend/controllers/chatController.js`
- `backend/routes/chatRoutes.js`
- `backend/services/aiChatService.js`
- `client/src/pages/ChatbotPage.jsx`
- `client/src/components/ChatbotWidget.jsx`

## File đã sửa

- `backend/server.js`
- `backend/.env.example`
- `client/src/App.jsx`
- `client/src/layouts/MainLayout.jsx`
- `client/package.json`
- `client/package-lock.json`

## Nội dung đã làm

### Refactor nhẹ `aiChatService.js`

- Đã tách rõ 4 tầng xử lý trong backend:
  - phân tích ý định người dùng
  - lọc ứng viên sản phẩm
  - chấm điểm ứng viên
  - gọi Gemini để sinh câu trả lời
- Đã tách thêm các hàm nhỏ để dễ đọc hơn:
  - `extractSemanticNeeds()`
  - `extractStructuredFilters()`
  - `extractPriceFilters()`
  - `buildProductQuery()`
  - `fetchCandidateProducts()`
  - `rankCandidateProducts()`
  - `mergeCurrentProductIfNeeded()`
  - `buildHistorySummary()`
  - `buildCurrentProductSummary()`
  - `buildProductSummary()`
  - `callGemini()`
  - `extractGeminiReply()`
- Mục tiêu của lần refactor này là làm luồng hybrid rõ hơn nhưng không đổi nghiệp vụ chat hiện có.

### Nền tảng ban đầu

- Frontend có widget chatbot nổi ở góc dưới phải.
- Frontend gọi `POST /api/chat`.
- Backend nhận `message` và gọi Gemini API.
- Đã cấu hình model Gemini đang dùng.

### Mức 1 - Hiểu nhu cầu tốt hơn

- Đọc câu hỏi để nhận diện:
  - hãng
  - tình trạng
  - dung lượng
  - khoảng giá
  - pin
  - ngoại hình
  - màn hình
  - Face ID / Touch ID
  - camera
  - chơi game
  - học sinh / sinh viên
- Query `Product` từ MongoDB.
- Chấm điểm sản phẩm để ưu tiên máy phù hợp nhất.

### Mức 1 mở rộng - Hiểu sâu hơn nhu cầu sử dụng

- Đã bổ sung nhận diện thêm:
  - học tập
  - chụp ảnh
  - chơi game
  - pin lâu
  - ưu tiên nhỏ gọn
  - ưu tiên camera selfie
  - ưu tiên iOS
  - ưu tiên Android
- Cách chấm điểm hiện tại:
  - `học tập`: ưu tiên pin ổn, giá hợp lý, dung lượng đủ dùng
  - `chụp ảnh`: ưu tiên text camera tốt, có mô tả quay/chụp
  - `camera selfie`: ưu tiên text có dấu hiệu camera trước / TrueDepth / chân dung
  - `nhỏ gọn`: ưu tiên máy có tên kiểu `mini`, `SE` hoặc màn hình nhỏ hơn
  - `iOS`: ưu tiên `brand = Apple`
  - `Android`: ưu tiên các brand không phải Apple

### Mức 2 - Trả lời gọn và đúng trọng tâm hơn

- Chỉ gợi ý tối đa 3 máy nổi bật.
- Mỗi máy là một mục riêng.
- Có lý do ngắn gọn vì sao máy đó phù hợp.

### Mức 3 - UX và fallback tốt hơn

- Lỗi Gemini được đổi sang thông báo thân thiện hơn.
- Có loading skeleton.
- Có gợi ý câu hỏi mẫu.
- Có nút `Thử lại`.
- Có auto scroll xuống tin nhắn mới nhất.
- Lưu lịch sử chat và câu hỏi gần đây vào `localStorage`.

### Mức 4 - Gắn chặt với trang sản phẩm

- Backend trả thêm `suggestedProducts` cùng với `reply`.
- Widget hiển thị card sản phẩm ngay dưới câu trả lời của bot.
- Mỗi card có nút `Xem chi tiết` dẫn tới `/products/:id`.

### Mức 4 mở rộng - Hiểu ngữ cảnh trang hiện tại và lịch sử chat

- Frontend gửi thêm:
  - `history`
  - `currentProductId`
  - `currentPath`
- Nếu user đang đứng ở `/products/:id`, backend sẽ query sản phẩm hiện tại để dùng làm ngữ cảnh ưu tiên.
- Bot đã có thể hiểu tốt hơn các câu như:
  - `máy này pin thế nào`
  - `con này có đáng mua không`
  - `vậy còn máy vừa nói ở trên thì sao`
- Prompt backend đã được nới bớt độ gò bó:
  - vẫn ưu tiên dữ liệu thật của shop
  - nhưng trả lời tự nhiên hơn
  - có thể giải thích sâu hơn theo mạch hội thoại
  - có thể trả lời kiến thức chung liên quan đến điện thoại nếu phù hợp

### Cải thiện hiển thị Markdown

- Prompt backend đã yêu cầu Gemini trả lời bằng Markdown đơn giản.
- Câu trả lời có thể có:
  - xuống dòng
  - bullet list
  - tiêu đề ngắn
  - chữ đậm cho tên sản phẩm
- Frontend dùng `react-markdown` để render Markdown an toàn.
- Không dùng `dangerouslySetInnerHTML`.
- User message vẫn hiển thị như text bình thường.

## Luồng dữ liệu hiện tại

User nhập câu hỏi  
→ React lưu message user  
→ React gọi `POST /api/chat`  
→ `chatController` nhận:
- `message`
- `history`
- `currentProductId`
- `currentPath`

→ `aiChatService` phân tích nhu cầu  
→ `aiChatService` đọc lịch sử hội thoại gần nhất  
→ `aiChatService` đọc sản phẩm hiện tại nếu user đang ở trang chi tiết  
→ `aiChatService` query `Product` phù hợp  
→ `aiChatService` build prompt Markdown + gọi Gemini  
→ `aiChatService` trả về:
- `reply`
- `suggestedProducts`

→ `chatController` trả JSON cho frontend  
→ `ChatbotWidget` render:
- câu trả lời Markdown
- card sản phẩm
- nút `Xem chi tiết`

## Manual Test Checklist

- [x] Mở widget chatbot ở góc dưới phải
- [x] Gửi câu `Xin chào`
- [ ] Hỏi `iPhone nào dưới 15 triệu`
- [ ] Đứng ở trang `/products/:id` và hỏi `máy này pin thế nào`
- [ ] Đứng ở trang `/products/:id` và hỏi `máy này có đáng mua không`
- [ ] Hỏi `máy nhỏ gọn dễ bỏ túi có gì`
- [ ] Hỏi `máy học tập cho sinh viên`
- [ ] Hỏi `máy selfie đẹp`
- [ ] Hỏi `máy Android pin lâu`
- [ ] Hỏi tiếp nhiều lượt để kiểm tra bot có bám lịch sử chat tốt hơn
- [ ] Kiểm tra AI trả lời có xuống dòng rõ ràng
- [ ] Kiểm tra AI trả lời có bullet list
- [ ] Kiểm tra tên sản phẩm được in đậm
- [ ] Kiểm tra chat bubble không bị tràn ngang
- [ ] Kiểm tra card sản phẩm hiển thị dưới câu trả lời
- [ ] Kiểm tra bấm `Xem chi tiết` đi tới đúng `/products/:id`
- [ ] Reload trang, lịch sử chat vẫn còn
- [ ] Đóng / mở widget, lịch sử chat vẫn còn
- [ ] Khi Gemini lỗi quota, giao diện vẫn hiện thông báo thân thiện

## Vấn đề còn tồn tại

- Vẫn phụ thuộc vào quota và độ ổn định của Gemini.
- Chưa có fallback sang model khác khi Gemini lỗi.
- Chưa có lịch sử chat lưu vào MongoDB.
- Một số nhu cầu như `camera selfie`, `nhỏ gọn`, `Android/iOS` hiện vẫn là heuristic theo dữ liệu sẵn có, vì schema Product chưa có field riêng cho:
  - hệ điều hành
  - camera trước
  - kích thước máy
- Chưa có nút thêm nhanh vào giỏ từ chatbot.

## Ghi chú phục vụ bảo vệ đồ án

- `chatController.js` nhận request và trả JSON cho frontend.
- `aiChatService.js` xử lý chính:
  - đọc câu hỏi
  - đọc lịch sử chat
  - đọc sản phẩm hiện tại
  - lọc sản phẩm
  - chấm điểm theo nhu cầu
  - build prompt
  - gọi Gemini
  - format câu trả lời
  - format danh sách sản phẩm gợi ý
- `ChatbotWidget.jsx` xử lý trải nghiệm người dùng:
  - state tin nhắn
  - loading
  - lỗi
  - retry
  - suggested questions
  - lịch sử chat
  - render Markdown
  - card sản phẩm và link chi tiết
