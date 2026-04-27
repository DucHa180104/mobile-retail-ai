import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { customerName, phoneNumber, address, note, items, totalAmount } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items must not be empty" });
    }

    const order = await Order.create({
      customerName,
      phoneNumber,
      address,
      note,
      items,
      totalAmount
    });

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
