import Product from "../models/Product.js";
import User from "../models/User.js";

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.productId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      cartItems: formatCartItems(user.cart)
    });
  } catch (error) {
    return next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (Number(quantity) < 1) {
      return res.status(400).json({ message: "quantity must be at least 1" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingItem = user.cart.find((item) => String(item.productId) === String(productId));

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      user.cart.unshift({
        productId: product._id,
        quantity: Number(quantity)
      });
    }

    await user.save();
    await user.populate("cart.productId");

    return res.status(200).json({
      cartItems: formatCartItems(user.cart)
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const itemIndex = user.cart.findIndex((item) => String(item.productId) === String(productId));

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (Number(quantity) < 1) {
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = Number(quantity);
    }

    await user.save();
    await user.populate("cart.productId");

    return res.status(200).json({
      cartItems: formatCartItems(user.cart)
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = user.cart.filter((item) => String(item.productId) !== String(productId));
    await user.save();
    await user.populate("cart.productId");

    return res.status(200).json({
      cartItems: formatCartItems(user.cart)
    });
  } catch (error) {
    return next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({
      cartItems: []
    });
  } catch (error) {
    return next(error);
  }
};

export const syncCart = async (req, res, next) => {
  try {
    const { cartItems = [] } = req.body;
    const normalizedItems = normalizeIncomingCartItems(cartItems);

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newCartItems = [];

    for (const incomingItem of normalizedItems) {
      const existingItem = user.cart.find(
        (item) => String(item.productId) === String(incomingItem.productId)
      );

      if (existingItem) {
        existingItem.quantity += incomingItem.quantity;
      } else {
        newCartItems.push({
          productId: incomingItem.productId,
          quantity: incomingItem.quantity
        });
      }
    }

    if (newCartItems.length > 0) {
      user.cart = [...newCartItems, ...user.cart];
    }

    await user.save();
    await user.populate("cart.productId");

    return res.status(200).json({
      cartItems: formatCartItems(user.cart)
    });
  } catch (error) {
    return next(error);
  }
};

function formatCartItems(cart) {
  return (cart || [])
    .filter((item) => item.productId)
    .map((item) => ({
      ...item.productId.toObject(),
      quantity: item.quantity
    }));
}

function normalizeIncomingCartItems(cartItems) {
  const mergedMap = new Map();

  for (const item of cartItems) {
    const productId = item?._id || item?.productId;
    const quantity = Number(item?.quantity || 0);

    if (!productId || quantity < 1) {
      continue;
    }

    const currentQuantity = mergedMap.get(String(productId)) || 0;
    mergedMap.set(String(productId), currentQuantity + quantity);
  }

  return Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));
}
