import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      note,
      shippingInfo,
      items,
      totalAmount,
      paymentMethod = "cod"
    } = req.body;
    const allowedPaymentMethods = ["cod", "bank_transfer", "online_mock"];
    const normalizedShippingInfo = {
      fullName: shippingInfo?.fullName?.trim() || customerName?.trim() || "",
      phoneNumber: shippingInfo?.phoneNumber?.trim() || phoneNumber?.trim() || "",
      address: shippingInfo?.address?.trim() || address?.trim() || "",
      city: shippingInfo?.city?.trim() || "",
      district: shippingInfo?.district?.trim() || "",
      ward: shippingInfo?.ward?.trim() || "",
      note: shippingInfo?.note?.trim() || note?.trim() || ""
    };

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

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    for (const item of items) {
      const product = productMap.get(String(item.productId));

      if (!product) {
        return res.status(400).json({
          message: `Product not found for item ${item.name || item.productId}`
        });
      }

      if ((product.stock ?? 0) < (item.quantity ?? 0)) {
        return res.status(400).json({
          message: `${product.name} không đủ hàng trong kho`
        });
      }
    }

    const paymentData = getPaymentData(paymentMethod);

    const order = await Order.create({
      user: req.user?._id || null,
      shippingInfo: normalizedShippingInfo,
      customerName: normalizedShippingInfo.fullName,
      phoneNumber: normalizedShippingInfo.phoneNumber,
      address: normalizedShippingInfo.address,
      note: normalizedShippingInfo.note,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentData.paymentStatus,
      paidAt: paymentData.paidAt,
      transactionId: paymentData.transactionId
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -Number(item.quantity || 0) }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "confirmed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
