import Product from "../models/Product.js";
import User from "../models/User.js";

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("wishlist")
      .populate("wishlist");

    return res.json({
      wishlist: user?.wishlist || []
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể tải danh sách yêu thích"
    });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Thiếu productId"
      });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
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
    return res.status(500).json({
      message: "Không thể cập nhật danh sách yêu thích"
    });
  }
};
