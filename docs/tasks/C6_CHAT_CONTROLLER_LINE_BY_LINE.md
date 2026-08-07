# C6 - Giải thích từng dòng code: backend/controllers/chatController.js

> Mục đích: Giải thích **từng dòng, từng lệnh** một cách dễ hiểu nhất cho người đang bị "quên hết code". Không đòi hỏi kiến thức nền tảng — chỉ cần đọc từ từ theo thứ tự.

---

## 0. File này làm gì? (Hiểu trước khi đọc code)

File này là **"người gác cổng + thư ký"** của chatbot ở phía máy chủ (backend).

Khi bạn gõ một câu hỏi trong hộp chat ở website:

```text
Bạn gõ: "iPhone nào dưới 15 triệu?"
        │
        ▼
  Frontend (React) gửi request tới backend
        │
        ▼
  chatController.js  ←── BẠN ĐANG ĐỨNG Ở ĐÂY
        │
        ▼
  aiChatService.js (đi hỏi Gemini AI, tìm sản phẩm trong database)
        │
        ▼
  Trả lời quay lại controller
        │
        ▼
  Controller gửi câu trả lời về cho frontend
        │
        ▼
  Bạn thấy chatbot trả lời
```

**Nói đơn giản:** File này nhận câu hỏi từ người dùng → nhờ service xử lý → trả kết quả về. Nó cũng lưu lịch sử chat vào database.

---

## 1. Hai câu IMPORT đầu tiên (dòng 1-2)

```js
import ChatHistory from "../models/ChatHistory.js";
import { generateChatReply } from "../services/aiChatService.js";
```

### Giải thích từng từ:

| Từ khóa | Nghĩa |
| --- | --- |
| `import` | Giống "mượn" một thứ từ file khác để dùng. Giống bạn nói: *"Cho tôi mượn cái máy khoan"* |
| `ChatHistory` | **Model** (khuôn mẫu) để làm việc với collection `ChatHistory` trong MongoDB. Collection này lưu **lịch sử chat** của người dùng |
| `from "../models/ChatHistory.js"` | Đường dẫn tới file model. `..` nghĩa là "lên một cấp thư mục" (từ `controllers/` lên `backend/`), rồi vào `models/` |
| `{ generateChatReply }` | **Hàm** (function) tên là `generateChatReply` — nghĩa là "tạo ra câu trả lời chat". Hàm này nằm trong file `aiChatService.js` |
| `from "../services/aiChatService.js"` | Đường dẫn tới file service (nơi chứa logic gọi Gemini AI) |

### Ví dụ thực tế:
- Dòng 1: *"Cho tôi mượn cái khuôn làm bánh tên là ChatHistory để tôi đúc (lưu) lịch sử chat."*
- Dòng 2: *"Cho tôi mượn cái máy trả lời tự động tên generateChatReply để nó lo việc hỏi AI."*

---

## 2. Hằng số giới hạn (dòng 4)

```js
const CHAT_HISTORY_MESSAGE_LIMIT = 100;
```

### Giải thích:
- `const` = khai báo một giá trị **không đổi** (constant). Không ai được sửa nó sau này.
- `CHAT_HISTORY_MESSAGE_LIMIT` = tên biến, viết HOA để biết đây là hằng số. Nghĩa: **giới hạn số tin nhắn lịch sử**.
- `= 100` = giá trị là **100**.

### Nghĩa thực tế:
> Lịch sử chat của một người chỉ giữ **tối đa 100 tin nhắn** gần nhất. Cũ hơn sẽ bị cắt bỏ (để database không phình to).

---

## 3. Hàm `sendChatReply` — "Gửi câu trả lời chat" (dòng 6-48)

Đây là **hàm quan trọng nhất** của file. Khi frontend gọi `POST /api/chat`, hàm này chạy.

### 3.1. Khai báo hàm (dòng 6-7)

```js
export async function sendChatReply(req, res) {
  try {
```

