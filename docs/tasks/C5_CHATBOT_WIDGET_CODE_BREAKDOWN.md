# C5 - Bóc tách code: client/src/components/ChatbotWidget.jsx

> Mục đích: Giúp hiểu rõ file giao diện chatbot — phần nào là **logic (xử lý dữ liệu)**, phần nào là **UI (thiết kế giao diện)**, và chúng nối với nhau như thế nào.

---

## 1. Tổng quan file

File này là **component giao diện chatbot** duy nhất, chạy được ở **2 chế độ**:

| Chế độ | Điều kiện | Dùng ở đâu |
| --- | --- | --- |
| **Full-page** | `<ChatbotWidget />` (không truyền prop) | Trang `/chatbot` (`ChatbotPage.jsx`) |
| **Floating (nổi bọt)** | `<ChatbotWidget floating />` | `MainLayout.jsx` — xuất hiện ở mọi trang |

File gồm ~800 dòng, chia làm **3 nhóm chính**:

```text
ChatbotWidget.jsx
├── A. Phần đầu: import + hằng số              (~dòng 1-26)
├── B. Component chính `ChatbotWidget`         (~dòng 28-440)
│     ├── State + useMemo + useEffect          (logic)
│     ├── Hàm gửi tin nhắn (async)             (logic)
│     └── JSX render giao diện                  (UI)
└── C. Component con + hàm phụ trợ              (~dòng 442-800)
      ├── Component con: ChatTabs, ChatPanel... (UI)
      ├── Hàm phụ trợ: đọc/ghi localStorage...  (logic)
      └── Component icon (SVG)                  (UI tĩnh)
```

---

## 2. Nhóm A - Import và hằng số (dòng 1-26)

### 2.1 Import (dòng 1-5)

```jsx
import { useEffect, useMemo, useRef, useState } from "react";   // React hooks (logic)
import ReactMarkdown from "react-markdown";                     // Render markdown thành HTML (UI)
import { Link, useLocation } from "react-router-dom";           // Điều hướng + lấy URL hiện tại
import { useAuth } from "../context/AuthContext.jsx";           // Lấy token / trạng thái đăng nhập
import { buildApiUrl, resolveMediaUrl } from "../lib/api.js";   // Dựng URL API + URL ảnh
```

→ **Phân vai:**
- `useState/useEffect/useMemo/useRef` → **logic** (quản lý state, chạy hiệu ứng)
- `ReactMarkdown`, `Link` → **UI** (hiển thị nội dung)
- `useAuth`, `buildApiUrl`, `resolveMediaUrl` → **logic** (kết nối backend)

### 2.2 Hằng số (dòng 10-26)

```jsx
const CHATBOT_MESSAGES_STORAGE_KEY = "mobile-retail-ai-chatbot-messages";      // Key lưu tin nhắn vào localStorage
const CHATBOT_RECENT_QUESTIONS_STORAGE_KEY = "...recent-questions";            // Key lưu câu hỏi gần đây

const initialMessages = [...];        // Tin nhắn chào mừng mặc định (UI content)
const defaultSuggestedQuestions = []; // Danh sách câu hỏi gợi ý mặc định (UI content)
```

→ Hằng số ở đây là **nội dung mặc định** (văn bản chào, câu hỏi gợi ý) + **key localStorage**.

---

## 3. Nhóm B - Component chính `ChatbotWidget` (dòng 28-440)

Đây là "bộ não" của file. Component nhận prop `floating`, quản lý toàn bộ state và phối hợp giữa logic + UI.

### 3.1 State (logic) — dòng 31-50

```jsx
const { token, isAuthenticated } = useAuth();  // Thông tin đăng nhập
const location = useLocation();                 // URL hiện tại

// State điều khiển hiển thị (logic)
const [isAiOpen, setIsAiOpen] = useState(false);          // Có mở cửa sổ AI chat không?
const [isSupportOpen, setIsSupportOpen] = useState(false);// Có mở cửa sổ support chat không?
const [activeTab, setActiveTab] = useState("ai");         // Đang ở tab "ai" hay "support"?

// State của AI chat (logic)
const [input, setInput] = useState("");                   // Text người dùng đang gõ
const [messages, setMessages] = useState(...);            // Danh sách tin nhắn
const [recentQuestions, setRecentQuestions] = useState(...);
const [loading, setLoading] = useState(false);            // Đang chờ AI trả lời?
const [error, setError] = useState("");                   // Lỗi hiện tại
const [lastFailedMessage, setLastFailedMessage] = useState(""); // Tin nhắn lỗi để nút "Gửi lại"

// State của support chat (logic)
const [supportInput, setSupportInput] = useState("");
const [supportConversation, setSupportConversation] = useState(null);
const [supportMessages, setSupportMessages] = useState([]);
const [supportLoading, setSupportLoading] = useState(false);
const [supportSending, setSupportSending] = useState(false);
const [supportError, setSupportError] = useState("");
```

→ **Toàn bộ phần này là LOGIC**: quản lý dữ liệu, không có gì hiển thị.

### 3.2 useMemo (logic) — dòng 53-70

