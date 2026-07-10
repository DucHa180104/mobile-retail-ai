import AdminNotification from "../models/AdminNotification.js";

export async function createOrderCreatedNotification(order) {
  if (!order?._id) {
    return null;
  }

  const customerName =
    order.shippingInfo?.fullName || order.customerName || "Khách hàng";

  return AdminNotification.create({
    type: "order_created",
    title: "Đơn hàng mới",
    message: `${customerName} vừa tạo đơn hàng mới.`,
    targetUrl: `/admin/orders?orderId=${order._id}`,
    metadata: {
      orderId: order._id,
      userId: order.user || null
    }
  });
}

export async function createSupportMessageNotification({
  conversation,
  user,
  message
}) {
  if (!conversation?._id || !message?.content) {
    return null;
  }

  return AdminNotification.create({
    type: "support_message",
    title: "Tin nhắn hỗ trợ mới",
    message: `${user?.name || "Khách hàng"} vừa gửi tin nhắn cho shop.`,
    targetUrl: `/admin/support-chat?conversation=${conversation._id}`,
    metadata: {
      conversationId: conversation._id,
      userId: user?._id || conversation.user || null
    }
  });
}
