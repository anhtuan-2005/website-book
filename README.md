# Book Review Website (NodeJS + MySQL)

Website đánh giá sách sử dụng NodeJS, ExpressJS và MySQL. Dự án hỗ trợ đăng ký, đăng nhập, tìm kiếm sách và gửi đánh giá.

## Yêu cầu
- NodeJS
- MySQL Server

## Cài đặt

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình Database:**
   - Mở file `.env`
   - Điền thông tin `DB_USER` và `DB_PASSWORD` của MySQL trên máy bạn.
   - (Tùy chọn) `DB_HOST` và `DB_NAME` nếu cần thay đổi.

3. **Khởi tạo Database:**
   Chạy lệnh sau để tạo database `book_review_db`, các bảng và dữ liệu mẫu:
   ```bash
   npm run db:setup
   ```
   *Nếu lệnh này lỗi, hãy kiểm tra lại user/password trong file .env*

## Chạy dự án

- **Chạy thông thường:**
  ```bash
  npm start
  ```

- **Chạy chế độ dev (tự động reload khi sửa code):**
  ```bash
  npm run dev
  ```

Truy cập: [http://localhost:3000](http://localhost:3000)

## Chạy dự án với Docker

1. **Yêu cầu**: Cài đặt Docker và Docker Compose.
2. **Chạy lệnh**:
   ```bash
   docker-compose up --build
   ```
   Lệnh này sẽ:
   - Khởi tạo MySQL container.
   - Build Node app.
   - Chờ MySQL sẵn sàng -> Chạy setup database -> Khởi động server.

3. **Truy cập**: [http://localhost:3000](http://localhost:3000)

## API Endpoints

- **Auth:**
  - `POST /api/register` (body: username, password)
  - `POST /api/login` (body: username, password)

- **Sách:**
  - `GET /api/books` (query: search)
  - `GET /api/books/:isbn`

- **Đánh giá:**
  - `POST /api/reviews` (header: Authorization Bearer token, body: isbn, score, comment)

## Kiểm thử
Sử dụng Postman để test các API trên. Đừng quên header `Authorization` cho các API cần đăng nhập.
