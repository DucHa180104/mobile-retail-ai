# C4 - Báo cáo hoàn thiện Chatbot RAG

## 1. Bối cảnh ban đầu

Dự án `mobile-retail-ai` ban đầu đã có chatbot AI tư vấn sản phẩm. Chatbot này đã hoạt động theo hướng lấy dữ liệu sản phẩm thật trong MongoDB, phân tích nhu cầu người dùng bằng rule/keyword, lọc và chấm điểm sản phẩm, sau đó đưa danh sách sản phẩm phù hợp vào Gemini để tạo câu trả lời tự nhiên.

Luồng ban đầu:

```text
Người dùng nhập câu hỏi
-> Frontend gửi POST /api/chat
-> Backend phân tích câu hỏi bằng rule/keyword
-> Backend query Product trong MongoDB
-> Backend chấm điểm sản phẩm thủ công
-> Backend đưa sản phẩm phù hợp vào prompt
-> Gemini tạo câu trả lời
-> Frontend hiển thị câu trả lời và sản phẩm gợi ý
```

Điểm mạnh của bản ban đầu:

- Chatbot đã dùng dữ liệu sản phẩm thật của shop.
- Không chỉ gọi Gemini trả lời chung chung.
- Có lọc sản phẩm theo hãng, giá, dung lượng, tình trạng, pin và nhu cầu.
- Có hiển thị sản phẩm gợi ý kèm nút xem chi tiết.
- Có lịch sử chat và fallback cơ bản.

Giới hạn của bản ban đầu:

- Chưa có embedding.
- Chưa có vector search.
- Việc hiểu nhu cầu còn phụ thuộc nhiều vào keyword/rule.
- Nếu người dùng hỏi bằng cách diễn đạt khác, chatbot có thể lọc chưa chính xác.
- Chưa thể gọi là RAG/vector RAG đầy đủ.

## 2. Mục tiêu nâng cấp

Mục tiêu của task C4 là nâng cấp chatbot từ hướng `rule-based + Gemini` lên hướng RAG/semantic search để chatbot hiểu câu hỏi tự nhiên tốt hơn.

Mục tiêu cụ thể:

- Tạo embedding cho dữ liệu sản phẩm.
- Lưu vector đại diện cho ý nghĩa của sản phẩm.
- Khi người dùng hỏi, tạo embedding cho câu hỏi.
- Tìm các sản phẩm gần nghĩa nhất với câu hỏi bằng semantic search.
- Kết hợp semantic search với các bộ lọc cứng như giá, hãng, tồn kho, tình trạng.
- Đưa top sản phẩm phù hợp vào Gemini để tạo câu trả lời.
- Giữ fallback về logic cũ nếu RAG hoặc API lỗi.
- Cập nhật tài liệu để giải thích được khi bảo vệ.

## 3. Kiến trúc RAG sau khi hoàn thiện

Luồng RAG hoàn thiện:

```text
Người dùng nhập câu hỏi
-> React ChatbotWidget gửi message lên /api/chat
-> chatController nhận request
-> aiChatService xử lý câu hỏi
-> Tạo embedding cho câu hỏi người dùng
-> Lọc thô sản phẩm theo dữ liệu có cấu trúc nếu có
-> Semantic search tìm sản phẩm gần nghĩa nhất
-> Rerank sản phẩm theo tồn kho, giá, nhu cầu và độ phù hợp
-> Lấy top 3-6 sản phẩm làm context
-> Đưa context + câu hỏi + lịch sử chat vào Gemini
-> Gemini trả lời bằng tiếng Việt, có giải thích và gợi ý sản phẩm
-> Backend trả reply + suggestedProducts
-> Frontend hiển thị câu trả lời, link sản phẩm và nút xem chi tiết
```

Kiến trúc này giúp chatbot không chỉ khớp từ khóa, mà còn hiểu ý nghĩa gần đúng của câu hỏi.

## 4. Các bước cần làm từ dự án ban đầu

### Bước 1 - Đóng băng chatbot hiện tại

Mục tiêu:

- Giữ lại bản chatbot đang chạy ổn định.
- Tránh việc nâng cấp RAG làm hỏng demo hiện tại.

Cần làm:

- Commit/push bản chatbot hiện tại.
- Test các câu hỏi cơ bản như:
  - "iPhone nào dưới 15 triệu?"
  - "Máy nào pin tốt?"
  - "Máy nào chơi game ổn?"
  - "Máy nào chụp ảnh đẹp?"
- Đảm bảo chatbot vẫn trả sản phẩm gợi ý từ database.

Kết quả đạt được:

