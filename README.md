# Mobile Retail AI

Website ban dien thoai xay dung bang MERN stack. He thong tap trung vao ban dien thoai moi/cu, gio hang, dat hang, quan tri san pham - don hang va tinh nang thu cu doi moi voi cong thuc dinh gia demo.

## Cong nghe su dung

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Xac thuc: JWT, bcryptjs
- Database: MongoDB local hoac MongoDB Atlas

## Chuc nang chinh

- Khach hang xem danh sach san pham, tim kiem, loc theo hang/tinh trang va sap xep theo gia.
- Xem chi tiet san pham gom thong so ky thuat, tinh trang may cu, anh va ton kho.
- Them vao gio hang, cap nhat so luong va dat hang.
- Dang ky, dang nhap va xem lich su don hang cua tai khoan.
- Trang thu cu doi moi tinh gia tam tinh theo model, dung luong, pin, man hinh, ngoai hinh va phu kien.
- Admin xem dashboard, quan ly san pham, them/sua/xoa san pham va cap nhat trang thai don hang.

## Cau truc thu muc

```text
mobile-retail-ai/
  backend/              Express API, MongoDB models, controllers, routes
  backend/seed/         Du lieu demo va tai khoan demo
  client/               React + Vite frontend
  docs/screenshots/     Anh chup man hinh demo cho bao cao
```

## Yeu cau moi truong

- Node.js 20+
- npm
- MongoDB local hoac MongoDB Atlas

## Cai dat backend

```bash
cd backend
npm install
```

Tao file `.env` trong thu muc `backend` dua theo `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mobile-retail-ai
JWT_SECRET=change-this-secret-before-production
JWT_EXPIRES_IN=7d
```

Chay backend:

```bash
npm run dev
```

Backend mac dinh chay tai:

```text
http://localhost:5000
```

## Cai dat frontend

```bash
cd client
npm install
npm run dev
```

Frontend thuong chay tai:

```text
http://localhost:5173
```

## Du lieu demo

Seeder se xoa du lieu san pham va user demo cu, sau do tao lai:

- 6 san pham dien thoai demo.
- 1 tai khoan admin.
- 1 tai khoan khach hang.

Chay seed:

```bash
cd backend
npm run seed
```

Tai khoan demo:

| Vai tro | Email | Mat khau |
| --- | --- | --- |
| Admin | `admin@example.com` | `admin123` |
| Khach hang | `user@example.com` | `user123` |

Duong dan admin:

```text
http://localhost:5173/admin/dashboard
```

## API chinh

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `GET` | `/api/products` | Lay danh sach san pham, ho tro keyword/brand/condition/sort |
| `GET` | `/api/products/:id` | Lay chi tiet san pham |
| `POST` | `/api/products` | Tao san pham, yeu cau admin |
| `PUT` | `/api/products/:id` | Cap nhat san pham, yeu cau admin |
| `DELETE` | `/api/products/:id` | Xoa san pham, yeu cau admin |
| `POST` | `/api/auth/register` | Dang ky tai khoan |
| `POST` | `/api/auth/login` | Dang nhap |
| `POST` | `/api/orders` | Tao don hang |
| `GET` | `/api/orders` | Lay tat ca don hang, yeu cau admin |
| `GET` | `/api/orders/my-orders` | Lay don hang cua tai khoan dang nhap |
| `PATCH` | `/api/orders/:id/status` | Cap nhat trang thai don hang, yeu cau admin |
| `POST` | `/api/tradein/estimate` | Tinh gia thu cu doi moi tam tinh |

## Anh chup man hinh

Dat anh demo vao `docs/screenshots/` theo ten file trong `docs/screenshots/README.md`.

| Man hinh | Anh |
| --- | --- |
| Trang chu | `docs/screenshots/home.png` |
| Danh sach dien thoai | `docs/screenshots/phones.png` |
| Chi tiet san pham | `docs/screenshots/product-detail.png` |
| Thanh toan | `docs/screenshots/checkout.png` |
| Thu cu doi moi | `docs/screenshots/trade-in.png` |
| Admin dashboard | `docs/screenshots/admin-dashboard.png` |
| Admin san pham | `docs/screenshots/admin-products.png` |
| Admin don hang | `docs/screenshots/admin-orders.png` |

Cu phap chen anh vao bao cao Markdown:

```md
![Trang chu](docs/screenshots/home.png)
```

## Lenh huu ich

Backend:

```bash
npm run dev
npm run start
npm run seed
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## Ghi chu cho bao ve

- Neu demo admin, hay seed du lieu truoc va dang nhap bang `admin@example.com`.
- Neu demo lich su don hang, dang nhap bang `user@example.com`, dat hang va vao trang "Don hang cua toi".
- Tinh nang thu cu doi moi hien la cong thuc demo rule-based, chua phai model AI/ML that.
