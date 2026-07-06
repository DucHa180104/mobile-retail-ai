# Task Name
P1.1 - Chuan hoa xu ly loi backend

# Status
DONE

# Last Updated
2026-07-04

# Muc tieu
- Khong de backend tra thang `error.message` noi bo ve client.
- Dua cac loi 500 thong thuong qua `errorHandler`.
- Giu lai cac loi nghiep vu 400/403/404 dang dung.
- Rieng chatbot van tra loi than thien, nhung khong lo loi tho tu Gemini hay stack trace.

# Cac file da sua
- `backend/controllers/cartController.js`
- `backend/controllers/wishlistController.js`
- `backend/controllers/reviewController.js`
- `backend/controllers/chatController.js`
- `backend/routes/errorHandling.standardization.test.js`

# Noi dung thay doi
- `cartController.js`
  - Doi cac `catch` tu `res.status(500).json({ message: error.message })` sang `next(error)`.
  - Muc dich: loi noi bo duoc xu ly tap trung boi `errorHandler`.
- `wishlistController.js`
  - Chuan hoa controller de loi noi bo di qua `next(error)`.
  - Giu lai cac message nghiep vu nhu thieu `productId`, khong tim thay san pham, khong tim thay nguoi dung.
- `reviewController.js`
  - Loi noi bo chuyen sang `next(error)`.
  - Giu lai xu ly duplicate review (`error.code === 11000`) vi day la loi nghiep vu du kien.
- `chatController.js`
  - `getMyChatHistory` khong tu tra `500` nua, ma dua qua `next(error)`.
  - `sendChatReply` van map loi chatbot theo huong than thien.
  - Fallback cuoi cung khong con tra `error.message` goc nua.

# Luong xu ly loi truoc va sau khi sua
## Truoc khi sua
- Controller bat duoc exception.
- Nhiieu noi tra thang `error.message` ve client.
- Rui ro:
  - Lo stack trace
  - Lo thong tin noi bo MongoDB / Gemini
  - Frontend nhin thay message kho hieu va khong an toan

## Sau khi sua
- Loi nghiep vu du kien:
  - van tra truc tiep tai controller
  - vi du: 400, 403, 404
- Loi noi bo khong du kien:
  - controller goi `next(error)`
  - `errorHandler` tra:
    - status `500`
    - body `{ "message": "Internal server error" }`
- Ngoai le cho chatbot:
  - controller map mot so nhom loi thanh message than thien
  - nhung khong tra loi raw tu Gemini

# Manual Test Checklist
- [x] Loi noi bo o cart khong lo `error.message`
- [x] Loi noi bo o wishlist khong lo `error.message`
- [x] Loi noi bo o review khong lo `error.message`
- [x] Loi noi bo o chat history khong lo `error.message`
- [x] Chatbot loi bat thuong tra message than thien, khong lo stack trace
- [ ] Test tay toan bo cac man hinh frontend lien quan

# Ket qua test tu dong
- Chay:
  - `cd backend`
  - `npm test -- routes/errorHandling.standardization.test.js routes/productRoutes.errorHandling.test.js`
- Ket qua:
  - `2` test files passed
  - `6` tests passed

# Van de con ton tai
- Chua quet lai toan bo tat ca controller khac trong du an de dong bo 100%.
- Chua co middleware phan loai loi ung dung thanh custom error class.
- Frontend hien tai van co the hien thi nhieu message rieng le theo tung trang, chua co xu ly thong bao loi tap trung.

# Ghi chu phuc vu bao ve do an
- Day la buoc quan trong de tranh lo thong tin noi bo he thong.
- Cach lam nay phu hop voi thong le backend:
  - business error xu ly tai controller
  - internal error dua qua global error handler
- Chatbot la truong hop dac biet:
  - van can than thien voi nguoi dung
  - nhung khong duoc lo loi raw cua Gemini hay ha tang noi bo