- Có bản fallback an toàn.
- Nếu RAG lỗi, vẫn có chatbot cũ để demo.

### Bước 2 - Thiết kế dữ liệu embedding

Mục tiêu:

- Xác định dữ liệu nào của sản phẩm sẽ được đưa vào embedding.

Dữ liệu nên đưa vào embedding:

- Tên sản phẩm.
- Hãng.
- Danh mục.
- Tình trạng máy.
- Dung lượng.
- Màu sắc.
- Giá.
- Pin.
- Tình trạng màn hình.
- Tình trạng ngoại hình.
- Mô tả sản phẩm.
- Nhu cầu phù hợp như học tập, chơi game, chụp ảnh, pin lâu, nhỏ gọn.

Ví dụ search text:

```text
iPhone 12 128GB, hãng Apple, điện thoại cũ đẹp, giá 9.690.000đ,
pin 88%, phù hợp học tập, dùng hằng ngày, chụp ảnh tốt, dung lượng lưu trữ vừa đủ.
```

Kết quả đạt được:

- Có chuẩn dữ liệu đầu vào cho embedding.
- Sản phẩm được biểu diễn bằng một đoạn text giàu ngữ nghĩa.

### Bước 3 - Tạo model hoặc nơi lưu embedding

Mục tiêu:

- Có nơi lưu vector của từng sản phẩm.

Phương án khuyến nghị:

Tạo model riêng:

```text
ProductEmbedding
- product: ObjectId ref Product
- searchText: String
- embedding: [Number]
- embeddingModel: String
- createdAt
- updatedAt
```

Lý do chọn model riêng:

- Không làm Product schema bị nặng.
- Dễ build lại embedding khi cần.
- Dễ tách phần semantic search khỏi logic sản phẩm chính.
- Dễ giải thích khi bảo vệ.

Kết quả đạt được:

- Có collection riêng để lưu dữ liệu vector.
- Code sạch hơn so với nhét trực tiếp vector vào Product.

### Bước 4 - Tạo embedding service

Mục tiêu:

- Tách riêng logic gọi embedding API.

File cần tạo:

```text
backend/services/embeddingService.js
```

Nhiệm vụ của service:

- Nhận text đầu vào.
- Kiểm tra text không rỗng.
- Đọc API key từ biến môi trường.
- Gọi embedding API.
- Trả về mảng vector.
- Throw lỗi rõ ràng nếu API lỗi.

Kết quả đạt được:

- Logic tạo embedding nằm riêng, dễ test.
- `aiChatService.js` không bị phình quá nhiều.
- Sau này có thể đổi provider embedding mà ít ảnh hưởng phần còn lại.

### Bước 5 - Tạo script build embedding cho sản phẩm

Mục tiêu:

- Sinh embedding cho toàn bộ sản phẩm hiện có trong MongoDB.

File cần tạo:

```text
backend/scripts/buildProductEmbeddings.js
```

Luồng script:

```text
Kết nối MongoDB
-> Đọc toàn bộ Product
-> Tạo searchText cho từng product
-> Gọi embeddingService.generateEmbedding(searchText)
-> Lưu hoặc cập nhật ProductEmbedding
-> In kết quả thành công/thất bại
```

Kết quả đạt được:

- Tất cả sản phẩm demo có vector.
- Chatbot có dữ liệu semantic search để truy vấn.
- Có thể chạy lại script khi seed dữ liệu mới.

### Bước 6 - Tạo semantic search service

Mục tiêu:

- Tìm sản phẩm gần nghĩa nhất với câu hỏi của user.

File cần tạo:

```text
backend/services/productSemanticSearchService.js
```

Nhiệm vụ:

- Nhận message của user.
- Nhận filter thô nếu có, ví dụ brand, price, category, condition.
- Tạo embedding cho message.
- Tìm các ProductEmbedding gần nghĩa nhất.
- Populate thông tin Product.
- Trả về danh sách sản phẩm phù hợp.

Nếu dùng MongoDB Atlas Vector Search:

```text
Sử dụng aggregation với $vectorSearch.
```

Nếu làm bản demo local đơn giản:

```text
Tính cosine similarity trong Node.js với dữ liệu nhỏ.
```

Kết quả đạt được:

- Chatbot có khả năng tìm sản phẩm theo ý nghĩa, không chỉ theo keyword.
- Các câu hỏi tự nhiên hơn vẫn tìm được sản phẩm phù hợp.

### Bước 7 - Kết hợp semantic search với filter cũ

Mục tiêu:

- Không bỏ toàn bộ logic cũ, mà nâng cấp thành hybrid search.

Logic mới:

