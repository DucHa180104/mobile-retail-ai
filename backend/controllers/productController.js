import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const { keyword = "", brand = "", condition = "", sort = "newest" } = req.query;
    const query = {};

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

    const sortOptions = getProductSort(sort);
    const products = await Product.find(query).sort(sortOptions);
    res.status(200).json(products);
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
