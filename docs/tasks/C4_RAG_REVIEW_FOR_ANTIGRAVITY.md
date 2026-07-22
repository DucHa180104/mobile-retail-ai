# C4 - Báo cáo rà soát Chatbot RAG gửi Antigravity

## 1. Mục đích báo cáo

Tài liệu này ghi lại kết quả kiểm tra phần Chatbot RAG vừa được triển khai trong dự án `mobile-retail-ai`.

Mục tiêu:

- Xác định phần nào đã làm đúng.
- Chỉ rõ phần nào chưa đạt hoặc cần diễn đạt lại cho chính xác.
- Ghi lại lỗi thực tế khi chạy trên máy local.
- Đưa ra checklist việc cần làm tiếp để hoàn thiện trước khi commit/push chính thức.

## 2. Kết luận nhanh

Phần RAG đã được triển khai **đúng hướng cho một bản demo đồ án**.

Hiện tại hệ thống đã có:

- Model lưu vector sản phẩm.
- Service gọi Gemini Embedding API.
- Service semantic search bằng cosine similarity.
- Script build embedding cho toàn bộ sản phẩm.
- NPM script để chạy build embedding.
- Kết nối RAG vào `aiChatService.js`.
- Fallback về logic chatbot cũ khi semantic search lỗi hoặc không có kết quả.
- Unit test riêng cho semantic search service.

Tuy nhiên, chưa nên gọi là:

```text
100% hoàn hảo
Production-ready tuyệt đối
Đã chắc chắn build 137/137 embedding thành công trên mọi môi trường
```

Lý do: trên máy local hiện tại, lệnh `npm run build:embeddings` vẫn gặp lỗi kết nối MongoDB Atlas (`MongooseServerSelectionError / connect EACCES`). Vì vậy, trạng thái chính xác nên là:

```text
RAG demo đã được triển khai ở mức code và test service.
Việc build embedding thực tế cần chạy lại khi MongoDB Atlas cho phép kết nối từ máy local.
```

## 3. Những phần đã làm đúng

### 3.1. Đã tạo model lưu embedding sản phẩm

File:

```text
backend/models/ProductEmbedding.js
```

Vai trò:

- Lưu vector embedding của từng sản phẩm.
- Mỗi document liên kết với một `Product`.
- Có field `searchText` để lưu đoạn mô tả đã dùng tạo embedding.
- Có field `embedding` là mảng số.
- Có field `embeddingModel` để biết vector được tạo bằng model nào.

Đánh giá:

- Cách tách model riêng là hợp lý.
- Không làm `Product.js` bị nặng.
- Dễ build lại vector khi cần.
- Dễ giải thích khi bảo vệ.

### 3.2. Đã tạo service gọi Gemini Embedding

File:

```text
backend/services/embeddingService.js
```

Vai trò:

- Nhận text đầu vào.
- Kiểm tra text không được rỗng.
- Đọc `GEMINI_API_KEY` từ biến môi trường.
- Gọi Gemini endpoint `embedContent`.
- Lấy mảng vector từ `data.embedding.values`.
- Throw lỗi rõ ràng nếu API lỗi.

Đánh giá:

- Tách riêng embedding service là đúng.
- Không nhét logic gọi embedding trực tiếp vào `aiChatService.js`.
- Dễ mock khi viết test.

### 3.3. Đã tạo semantic search service

File:

```text
backend/services/productSemanticSearchService.js
```

Vai trò:

- Tạo vector cho câu hỏi của user.
- Lấy danh sách vector sản phẩm từ `ProductEmbedding`.
- Populate thông tin product.
- Lọc sản phẩm còn hàng.
- Lọc theo brand/category/price/condition nếu có.
- Tính cosine similarity giữa vector câu hỏi và vector sản phẩm.
- Sắp xếp sản phẩm theo điểm similarity.
- Trả về top sản phẩm phù hợp.

Đánh giá:

- Đây là semantic search thật ở mức demo.
- Cách tính cosine similarity trong backend Node.js phù hợp với dữ liệu nhỏ/vừa.
- Chưa phải MongoDB Atlas Vector Search production.

### 3.4. Đã nối RAG vào chatbot hiện tại

File:

```text
backend/services/aiChatService.js
```

Luồng mới:

