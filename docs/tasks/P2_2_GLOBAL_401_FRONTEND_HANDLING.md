# Task Name
P2.2 - Xu ly 401 toan cuc o frontend

# Status
DONE

# Last Updated
2026-07-07

# Muc tieu
- Khong de moi trang tu xu ly token het han mot cach roi rac.
- Khi request co token ma bi `401`, frontend tu logout sach.
- Dua nguoi dung ve trang dang nhap voi thong bao de hieu.
- Neu tai khoan bi khoa (`403` phu hop) thi cung xu ly than thien.

# File da sua
- `client/src/lib/api.js`
- `client/src/context/AuthContext.jsx`
- `client/src/pages/LoginPage.jsx`

# Van de goc
- Truoc day frontend chi `fetch` tung trang.
- Neu backend tra `401`, moi trang tu bat loi va hien thong bao rieng.
- Khong co co che logout tap trung.
- Khong co redirect thong nhat ve login.

# Giai phap da lam
## 1. Tao global fetch auth handler
- Cai trong `client/src/lib/api.js`
- Handler nay:
  - boc `window.fetch`
  - neu request co `Authorization`
  - va response la `401`
  - thi phat mot event toan cuc

## 2. AuthContext nghe event auth failure
- `AuthContext` dang ky listener
- Khi co event:
  - xoa user/token trong state
  - xoa localStorage
  - chuyen ve `/login`

## 3. LoginPage hien message than thien
- Message duoc luu tam trong `sessionStorage`
- Login page doc ra khi mount
- User nhin thay ly do bi dua ve login

# Cac truong hop dang xu ly
- Token het han -> thong bao dang nhap lai
- Token khong hop le -> thong bao dang nhap lai
- Tai khoan bi khoa -> thong bao lien he quan tri vien

# Manual Test Checklist
- [ ] Dang nhap tai khoan binh thuong
- [ ] Sua token trong localStorage thanh token sai / het han
- [ ] Vao trang can auth nhu `/profile` hoac `/my-orders`
- [ ] Frontend tu logout va chuyen ve `/login`
- [ ] Login page hien message "Phien dang nhap da het han..."
- [ ] Ban tai khoan tu admin
- [ ] Dung token cu de vao route can auth
- [ ] Frontend tu dua ve login va hien message tai khoan bi khoa

# Ghi chu phuc vu bao ve do an
- Day la buoc nang cap UX + auth flow:
  - khong chi chan o backend
  - ma frontend cung phan ung thong nhat
- Loi the cua cach lam nay:
  - khong phai copy-paste xu ly `401` o tung page
  - de bao tri hon
