# Task Name
P1.5 - Fix update profile tranh mat du lieu shippingInfo

# Status
DONE

# Last Updated
2026-07-06

# Muc tieu
- Khong de API `PUT /api/auth/profile` xoa trang cac field shippingInfo khong duoc gui len.
- Chi update field nao request thuc su muon sua.
- Van cho phep user xoa mot field neu co y gui chuoi rong.

# File da sua
- `backend/controllers/authController.js`
- `backend/routes/authRoutes.profileUpdate.test.js`

# Van de goc
- Code cu gán de toan bo `user.shippingInfo`.
- Neu request chi gui 1 field, cac field con lai bi reset thanh `""`.
- Day la bug mat du lieu o backend.

# Logic cu
- Neu co `shippingInfo` trong body:
  - backend tao object moi
  - field nao khong co trong request se thanh `""`

# Logic moi
- Lay `shippingInfo` hien tai cua user
- Tao `nextShippingInfo` tu du lieu cu
- Duyet tung field hop le:
  - neu request co field do thi moi ghi de
  - neu request khong co thi giu nguyen gia tri cu
- Neu request co gui chuoi rong cho mot field:
  - van cho phep luu `""`

# Manual Test Checklist
- [x] Update chi `shippingInfo.fullName` -> cac field khac giu nguyen
- [x] Gui `shippingInfo.note = ""` -> note bi xoa, field khac giu nguyen
- [ ] Test tay tren trang `/profile`

# Ket qua test tu dong
- Chay:
  - `cd backend`
  - `npm test -- routes/authRoutes.profileUpdate.test.js`
- Ket qua:
  - `1` test file passed
  - `2` tests passed

# Ghi chu phuc vu bao ve do an
- Day la bug backend dang "ngam":
  - frontend hien tai thuong gui du field nen co the chua lo ngay
  - nhung ve thiet ke API thi van sai
- Cach sua dung la:
  - khong gán de toan bo object long nhau
  - chi update field nao request muon doi
