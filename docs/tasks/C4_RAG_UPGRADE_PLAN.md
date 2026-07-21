# C4 - Kế hoạch nâng cấp Chatbot lên RAG

## 1. Mục tiêu

Tài liệu này ghi lại hiện trạng chatbot AI của dự án `mobile-retail-ai`, các giới hạn hiện tại, lý do không nên nâng cấp vội vàng lên RAG và lộ trình từng bước nếu muốn phát triển chatbot theo hướng RAG/semantic search.

Mục tiêu chính:

- Hiểu rõ chatbot hiện tại đang hoạt động theo kiểu nào.
- Phân biệt chatbot hiện tại với RAG đầy đủ.
- Xác định các vấn đề sẽ gặp khi nâng cấp lên RAG.
- Lập kế hoạch hoàn thiện theo mức độ ưu tiên.
- Giữ được bản demo ổn định, không phá code chatbot đang chạy.

## 2. Hiện trạng chatbot hiện tại

Chatbot hiện tại là chatbot tư vấn sản phẩm dựa trên dữ liệu thật trong MongoDB, kết hợp với Gemini API để tạo câu trả lời tự nhiên.

Luồng hiện tại:

```text
User nhập câu hỏi
-> React ChatbotWidget gửi POST /api/chat
-> Express route nhận request
-> chatController gọi aiChatService
-> aiChatService phân tích câu hỏi bằng rule/keyword
-> aiChatService query Product trong MongoDB bằng Mongoose
-> aiChatService chấm điểm sản phẩm bằng scoring thủ công
-> lấy một số sản phẩm phù hợp nhất
-> đưa danh sách sản phẩm vào prompt
-> Gemini sinh câu trả lời
-> backend trả reply và suggestedProducts
-> frontend hiển thị tin nhắn và nút xem chi tiết sản phẩm
```

Có thể gọi đúng là:

```text
Chatbot tư vấn sản phẩm theo hướng retrieval-augmented đơn giản dựa trên dữ liệu có cấu trúc.
```

Không nên gọi là:

```text
Vector RAG đầy đủ.
```

Lý do: hệ thống chưa có embedding, chưa có vector database và chưa có semantic vector search.

## 3. Chatbot hiện tại đang dùng kỹ thuật gì

### 3.1. Rule-based intent extraction

Backend đọc câu hỏi của user và tìm các dấu hiệu như:

- Hãng máy: iPhone, Samsung, Xiaomi, Oppo.
- Mức giá: dưới 10 triệu, dưới 15 triệu, trên 20 triệu.
- Dung lượng: 64GB, 128GB, 256GB, 512GB.
- Tình trạng: máy mới, cũ đẹp, cũ 99%, cũ dùng tốt.
- Nhu cầu: học tập, chơi game, chụp ảnh, pin lâu, nhỏ gọn, selfie, iOS/Android.

Đây là cách "hiểu nhu cầu" bằng rule/keyword, không phải AI semantic search thật sự.

### 3.2. Structured MongoDB query

Sau khi tách được thông tin, backend tạo query đến MongoDB bằng Mongoose.

Ví dụ:

```text
Nếu user hỏi "iPhone dưới 15 triệu"
-> brand = Apple
-> maxPrice = 15000000
-> query Product với brand và price
```

Đây là truy vấn theo dữ liệu có cấu trúc, giống lọc sản phẩm bình thường.

### 3.3. Rule-based scoring

Sau khi lấy danh sách sản phẩm ứng viên, backend chấm điểm sản phẩm dựa theo rule.

Ví dụ:

- User cần pin lâu -> sản phẩm có batteryPercent cao được cộng điểm.
- User cần chơi game -> máy có giá cao hơn, đời mới hơn, cấu hình tốt hơn được ưu tiên.
- User cần học tập -> máy giá vừa phải, pin ổn, dung lượng hợp lý được ưu tiên.
- User cần chụp ảnh -> iPhone/Samsung và máy đời cao được ưu tiên.

