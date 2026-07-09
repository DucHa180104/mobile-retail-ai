## Task Name
UI Contact Page Redesign

## Status
DONE

## Last Updated
2026-07-09

## Muc tieu
- Thu gon trang lien he thanh bo cuc 2 cot ro rang.
- Tach phan gioi thieu/QR va phan chat ho tro thanh 2 khu vuc de nhin.
- Cho admin doi QR Zalo tu giao dien admin.

## Cac file da sua
- `client/src/pages/ContactPage.jsx`
- `client/src/pages/AdminSupportChatPage.jsx`
- `backend/server.js`

## Cac file da tao
- `backend/models/ContactSettings.js`
- `backend/controllers/contactSettingsController.js`
- `backend/routes/contactSettingsRoutes.js`

## Noi dung thay doi
- Tao API public lay cau hinh QR lien he.
- Tao API admin cap nhat QR Zalo.
- Trang lien he doi thanh bo cuc 2 cot:
  - cot trai: PR gon, hotline, email, dia chi, QR
  - cot phai: khung chat truc tiep
- Admin support chat co them form doi QR.

## Luong du lieu
- User vao `/contact` -> frontend goi `GET /api/contact-settings` -> lay QR hien tai -> render QR.
- Admin vao trang support chat -> sua URL QR -> frontend goi `PUT /api/contact-settings` -> backend luu MongoDB -> user reload trang lien he se thay QR moi.

## Manual Test Checklist
- [ ] Vao `/contact` thay bo cuc 2 cot gon hon
- [ ] Phan QR nam ben trai, phan chat nam ben phai
- [ ] QR fallback ve anh mac dinh neu chua co cau hinh
- [ ] Admin sua QR thanh cong tai `/admin/support-chat`
- [ ] User reload `/contact` thay QR moi

## Van de con ton tai
- Chua co uploader rieng cho QR ngay trong form admin, hien tai admin nhap URL hoac duong dan upload san co.

## Ghi chu bao ve do an
- Day la cach mo rong nhe, khong can dung module settings lon.
- QR da khong con hardcode cung trong frontend nhu truoc.