```jsx
const wrapperClassName = useMemo(() => { ... }, [floating]);
// Quyết định class CSS của khung: 
//   - floating=false → "rounded-3xl ..." (khung trong trang)
//   - floating=true  → "fixed bottom-6 right-6 z-50 ..." (dính góc phải dưới)

const currentProductId = useMemo(() => {
  const matchedPath = location.pathname.match(/^\/products\/([^/]+)$/);
  return matchedPath ? matchedPath[1] : "";
}, [location.pathname]);
// Tự nhận biết user đang xem sản phẩm nào (từ URL /products/:id)
```

→ `wrapperClassName` là cầu nối **logic → UI** (tính class rồi gán vào JSX). `currentProductId` là **logic** (lấy dữ liệu).

### 3.3 useEffect (logic) — dòng 72-180

4 useEffect chính:

| useEffect | Nhiệm vụ |
| --- | --- |
| Lưu messages vào localStorage khi chưa đăng nhập | Giữ tin nhắn khi tắt trình duyệt (logic) |
| Lưu recentQuestions vào localStorage | Nhớ câu hỏi gần đây (logic) |
| Fetch `/api/chat/history` khi đăng nhập | Tải lịch sử chat từ server (logic) |
| Fetch + **polling** `/api/support-chat/me` mỗi 4 giây | Tự làm mới hội thoại support (logic) |

→ **Toàn bộ là LOGIC**: gọi API, đọc/ghi localStorage. Không render gì.

### 3.4 Hàm xử lý chính (logic) — dòng 180-320

```jsx
async function sendMessage(messageText) {
  // 1. Validate tin nhắn rỗng
  // 2. Tạo message user + nối vào messages
  // 3. Gọi POST /api/chat với history, currentProductId, currentPath
  // 4. Nhận reply + suggestedProducts → thêm message bot vào messages
  // 5. catch → setError; finally → setLoading(false)
}

async function sendSupportMessage(messageText) {
  // Gọi POST /api/support-chat/me/messages, cập nhật conversation + messages
}

function handleSubmit(event)      { event.preventDefault(); sendMessage(input); }
function handleSuggestedQuestion(question) { sendMessage(question); }
function handleRetry()            { sendMessage(lastFailedMessage); }
function handleSupportSubmit(event) { event.preventDefault(); sendSupportMessage(supportInput); }
```

→ **Toàn bộ là LOGIC**: xử lý sự kiện, gọi API, cập nhật state. Đây là "hành động" của chatbot.

### 3.5 JSX render (UI) — dòng 322-440

```jsx
// NHÁNH 1: Full-page (floating = false)
if (!floating) {
  return (
    <section className={wrapperClassName}>
      <ChatTabs activeTab={activeTab} onChange={setActiveTab} />  // 2 nút tab (UI)
      {activeTab === "ai" ? <ChatPanel ... /> : <SupportChatPanel ... />}
    </section>
  );
}

// NHÁNH 2: Floating (floating = true)
return (
  <div className={wrapperClassName}>
    {/* 1. Cửa sổ AI chat (hiện khi isAiOpen) */}
    {isAiOpen && ( ... header gradient + quick suggestions + ChatPanel compact ... )}

    {/* 2. Cửa sổ support chat (hiện khi isSupportOpen) */}
    {isSupportOpen && ( ... header tối màu + SupportChatPanel compact ... )}

    {/* 3. Hai nút bọt nổi (hiện khi cả 2 cửa sổ đều đóng) */}
    {!isAiOpen && !isSupportOpen && (
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => { setIsAiOpen(true); ... }}> ... Mạnh Hương AI ... </button>
        <button onClick={() => { setIsSupportOpen(true); ... }}> ... Chat trực tiếp ... </button>
      </div>
    )}
  </div>
);
```

→ **Toàn bộ phần này là UI**: JSX + Tailwind CSS. Logic chỉ được *gọi* qua `onClick`, `onChange`, `onSubmit`.

**Mối liên hệ logic ↔ UI ở đây:**
- Nút bọt `onClick` → gọi `setIsAiOpen(true)` (logic mở panel)
- `{isAiOpen && (...)}` → UI quyết định hiện/ẩn dựa trên state
- `{loading ? <LoadingSkeleton /> : null}` → UI hiện loading khi state `loading = true`

---

## 4. Nhóm C - Component con và hàm phụ trợ (dòng 442-800)

### 4.1 Component con UI (chỉ hiển thị, nhận props)

| Component | Chức năng | Nhận props (dữ liệu) |
| --- | --- | --- |
| `ChatTabs` | 2 nút chuyển tab "Chat với AI" / "Chat với admin" | `activeTab`, `onChange` |
| `ChatPanel` | Khung chat AI: tin nhắn, lỗi, gợi ý, ô nhập | `input, messages, loading, error, ...` |
| `SupportChatPanel` | Khung chat support | `isAuthenticated, messages, input, ...` |
| `ChatMessage` | 1 bong bóng tin nhắn AI (có card sản phẩm) | `message` |
| `SupportMessageBubble` | 1 bong bóng tin nhắn support (kèm giờ) | `message` |
| `MarkdownMessage` | Render text Markdown thành HTML đẹp | `content` |
| `LoadingSkeleton` | Hiệu ứng 3 chấm đang "suy nghĩ" | — |