| Từ khóa | Nghĩa |
| --- | --- |
| `export` | Cho phép file khác dùng được hàm này (giống "công khai" để người khác gọi) |
| `async` | Hàm **bất đồng bộ** — nó có thể chờ đợi (ví dụ chờ AI trả lời) mà không làm treo máy chủ. Giống bạn gọi món ở nhà hàng: bạn không đứng đơ ở quầy, mà về bàn chờ |
| `function sendChatReply` | Định nghĩa hàm tên `sendChatReply` |
| `(req, res)` | Hai tham số mà Express luôn truyền vào mọi controller: |
| `req` | **REQUEST** = thứ khách gửi tới (câu hỏi, token, thông tin user) |
| `res` | **RESPONSE** = thứ server trả về (câu trả lời) |
| `try {` | Bắt đầu khối "thử làm". Nếu có lỗi xảy ra bên trong, sẽ nhảy xuống `catch` ở dưới |

### 3.2. Lấy dữ liệu từ request (dòng 8-14)

```js
    const {
      message = "",
      history = [],
      currentProductId = "",
      currentPath = ""
    } = req.body;
```

- `req.body` = phần **thân** của request. Frontend gửi lên dạng JSON, Express tự phân tích ra thành object.
- `{ message, history, currentProductId, currentPath }` = **destructuring** — "mở hộp quà ra và lấy 4 món bên trong".
- `message = ""` = nếu frontend **không gửi** `message`, mặc định lấy chuỗi rỗng `""` (tránh bị lỗi).

**Bốn biến nhận được:**
| Biến | Nghĩa |
| --- | --- |
| `message` | Câu hỏi người dùng gõ, ví dụ *"iPhone nào dưới 15 triệu?"* |
| `history` | Lịch sử các tin nhắn trước đó (để AI hiểu ngữ cảnh) |
| `currentProductId` | ID của sản phẩm người dùng đang xem (để AI biết đang tư vấn máy nào) |
| `currentPath` | Đường dẫn URL hiện tại, ví dụ `/products/abc123` |

### 3.3. Kiểm tra câu hỏi có rỗng không (dòng 16-20)

```js
    if (!String(message).trim()) {
      return res.status(400).json({
        message: "Vui long nhap noi dung cau hoi"
      });
    }
```

- `String(message)` = ép `message` về dạng chuỗi (đề phòng nó là số, null, v.v.)
- `.trim()` = **cắt bỏ khoảng trắng** đầu và cuối chuỗi. Ví dụ `"  hello  "` → `"hello"`.
- `!` = **phủ định** (lật ngược). Nếu chuỗi rỗng `""` → `!""` = `true`.
- Vậy điều kiện này = **"Nếu câu hỏi rỗng hoặc toàn khoảng trắng"** thì:

```js
    return res.status(400).json({ message: "..." });
```
- `return` = dừng hàm tại đây, không chạy tiếp.
- `res.status(400)` = trả về mã lỗi **400 Bad Request** (yêu cầu không hợp lệ).
- `.json({ message: "..." })` = kèm nội dung lỗi bằng định dạng JSON.

**Nghĩa thực tế:** Nếu người dùng bấm gửi mà không gõ gì → server trả về *"Vui lòng nhập nội dung câu hỏi"*.

### 3.4. Chuẩn hóa câu hỏi (dòng 22)

```js
    const normalizedMessage = String(message).trim();
```

- Tạo biến `normalizedMessage` = câu hỏi đã **cắt khoảng trắng thừa**.
- Ví dụ: `"  iPhone gia bao nhieu  "` → `"iPhone gia bao nhieu"`.

### 3.5. Gọi service xử lý AI (dòng 24-30)

```js
    const result = await generateChatReply({
      message,
      history,
      currentProductId,
      currentPath
    });
```

- `generateChatReply({...})` = gọi hàm ở service (đã import ở dòng 2). Truyền vào cả 4 thông tin.
- `await` = **chờ đợi**. Server sẽ tạm dừng ở đây, chờ AI trả lời xong mới đi tiếp. (Vì hàm này là `async`, nên được phép `await`.)
- `const result` = lưu kết quả AI trả về vào biến `result`. Kết quả này là một object có 2 phần:
  - `result.reply` → câu trả lời dạng text
  - `result.suggestedProducts` → danh sách sản phẩm gợi ý

### 3.6. Lưu lịch sử chat nếu có user đăng nhập (dòng 32-43)

```js
    if (req.user?._id) {
      await saveUserChatHistory({
        userId: req.user._id,
        userMessage: normalizedMessage,
        botReply: result.reply,
        suggestedProducts: result.suggestedProducts || [],
        currentPath,
        currentProductId
      });
    }
```

