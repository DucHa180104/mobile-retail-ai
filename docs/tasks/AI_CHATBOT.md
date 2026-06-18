# AI Chatbot

- **Trạng thái:** IN PROGRESS
- **Cập nhật lần cuối:** 2026-06-18

## Mục tiêu

- Dựng bộ khung chatbot mock để hiểu luồng dữ liệu trước khi gọi AI thật.

## File đã tạo

- `backend/controllers/chatController.js`
- `backend/routes/chatRoutes.js`
- `client/src/pages/ChatbotPage.jsx`
- `client/src/components/ChatbotWidget.jsx`

## File đã sửa

- `backend/server.js`
- `client/src/App.jsx`
- `client/src/layouts/MainLayout.jsx`

## Phạm vi bước 1

- Frontend gửi `message` lên backend
- Backend nhận `req.body.message`
- Backend trả:
  - `res.json({ reply: "Bạn vừa hỏi: ..." })`
- Frontend hiển thị reply
- Có thêm chatbot nổi ở góc dưới phải trên các trang user

## Chưa làm ở bước này

- Chưa gọi OpenAI / Gemini
- Chưa lưu MongoDB
- Chưa streaming
- Chưa socket
- Chưa auth cho chatbot
