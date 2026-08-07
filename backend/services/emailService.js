import nodemailer from "nodemailer";

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Support Gmail SMTP if GMAIL_USER & GMAIL_APP_PASS are provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: String(process.env.GMAIL_USER).trim(),
        pass: String(process.env.GMAIL_APP_PASS).replace(/\s+/g, "")
      }
    });
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
    throw new Error("Missing email environment variables (Gmail or Mailtrap)");
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

async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const fromAddress = process.env.RESEND_FROM || "Mạnh Hương Mobile <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error?.message || "Lỗi gửi mail từ Resend API");
    }

    return data;
  }

  const transporter = getTransporter();
  return await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.GMAIL_USER || "no-reply@manhhuongmobile.com",
    to,
    subject,
    text,
    html
  });
}

export async function sendOrderConfirmationEmail(order, recipientEmail) {
  if (!recipientEmail) {
    throw new Error("Recipient email is missing");
  }

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

  await sendEmail({
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

  const userName = user.name || "Khách hàng";

  await sendEmail({
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

export async function sendOrderCancelledCustomerEmail(order, recipientEmail) {
  if (!recipientEmail) return;

  const orderCode = `#${String(order._id).slice(-8).toUpperCase()}`;
  const isPaid = order.paymentStatus === "refunded" || order.paymentStatus === "paid";

  await sendEmail({
    to: recipientEmail,
    subject: `[Mạnh Hương Mobile] Thông báo HỦY ĐƠN HÀNG ${orderCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #e11d48; margin-bottom: 16px;">Đơn hàng ${escapeHtml(orderCode)} đã được HỦY thành công</h2>
        <p>Xin chào <strong>${escapeHtml(order.shippingInfo?.fullName || order.customerName || "Quý khách")}</strong>,</p>
        <p>Hệ thống Mạnh Hương Mobile xin thông báo đơn hàng của bạn đã chuyển sang trạng thái <strong>ĐÃ HỦY</strong>.</p>
        
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #9f1239;">Thông tin chi tiết:</h4>
          <p style="margin: 4px 0;"><strong>Mã đơn hàng:</strong> ${escapeHtml(orderCode)}</p>
          <p style="margin: 4px 0;"><strong>Tổng thanh toán:</strong> ${escapeHtml(formatCurrency(order.totalAmount))}</p>
          <p style="margin: 4px 0;"><strong>Trạng thái thanh toán:</strong> ${isPaid ? "Đã hoàn tiền / Đang xử lý hoàn khoản" : "Chưa thanh toán"}</p>
        </div>

        ${
          isPaid
            ? `<div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #0369a1; font-size: 13px;">
                  💡 <strong>Quy trình hoàn tiền:</strong> Bộ phận CSKH của shop sẽ chủ động gọi tới SĐT <strong>${escapeHtml(order.shippingInfo?.phoneNumber || order.phoneNumber || "")}</strong> để hỗ trợ hoàn tiền nhanh nhất trong vòng 24h.
                </p>
               </div>`
            : ""
        }

        <p>Nếu bạn không thực hiện thao tác này hoặc có bất kỳ thắc mắc nào, vui lòng liên hệ Hotline: <strong>035.771.2853</strong> để được trợ giúp ngay.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Mạnh Hương Mobile - Cảm ơn quý khách đã tin tưởng dịch vụ của chúng tôi!</p>
      </div>
    `
  });
}

export async function sendOrderCancelledAdminAlert(order, adminEmail) {
  const targetEmail = adminEmail || process.env.ADMIN_ALERT_EMAIL || process.env.GMAIL_USER;
  if (!targetEmail) return;

  const orderCode = `#${String(order._id).slice(-8).toUpperCase()}`;
  const isPaid = order.paymentStatus === "refunded" || order.paymentStatus === "paid";

  await sendEmail({
    to: targetEmail,
    subject: `🚨 [KHẨN CẤP ADMIN] Đơn hàng ${orderCode} VỪA BỊ HỦY ${isPaid ? "(CẦN HOÀN TIỀN GẤP)" : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; border: 2px solid #e11d48; border-radius: 12px; padding: 24px;">
        <h2 style="color: #e11d48; margin-bottom: 16px;">⚠️ CẢNH BÁO ADMIN: CÓ ĐƠN HÀNG VỪA BỊ HỦY</h2>
        <p>Có 1 đơn hàng trên hệ thống vừa chuyển sang trạng thái <strong>HỦY ĐƠN</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a;">Thông tin khách hàng & Đơn hàng:</h4>
          <p style="margin: 4px 0;"><strong>Mã đơn hàng:</strong> ${escapeHtml(orderCode)}</p>
          <p style="margin: 4px 0;"><strong>Tên khách hàng:</strong> ${escapeHtml(order.shippingInfo?.fullName || order.customerName || "Chưa cập nhật")}</p>
          <p style="margin: 4px 0;"><strong>Số điện thoại:</strong> ${escapeHtml(order.shippingInfo?.phoneNumber || order.phoneNumber || "Chưa cập nhật")}</p>
          <p style="margin: 4px 0;"><strong>Email liên hệ:</strong> ${escapeHtml(order.contactEmail || "Chưa cập nhật")}</p>
          <p style="margin: 4px 0;"><strong>Tổng giá trị đơn:</strong> <span style="color: #e11d48; font-weight: bold;">${escapeHtml(formatCurrency(order.totalAmount))}</span></p>
          <p style="margin: 4px 0;"><strong>Hình thức thanh toán:</strong> ${escapeHtml(formatPaymentMethod(order.paymentMethod))}</p>
        </div>

        ${
          isPaid
            ? `<div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 8px 0; color: #991b1b;">🔥 YÊU CẦU XỬ LÝ HOÀN TIỀN GẤP:</h4>
                <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
                  Đơn hàng này <strong>ĐÃ THANH TOÁN TIỀN TRƯỚC</strong>! Vui lòng liên hệ SĐT <strong>${escapeHtml(order.shippingInfo?.phoneNumber || order.phoneNumber)}</strong> để lấy STK ngân hàng và chuyển khoản trả tiền lại cho khách nhanh nhất.
                </p>
               </div>`
            : `<p style="color: #475569; font-size: 13px;">Đơn hàng thanh toán COD (Chưa trả tiền). Hệ thống đã tự động cộng trả lại số lượng tồn kho sản phẩm.</p>`
        }

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Mạnh Hương Mobile Admin Alert System</p>
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
