import nodemailer from "nodemailer";

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const requiredValues = [
    process.env.MAILTRAP_HOST,
    process.env.MAILTRAP_PORT,
    process.env.MAILTRAP_USER,
    process.env.MAILTRAP_PASS,
    process.env.MAIL_FROM
  ];

  if (requiredValues.some((value) => !value)) {
    throw new Error("Mailtrap environment variables are missing");
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: Number(process.env.MAILTRAP_PORT),
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });

  return cachedTransporter;
}

export async function sendOrderConfirmationEmail(order, recipientEmail) {
  if (!recipientEmail) {
    throw new Error("Recipient email is missing");
  }

  const transporter = getTransporter();
  const orderCode = `#${String(order._id).slice(-8).toUpperCase()}`;
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN")
    : "Đang cập nhật";
  const paymentMethod = formatPaymentMethod(order.paymentMethod);
  const status = formatOrderStatus(order.status);
  const productLines = (order.items || [])
    .map(
      (item) =>
        `- ${item.name} | SL: ${item.quantity} | ${formatCurrency(item.price)}`
    )
    .join("\n");

  const htmlItems = (order.items || [])
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} - SL: ${item.quantity} - ${escapeHtml(
          formatCurrency(item.price)
        )}</li>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: recipientEmail,
    subject: `Xác nhận đơn hàng ${orderCode}`,
    text: [
      "Cảm ơn bạn đã đặt hàng tại Mạnh Hương.",
      "",
      `Mã đơn: ${orderCode}`,
      `Ngày đặt: ${orderDate}`,
      `Người nhận: ${order.shippingInfo?.fullName || order.customerName || "Đang cập nhật"}`,
      `Tổng tiền: ${formatCurrency(order.totalAmount)}`,
      `Trạng thái đơn: ${status}`,
      `Phương thức thanh toán: ${paymentMethod}`,
      "",
      "Danh sách sản phẩm:",
      productLines
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Xác nhận đơn hàng ${escapeHtml(orderCode)}</h2>
        <p>Cảm ơn bạn đã đặt hàng tại <strong>Mạnh Hương</strong>.</p>
        <p><strong>Mã đơn:</strong> ${escapeHtml(orderCode)}</p>
        <p><strong>Ngày đặt:</strong> ${escapeHtml(orderDate)}</p>
        <p><strong>Người nhận:</strong> ${escapeHtml(
          order.shippingInfo?.fullName || order.customerName || "Đang cập nhật"
        )}</p>
        <p><strong>Tổng tiền:</strong> ${escapeHtml(formatCurrency(order.totalAmount))}</p>
        <p><strong>Trạng thái đơn:</strong> ${escapeHtml(status)}</p>
        <p><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentMethod)}</p>
        <p><strong>Danh sách sản phẩm:</strong></p>
        <ul>${htmlItems}</ul>
      </div>
    `
  });
}

export async function sendWelcomeEmail(user, recipientEmail) {
  if (!recipientEmail) {
    throw new Error("Recipient email is missing");
  }

  const transporter = getTransporter();
  const userName = user.name || "Khách hàng";

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: recipientEmail,
    subject: "Chào mừng thành viên mới - Mạnh Hương Mobile",
    text: [
      `Chào ${userName},`,
      "",
      "Cảm ơn bạn đã đăng ký tài khoản thành viên tại Mạnh Hương Mobile.",
      "Tài khoản của bạn đã được kích hoạt thành công.",
      `Email đăng nhập: ${recipientEmail}`,
      `Số điện thoại: ${user.phoneNumber || "Chưa cập nhật"}`,
      "",
      "Bây giờ bạn có thể trải nghiệm mua sắm, tích lũy điểm thưởng và theo dõi đơn hàng của mình dễ dàng hơn.",
      "",
      "Trân trọng,",
      "Đội ngũ Mạnh Hương Mobile"
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">Chào mừng bạn đến với Mạnh Hương Mobile!</h2>
        <p>Chào <strong>${escapeHtml(userName)}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản thành viên tại hệ thống của chúng tôi.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #334155;">Thông tin tài khoản:</h4>
          <p style="margin: 4px 0;"><strong>Email đăng nhập:</strong> ${escapeHtml(recipientEmail)}</p>
          <p style="margin: 4px 0;"><strong>Số điện thoại:</strong> ${escapeHtml(user.phoneNumber || "Chưa cập nhật")}</p>
        </div>
        <p>Bây giờ bạn có thể trải nghiệm mua sắm trực tuyến, theo dõi trạng thái đơn hàng và tham gia các chương trình khuyến mãi đặc quyền dành cho thành viên.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đây là email tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.</p>
      </div>
    `
  });
}


function formatCurrency(value) {
  return `${(Number(value) || 0).toLocaleString("vi-VN")}đ`;
}

function formatPaymentMethod(paymentMethod) {
  if (paymentMethod === "bank_transfer") {
    return "Chuyển khoản ngân hàng";
  }

  if (paymentMethod === "online_mock") {
    return "Thanh toán online giả lập";
  }

  return "Thanh toán khi nhận hàng";
}

function formatOrderStatus(status) {
  if (status === "confirmed") {
    return "Đã xác nhận";
  }

  if (status === "cancelled") {
    return "Đã hủy";
  }

  return "Chờ xác nhận";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
