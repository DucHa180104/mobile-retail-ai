import Product from "../models/Product.js";
import User from "../models/User.js";

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("wishlist").populate("wishlist");

    return res.json({
      wishlist: user?.wishlist || []
    });
  } catch (error) {
    return next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Thieu productId"
      });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({
        message: "Khong tim thay san pham"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Khong tim thay nguoi dung"
      });
    }

    const isWishlisted = user.wishlist.some((item) => item.toString() === productId);

    if (isWishlisted) {
      user.wishlist = user.wishlist.filter((item) => item.toString() !== productId);
    } else {
      user.wishlist.push(product._id);
    }

    await user.save();
    await user.populate("wishlist");

    return res.json({
      isWishlisted: !isWishlisted,
      wishlist: user.wishlist
    });
  } catch (error) {
    return next(error);
  }
};