```text
1. Phân tích câu hỏi như hiện tại để lấy filter cứng.
2. Nếu user nói rõ giá/hãng/danh mục/tình trạng thì dùng filter đó.
3. Semantic search chỉ tìm trong nhóm sản phẩm phù hợp với filter.
4. Rerank lại kết quả theo tồn kho, giá và nhu cầu.
5. Lấy top 3-6 sản phẩm đưa vào Gemini.
```

Lý do:

- Nếu user nói "iPhone dưới 15 triệu" thì không nên semantic search ra Samsung.
- Nếu sản phẩm hết hàng thì không nên ưu tiên.
- Nếu user nói rõ ngân sách thì phải tôn trọng ngân sách.

Kết quả đạt được:

- Chatbot thông minh hơn nhưng vẫn kiểm soát được.
- Giảm nguy cơ Gemini tư vấn sai sản phẩm ngoài shop.

### Bước 8 - Sửa aiChatService.js để dùng RAG

Mục tiêu:

- Nối semantic search vào luồng chatbot hiện tại.

File cần sửa:

```text
backend/services/aiChatService.js
```

Logic cần chỉnh:

- Giữ validate message.
- Giữ kiểm tra Gemini API key.
- Giữ phần extract filters hiện tại.
- Thêm bước gọi semantic search.
- Nếu semantic search thành công, dùng kết quả này làm context.
- Nếu semantic search lỗi, fallback về query/scoring cũ.
- Giữ format prompt và format suggestedProducts.

Kết quả đạt được:

- Chatbot dùng RAG nhưng không phá frontend.
- Frontend vẫn gọi `/api/chat` như cũ.
- Nếu RAG lỗi, user vẫn nhận được câu trả lời từ logic cũ.

### Bước 9 - Cập nhật prompt cho Gemini

Mục tiêu:

- Yêu cầu Gemini trả lời dựa trên context sản phẩm thật.

Prompt cần nhấn mạnh:

- Chỉ tư vấn sản phẩm có trong danh sách context.
- Không bịa sản phẩm ngoài shop.
- Nếu chưa đủ thông tin thì hỏi lại user.
- Ưu tiên 2-3 sản phẩm phù hợp nhất.
- Nêu lý do phù hợp theo nhu cầu.
- Trả lời bằng tiếng Việt, có Markdown, dễ đọc.

Kết quả đạt được:

- Câu trả lời gọn hơn.
- Có bullet list, in đậm tên sản phẩm.
- Tránh trả lời lan man hoặc bịa sản phẩm.

### Bước 10 - Cập nhật frontend nếu cần

Mục tiêu:

- Hiển thị kết quả RAG thân thiện hơn.

File có thể sửa:

```text
client/src/components/ChatbotWidget.jsx
```

Có thể thêm:

- Badge "Gợi ý theo dữ liệu shop".
- Nút "Xem chi tiết" rõ hơn.
- Hiển thị 2-3 sản phẩm gợi ý dạng card nhỏ.
- Thông báo thân thiện nếu AI lỗi.
- Giữ lịch sử chat như hiện tại.

Kết quả đạt được:

- User thấy chatbot giống trợ lý mua hàng thật hơn.
- Kết quả không chỉ là đoạn text dài.

### Bước 11 - Thêm fallback an toàn

Mục tiêu:

- RAG lỗi thì chatbot vẫn dùng được.

Các trường hợp cần fallback:

- Embedding API lỗi.
- Gemini API lỗi.
- Vector search không có kết quả.
- Sản phẩm chưa có embedding.
- MongoDB lỗi tạm thời.

Fallback đề xuất:

```text
Nếu semantic search lỗi
-> dùng lại query/scoring cũ trong aiChatService
-> nếu vẫn không có kết quả thì hỏi lại user về ngân sách/hãng/nhu cầu
```

Kết quả đạt được:

- Demo ít rủi ro.
- Chatbot không bị chết toàn bộ chỉ vì RAG lỗi.

### Bước 12 - Viết test và checklist

Mục tiêu:

- Có bằng chứng chatbot hoạt động đúng.

Checklist test tay:

- [ ] Hỏi "iPhone nào dưới 15 triệu?".
- [ ] Hỏi "Máy nào hợp sinh viên pin tốt?".
- [ ] Hỏi "Máy nào chơi game mượt?".
- [ ] Hỏi "Máy nào chụp ảnh đẹp?".
- [ ] Hỏi "Máy nào cho bố mẹ dùng đơn giản?".
- [ ] Hỏi theo sản phẩm đang mở ở trang chi tiết.
- [ ] Tắt/sai API key embedding -> chatbot fallback.
- [ ] Tắt/sai Gemini key -> hiện lỗi thân thiện.
- [ ] Sản phẩm hết hàng không được ưu tiên.
- [ ] Sản phẩm được gợi ý có link xem chi tiết.