- `req.user` = thông tin user đã được middleware xác thực gắn vào request (chỉ có nếu user gửi token hợp lệ).
- `req.user?._id` = dấu `?` (optional chaining) nghĩa là **"nếu req.user tồn tại thì mới lấy ._id, còn không thì trả về undefined"**. Tránh lỗi khi `req.user` là `null`.
- `if (...)` = nếu có `_id` (tức user đã đăng nhập) thì:
  - Gọi hàm `saveUserChatHistory({...})` — hàm này sẽ được giải thích ở mục 7.
  - `await` = chờ lưu xong mới đi tiếp.
  - `result.suggestedProducts || []` = "nếu có sản phẩm gợi ý thì dùng, còn không thì dùng mảng rỗng `[]`".

**Nghĩa thực tế:** Chỉ lưu lịch sử chat cho **user đã đăng nhập**. Khách vãng lai (guest) thì không lưu.

### 3.7. Trả kết quả thành công (dòng 45-49)

```js
    return res.status(200).json({
      reply: result.reply,
      suggestedProducts: result.suggestedProducts || []
    });
```

- `res.status(200)` = mã **200 OK** (thành công).
- `.json({ reply, suggestedProducts })` = gửi về cho frontend:
  - `reply` → câu trả lời text
  - `suggestedProducts` → danh sách sản phẩm gợi ý

### 3.8. Xử lý lỗi (dòng 50-54)

```js
  } catch (error) {
    const friendlyError = mapChatbotError(error);

    return res.status(friendlyError.status).json({
      message: friendlyError.message
    });
  }
}
```

- `catch (error)` = nếu bất kỳ lỗi nào xảy ra trong khối `try` ở trên, nhảy xuống đây, lỗi được bỏ vào biến `error`.
- `mapChatbotError(error)` = gọi hàm (sẽ giải thích ở mục 5) để **chuyển lỗi kỹ thuật thành câu thông báo thân thiện**.
- Kết quả là `friendlyError` có 2 phần: `friendlyError.status` (mã lỗi) và `friendlyError.message` (lời nhắn).
- `res.status(friendlyError.status).json({ message })` = trả về mã lỗi + lời nhắn thân thiện.

**Nghĩa thực tế:** Không bao giờ để lộ lỗi kỹ thuật gốc (như stack trace, API key...). Chỉ trả lời kiểu "AI đang quá tải" hoặc "Cấu hình API chưa hợp lệ" — thân thiện với người dùng.

---

## 4. Hàm `getMyChatHistory` — "Lấy lịch sử chat của tôi" (dòng 56-64)

```js
export async function getMyChatHistory(req, res, next) {
  try {
    const history = await ChatHistory.findOne({ user: req.user._id });

    return res.status(200).json({
      messages: formatStoredMessages(history?.messages || [])
    });
  } catch (error) {
    return next(error);
  }
}
```

### 4.1. Khai báo hàm (dòng 56)

```js
export async function getMyChatHistory(req, res, next) {
```

| Từ khóa | Nghĩa |
| --- | --- |
| `export` | Cho phép file khác dùng hàm này (route sẽ gọi) |
| `async` | Hàm bất động bộ, có thể chờ đợi database |
| `function getMyChatHistory` | Tên hàm: "Lấy lịch sử chat của tôi" |
| `(req, res, next)` | Ba tham số: `req` = request (yêu cầu), `res` = response (trả về), `next` = chuyển lỗi cho middleware xử lý lỗi |

### 4.2. Tìm lịch sử trong database (dòng 58)

```js
const history = await ChatHistory.findOne({ user: req.user._id });
```

- `ChatHistory` = Model MongoDB (đã import ở dòng 1).
- `.findOne(...)` = **tìm một bản ghi** trong collection `ChatHistory`.
- `{ user: req.user._id }` = điều kiện: tìm bản ghi có trường `user` bằng với ID của user đang đăng nhập.
- `req.user._id` = ID của user (được middleware xác thực gắn vào request).
- `await` = chờ database trả kết quả.
- `const history` = lưu kết quả vào biến (có thể là object hoặc `null` nếu chưa có).

### 4.3. Trả về danh sách tin nhắn (dòng 60-62)

```js
return res.status(200).json({
  messages: formatStoredMessages(history?.messages || [])
});
```