Scoring này giúp chatbot không đưa sản phẩm ngẫu nhiên, nhưng vẫn phụ thuộc vào rule mình viết.

### 3.4. Gemini chỉ sinh câu trả lời

Gemini không tự truy cập database. Gemini chỉ nhận:

- Câu hỏi của user.
- Lịch sử chat gần đây.
- Sản phẩm hiện tại nếu user đang ở trang chi tiết.
- Danh sách sản phẩm backend đã lọc/chấm điểm.

Sau đó Gemini viết câu trả lời bằng tiếng Việt tự nhiên.

## 4. RAG là gì

RAG là viết tắt của Retrieval-Augmented Generation.

Hiểu đơn giản:

```text
AI không tự trả lời bằng kiến thức chung.
Hệ thống lấy dữ liệu liên quan từ database/tài liệu trước.
Sau đó đưa dữ liệu đó vào prompt để AI trả lời dựa trên ngữ cảnh thật.
```

Luồng RAG chuẩn:

```text
User hỏi
-> Tạo embedding/vector cho câu hỏi
-> Tìm dữ liệu gần nghĩa nhất trong vector database
-> Lấy các đoạn/sản phẩm liên quan làm context
-> Đưa context + câu hỏi vào LLM
-> LLM sinh câu trả lời
```

## 5. Vector RAG khác chatbot hiện tại ở đâu

| Tiêu chí | Chatbot hiện tại | Vector RAG |
|---|---|---|
| Có dùng database thật | Có | Có |
| Có đưa dữ liệu vào prompt | Có | Có |
| Có dùng Gemini | Có | Có |
| Có embedding | Chưa | Có |
| Có vector database/search | Chưa | Có |
| Tìm theo keyword/rule | Có | Ít phụ thuộc hơn |
| Tìm theo ý nghĩa gần nhau | Hạn chế | Tốt hơn |
| Độ khó code | Vừa phải | Cao hơn |
| Rủi ro lỗi demo | Thấp hơn | Cao hơn nếu làm vội |

Kết luận: chatbot hiện tại đã có retrieval theo dữ liệu thật, nhưng chưa có semantic retrieval bằng vector.

## 6. Hạn chế của chatbot hiện tại so với RAG

### 6.1. Phụ thuộc vào keyword

Nếu user hỏi bằng từ khác với rule đã viết, chatbot có thể hiểu sai hoặc lọc thiếu.

Ví dụ:

```text
Rule có từ "chơi game"
User hỏi "máy nào cày Liên Quân mượt"
```

Nếu code chưa bắt các từ "cày", "Liên Quân", "mượt" thì scoring có thể không ưu tiên đúng sản phẩm gaming.

### 6.2. Khó hiểu ý nghĩa sâu

Chatbot hiện tại hiểu nhu cầu theo danh sách từ khóa đã lập trình sẵn.

Nó chưa thực sự hiểu các câu gần nghĩa như:

- "đi học cần máy bền pin"
- "máy nào hợp sinh viên quay TikTok"
- "mua cho bố mẹ dùng đơn giản"
- "máy nhỏ gọn chụp ảnh đẹp"

RAG/vector search sẽ mạnh hơn ở nhóm câu hỏi này vì nó tìm theo độ gần nghĩa, không chỉ khớp chữ.

### 6.3. Scoring thủ công khó bảo trì khi sản phẩm tăng

Khi số lượng sản phẩm lớn hơn, rule scoring sẽ ngày càng nhiều.

Nếu thêm nhiều loại sản phẩm như:

- Điện thoại mới.
- Điện thoại cũ.
- Máy tính bảng.
- Phụ kiện.
- Dòng cao cấp.
- Dòng giá rẻ.

Thì scoring thủ công phải được mở rộng dần, nếu không chatbot sẽ ưu tiên chưa chính xác.

### 6.4. Chưa tìm tốt theo mô tả dài

Nếu sản phẩm có mô tả dài, ví dụ:

```text
Màn hình đẹp, camera selfie tốt, pin ổn, phù hợp sinh viên học online.
```