```text
User hỏi
-> extract filters như cũ
-> thử gọi searchSemanticProducts
-> nếu có kết quả semantic search thì dùng kết quả đó
-> nếu lỗi hoặc không có kết quả thì fallback về findRelevantProducts cũ
-> build prompt
-> gọi Gemini sinh câu trả lời
```

Đánh giá:

- Cách nối này an toàn.
- Không phá route `/api/chat`.
- Không cần sửa frontend.
- Logic cũ vẫn còn để fallback.

### 3.5. Đã tự đồng bộ vector khi admin thêm/sửa/xóa sản phẩm

File:

```text
backend/controllers/productController.js
```

Luồng đã thêm:

- Khi tạo sản phẩm mới: gọi `syncProductEmbedding(product)`.
- Khi cập nhật sản phẩm: gọi `syncProductEmbedding(product)`.
- Khi xóa sản phẩm: gọi `removeProductEmbedding(productId)`.

Đánh giá:

- Đây là điểm tốt vì không chỉ build embedding một lần.
- Khi admin cập nhật sản phẩm, vector cũng được cập nhật theo.

Điểm cần chú ý:

- Hiện sync đang chạy background, không `await`.
- Nếu embedding API lỗi, sản phẩm vẫn tạo/sửa thành công.
- Cách này phù hợp demo vì không để lỗi AI làm hỏng CRUD sản phẩm.
- Nhưng cần ghi rõ trong tài liệu: vector sync thất bại thì log lỗi, không rollback product.

### 3.6. Đã thêm script build embedding

File:

```text
backend/scripts/buildProductEmbeddings.js
```

Vai trò:

- Kết nối MongoDB.
- Đọc toàn bộ Product.
- Tạo `searchText` cho từng sản phẩm.
- Gọi `generateEmbedding`.
- Lưu/cập nhật `ProductEmbedding`.
- In số lượng thành công/thất bại.

Đánh giá:

- Đây là script cần thiết để nạp vector cho dữ liệu seed hiện có.
- Phù hợp để chạy sau khi seed sản phẩm.

### 3.7. Đã thêm npm scripts

File:

```text
backend/package.json
```

Script đã thêm:

```json
"build:embeddings": "node scripts/buildProductEmbeddings.js",
"seed:embeddings": "node scripts/buildProductEmbeddings.js"
```

Đánh giá:

- Giúp người dùng chạy nhanh hơn.
- Nên ghi rõ trong README/docs cách dùng:

```bash
cd backend
npm run build:embeddings
```

### 3.8. Đã có unit test cho semantic search

File:

```text
backend/services/productSemanticSearchService.test.js
```