- `res.status(200).json({...})` = trả về mã 200 thành công, kèm dữ liệu JSON.
- `history?.messages` = dấu `?` (optional chaining) nghĩa là: "nếu `history` tồn tại thì lấy `.messages`, còn không thì `undefined`".
- `|| []` = "nếu vế trái là `undefined` hoặc `null` thì dùng mảng rỗng `[]`".
- `formatStoredMessages(...)` = gọi hàm định dạng tin nhắn (sẽ giải thích ở mục 8).

### 4.4. Bắt lỗi (dòng 63-65)

```js
} catch (error) {
  return next(error);
}
```

- Khác với `sendChatReply` (tự xử lý lỗi), hàm này **chuyển lỗi cho Express** qua `next(error)`.
- Express sẽ gọi middleware `errorHandler` (trong `backend/middleware/errorHandler.js`) để xử lý lỗi tập trung.

---

## 5. Hàm `mapChatbotError` — "Biến lỗi kỹ thuật thành câu dễ hiểu" (dòng 67-103)

```js
function mapChatbotError(error) {
  const errorMessage = String(error?.message || "");
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("quota")) {
    return {
      status: 503,
      message: "AI dang qua tai hoac da cham gioi han luot goi. Ban thu lai sau it phut nhe."
    };
  }

  if (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("fetch failed")
  ) {
    return {
      status: 503,
      message: "Khong the ket noi toi Gemini API luc nay. Ban kiem tra mang roi thu lai nhe."
    };
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("gemini_api_key") ||
    normalizedMessage.includes("unauthorized")
  ) {
    return {
      status: 500,
      message: "Cau hinh Gemini API chua hop le. Ban kiem tra lai API key trong file .env."
    };
  }

  return {
    status: 500,
    message: "Chatbot dang gap loi tam thoi. Ban thu lai sau nhe."
  };
}
```

### 5.1. Khai báo (dòng 67)

```js
function mapChatbotError(error) {
```

- Không có `export` → hàm này **chỉ dùng nội bộ** trong file này, không ai bên ngoài gọi được.
- `function mapChatbotError` = "ánh xạ (biến đổi) lỗi chatbot".
- `(error)` = nhận vào một object lỗi.

### 5.2. Lấy nội dung lỗi (dòng 68-69)

```js
const errorMessage = String(error?.message || "");
const normalizedMessage = errorMessage.toLowerCase();
```

- `error?.message` = lấy thuộc tính `message` của lỗi (nếu có). Ví dụ lỗi có message: `"API key not valid. Please pass a valid API key."`
- `|| ""` = nếu không có message thì dùng chuỗi rỗng.
- `String(...)` = ép thành chuỗi.
- `.toLowerCase()` = **chuyển thành chữ thường** để dễ so sánh. Ví dụ: `"API Key"` → `"api key"`.

### 5.3. Kiểm tra từ khóa "quota" (dòng 71-76)

```js
if (normalizedMessage.includes("quota")) {
  return {
    status: 503,
    message: "AI dang qua tai hoac da cham gioi han luot goi. Ban thu lai sau it phut nhe."
  };
}
```

- `.includes("quota")` = kiểm tra xem chuỗi có chứa từ "quota" không. "Quota" là giới hạn số lần gọi API.
- `return { status: 503, message: "..." }` = trả về:
  - Mã lỗi **503 Service Unavailable** (dịch vụ tạm thời không khả dụng).
  - Câu thông báo thân thiện bằng tiếng Việt: *"AI đang quá tải hoặc đã chạm giới hạn lượt gọi. Bạn thử lại sau ít phút nhé."*

### 5.4. Kiểm tra lỗi kết nối (dòng 78-83)

```js
if (
  normalizedMessage.includes("timed out") ||
  normalizedMessage.includes("fetch failed")
) {
  return {
    status: 503,
    message: "Khong the ket noi toi Gemini API luc nay. Ban kiem tra mang roi thu lai nhe."
  };
}
```

- `"timed out"` = lỗi hết thời gian chờ (AI không kịp trả lời trong thời gian quy định).
- `"fetch failed"` = lỗi không fetch được (không gọi được API Gemini).
- `||` = **hoặc** — nếu một trong hai điều kiện đúng.
- Trả về mã 503 và thông báo: *"Không thể kết nối tới Gemini API lúc này. Bạn kiểm tra mạng rồi thử lại nhé."*

