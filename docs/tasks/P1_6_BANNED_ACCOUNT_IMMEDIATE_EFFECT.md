# Task Name
P1.6 - Ban tai khoan co hieu luc ngay

# Status
DONE

# Last Updated
2026-07-06

# Muc tieu
- Khong de user bi khoa van dung duoc JWT cu den khi het han.
- Chac chan cac route can dang nhap bi chan ngay khi `isActive === false`.
- Khong pha guest flow o cac route dung `protectOptional`.

# File da sua
- `backend/middleware/authMiddleware.js`
- `backend/routes/authRoutes.banEnforcement.test.js`

# Van de goc
- Login da chan user bi khoa.
- Nhung middleware `protect` truoc day chi verify JWT va tim user.
- Neu token cu van con han thi user bi ban van truy cap duoc route protected.

# Logic moi
## protect
- Verify token
- Tim user
- Neu `user.isActive === false`
  - tra `403`
  - message: `Account has been disabled`

## protectOptional
- Verify token
- Tim user
- Neu user khong ton tai hoac `isActive === false`
  - khong gan `req.user`
  - `next()` nhu guest/public request

# Vi sao chon cach nay
- Route protected phai bi chan ngay khi tai khoan da bi khoa.
- Route optional auth nhu checkout guest khong nen bi vo chi vi may con token cu cua tai khoan da bi ban.
- Cach nay vua dam bao bao mat, vua khong lam vo cac public flow.

# Manual Test Checklist
- [x] User bi ban goi route `/api/auth/me` bang token cu -> bi chan `403`
- [x] Token cu cua user bi ban khong con duoc gan vao order qua `protectOptional`
- [ ] Test tay tren frontend:
  - dang nhap user
  - admin ban user
  - reload trang user
  - vao route can login xem co bi chan ngay khong

# Ket qua test tu dong
- Chay:
  - `cd backend`
  - `npm test -- routes/authRoutes.banEnforcement.test.js`
- Ket qua:
  - `1` test file passed
  - `2` tests passed

# Ghi chu phuc vu bao ve do an
- Day la bug session/auth rat thuc te:
  - login endpoint da chan
  - nhung token cu van song neu middleware protect khong kiem tra trang thai user
- Cach sua dung la:
  - kiem tra `isActive` trong middleware, khong chi trong login
