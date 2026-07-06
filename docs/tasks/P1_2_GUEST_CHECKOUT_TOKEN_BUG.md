# Task Name
P1.2 - Guest checkout khong bi chan boi token cu/het han

# Status
DONE

# Last Updated
2026-07-04

# Muc tieu
- Dam bao khach vang lai van dat hang duoc du may con token cu.
- Khong bien route guest checkout thanh route "gan nhu bat buoc dang nhap".
- Giu nguyen hanh vi hien tai voi user dang nhap hop le.

# File da sua
- `backend/middleware/authMiddleware.js`
- `backend/routes/orderRoutes.optionalAuthGuestCheckout.test.js`

# Van de goc
- `POST /api/orders` dung middleware `protectOptional`.
- Frontend checkout neu con `token` thi van gui header `Authorization`.
- Neu token da het han hoac khong hop le:
  - `protectOptional` cu tra `401`
  - guest checkout bi chan, du user dang muon mua hang nhu khach vang lai

# Logic cu
- Khong co token:
  - `next()`
- Token hop le:
  - gan `req.user`
  - `next()`
- Token sai / het han:
  - tra `401 Not authorized, token is invalid`
- User trong token khong ton tai:
  - tra `401 Not authorized, user not found`

# Logic moi
- Khong co token:
  - `next()`
- Token hop le:
  - gan `req.user`
  - `next()`
- Token sai / het han:
  - bo qua auth optional
  - khong tra `401`
  - `next()` de route tiep tuc nhu guest
- User trong token khong ton tai:
  - bo qua auth optional
  - `next()` de route tiep tuc nhu guest

# Vi sao sua nhu vay
- `protectOptional` dung ban chat la middleware "co token hop le thi nhan user, khong thi van cho di tiep".
- Route tao don hang cho phep guest checkout, nen token cu khong duoc phep pha flow nay.
- Neu token hop le thi van phai giu hanh vi gan `req.user` de order login van lien ket voi user.

# Luong du lieu sau khi sua
1. Frontend goi `POST /api/orders`
2. Neu may con token cu, request van gui `Authorization`
3. `protectOptional` doc token
4. Neu token hop le:
   - gan `req.user`
   - vao `createOrder` voi tu cach user da dang nhap
5. Neu token het han / sai / user khong con ton tai:
   - khong chan request
   - vao `createOrder` voi tu cach guest
6. Order van tao thanh cong

# Manual Test Checklist
- [x] Co token het han trong header van dat order guest duoc
- [x] Order guest tao ra co `user = null`
- [x] Stock van bi tru dung khi guest checkout
- [x] Token hop le van tao order co lien ket `user`
- [ ] Test tay tren frontend voi localStorage token cu that su

# Ket qua test tu dong
- Chay:
  - `cd backend`
  - `npm test -- routes/orderRoutes.optionalAuthGuestCheckout.test.js`
- Ket qua:
  - `1` test file passed
  - `2` tests passed

# Ghi chu bao ve do an
- Day la mot bug UX + auth rat de gap trong thuc te:
  - user tung dang nhap
  - token het han
  - quay lai mua guest
  - he thong chan oan
- Cach sua dung la:
  - route optional auth chi xac thuc neu token hop le
  - token loi thi khong duoc bien thanh loi chan guest flow