### 5.5. Kiểm tra lỗi API key (dòng 85-92)

```js
if (
  normalizedMessage.includes("api key") ||
  normalizedMessage.includes("gemini_api_key") ||
  normalizedMessage.includes("unauthorized")
) {
  return {
    status: 500,
    message: "Cau hinh Gemini API chua hop le. Ban kiem tra lai API key trong file .env."
  };
}
```

- `"api key"` = lỗi liên quan đến API key.
- `"gemini_api_key"` = tên biến môi trường trong file `.env`.
- `"unauthorized"` = lỗi không được phép (thường do key sai).
- Trả về mã **500 Internal Server Error** (lỗi máy chủ nội bộ — cần admin sửa).
- Thông báo: *"Cấu hình Gemini API chưa hợp lệ. Bạn kiểm tra lại API key trong file .env."*

### 5.6. Lỗi mặc định (dòng 94-98)

```js
return {
  status: 500,
  message: "Chatbot dang gap loi tam thoi. Ban thu lai sau nhe."
};
```

- Nếu không khớp với bất kỳ lỗi nào ở trên → trả lỗi mặc định.
- Quan trọng: **không bao giờ trả về lỗi gốc của Gemini** (có thể lộ thông tin nhạy cảm).

---

## 6. Hàm `saveUserChatHistory` — "Lưu lịch sử chat" (dòng 105-140)

```js
async function saveUserChatHistory({
  userId,
  userMessage,
  botReply,
  suggestedProducts,
  currentPath,
  currentProductId
}) {
  const history = await ChatHistory.findOne({ user: userId });

  const nextMessages = [
    ...(history?.messages || []),
    {
      role: "user",
      text: userMessage,
      currentPath,
      currentProductId
    },
    {
      role: "bot",
      text: botReply,
      products: normalizeSuggestedProducts(suggestedProducts),
      currentPath,
      currentProductId
    }
  ].slice(-CHAT_HISTORY_MESSAGE_LIMIT);

  await ChatHistory.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      messages: nextMessages
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}
```

### 6.1. Khai báo (dòng 105-112)

```js
async function saveUserChatHistory({
  userId,
  userMessage,
  botReply,
  suggestedProducts,
  currentPath,
  currentProductId
}) {
```

- `async function saveUserChatHistory` = hàm bất đồng bộ (có `await` bên trong).
- **Destructuring object** trong tham số: Nhận vào một object và mở ra lấy 6 biến:
  - `userId` = ID của user
  - `userMessage` = câu hỏi của user
  - `botReply` = câu trả lời của AI
  - `suggestedProducts` = danh sách sản phẩm gợi ý
  - `currentPath` = đường dẫn URL hiện tại
  - `currentProductId` = ID sản phẩm đang xem (nếu có)

### 6.2. Tìm lịch sử cũ (dòng 114)

```js
const history = await ChatHistory.findOne({ user: userId });
```

- Tìm bản ghi `ChatHistory` của user này.
- Nếu chưa có → `history = null` (user chat lần đầu).

### 6.3. Tạo mảng tin nhắn mới (dòng 116-129)

```js
const nextMessages = [
    ...(history?.messages || []),
    {
      role: "user",
      text: userMessage,
      currentPath,
      currentProductId
    },
    {
      role: "bot",
      text: botReply,
      products: normalizeSuggestedProducts(suggestedProducts),
      currentPath,
      currentProductId
    }
].slice(-CHAT_HISTORY_MESSAGE_LIMIT);
```

Phân tích từng phần:

**a) `...(history?.messages || [])`**
- `...` = **spread operator** (toán tử trải). Nó "trải" mảng cũ ra thành từng phần tử riêng lẻ, rồi đặt vào mảng mới.
- `history?.messages` = nếu có lịch sử thì lấy mảng tin nhắn cũ, không thì `undefined`.
- `|| []` = nếu `undefined` thì dùng mảng rỗng.
- Giống bạn có 1 rổ táo cũ, bạn đổ hết táo ra bàn, rồi thêm táo mới vào.

