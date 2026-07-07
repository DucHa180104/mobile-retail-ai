# Task Name
P2.4 - Dong bo so lieu tai lieu va du lieu demo

# Status
DONE

# Last Updated
2026-07-07

# Muc tieu
- Lam cho README va du lieu seed khop nhau hon.
- Tranh truong hop tai lieu noi so lieu mot dang, dashboard va database hien thi mot ne.
- Giup de giai thich bo du lieu demo khi bao ve.

# File da sua
- `README.md`
- `backend/seed/productsSeeder.js`
- `backend/seed/reviewTestSeeder.js`

# Van de goc
- Tai lieu truoc day mo ta bo seed con chung chung.
- Trong thuc te:
  - `productsSeeder.js` tao ra `39` san pham
  - `seed:review-test` bo sung them user va order test
- Neu README khong noi ro, nguoi doc de hieu sai quy mo demo data.

# Noi dung da dong bo
## README
- Ghi ro `npm run seed` tao:
  - `39` san pham demo
  - `1` admin demo
  - `1` user demo
- Ghi ro `npm run seed:review-test` bo sung:
  - `4` user test review
  - `8` don hang test

## Seeder logs
- `productsSeeder.js`
  - in ra tong so san pham demo
  - in ra tong so user demo
- `reviewTestSeeder.js`
  - in ra tong so user review test
  - in ra tong so order review test

# Y nghia
- Khi seed xong, terminal se noi ro da nap bao nhieu du lieu.
- README va bo data demo khop nhau hon.
- De hon cho:
  - nguoi huong dan
  - hoi dong bao ve
  - chinh ban khi reset lai du an

# Manual Test Checklist
- [ ] Chay `cd backend && npm run seed`
- [ ] Kiem tra terminal co in dung:
  - `Total demo products: 39`
  - `Total demo users: 2`
- [ ] Chay `cd backend && npm run seed:review-test`
- [ ] Kiem tra terminal co in dung:
  - `Total review test users: 4`
  - `Total review test orders: 8`
- [ ] Mo README va doi chieu lai noi dung

# Ghi chu phuc vu bao ve do an
- Day khong phai task doi logic nghiep vu, ma la task "lam sach demo data va tai lieu".
- Tac dung lon la tranh bi hoi:
  - "README ghi khac dashboard"
  - "Seed dang tao bao nhieu san pham?"
  - "Review test data de o dau?"
