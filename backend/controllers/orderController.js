import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { createOrderCreatedNotification } from "../services/adminNotificationService.js";
import {
  sendOrderConfirmationEmail,
  sendOrderCancelledCustomerEmail,
  sendOrderCancelledAdminAlert
} from "../services/emailService.js";

const allowedOrderStatuses = ["pending", "confirmed", "cancelled"];
const VALID_ORDER_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: []
};

export const createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      note,
      contactEmail,
      shippingInfo,
      items,
      paymentMethod = "cod"
    } = req.body;
    const allowedPaymentMethods = ["cod", "bank_transfer", "online_mock"];
    const normalizedEmail = String(contactEmail || req.user?.email || "")
      .trim()
      .toLowerCase();
    const normalizedShippingInfo = {
      fullName: shippingInfo?.fullName?.trim() || customerName?.trim() || "",
      phoneNumber: shippingInfo?.phoneNumber?.trim() || phoneNumber?.trim() || "",
      address: shippingInfo?.address?.trim() || address?.trim() || "",
      city: shippingInfo?.city?.trim() || "",
      district: shippingInfo?.district?.trim() || "",
      ward: shippingInfo?.ward?.trim() || "",
      note: shippingInfo?.note?.trim() || note?.trim() || ""
    };

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Contact email is required" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Contact email is invalid" });
    }

    if (!normalizedShippingInfo.fullName) {
      return res.status(400).json({ message: "Shipping full name is required" });
    }

    if (!normalizedShippingInfo.phoneNumber) {
      return res.status(400).json({ message: "Shipping phone number is required" });
    }

    if (!normalizedShippingInfo.address) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items must not be empty" });
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const normalizedRequestItems = items.map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Number(item.quantity || 0)
    }));

    for (const item of normalizedRequestItems) {
      if (!item.productId) {
        return res.status(400).json({ message: "Product id is required" });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: "Item quantity must be at least 1" });
      }
    }

    const paymentData = getPaymentData(paymentMethod);
    const session = await mongoose.startSession();
    let order = null;

    try {
      await session.withTransaction(async () => {
        const orderItems = [];
        let calculatedTotalAmount = 0;

        for (const item of normalizedRequestItems) {
          const product = await Product.findById(item.productId).session(session);

          if (!product) {
            throw createHttpError(400, `Product not found for item ${item.productId}`);
          }

          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: { $gte: item.quantity }
            },
            {
              $inc: { stock: -item.quantity }
            },
            {
              returnDocument: "after",
              session
            }
          );

          if (!updatedProduct) {
            throw createHttpError(400, `${product.name} khong du hang trong kho`);
          }

          const orderItem = {
            productId: product._id,
            name: product.name,
            price: Number(product.price || 0),
            quantity: item.quantity,
            image: product.images?.[0] || ""
          };

          orderItems.push(orderItem);
          calculatedTotalAmount += orderItem.price * orderItem.quantity;
        }

        [order] = await Order.create(
          [
            {
              user: req.user?._id || null,
              contactEmail: normalizedEmail,
              shippingInfo: normalizedShippingInfo,
              customerName: normalizedShippingInfo.fullName,
              phoneNumber: normalizedShippingInfo.phoneNumber,
              address: normalizedShippingInfo.address,
              note: normalizedShippingInfo.note,
              items: orderItems,
              totalAmount: calculatedTotalAmount,
              paymentMethod,
              paymentStatus: paymentData.paymentStatus,
              paidAt: paymentData.paidAt,
              transactionId: paymentData.transactionId
            }
          ],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    try {
      await sendOrderConfirmationEmail(order, order.contactEmail);
    } catch (emailError) {
      console.error("Order confirmation email error:", emailError.message);
    }

    try {
      await createOrderCreatedNotification(order);
    } catch (notificationError) {
      console.error("Create order notification error:", notificationError.message);
    }

    res.status(201).json(order);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const filters = buildStatusFilter(req.query.status);
    const orders = await Order.find(filters).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const userOrEmailOrPhone = [{ user: req.user._id }];

    if (req.user?.email) {
      userOrEmailOrPhone.push({ contactEmail: req.user.email.toLowerCase().trim() });
    }

    if (req.user?.phoneNumber) {
      userOrEmailOrPhone.push({ phoneNumber: req.user.phoneNumber.trim() });
    }

    const statusFilter = buildStatusFilter(req.query.status);
    const query = {
      $or: userOrEmailOrPhone,
      ...statusFilter
    };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = order.user && String(order.user) === String(req.user?._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You do not have permission to view this order" });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!allowedOrderStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
          throw createHttpError(404, "Order not found");
        }

        if (order.status === status) {
          updatedOrder = order;
          return;
        }

        const allowedNextStatuses = VALID_ORDER_STATUS_TRANSITIONS[order.status] || [];

        if (!allowedNextStatuses.includes(status)) {
          throw createHttpError(
            400,
            `Khong the chuyen trang thai don hang tu '${order.status}' sang '${status}'`
          );
        }

        if (status === "cancelled") {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.productId,
              {
                $inc: { stock: item.quantity }
              },
              { session }
            );
          }
          if (order.paymentStatus === "paid") {
            order.paymentStatus = "refunded";
          }
        }

        order.status = status;
        await order.save({ session });
        updatedOrder = order;
      });
    } finally {
      await session.endSession();
    }

    if (status === "cancelled" && updatedOrder) {
      try {
        await sendOrderCancelledCustomerEmail(updatedOrder, updatedOrder.contactEmail);
        await sendOrderCancelledAdminAlert(updatedOrder);
      } catch (emailError) {
        console.error("Order cancellation email alert error:", emailError.message);
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

export const cancelMyOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
          throw createHttpError(404, "Đơn hàng không tồn tại");
        }

        const isOwner = order.user && String(order.user) === String(req.user?._id);
        const isGuestEmailOwner =
          !order.user && order.contactEmail === req.user?.email?.toLowerCase();

        if (!isOwner && !isGuestEmailOwner) {
          throw createHttpError(403, "Bạn không có quyền hủy đơn hàng này");
        }

        if (order.status !== "pending") {
          throw createHttpError(
            400,
            "Chỉ có thể hủy đơn hàng khi đơn hàng đang ở trạng thái Chờ xác nhận"
          );
        }

        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: { stock: item.quantity }
            },
            { session }
          );
        }

        order.status = "cancelled";
        if (order.paymentStatus === "paid") {
          order.paymentStatus = "refunded";
        }
        await order.save({ session });
        updatedOrder = order;
      });
    } finally {
      await session.endSession();
    }

    if (updatedOrder) {
      try {
        await sendOrderCancelledCustomerEmail(updatedOrder, updatedOrder.contactEmail);
        await sendOrderCancelledAdminAlert(updatedOrder);
      } catch (emailError) {
        console.error("Order cancellation email alert error:", emailError.message);
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    next(error);
  }
};

function getPaymentData(paymentMethod) {
  if (paymentMethod === "bank_transfer") {
    return {
      paymentStatus: "pending",
      paidAt: null,
      transactionId: ""
    };
  }

  if (paymentMethod === "online_mock") {
    return {
      paymentStatus: "paid",
      paidAt: new Date(),
      transactionId: `MOCK-${Date.now()}`
    };
  }

  return {
    paymentStatus: "unpaid",
    paidAt: null,
    transactionId: ""
  };
}

function buildStatusFilter(status) {
  if (!status || status === "all") {
    return {};
  }

  if (!allowedOrderStatuses.includes(status)) {
    return {};
  }

  return { status };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