**b) Thêm tin nhắn user (dòng 118-121)**
```js
{
  role: "user",     // người gửi là user
  text: userMessage, // nội dung câu hỏi
  currentPath,       // đường dẫn user đang đứng
  currentProductId   // sản phẩm user đang xem
}
```

**c) Thêm tin nhắn bot (dòng 123-128)**
```js
{
  role: "bot",       // người gửi là bot
  text: botReply,    // câu trả lời của AI
  products: normalizeSuggestedProducts(suggestedProducts), // sản phẩm gợi ý đã chuẩn hóa
  currentPath,
  currentProductId
}
```

**d) `.slice(-CHAT_HISTORY_MESSAGE_LIMIT)`**
- `.slice(-100)` = **chỉ lấy 100 tin nhắn cuối cùng**.
- Dấu `-` nghĩa là "đếm từ cuối lên". Nếu có 150 tin nhắn, chỉ lấy 50 tin nhắn mới nhất.
- Đây là cách **giới hạn kích thước** lịch sử, tránh database phình to.

### 6.4. Lưu vào database (dòng 131-139)

```js
await ChatHistory.findOneAndUpdate(
  { user: userId },              // Điều kiện: tìm bản ghi của user này
  {
    user: userId,                // Dữ liệu cần update
    messages: nextMessages       // Mảng tin nhắn mới
  },
  {
    upsert: true,                // Nếu chưa có → TẠO MỚI; nếu có → CẬP NHẬT
    new: true,                   // Trả về bản ghi mới nhất (không dùng kết quả ở đây)
    setDefaultsOnInsert: true    // Nếu tạo mới, tự động điền các giá trị mặc định
  }
);
```

- `ChatHistory.findOneAndUpdate(...)` = tìm một bản ghi và cập nhật nó.
- `{ user: userId }` = điều kiện tìm: bản ghi có trường `user` = `userId`.
- `{ user: userId, messages: nextMessages }` = nội dung cập nhật: gán lại `user` và `messages`.
- `{ upsert: true }` = **UPDATE + INSERT** = "nếu tìm thấy thì update, không tìm thấy thì tạo mới".
- `await` = chờ lưu xong.

---

## 7. Hàm `normalizeSuggestedProducts` — "Chuẩn hóa sản phẩm gợi ý" (dòng 142-160)

```js
function normalizeSuggestedProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => ({
    id: product.id || "",
    name: product.name || "",
    image: product.image || "",
    priceText: product.priceText || "",
    conditionLabel: product.conditionLabel || "",
    stock: Number(product.stock) || 0,
    stockText: product.stockText || "",
    storage: product.storage || "",
    batteryHealth: product.batteryHealth || "",
    path: product.path || ""
  }));
}
```

### 7.1. Kiểm tra đầu vào (dòng 143-145)

```js
if (!Array.isArray(products)) {
  return [];
}
```

- `Array.isArray(products)` = kiểm tra xem `products` có phải là **mảng** không.
- `!` = phủ định. Nếu không phải mảng → trả về mảng rỗng `[]`.
- Phòng trường hợp: nếu `suggestedProducts` là `undefined`, `null`, hoặc một số → không bị lỗi.

### 7.2. Map từng sản phẩm (dòng 147-159)

```js
return products.map((product) => ({ ... }));
```

- `.map(...)` = **duyệt qua từng sản phẩm**, biến đổi nó thành object mới.
- `(product) => ({...})` = hàm mũi tên (arrow function): nhận vào `product` cũ, trả về object mới.

**Mỗi sản phẩm mới có 10 trường, dùng `|| ""` để đảm bảo không bị `undefined`:**

| Trường | Gốc | Mặc định nếu thiếu |
| --- | --- | --- |
| `id` | `product.id` | `""` |
| `name` | `product.name` | `""` |
| `image` | `product.image` | `""` |
| `priceText` | `product.priceText` | `""` |
| `conditionLabel` | `product.conditionLabel` | `""` |
| `stock` | `Number(product.stock)` | `0` |
| `stockText` | `product.stockText` | `""` |
| `storage` | `product.storage` | `""` |
| `batteryHealth` | `product.batteryHealth` | `""` |
| `path` | `product.path` | `""` |

**Ví dụ:** Nếu service trả về sản phẩm thiếu trường `image`:
```js
// Dữ liệu gốc từ service (thiếu image)
{ id: "abc", name: "iPhone 15", priceText: "19.990.000đ" }

// Sau khi normalize:
{ id: "abc", name: "iPhone 15", image: "", priceText: "19.990.000đ", ... }
```