Vector RAG có thể biến mô tả này thành embedding để tìm theo ý nghĩa.

Chatbot hiện tại chủ yếu dựa vào field có cấu trúc và rule đã viết.

### 6.5. Không nên nói quá khi bảo vệ

Nếu nói "em đã làm RAG" mà chưa có embedding/vector database, hội đồng có thể hỏi:

- Embedding lưu ở đâu?
- Vector search dùng công nghệ gì?
- Độ tương đồng tính như thế nào?
- Sản phẩm mới thêm thì cập nhật vector ra sao?

Lúc đó sẽ khó bảo vệ nếu hệ thống thực tế chưa có các phần này.

## 7. Nếu nâng cấp lên RAG cần làm những gì

### 7.1. Chọn dữ liệu đưa vào embedding

Cần gom các thông tin sản phẩm thành một chuỗi search text.

Ví dụ:

```text
Tên: iPhone 12 128GB
Hãng: Apple
Danh mục: Điện thoại
Tình trạng: Cũ đẹp
Giá: 9690000
Pin: 88%
Mô tả: Phù hợp học tập, chụp ảnh, dùng hằng ngày
Thông số: ...
```

Chuỗi này sẽ được đưa vào model embedding.

### 7.2. Tạo embedding cho sản phẩm

Embedding là mảng số biểu diễn ý nghĩa của văn bản.

Ví dụ đơn giản:

```text
"iPhone 12 pin tốt giá rẻ"
-> [0.12, -0.43, 0.88, ...]
```

Hai câu gần nghĩa sẽ có vector gần nhau.

Cần tạo script riêng để:

- Đọc tất cả sản phẩm trong MongoDB.
- Tạo searchText cho từng sản phẩm.
- Gọi embedding API.
- Lưu vector vào DB.

### 7.3. Lưu vector

Có 2 hướng:

#### Hướng A - Lưu trực tiếp trong Product

Thêm field:

```text
embedding: [Number]
embeddingUpdatedAt: Date
```

Ưu điểm:

- Đơn giản.
- Sản phẩm và vector nằm chung một document.

Nhược điểm:

- Product document lớn hơn.
- Nếu vector dài, đọc product có thể nặng hơn.

#### Hướng B - Tạo model ProductEmbedding riêng

Tạo collection riêng:

```text
product: ObjectId ref Product
searchText: String
embedding: [Number]
embeddingModel: String
updatedAt: Date
```

Ưu điểm:

- Sạch hơn.
- Dễ build lại embedding.
- Không làm Product schema bị nặng.

Nhược điểm:

- Thêm model, thêm logic đồng bộ.

Để làm đồ án gọn, nên chọn Hướng B nếu muốn sạch, Hướng A nếu muốn nhanh.

### 7.4. Tạo vector index/search

Nếu dùng MongoDB Atlas Vector Search, cần tạo index cho field embedding.

Sau đó query bằng aggregation `$vectorSearch`.

Nếu không muốn dùng Atlas Vector Search, có thể làm demo đơn giản bằng cosine similarity trong Node.js, nhưng cách này chỉ hợp với dữ liệu nhỏ.

### 7.5. Tạo embedding cho câu hỏi user

Khi user hỏi:

```text
"Em cần máy học tập pin tốt dưới 10 triệu"
```

Backend tạo embedding cho câu hỏi này, sau đó tìm sản phẩm có embedding gần nhất.

### 7.6. Hybrid search

Không nên bỏ hết filter cũ.

Hướng tốt nhất là hybrid:

```text
Lọc cứng:
- category
- brand nếu user nói rõ
- price nếu user nói rõ
- stock > 0
- condition nếu user nói rõ

Sau đó semantic search:
- tìm sản phẩm gần nghĩa nhất trong nhóm đã lọc

Sau đó rerank:
- ưu tiên tồn kho
- ưu tiên giá hợp lý
- ưu tiên sản phẩm phù hợp nhu cầu
```

