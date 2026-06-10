import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const {
      keyword = "",
      brand = "",
      condition = "",
      storage = "",
      minPrice = "",
      maxPrice = "",
      sort = "newest",
      page = "1",
      limit = "6"
    } = req.query;
    const query = {};
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Number.parseInt(limit, 10) || 6);
    const skip = (pageNumber - 1) * limitNumber;
    const minPriceNumber = Number.parseInt(minPrice, 10);
    const maxPriceNumber = Number.parseInt(maxPrice, 10);

    if (keyword.trim()) {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: "i" } },
        { brand: { $regex: keyword.trim(), $options: "i" } }
      ];
    }

    if (brand.trim()) {
      query.brand = { $regex: `^${escapeRegex(brand.trim())}$`, $options: "i" };
    }

    if (condition.trim()) {
      query.condition = condition.trim();
    }

    if (storage.trim()) {
      query["specs.storage"] = { $regex: `^${escapeRegex(storage.trim())}$`, $options: "i" };
    }

    if (Number.isFinite(minPriceNumber) || Number.isFinite(maxPriceNumber)) {
      query.price = {};

      if (Number.isFinite(minPriceNumber)) {
        query.price.$gte = minPriceNumber;
      }

      if (Number.isFinite(maxPriceNumber)) {
        query.price.$lte = maxPriceNumber;
      }
    }

    const sortOptions = getProductSort(sort);
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOptions).skip(skip).limit(limitNumber);
    const totalPages = Math.max(1, Math.ceil(totalProducts / limitNumber));

    res.status(200).json({
      products,
      currentPage: pageNumber,
      totalPages,
      totalProducts,
      pageSize: limitNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getProductSort(sort) {
  if (sort === "price_asc") {
    return { price: 1 };
  }

  if (sort === "price_desc") {
    return { price: -1 };
  }

  return { createdAt: -1 };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