---

## 8. Hàm `formatStoredMessages` — "Định dạng tin nhắn lưu trữ" (dòng 162-175)

```js
function formatStoredMessages(messages) {
  return messages.map((message) => ({
    id: message._id,
    role: message.role,
    text: message.text,
    products: Array.isArray(message.products) ? message.products : [],
    currentPath: message.currentPath || "",
    currentProductId: message.currentProductId || "",
    createdAt: message.createdAt
  }));
}
```

### 8.1. Mục đích

Hàm này chuyển đổi dữ liệu tin nhắn từ **định dạng MongoDB** sang **định dạng frontend cần**.

### 8.2. Phân tích từng dòng

- `messages.map(...)` = duyệt từng tin nhắn trong mảng.
- `id: message._id` = MongoDB lưu ID là `_id` (có gạch dưới), frontend cần `id` (không gạch dưới). Đây là bước **đổi tên trường**.
- `role: message.role` = giữ nguyên: `"user"` hoặc `"bot"`.
- `text: message.text` = giữ nguyên nội dung.
- `products: Array.isArray(message.products) ? message.products : []` = nếu `products` là mảng thì giữ, không thì dùng mảng rỗng.
- `currentPath: message.currentPath || ""` = đường dẫn, mặc định `""` nếu thiếu.
- `currentProductId: message.currentProductId || ""` = ID sản phẩm, mặc định `""` nếu thiếu.
- `createdAt: message.createdAt` = thời gian tạo, giữ nguyên.

---

## 9. Tổng kết toàn bộ file

### 9.1. Sơ đồ luồng dữ liệu

```text
Frontend gửi POST /api/chat
  │
  ▼
sendChatReply(req, res)                  ←── Controller nhận request
  │
  ├─ Kiểm tra message rỗng? → trả lỗi 400
  │
  ├─ Gọi generateChatReply({...})         ←── Service gọi Gemini AI
  │     │
  │     └─ Trả về { reply, suggestedProducts }
  │
  ├─ Nếu có user đăng nhập:
  │     └─ saveUserChatHistory({...})     ←── Lưu vào MongoDB
  │           │
  │           ├─ Lấy lịch sử cũ
  │           ├─ Thêm tin nhắn mới
  │           ├─ Cắt bớt (giữ 100 tin cuối)
  │           └─ Lưu lại (upsert)
  │
  ├─ Trả về 200 { reply, suggestedProducts }
  │
  └─ Nếu lỗi:
        └─ mapChatbotError(error)         ←── Biến lỗi thành thông báo thân thiện
              └─ Trả về mã lỗi + message
```

### 9.2. Các hàm trong file

| Tên hàm | Công khai? | Chức năng |
| --- | --- | --- |
| `sendChatReply` | ✅ `export` | Nhận câu hỏi, gọi AI, lưu lịch sử, trả kết quả |
| `getMyChatHistory` | ✅ `export` | Lấy lịch sử chat của user đang đăng nhập |
| `mapChatbotError` | ❌ Nội bộ | Biến lỗi kỹ thuật thành câu thông báo thân thiện |
| `saveUserChatHistory` | ❌ Nội bộ | Lưu tin nhắn vào MongoDB, tự động giới hạn 100 tin |
| `normalizeSuggestedProducts` | ❌ Nội bộ | Đảm bảo mỗi sản phẩm có đủ các trường cần thiết |
| `formatStoredMessages` | ❌ Nội bộ | Chuyển đổi định dạng tin nhắn từ MongoDB → frontend |

### 9.3. Tại sao file này quan trọng?

- **Bảo mật:** Không bao giờ để lộ lỗi kỹ thuật gốc ra ngoài. Luôn dùng `mapChatbotError` để thay thế bằng thông báo an toàn.
- **Tiết kiệm:** Lịch sử chat tự động giới hạn 100 tin nhắn, tránh database phình to.
- **Linh hoạt:** Hỗ trợ cả user đã đăng nhập (lưu lịch sử) và khách vãng lai (không lưu).
- **Dễ bảo trì:** Tách biệt rõ controller (nhận/gửi request) và service (xử lý AI).
