# Task Name
P1.3 - Lam ro hanh vi nut mua tren trang danh sach

# Status
DONE

# Last Updated
2026-07-06

# Muc tieu
- Dam bao nhan nut tren card san pham khop voi hanh vi that.
- Khong de hoi dong hoac nguoi dung bam nut "Mua ngay" nhung thuc te lai khong mua ngay.
- Uu tien cho nguoi dung vao trang chi tiet de xem ky tinh trang may truoc khi quyet dinh.

# File da sua
- `client/src/components/ProductCard.jsx`
- `client/src/pages/PhonesPage.jsx`
- `client/src/pages/ProductListPage.jsx`

# Hien trang sau khi chot task
- O trang danh sach san pham:
  - nut chinh tren card la `Xem chi tiet`
  - nut mui ten phu cung di toi trang chi tiet
- O `PhonesPage`:
  - card danh muc cung da dung `Xem chi tiet`
- O `ProductDetailPage`:
  - van giu `Mua ngay` vi day moi la noi nguoi dung da xem du thong tin va co hanh dong mua that

# Noi dung thay doi
- Chot UX theo huong:
  - card danh sach khong mua ngay truc tiep
  - card danh sach chi dan nguoi dung vao `/products/:id`
- Don sach code o `ProductListPage.jsx`:
  - bo `useCart`
  - bo prop `onAddToCart` da khong con duoc su dung

# Logic truoc va sau
## Truoc day
- Nut tren card tung gay nham lan:
  - ten hien thi kieu "Mua ngay"
  - nhung hanh vi that chi la mo trang chi tiet
  - hoac trong mot so giai doan la them vao gio

## Sau khi chot
- Card danh sach:
  - nhan = `Xem chi tiet`
  - hanh vi = mo trang chi tiet
- Trang chi tiet:
  - nhan = `Mua ngay`
  - hanh vi = mua that theo flow hien tai

# Vi sao huong nay hop ly
- Web ban dien thoai cu can nguoi dung xem ky:
  - tinh trang may
  - pin
  - ngoai hinh
  - bao hanh
  - ghi chu may
- Vi vay o trang danh sach, `Xem chi tiet` la trung thuc va hop ly hon `Mua ngay`.

# Manual Test Checklist
- [ ] Vao trang chu, bam nut chinh tren card san pham
- [ ] He thong di dung toi `/products/:id`
- [ ] Khong tu them san pham vao gio
- [ ] Vao `/phones`, bam nut `Xem chi tiet` tren card
- [ ] He thong di dung toi `/products/:id`
- [ ] Nut mui ten phu van mo dung trang chi tiet
- [ ] O trang chi tiet, nut `Mua ngay` van hoat dong nhu cu

# Ket qua test
- Da ra soat lai code va chot hanh vi thong nhat.
- Chua ghi nhan test tay toan bo checklist trong lan cap nhat nay.

# Ghi chu phuc vu bao ve do an
- Day la task UX quan trong:
  - sua ten nut de trung voi hanh vi
  - tranh giang vien bam vao thay "noi mot dang, lam mot neo"
- Cach trinh bay gon:
  - "O trang danh sach, chau chu dong doi ve Xem chi tiet vi san pham may cu can xem ky truoc khi mua. Nut Mua ngay chi de o trang chi tiet, noi nguoi dung da co du thong tin."