→ **Đây là phần THIẾT KẾ GIAO DIỆN thuần túy**: Tailwind class, bố cục, màu sắc. Chúng "ngu" (không biết lấy dữ liệu), chỉ nhận props và vẽ ra.

### 4.2 Hàm phụ trợ (logic)

```jsx
function readStoredMessages() { ... }          // Đọc tin nhắn từ localStorage (logic)
function normalizeStoredMessages(messages) { ... } // Chuẩn hóa dữ liệu (logic)
function readStoredRecentQuestions() { ... }   // Đọc câu hỏi gần đây (logic)
function buildRecentQuestions(...) { ... }     // Gộp câu hỏi mới vào danh sách (logic)
function getErrorPresentation(error) { ... }   // Map text lỗi → kiểu hiển thị (logic→UI)
function formatTime(value) { ... }             // Format giờ (logic)
```

→ **Logic**: xử lý dữ liệu thuần, không render. Riêng `getErrorPresentation` trả về class + icon nên là **cầu nối logic→UI**.

### 4.3 Component icon SVG (UI tĩnh)

```jsx
function ChatIcon() {}      // Hình chat
function SparkIcon() {}     // Hình tia lửa (AI)
function WarningIcon() {}   // Cảnh báo
function ErrorIcon() {}     // Lỗi
function WifiOffIcon() {}   // Mất kết nối
function InfoIcon() {}      // Thông tin
function SpinnerIcon() {}   // Vòng xoay loading
function SendIcon() {}      // Nút gửi
```

→ **UI thuần túy**: các hình SVG cố định, nhận optional `className` để đổi kích thước/màu.

---

## 5. Tóm tắt: Đâu là LOGIC, đâu là UI?

| Loại | Nằm ở đâu | Ví dụ |
| --- | --- | --- |
| **State (logic)** | Đầu component `ChatbotWidget` | `messages`, `loading`, `isAiOpen` |
| **useMemo / useEffect (logic)** | Giữa component chính | fetch history, polling support, đọc localStorage |
| **Hàm xử lý (logic)** | Giữa component chính | `sendMessage`, `sendSupportMessage`, `handleSubmit` |
| **Hàm phụ trợ (logic)** | Cuối file | `readStoredMessages`, `normalizeStoredMessages`, `formatTime` |
| **Component con UI** | Cuối file | `ChatPanel`, `ChatMessage`, `MarkdownMessage` |
| **Icon SVG (UI)** | Cuối file | `SparkIcon`, `SendIcon`, `SpinnerIcon` |
| **JSX + Tailwind (UI)** | Phần `return (...)` của mỗi component | header gradient, bong bóng chat, nút bọt |

---

## 6. Luồng dữ liệu trong file (Data flow)

```text
[User gõ tin nhắn]
       │
       ▼
sendMessage()  ──(logic)──►  POST /api/chat  ──►  Backend (Gemini + RAG)
       │                                                 │
       │            ◄──────────  reply + suggestedProducts ◄─┘
       ▼
setMessages([...cũ, userMessage, botMessage])   ──(logic: cập nhật state)
       │
       ▼
ChatPanel  ──(UI: nhận props messages)──►  ChatMessage ──►  hiển thị bong bóng
                                                    │
                                                    └──►  card sản phẩm (Link đi /products/:id)
```

---

## 7. Hướng dẫn chỉnh sửa nhanh

| Muốn làm | Sửa ở đâu |
| --- | --- |
| Đổi vị trí bọt chat | `wrapperClassName` (dòng ~60): `right-6` → `left-6` |
| Đổi kích thước khung chat | `wrapperClassName`: `max-w-[500px]` |
| Đổi màu header AI | Trong nhánh floating: `bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800` |
| Đổi câu chào mặc định | `initialMessages` (dòng ~15) |
| Đổi câu hỏi gợi ý mặc định | `defaultSuggestedQuestions` (dòng ~23) |
| Đổi tần suất polling support chat | `setInterval(..., 4000)` trong useEffect polling |
| Thêm chức năng cho nút bọt | Phần `{!isAiOpen && !isSupportOpen && (...)}` |

---

## 8. Kết luận

File `ChatbotWidget.jsx` được tổ chức theo mô hình **"Component lớn chứa logic, các component con lo phần vẽ"**:

- **ChatbotWidget** = điều phối viên: nắm hết state, gọi API, quyết định hiện panel nào.
- **ChatPanel / SupportChatPanel / ChatMessage / MarkdownMessage** = họa sĩ: chỉ nhận dữ liệu qua props và render giao diện.
- **Icon SVG + Tailwind** = vật liệu trang trí.

Nhờ tách vậy, bạn có thể sửa giao diện (Tailwind class, component con) mà không sợ đụng logic, và ngược lại sửa logic (cách gọi API) mà không lo vỡ giao diện.

