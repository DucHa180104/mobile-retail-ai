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
      "Cảm ơn bạn đã đặt hàng tại Mạnh Hường.",
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
        <p>Cảm ơn bạn đã đặt hàng tại <strong>Mạnh Hường</strong>.</p>
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
