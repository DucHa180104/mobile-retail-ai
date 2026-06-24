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
    const productData = buildProductPayload(req.body);
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productData = buildProductPayload(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
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

function buildProductPayload(body = {}) {
  const payload = {};

  if (hasOwn(body, "name")) {
    payload.name = normalizeString(body.name);
  }

  if (hasOwn(body, "brand")) {
    payload.brand = normalizeString(body.brand);
  }

  if (hasOwn(body, "price")) {
    payload.price = normalizeNumber(body.price);
  }

  if (hasOwn(body, "stock")) {
    payload.stock = normalizeNumber(body.stock);
  }

  if (hasOwn(body, "condition")) {
    payload.condition = normalizeString(body.condition);
  }

  if (hasOwn(body, "images")) {
    payload.images = normalizeImages(body.images);
  }

  if (hasOwn(body, "description")) {
    payload.description = normalizeString(body.description);
  }

  if (hasOwn(body, "usedDetails")) {
    payload.usedDetails = pickUsedDetails(body.usedDetails);
  }

  if (hasOwn(body, "specs")) {
    payload.specs = pickSpecs(body.specs);
  }

  return payload;
}

function pickUsedDetails(usedDetails = {}) {
  const payload = {};

  if (hasOwn(usedDetails, "color")) {
    payload.color = normalizeString(usedDetails.color);
  }

  if (hasOwn(usedDetails, "batteryHealth")) {
    payload.batteryHealth = normalizeString(usedDetails.batteryHealth);
  }

  if (hasOwn(usedDetails, "warranty")) {
    payload.warranty = normalizeString(usedDetails.warranty);
  }

  if (hasOwn(usedDetails, "screenStatus")) {
    payload.screenStatus = normalizeString(usedDetails.screenStatus);
  }

  if (hasOwn(usedDetails, "bodyStatus")) {
    payload.bodyStatus = normalizeString(usedDetails.bodyStatus);
  }

  if (hasOwn(usedDetails, "faceIdStatus")) {
    payload.faceIdStatus = normalizeString(usedDetails.faceIdStatus);
  }

  if (hasOwn(usedDetails, "accessories")) {
    payload.accessories = normalizeString(usedDetails.accessories);
  }

  if (hasOwn(usedDetails, "repairHistory")) {
    payload.repairHistory = normalizeString(usedDetails.repairHistory);
  }

  if (hasOwn(usedDetails, "note")) {
    payload.note = normalizeString(usedDetails.note);
  }

  return payload;
}

function pickSpecs(specs = {}) {
  const payload = {};

  if (hasOwn(specs, "screen")) {
    payload.screen = normalizeString(specs.screen);
  }

  if (hasOwn(specs, "chip")) {
    payload.chip = normalizeString(specs.chip);
  }

  if (hasOwn(specs, "ram")) {
    payload.ram = normalizeString(specs.ram);
  }

  if (hasOwn(specs, "storage")) {
    payload.storage = normalizeString(specs.storage);
  }

  if (hasOwn(specs, "battery")) {
    payload.battery = normalizeString(specs.battery);
  }

  if (hasOwn(specs, "camera")) {
    payload.camera = normalizeString(specs.camera);
  }

  return payload;
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => normalizeString(image))
    .filter(Boolean);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}