Kết quả kiểm tra:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
```

Đánh giá:

- Test chứng minh service có thể xử lý message rỗng.
- Test chứng minh service có thể mock embedding, lọc stock, lọc brand và trả kết quả phù hợp.

## 4. Những phần chưa đạt hoặc cần chỉnh lại

### 4.1. Không nên gọi là production-ready tuyệt đối

Vấn đề:

Trong phần mô tả có các cụm như:

```text
100% hoàn hảo
Production-ready
An toàn tuyệt đối
Đã sẵn sàng đạt điểm tối đa
```

Các cụm này không nên dùng trong báo cáo kỹ thuật.

Lý do:

- Hệ thống hiện tại chưa dùng Atlas Vector Search.
- Chưa có test integration thật với MongoDB + Gemini.
- Chưa xác nhận build embedding thành công trên máy local.
- Chưa có cơ chế retry/rate-limit nghiêm túc cho embedding build.
- Chưa có kiểm soát chi phí/quota API.

Cách diễn đạt nên dùng:

```text
Hệ thống đã hoàn thiện ở mức RAG demo/hybrid semantic search, phù hợp với phạm vi đồ án. Với quy mô sản phẩm nhỏ/vừa, hệ thống sử dụng cosine similarity in-memory để giảm độ phức tạp triển khai. Nếu mở rộng production, có thể chuyển sang MongoDB Atlas Vector Search hoặc vector database chuyên dụng.
```

### 4.2. Lệnh build embedding chưa chạy thành công trên máy local hiện tại

Lệnh đã thử:

```bash
cd backend
npm run build:embeddings
```

Kết quả thực tế trên máy local:

```text
MongooseServerSelectionError
Could not connect to any servers in your MongoDB Atlas cluster
connect EACCES ...:27017
```

Ý nghĩa:

- Code script có thể đúng.
- Nhưng máy local hiện tại chưa kết nối được MongoDB Atlas.
- Nguyên nhân có thể là IP whitelist, firewall, proxy hoặc mạng chặn cổng `27017`.

Vì vậy, không nên khẳng định chắc chắn từ máy local rằng:

```text
137/137 sản phẩm đã build embedding thành công.
```

Nên ghi:

```text
Script build embedding đã sẵn sàng. Cần chạy lại khi kết nối MongoDB Atlas ổn định để xác nhận số lượng sản phẩm được build vector thành công.
```

### 4.3. Đây là in-memory cosine similarity, chưa phải Atlas Vector Search

Hiện tại semantic search đang làm:

```text
ProductEmbedding.find()
-> populate product
-> lọc bằng JavaScript
-> tính cosine similarity bằng vòng for trong Node.js
-> sort trong memory
```

Điều này phù hợp với demo.

Nhưng chưa phải:

```text
MongoDB Atlas $vectorSearch
Pinecone
Qdrant
Weaviate
FAISS
```

Cách trình bày đúng:

```text
Hệ thống dùng semantic search bằng embedding và cosine similarity in-memory. Đây là hướng RAG demo phù hợp với dữ liệu nhỏ/vừa. Khi sản phẩm tăng lớn, có thể chuyển sang MongoDB Atlas Vector Search để tối ưu hiệu năng.
```

### 4.4. Search service đang lấy toàn bộ embedding

Đoạn logic hiện tại:

```text
ProductEmbedding.find().populate("product").lean()
```

Vấn đề:

- Với vài trăm sản phẩm thì ổn.
- Với hàng chục nghìn sản phẩm thì sẽ nặng.
- Mỗi lần user hỏi đều load toàn bộ embedding lên RAM.

Cách cải thiện sau:

- Dùng Atlas Vector Search.
- Hoặc lọc trước bằng query MongoDB tốt hơn.
- Hoặc cache embedding trong memory nếu chỉ demo local.
- Hoặc giới hạn theo category/brand trước khi tính similarity.

### 4.5. Test hiện tại còn hơi mỏng

Test hiện tại pass, nhưng mới kiểm tra 2 case.

Nên bổ sung thêm các case:

- Khi `generateEmbedding` throw lỗi.
- Khi không có embedding nào trong DB.
- Khi filter `maxPrice` hoạt động.
- Khi filter `condition` hoạt động.
- Khi vector không cùng chiều thì similarity = 0.
- Khi sản phẩm hết hàng thì bị loại.

### 4.6. Chưa có test integration cho `/api/chat`

Hiện mới test service semantic search.

Nên thêm test hoặc checklist cho luồng:

```text
POST /api/chat
-> gọi semantic search
-> nếu semantic search lỗi thì fallback
-> vẫn trả reply
```

Test integration này sẽ chứng minh RAG không phá chatbot cũ.

### 4.7. Cần cập nhật README hoặc docs hướng dẫn chạy

Hiện cần có hướng dẫn rõ:

```bash
cd backend
npm run seed
npm run build:embeddings
npm run dev
```

Cần ghi thêm điều kiện:

- `.env` phải có `MONGODB_URI`.
- `.env` phải có `GEMINI_API_KEY`.
- MongoDB Atlas phải cho phép IP hiện tại.
- Nếu dùng mạng bị chặn cổng `27017`, cần đổi mạng.

### 4.8. Ghi chú về `0.0.0.0/0` cần cẩn thận

Trong docs có gợi ý thêm `0.0.0.0/0` vào MongoDB Atlas.

Cách này tiện cho demo nhưng không nên gọi là an toàn production.

Nên ghi rõ:

```text
Trong môi trường demo/học tập có thể dùng 0.0.0.0/0 để tránh lỗi đổi IP. Trong môi trường thật nên whitelist IP cụ thể hoặc dùng server deploy cố định.
```

## 5. Checklist việc cần làm tiếp

### 5.1. Chỉnh lại ngôn từ trong docs

- [ ] Thay "100% hoàn hảo" bằng "hoàn thiện ở mức demo đồ án".
- [ ] Thay "production-ready" bằng "sẵn sàng demo".
- [ ] Thay "an toàn tuyệt đối" bằng "có fallback để giảm rủi ro".
- [ ] Ghi rõ đây là "Hybrid Vector RAG in-memory".
- [ ] Ghi rõ chưa dùng MongoDB Atlas `$vectorSearch`.

### 5.2. Xác nhận build embedding

- [ ] Kiểm tra MongoDB Atlas Network Access.
- [ ] Thêm IP hiện tại hoặc dùng `0.0.0.0/0` cho demo.
- [ ] Thử mạng khác nếu cổng `27017` bị chặn.
- [ ] Chạy:
  ```bash
  cd backend
  npm run build:embeddings
  ```
- [ ] Chụp/log lại kết quả thành công.
- [ ] Kiểm tra collection `productembeddings` trong MongoDB Atlas có dữ liệu.

### 5.3. Bổ sung test service

- [ ] Test khi `generateEmbedding` lỗi.
- [ ] Test khi DB không có embedding.
- [ ] Test filter `maxPrice`.
- [ ] Test filter `condition`.
- [ ] Test vector không cùng chiều.
- [ ] Test sản phẩm hết hàng bị loại.

### 5.4. Bổ sung checklist test tay

- [ ] Hỏi "iPhone nào dưới 15 triệu?".
- [ ] Hỏi "Máy nào hợp sinh viên pin tốt?".
- [ ] Hỏi "Máy nào chơi game mượt?".
- [ ] Hỏi "Máy nào chụp ảnh đẹp?".
- [ ] Hỏi "Máy nào cho bố mẹ dùng đơn giản?".
- [ ] Tắt/sai `GEMINI_API_KEY` để kiểm tra fallback/error thân thiện.
- [ ] Xóa tạm ProductEmbedding để kiểm tra fallback về logic cũ.

### 5.5. Cập nhật hướng dẫn bảo vệ

Nên chuẩn bị câu trả lời:

```text
Chatbot của em dùng RAG demo theo hướng hybrid. Backend tạo embedding cho sản phẩm bằng Gemini, lưu vector trong MongoDB, sau đó khi người dùng hỏi sẽ tạo embedding cho câu hỏi và tính cosine similarity để tìm sản phẩm gần nghĩa nhất. Em vẫn giữ filter cứng như giá, hãng, tình trạng, tồn kho để đảm bảo không gợi ý sai sản phẩm. Nếu RAG lỗi, hệ thống fallback về logic tìm kiếm cũ nên chatbot không bị chết.
```

Và nếu bị hỏi vì sao không dùng Atlas Vector Search:

```text
Do phạm vi đồ án và số lượng sản phẩm demo còn nhỏ, em dùng cosine similarity in-memory để giảm độ phức tạp triển khai. Đây là bản RAG demo dễ kiểm soát. Nếu triển khai production với dữ liệu lớn, em sẽ chuyển sang MongoDB Atlas Vector Search hoặc vector database chuyên dụng.
```

## 6. Mức độ hoàn thiện hiện tại

Đánh giá thực tế:

```text
Code kiến trúc RAG demo: 80-85%
Test service: 60%
Docs: 75%
Xác nhận dữ liệu embedding trên local: chưa xác nhận do lỗi kết nối MongoDB Atlas
Production readiness: chưa nên khẳng định
Demo readiness: gần đạt, cần build embedding thành công và test chatbot thực tế
```

## 7. Đề xuất chỉnh sửa ngắn gọn trước khi commit

Nên làm trước khi commit/push:

1. Chỉnh docs để không dùng từ quá chắc như "production-ready tuyệt đối".
2. Ghi rõ trạng thái hiện tại là "RAG demo/hybrid semantic search".
3. Bổ sung checklist chạy `npm run build:embeddings`.
4. Ghi rõ lỗi MongoDB Atlas hiện tại là lỗi môi trường/kết nối, không phải lỗi syntax code.
5. Nếu có thời gian, thêm 2-3 test nữa cho semantic search service.

## 8. Kết luận gửi Antigravity

Phần triển khai hiện tại là một bước nâng cấp tốt và đúng hướng. Nó đã biến chatbot từ `rule-based + Gemini` thành chatbot có lớp semantic retrieval bằng embedding.

Tuy nhiên, để tài liệu và báo cáo kỹ thuật chính xác hơn, cần tránh mô tả quá mức. Trạng thái nên được gọi là:

```text
Hybrid Vector RAG demo dùng Gemini Embedding và cosine similarity in-memory, có fallback về logic cũ.
```

Không nên gọi là:

```text
Production-ready tuyệt đối.
```

Việc cần làm cuối cùng là xác nhận build embedding thành công trên môi trường local/Atlas và bổ sung thêm một số test/checklist để bảo vệ chắc hơn.