Test tự động nếu còn thời gian:

- Test tạo searchText từ Product.
- Test cosine similarity nếu dùng local similarity.
- Test semantic service fallback khi embedding lỗi.
- Test `/api/chat` vẫn trả reply khi semantic search lỗi.

Kết quả đạt được:

- Có checklist rõ để demo và bảo vệ.
- Có cơ sở chứng minh hệ thống hoạt động đúng.

### Bước 13 - Cập nhật tài liệu

Mục tiêu:

- Giải thích đúng và không nói quá.

File cần cập nhật:

```text
docs/tasks/AI_CHATBOT.md
docs/tasks/C4_RAG_UPGRADE_PLAN.md
README.md nếu cần
```

Nội dung cần ghi:

- Chatbot ban đầu hoạt động thế nào.
- RAG được thêm vào ở đâu.
- Embedding lưu ở đâu.
- Semantic search hoạt động ra sao.
- Có fallback như thế nào.
- Những giới hạn còn tồn tại.

Kết quả đạt được:

- Người hướng dẫn đọc vào hiểu được.
- Khi bảo vệ, có tài liệu để dựa vào trả lời.

## 5. Thành quả đạt được nếu hoàn thiện thành công

### 5.1. Chatbot hiểu nhu cầu tự nhiên hơn

Trước khi nâng cấp:

```text
Chatbot phụ thuộc nhiều vào keyword.
```

Sau khi nâng cấp:

```text
Chatbot có thể tìm sản phẩm theo ý nghĩa gần đúng của câu hỏi.
```

Ví dụ:

```text
"Máy nào hợp sinh viên quay TikTok pin ổn?"
```

Hệ thống có thể hiểu rằng user cần:

- Giá hợp lý.
- Pin ổn.
- Camera tốt.
- Phù hợp sinh viên.
- Có khả năng quay video/chụp ảnh.

### 5.2. Chatbot gắn chặt hơn với dữ liệu shop

Chatbot không trả lời theo kiến thức chung của Gemini.

Nó trả lời dựa trên:

- Sản phẩm thật trong MongoDB.
- Tồn kho thật.
- Giá thật.
- Tình trạng máy thật.
- Link chi tiết sản phẩm thật.

### 5.3. Giảm tư vấn sai sản phẩm

Nhờ có context lấy từ database, Gemini bị giới hạn trong danh sách sản phẩm thật.

Điều này giúp giảm rủi ro:

- Bịa sản phẩm shop không bán.
- Nói sai giá.
- Gợi ý sản phẩm hết hàng.
- Tư vấn quá chung chung.

### 5.4. Có kiến trúc dễ mở rộng

Sau khi tách embedding service và semantic search service, hệ thống dễ mở rộng:

- Có thể đổi model embedding.
- Có thể build lại embedding khi seed mới.
- Có thể cập nhật embedding khi admin sửa sản phẩm.
- Có thể thêm semantic search cho trang tìm kiếm sản phẩm.
- Có thể mở rộng sang phụ kiện, máy tính bảng, thu cũ đổi mới.

### 5.5. Có điểm cộng kỹ thuật khi bảo vệ

Nếu hoàn thiện RAG, có thể trình bày các điểm kỹ thuật:

- Retrieval-Augmented Generation.
- Embedding.
- Vector search.
- Hybrid search.
- Fallback.
- Prompt engineering.
- Tích hợp dữ liệu thật từ MongoDB.

Đây là các điểm giúp đồ án trông hiện đại và có chiều sâu hơn.

## 6. Kết quả mong muốn cuối cùng

Khi hoàn thiện thành công, chatbot cần đạt các tiêu chí:

- Người dùng hỏi tự nhiên, chatbot vẫn hiểu đúng nhu cầu.
- Chatbot chỉ tư vấn sản phẩm có trong shop.
- Chatbot ưu tiên sản phẩm còn hàng.
- Chatbot nêu rõ vì sao sản phẩm phù hợp.
- Chatbot có link/nút xem chi tiết sản phẩm.
- Chatbot có fallback khi RAG/Gemini lỗi.
- Admin/người hướng dẫn có thể đọc tài liệu và hiểu luồng xử lý.
- Người làm đồ án có thể giải thích được sự khác nhau giữa keyword search, semantic search và RAG.

## 7. Cách trình bày thành công trong báo cáo

Có thể viết:

```text
Sau khi nâng cấp, chatbot không chỉ dựa vào rule/keyword mà được bổ sung cơ chế retrieval theo ngữ nghĩa. Hệ thống tạo embedding cho dữ liệu sản phẩm, lưu vector để phục vụ semantic search. Khi người dùng nhập câu hỏi, backend tạo embedding cho câu hỏi, tìm các sản phẩm gần nghĩa nhất, kết hợp với bộ lọc có cấu trúc như giá, hãng, tình trạng và tồn kho, sau đó đưa các sản phẩm phù hợp vào Gemini để tạo câu trả lời tư vấn.

Nhờ đó chatbot có thể hiểu các câu hỏi tự nhiên hơn, hạn chế tư vấn sai sản phẩm và gắn chặt hơn với dữ liệu thật của cửa hàng.
```

## 8. Phạm vi nên giữ để không quá rủi ro

Nên làm:

- RAG cho sản phẩm.
- Hybrid search.
- Fallback về logic cũ.
- Docs và checklist test.

Chưa nên làm nếu sát deadline:

- Realtime streaming response.
- Vector search cho toàn bộ lịch sử chat.
- RAG nhiều nguồn tài liệu phức tạp.
- Tự động đánh giá chất lượng câu trả lời bằng AI.
- Làm lại toàn bộ chatbot UI.

## 9. Kết luận

Từ dự án ban đầu, chatbot đã có nền tảng tốt vì đã sử dụng dữ liệu sản phẩm thật trong MongoDB và Gemini API để tư vấn. Việc nâng cấp lên RAG không bắt buộc để chatbot hoạt động, nhưng là hướng phát triển tốt nếu còn thời gian.

Nếu hoàn thiện thành công, thành quả lớn nhất là chatbot sẽ chuyển từ mức "lọc sản phẩm theo rule rồi nhờ AI diễn đạt" sang mức "tìm sản phẩm theo ngữ nghĩa, kết hợp dữ liệu thật và AI để tư vấn thông minh hơn".

Tuy nhiên, cần triển khai theo hướng an toàn:

```text
Không phá chatbot hiện tại.
Thêm RAG như một lớp nâng cấp.
Luôn có fallback.
Test kỹ trước khi đưa vào demo chính.
```

## 10. Trạng thái Triển khai Thực tế & Xử lý sự cố mạng

> [!IMPORTANT]
> **Hiện trạng kỹ thuật của RAG:**
> - Chatbot RAG đã được triển khai hoàn chỉnh ở mức **RAG Demo / Hybrid search in-memory**: Hệ thống sử dụng Gemini API (`gemini-embedding-001`) để tạo vector 768 chiều cho câu hỏi, lưu trữ vector sản phẩm trong bộ sưu tập `ProductEmbedding` của MongoDB, và so khớp độ tương đồng ngữ nghĩa bằng thuật toán **Cosine Similarity chạy trực tiếp trên Backend Node.js** (sau khi đã lọc thô qua điều kiện cứng).
> - Giao diện Frontend và router `/api/chat` được giữ nguyên, giúp giảm rủi ro ảnh hưởng đến luồng chatbot hiện tại.

### Hướng dẫn sửa lỗi kết nối MongoDB Atlas (`MongooseServerSelectionError / EACCES`)
Nếu khi chạy lệnh `npm run build:embeddings` hoặc khởi động Server trên máy cục bộ của bạn mà gặp lỗi kết nối đến cụm Atlas (cổng 27017 bị chặn hoặc lỗi quyền truy cập):
1. **Kiểm tra IP Access List trên MongoDB Atlas:**
   - Truy cập vào trang quản trị MongoDB Atlas.
   - Đi tới mục **Network Access** -> Chọn **IP Access List**.
   - Bấm **Add IP Address** và thêm địa chỉ `0.0.0.0/0` (Cho phép kết nối từ mọi IP - phù hợp cho môi trường đồ án học tập/demo) hoặc bấm **Add Current IP Address** để cấp quyền riêng cho IP mạng nhà bạn.
2. **Kiểm tra tường lửa hoặc proxy mạng:**
   - Một số mạng công ty, trường học hoặc quán cafe chặn cổng gửi ra ngoài `27017` (cổng mặc định của MongoDB). Trong trường hợp này, hãy thử đổi sang mạng khác (ví dụ: phát 4G từ điện thoại) và chạy lại lệnh:
     ```bash
     npm run build:embeddings
     ```
   - Khi chạy lệnh thành công, terminal sẽ in ra số lượng sản phẩm tạo embedding thành công/thất bại. Ví dụ: Thành công: 137/137 nếu toàn bộ sản phẩm được xử lý đầy đủ. Giao diện Chatbot sẽ tự động nhận diện và kích hoạt RAG.