Đây là hướng rất hợp với đồ án bán lẻ.

### 7.7. Đưa top sản phẩm vào Gemini

Sau khi tìm được 3-6 sản phẩm phù hợp, vẫn đưa vào Gemini như hiện tại.

Gemini vẫn làm nhiệm vụ:

- Giải thích vì sao hợp.
- Viết câu trả lời tiếng Việt.
- Gợi ý sản phẩm.
- Hỏi tiếp nếu user chưa nói rõ nhu cầu.

## 8. File có thể cần tạo/sửa nếu làm RAG

### Backend

File có thể tạo mới:

- `backend/models/ProductEmbedding.js`
- `backend/services/embeddingService.js`
- `backend/services/productSemanticSearchService.js`
- `backend/scripts/buildProductEmbeddings.js`
- `docs/tasks/C4_RAG_UPGRADE_PLAN.md`

File có thể sửa:

- `backend/services/aiChatService.js`
- `backend/models/Product.js` nếu chọn lưu embedding trực tiếp trong Product.
- `backend/.env.example`
- `backend/package.json` nếu thêm script build embedding.

### Frontend

Có thể không cần sửa frontend ở bản đầu.

Nếu muốn hiển thị rõ hơn:

- `client/src/components/ChatbotWidget.jsx`

Có thể thêm:

- Badge "Gợi ý theo dữ liệu shop".
- Thông báo fallback khi semantic search lỗi.
- Hiển thị link sản phẩm rõ hơn.

## 9. Biến môi trường có thể cần thêm

Tùy nhà cung cấp embedding, có thể cần:

```text
EMBEDDING_API_KEY=
EMBEDDING_MODEL=
VECTOR_SEARCH_INDEX=
```

Nếu dùng chung Gemini:

```text
GEMINI_API_KEY=
GEMINI_EMBEDDING_MODEL=
```

Cần kiểm tra model embedding hỗ trợ thực tế trước khi code, vì model/API có thể thay đổi theo thời gian.

## 10. Rủi ro khi làm RAG lúc gần demo

### 10.1. Rủi ro API key/quota

Embedding và Gemini đều phụ thuộc API key.

Nếu key hết quota hoặc lỗi billing, chatbot có thể lỗi.

Cần có fallback về cách tìm sản phẩm hiện tại.

### 10.2. Rủi ro vector index

Nếu dùng MongoDB Atlas Vector Search, cần cấu hình index đúng.

Sai index, sai kích thước vector hoặc sai field sẽ làm search lỗi.

### 10.3. Rủi ro dữ liệu chưa có embedding

Nếu sản phẩm mới thêm chưa được build embedding, semantic search có thể bỏ qua sản phẩm đó.

Cần có quy tắc:

- Build embedding lại sau khi seed.
- Hoặc cập nhật embedding khi admin sửa sản phẩm.
- Hoặc fallback query sản phẩm bình thường.

### 10.4. Rủi ro giải thích khi bảo vệ

RAG là chủ đề nghe hiện đại, nhưng hội đồng có thể hỏi sâu.

Cần nắm:

- Embedding là gì.
- Vector search là gì.
- Khác keyword search ở đâu.
- Vì sao cần hybrid search.
- Khi product thay đổi thì embedding cập nhật ra sao.
- Nếu API lỗi thì fallback thế nào.

### 10.5. Rủi ro phá chatbot đang chạy

Chatbot hiện tại đang có luồng ổn định.

Nếu thay toàn bộ bằng RAG mà lỗi, demo chatbot sẽ mất điểm.

Nên làm theo kiểu thêm lớp mới và giữ fallback.

## 11. Lộ trình thực hiện để an toàn

### Giai đoạn 0 - Đóng băng bản chatbot hiện tại

Mục tiêu:

- Giữ chatbot hiện tại chạy ổn.
- Commit/push bản hiện tại.
- Có demo fallback nếu RAG lỗi.

Cần làm:

- Kiểm tra chatbot trả lời được câu hỏi cơ bản.
- Kiểm tra product cards hiện đúng.
- Kiểm tra lỗi Gemini có thông báo thân thiện.

Kết quả:

- Có một bản chatbot chắc chắn demo được.

### Giai đoạn 1 - Viết docs và thiết kế RAG

Mục tiêu:

- Chưa code nhiều.
- Nắm rõ schema, flow, fallback.

Cần làm:

- Viết tài liệu RAG design.
- Chọn lưu vector trong Product hay ProductEmbedding.
- Chọn embedding provider/model.
- Chọn cách search: Atlas Vector Search hay cosine similarity local.

Kết quả:

- Có thiết kế để bảo vệ được trước khi code.

### Giai đoạn 2 - Tạo embedding service

Mục tiêu:

- Tạo hàm tạo embedding riêng, chưa cần nối chatbot.

Cần làm:

- Tạo `embeddingService.js`.
- Hàm `generateEmbedding(text)`.
- Validate text rỗng.
- Validate API key.
- Xử lý lỗi API.

Kết quả:

- Có thể test tạo vector cho một câu đơn giản.

### Giai đoạn 3 - Build embedding cho sản phẩm

Mục tiêu:

- Mỗi sản phẩm có vector để tìm kiếm.

Cần làm:

- Tạo script build embedding.
- Đọc Product trong MongoDB.
- Tạo `searchText`.
- Gọi embedding API.
- Lưu vào DB.

Kết quả:

- Sản phẩm có dữ liệu semantic search.

### Giai đoạn 4 - Tạo semantic search service

Mục tiêu:

- Tìm sản phẩm gần nghĩa với câu hỏi user.

Cần làm:

- Tạo `productSemanticSearchService.js`.
- Input: message + filters.
- Output: danh sách product phù hợp.
- Nếu vector search lỗi thì fallback về query/scoring hiện tại.

Kết quả:

- Có hàm tìm sản phẩm bằng semantic search.

### Giai đoạn 5 - Nối vào aiChatService

Mục tiêu:

- Chatbot dùng semantic results làm context cho Gemini.

Cần làm:

- Sửa `aiChatService.js`.
- Giữ lại logic parse filter cũ.
- Gọi semantic search sau khi lọc thô.
- Lấy top 3-6 sản phẩm.
- Đưa vào prompt như hiện tại.

Kết quả:

- User hỏi tự nhiên hơn, chatbot vẫn gợi ý đúng sản phẩm.

### Giai đoạn 6 - Fallback và test

Mục tiêu:

- Nếu RAG lỗi, chatbot không chết.

Cần làm:

- Nếu embedding API lỗi -> dùng query/scoring cũ.
- Nếu vector search không có kết quả -> hỏi lại user hoặc dùng sản phẩm bán chạy.
- Viết checklist test.
- Có thể viết test tự động cho service nếu kịp.

Kết quả:

- Demo an toàn hơn.

### Giai đoạn 7 - Cập nhật docs và báo cáo

Mục tiêu:

- Trình bày đúng mức, không nói quá.

Cần làm:

- Cập nhật `AI_CHATBOT.md`.
- Thêm mục "Hướng nâng cấp RAG".
- Nếu đã làm RAG thật, ghi rõ:
  - Embedding model.
  - Vector storage.
  - Vector search flow.
  - Fallback.

Kết quả:

- Bảo vệ dễ nói và không bị hỏi lung tung.

## 12. Ước lượng thời gian

### Bản prototype

Thời gian: vài giờ đến 1 ngày.

Làm được:

- Tạo embedding.
- Search thử.
- Nối vào chatbot ở mức cơ bản.

Chưa chắc:

- Fallback tốt.
- Test tốt.
- Giải thích tốt.

### Bản demo ổn định

Thời gian: 3-5 ngày.

Làm được:

- Embedding service.
- Build embedding script.
- Semantic search.
- Hybrid filter.
- Fallback về logic cũ.
- Docs và checklist test.

Phù hợp nếu:

- Còn trên 10 ngày.
- Các lỗi demo chính đã ổn.
- Có thời gian học để bảo vệ.

### Bản hoàn chỉnh hơn

Thời gian: 7-10 ngày hoặc hơn.

Làm được:

- Tự động cập nhật embedding khi admin sửa sản phẩm.
- Vector index chuẩn.
- Admin quản lý chat/search quality.
- Test tự động nhiều hơn.

Không nên làm sát deadline.

## 13. Nên làm hay không trong tình trạng hiện tại

Nếu mục tiêu là bảo vệ ổn định, nên ưu tiên:

1. App chạy local ổn.
2. Ảnh sản phẩm không vỡ.
3. Checkout/order/admin không lỗi.
4. Chatbot hiện tại trả lời tốt.
5. README và báo cáo rõ ràng.
6. Video demo backup.

Chỉ nên làm RAG nếu các mục trên đã ổn.

Khuyến nghị:

```text
Giữ chatbot hiện tại làm bản chính.
Nếu còn thời gian, làm RAG như một branch/tính năng mở rộng.
Luôn giữ fallback về logic chatbot cũ.
```

## 14. Cách trình bày với người hướng dẫn

Có thể nói:

```text
Chatbot hiện tại của em chưa phải vector RAG đầy đủ. Hệ thống đang truy vấn dữ liệu sản phẩm thật trong MongoDB, lọc và chấm điểm sản phẩm theo nhu cầu người dùng, sau đó đưa danh sách sản phẩm phù hợp vào Gemini để tạo câu trả lời tư vấn.

Hướng phát triển tiếp theo là nâng cấp sang RAG/semantic search: tạo embedding cho sản phẩm, lưu vector, khi người dùng hỏi thì tìm sản phẩm gần nghĩa nhất rồi đưa vào Gemini trả lời. Cách này giúp chatbot hiểu câu hỏi tự nhiên hơn, nhưng cần thêm thời gian để làm embedding, vector search, fallback và test.

Trong thời gian hiện tại, em sẽ ưu tiên giữ bản chatbot ổn định để demo, đồng thời ghi RAG là hướng mở rộng hoặc làm bản demo riêng nếu còn thời gian.
```

## 15. Checklist nếu quyết định làm RAG

- [ ] Chatbot hiện tại đã được commit/push làm bản fallback.
- [ ] Đã chọn cách lưu vector: Product hay ProductEmbedding.
- [ ] Đã chọn embedding model.
- [ ] Đã tạo embedding service.
- [ ] Đã tạo script build embedding cho sản phẩm.
- [ ] Đã build embedding cho dữ liệu demo.
- [ ] Đã tạo semantic search service.
- [ ] Đã nối semantic search vào aiChatService.
- [ ] Đã giữ fallback về query/scoring cũ.
- [ ] Đã test câu hỏi: "máy nào hợp sinh viên pin tốt".
- [ ] Đã test câu hỏi: "máy nào chụp ảnh đẹp dưới 15 triệu".
- [ ] Đã test câu hỏi: "máy nào chơi game mượt".
- [ ] Đã test khi API embedding lỗi.
- [ ] Đã test khi Gemini lỗi.
- [ ] Đã cập nhật docs chatbot.
- [ ] Đã chuẩn bị cách giải thích embedding/vector search khi bảo vệ.

## 16. Kết luận

Chatbot hiện tại không bị yếu nếu trình bày đúng. Điểm mạnh là đã gắn với dữ liệu sản phẩm thật của shop, có lọc, scoring, prompt và gợi ý sản phẩm cụ thể.

RAG là hướng nâng cấp tốt nhưng không bắt buộc nếu thời gian gần demo. Nếu làm, nên làm theo hướng hybrid và giữ fallback để không phá chatbot hiện tại.

Ưu tiên cuối cùng:

```text
Ổn định demo trước.
RAG là điểm cộng sau.
Không đánh đổi một chatbot đang chạy ổn lấy một RAG làm vội và khó bảo vệ.
```
