import Product from "../models/Product.js";
import { searchSemanticProducts } from "./productSemanticSearchService.js";

const CHATBOT_PRODUCT_LIMIT = 6;
const CHATBOT_CANDIDATE_LIMIT = 18;
const CHATBOT_SUGGESTION_LIMIT = 3;
const CHATBOT_HISTORY_LIMIT = 8;

export async function generateChatReply({
    message,
    history = [],
    currentProductId = "",
    currentPath = ""
}) {
    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
        throw new Error("Nội dung câu hỏi không được để trống");
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        throw new Error("Thiếu GEMINI_API_KEY trong file .env");
    }

    const modelName = "gemini-flash-latest";
    const endpoint = buildGeminiEndpoint(modelName, geminiApiKey);

    const normalizedHistory = normalizeChatHistory(history);
    const filters = extractChatFilters(trimmedMessage);
    const currentProduct = await findCurrentProduct(currentProductId);

    let products = [];
    try {
        products = await searchSemanticProducts({ message: trimmedMessage, filters });
        console.log(`🤖 [RAG] Tìm thấy ${products.length} sản phẩm theo vector ngữ nghĩa.`);
    } catch (err) {
        console.error("🤖 [RAG-Fallback] Lỗi truy vấn ngữ nghĩa, sử dụng logic tìm kiếm cũ:", err.message);
    }

    if (!products || products.length === 0) {
        products = await findRelevantProducts(filters, currentProduct);
    } else {
        products = rankCandidateProducts(products, filters, currentProduct);
        products = mergeCurrentProductIfNeeded(products, filters, currentProduct);
    }

    const prompt = buildChatPrompt({
        question: trimmedMessage,
        products,
        history: normalizedHistory,
        currentProduct,
        currentPath
    });

    const data = await callGemini(endpoint, prompt);
    const reply = extractGeminiReply(data);

    const formattedReply = formatChatReply(reply);
    return {
        reply: formattedReply,
        suggestedProducts: buildSuggestedProducts(products, currentProduct, formattedReply)
    };
}

function buildGeminiEndpoint(modelName, geminiApiKey) {
    return (
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent` +
        `?key=${geminiApiKey}`
    );
}

function normalizeChatHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter((item) => item && (item.role === "user" || item.role === "bot"))
        .map((item) => ({
            role: item.role,
            text: String(item.text || "").trim()
        }))
        .filter((item) => item.text)
        .slice(-CHATBOT_HISTORY_LIMIT);
}

async function findCurrentProduct(currentProductId) {
    const trimmedId = String(currentProductId || "").trim();

    if (!trimmedId) {
        return null;
    }

    try {
        return await Product.findById(trimmedId).lean();
    } catch {
        return null;
    }
}

function extractChatFilters(message) {
    const normalizedMessage = normalizeVietnameseText(message);

    const semanticNeeds = extractSemanticNeeds(normalizedMessage);
    const structuredFilters = extractStructuredFilters(normalizedMessage, semanticNeeds);
    const priceFilters = extractPriceFilters(normalizedMessage);

    return {
        ...structuredFilters,
        ...priceFilters,
        ...semanticNeeds
    };
}

function extractSemanticNeeds(normalizedMessage) {
    const prefersIOS = containsAny(normalizedMessage, ["ios", "iphone", "apple"]);
    const prefersAndroid = containsAny(normalizedMessage, ["android", "samsung", "xiaomi", "oppo"]);
    const needsStudy = containsAny(normalizedMessage, [
        "hoc tap",
        "hoc online",
        "zoom",
        "google meet",
        "word",
        "docs",
        "ghi chep",
        "sinh vien",
        "hoc sinh"
    ]);
    const needsPhotography = containsAny(normalizedMessage, [
        "chup anh",
        "camera dep",
        "song ao",
        "quay video",
        "camera tot"
    ]);
    const needsSelfieCamera = containsAny(normalizedMessage, [
        "selfie",
        "camera truoc",
        "chan dung",
        "goi video",
        "tiktok",
        "facebook"
    ]);
    const needsCompact = containsAny(normalizedMessage, [
        "nho gon",
        "de cam",
        "de bo tui",
        "gon nhe",
        "may nho",
        "cam mot tay"
    ]);

    return {
        prefersIOS,
        prefersAndroid,
        needsStudy,
        needsPhotography,
        needsSelfieCamera,
        needsCompact,
        needsGoodBattery: containsAny(normalizedMessage, [
            "pin tot",
            "pin khoe",
            "pin trau",
            "pin on",
            "pin lau"
        ]),
        needsNiceBody: containsAny(normalizedMessage, [
            "may dep",
            "ngoai hinh dep",
            "it tray",
            "dep keng"
        ]),
        needsGoodScreen: containsAny(normalizedMessage, [
            "man dep",
            "man zin",
            "man on",
            "man it xuoc"
        ]),
        needsWorkingFaceId: containsAny(normalizedMessage, [
            "face id",
            "touch id",
            "nhan dien khuon mat"
        ]),
        needsGoodCamera: needsPhotography || needsSelfieCamera,
        needsGaming: containsAny(normalizedMessage, [
            "choi game",
            "gaming",
            "pubg",
            "lien quan",
            "fps",
            "hieu nang"
        ]),
        needsStudentBudget: containsAny(normalizedMessage, [
            "sinh vien",
            "hoc sinh",
            "gia re",
            "tiet kiem"
        ]),
        needsLowRepairRisk: containsAny(normalizedMessage, [
            "chua sua",
            "it sua",
            "nguyen ban",
            "zin"
        ]),
        refersToCurrentProduct: containsAny(normalizedMessage, [
            "may nay",
            "san pham nay",
            "con nay",
            "chiec nay",
            "may hien tai",
            "may dang xem"
        ])
    };
}

function extractStructuredFilters(normalizedMessage, semanticNeeds) {
    const filters = {
        brand: "",
        condition: "",
        storage: "",
        category: ""
    };

    if (semanticNeeds.prefersIOS) {
        filters.brand = "Apple";
    } else if (containsAny(normalizedMessage, ["samsung"])) {
        filters.brand = "Samsung";
    } else if (containsAny(normalizedMessage, ["xiaomi"])) {
        filters.brand = "Xiaomi";
    } else if (containsAny(normalizedMessage, ["oppo"])) {
        filters.brand = "Oppo";
    }

    if (containsAny(normalizedMessage, ["cu 99"])) {
        filters.condition = "used_99";
    } else if (containsAny(normalizedMessage, ["cu dep"])) {
        filters.condition = "used_good";
    } else if (containsAny(normalizedMessage, ["cu dung tot"])) {
        filters.condition = "used_fair";
    } else if (containsAny(normalizedMessage, ["moi", "may moi"])) {
        filters.condition = "new";
    }

    const storageMatch = normalizedMessage.match(/\b(64gb|128gb|256gb|512gb|1tb)\b/i);

    if (storageMatch) {
        filters.storage = storageMatch[1].toUpperCase();
    }

    // Extract category based on keyword references
    if (containsAny(normalizedMessage, ["dien thoai", "dt", "phone", "iphone", "samsung", "oppo", "xiaomi"])) {
        filters.category = "phone";
    } else if (containsAny(normalizedMessage, ["ipad", "tablet", "may tinh bang", "tab"])) {
        filters.category = "tablet";
    } else if (containsAny(normalizedMessage, ["tai nghe", "airpods", "buds", "sac", "cap", "op", "bao da", "phu kien", "pencil"])) {
        filters.category = "accessory";
    }

    return filters;
}

function extractPriceFilters(normalizedMessage) {
    const priceFilters = {
        minPrice: null,
        maxPrice: null
    };

    const underPriceMatch = normalizedMessage.match(/duoi\s+(\d+)\s*trieu/i);
    const fromToPriceMatch = normalizedMessage.match(/tu\s+(\d+)\s*(?:den|-)\s*(\d+)\s*trieu/i);
    const aroundPriceMatch = normalizedMessage.match(/(\d+)\s*trieu/i);

    if (fromToPriceMatch) {
        priceFilters.minPrice = Number.parseInt(fromToPriceMatch[1], 10) * 1000000;
        priceFilters.maxPrice = Number.parseInt(fromToPriceMatch[2], 10) * 1000000;
    } else if (underPriceMatch) {
        priceFilters.maxPrice = Number.parseInt(underPriceMatch[1], 10) * 1000000;
    } else if (aroundPriceMatch) {
        priceFilters.maxPrice = Number.parseInt(aroundPriceMatch[1], 10) * 1000000;
    }

    return priceFilters;
}

async function findRelevantProducts(filters, currentProduct) {
    const query = buildProductQuery(filters);
    const candidates = await fetchCandidateProducts(query);
    const rankedProducts = rankCandidateProducts(candidates, filters, currentProduct);
    return mergeCurrentProductIfNeeded(rankedProducts, filters, currentProduct);
}

function buildProductQuery(filters) {
    const query = {
        stock: { $gt: 0 }
    };

    if (filters.brand) {
        query.brand = new RegExp(`^${escapeRegex(filters.brand)}$`, "i");
    }

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.condition) {
        query.condition = filters.condition;
    }

    if (filters.storage) {
        query["specs.storage"] = new RegExp(`^${escapeRegex(filters.storage)}$`, "i");
    }

    if (Number.isFinite(filters.minPrice) || Number.isFinite(filters.maxPrice)) {
        query.price = {};

        if (Number.isFinite(filters.minPrice)) {
            query.price.$gte = filters.minPrice;
        }

        if (Number.isFinite(filters.maxPrice)) {
            query.price.$lte = filters.maxPrice;
        }
    }

    return query;
}

async function fetchCandidateProducts(query) {
    return Product.find(query).sort({ createdAt: -1 }).limit(CHATBOT_CANDIDATE_LIMIT).lean();
}

function rankCandidateProducts(candidates, filters, currentProduct) {
    return candidates
        .map((product) => ({
            product,
            score: scoreProductForNeeds(product, filters, currentProduct)
        }))
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            if (a.product.price !== b.product.price) {
                return a.product.price - b.product.price;
            }

            return new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime();
        })
        .slice(0, CHATBOT_PRODUCT_LIMIT)
        .map((entry) => entry.product);
}

function mergeCurrentProductIfNeeded(products, filters, currentProduct) {
    if (!currentProduct || !currentProduct._id) {
        return products;
    }

    const mergedProducts = [];

    if (
        filters.refersToCurrentProduct ||
        !products.some((product) => String(product._id) === String(currentProduct._id))
    ) {
        mergedProducts.push(currentProduct);
    }

    for (const product of products) {
        if (!mergedProducts.some((item) => String(item._id) === String(product._id))) {
            mergedProducts.push(product);
        }
    }

    return mergedProducts.slice(0, CHATBOT_PRODUCT_LIMIT);
}

function scoreProductForNeeds(product, filters, currentProduct) {
    let score = 0;

    // Nhom 1: uu tien san pham dang xem va dieu kien co cau truc.
    if (currentProduct && String(currentProduct._id) === String(product._id)) {
        score += filters.refersToCurrentProduct ? 12 : 2;
    }

    score += scoreStructuredMatch(product, filters);

    // Nhom 2: uu tien theo nhu cau su dung mem.
    score += scoreSemanticNeeds(product, filters);

    // Nhom 3: uu tien ton kho con san.
    if (product.stock > 0) {
        score += Math.min(product.stock, 3);
    }

    return score;
}

function scoreStructuredMatch(product, filters) {
    let score = 0;

    if (filters.prefersIOS && equalsIgnoreCase(product.brand, "Apple")) {
        score += 8;
    }

    if (filters.prefersAndroid && !equalsIgnoreCase(product.brand, "Apple")) {
        score += 8;
    }

    if (filters.brand && equalsIgnoreCase(product.brand, filters.brand)) {
        score += 4;
    }

    if (filters.condition && product.condition === filters.condition) {
        score += 4;
    }

    if (filters.storage && equalsIgnoreCase(product.specs?.storage, filters.storage)) {
        score += 4;
    }

    if (filters.maxPrice && Number.isFinite(product.price)) {
        if (product.price <= filters.maxPrice) {
            score += 3;
        }

        if (filters.needsStudentBudget) {
            const distance = Math.max(0, filters.maxPrice - product.price);
            score += distance / 1000000;
        }
    }

    if (filters.minPrice && Number.isFinite(product.price) && product.price >= filters.minPrice) {
        score += 1;
    }

    return score;
}

function scoreSemanticNeeds(product, filters) {
    let score = 0;

    if (filters.needsGoodBattery) {
        score += scoreBatteryHealth(product);
    }

    if (filters.needsNiceBody) {
        score += scoreByText(product.usedDetails?.bodyStatus, ["dep", "it tray", "nhe", "keng", "tot"]);
    }

    if (filters.needsGoodScreen) {
        score += scoreByText(product.usedDetails?.screenStatus, [
            "dep",
            "zin",
            "it xuoc",
            "tot",
            "binh thuong"
        ]);
    }

    if (filters.needsWorkingFaceId) {
        score += scoreByText(product.usedDetails?.faceIdStatus, [
            "hoat dong",
            "binh thuong",
            "tot",
            "on",
            "ok",
            "full"
        ]);
    }

    if (filters.needsGoodCamera || filters.needsPhotography) {
        score += scoreCameraNeeds(product);
    }

    if (filters.needsSelfieCamera) {
        score += scoreSelfieCameraNeeds(product);
    }

    if (filters.needsGaming) {
        score += scoreGaming(product);
    }

    if (filters.needsStudy) {
        score += scoreStudyNeeds(product);
    }

    if (filters.needsCompact) {
        score += scoreCompactNeeds(product);
    }

    if (filters.needsStudentBudget) {
        score += scoreStudentBudget(product.price);
    }

    if (filters.needsLowRepairRisk) {
        score += scoreByText(product.usedDetails?.repairHistory, ["chua", "khong", "nguyen ban", "zin"]);
    }

    return score;
}

function buildChatPrompt({ question, products, history, currentProduct, currentPath }) {
    const historySummary = buildHistorySummary(history);
    const currentProductSummary = buildCurrentProductSummary(currentProduct, currentPath);
    const productSummary = buildProductSummary(products);

    return `
Bạn là chatbot tư vấn bán điện thoại cũ của shop Mạnh Hương.

Mục tiêu:
- Trả lời tự nhiên, mượt, giống một trợ lý bán hàng thân thiện.
- Đọc lịch sử chat để hiểu người dùng đang hỏi tiếp về nhu cầu nào.
- Nếu người dùng đang ở trang chi tiết sản phẩm, ưu tiên hiểu họ đang hỏi về chính máy đó.
- Hiểu tốt các nhu cầu như:
  - học tập
  - chụp ảnh
  - chơi game
  - pin lâu
  - nhỏ gọn
  - camera selfie
  - ưu tiên iOS
  - ưu tiên Android

Quy tắc trả lời:
- Nếu người dùng chỉ chào hỏi xã giao hoặc hỏi câu chung không tìm máy: Hãy chào lại tự nhiên, lịch sự và KHÔNG liệt kê tên bất kỳ sản phẩm nào.
- Khi tư vấn hoặc so sánh sản phẩm, bạn CHỈ ĐƯỢC GIỚI THIỆU các sản phẩm có trong "Danh sách sản phẩm hiện có để tư vấn" bên dưới.
- Mỗi khi nhắc tới sản phẩm nào, hãy ghi RÕ TÊN ĐẦY ĐỦ VÀ GIÁ BÁN niêm yết của sản phẩm đó (Ví dụ: "**iPhone 15 128GB** (giá 19.490.000đ)").
- Không bịa thêm tồn kho, giá, tình trạng máy nếu dữ liệu không có.
- Nếu người dùng hỏi sâu hơn về máy đang xem, hãy trả lời bám theo sản phẩm hiện tại trước.
- Nếu người dùng hỏi kiến thức chung liên quan đến điện thoại, có thể trả lời tự nhiên bằng kiến thức chung, nhưng nếu có thể hãy nối lại với sản phẩm của shop.
- Nếu đang tư vấn lựa chọn máy, ưu tiên nêu 2 đến 3 máy nổi bật nhất và nói rõ vì sao hợp với nhu cầu.
- Trả lời bằng tiếng Việt, dễ đọc, tự nhiên, không máy móc.
- Dùng Markdown đơn giản:
  - có xuống dòng rõ ràng
  - có bullet list khi cần
  - in đậm tên sản phẩm bằng cú pháp Markdown
- Không dùng bảng markdown.
- Không dùng code block.
- Nếu không chắc về một thông tin cụ thể, hãy nói rõ là shop chưa có dữ liệu chi tiết đó.

Ngữ cảnh trang hiện tại:
${currentProductSummary}

Lịch sử hội thoại gần đây:
${historySummary}

Danh sách sản phẩm hiện có để tư vấn:
${productSummary}

Câu hỏi mới nhất của khách:
${question}
  `.trim();
}

function buildHistorySummary(history) {
    if (!history.length) {
        return "Chưa có lịch sử hội thoại trước đó.";
    }

    return history
        .map((entry, index) => `${index + 1}. ${entry.role === "user" ? "Khách" : "Bot"}: ${entry.text}`)
        .join("\n");
}

function buildCurrentProductSummary(currentProduct, currentPath) {
    if (!currentProduct) {
        return "Người dùng hiện không đứng ở một trang sản phẩm cụ thể.";
    }

    return formatCurrentProductContext(currentProduct, currentPath);
}

function buildProductSummary(products) {
    if (!products.length) {
        return "Hiện tại không có sản phẩm nào trong shop khớp với bộ lọc cơ bản.";
    }

    return products.map((product, index) => formatProductForPrompt(product, index + 1)).join("\n");
}

function formatCurrentProductContext(product, currentPath) {
    const conditionLabel = getConditionLabel(product.condition);

    return [
        `Đường dẫn hiện tại: ${currentPath || `/products/${product._id}`}`,
        `Tên máy đang xem: ${product.name}`,
        `Hãng: ${product.brand || "Chưa rõ"}`,
        `Giá: ${formatPrice(product.price)}`,
        `Tình trạng: ${conditionLabel}`,
        `Dung lượng: ${product.specs?.storage || "Chưa rõ"}`,
        `Pin: ${product.usedDetails?.batteryHealth || product.specs?.battery || "Chưa rõ"}`,
        `Màn hình: ${product.specs?.screen || product.usedDetails?.screenStatus || "Chưa rõ"}`,
        `Ngoại hình: ${product.usedDetails?.bodyStatus || "Chưa rõ"}`,
        `Camera: ${product.specs?.camera || "Chưa rõ"}`,
        `Face ID / Touch ID: ${product.usedDetails?.faceIdStatus || "Chưa rõ"}`,
        `Lịch sử sửa chữa: ${product.usedDetails?.repairHistory || "Chưa rõ"}`,
        `Ghi chú: ${product.usedDetails?.note || product.description || "Không có"}`
    ].join(" | ");
}

function formatProductForPrompt(product, index) {
    const conditionLabel = getConditionLabel(product.condition);
    const parts = [
        `${index}. ${product.name}`,
        `Hãng: ${product.brand || "Chưa rõ"}`,
        `Giá: ${formatPrice(product.price)}`,
        `Tình trạng: ${conditionLabel}`,
        `Dung lượng: ${product.specs?.storage || "Chưa rõ"}`,
        `Màu sắc: ${product.usedDetails?.color || "Chưa rõ"}`,
        `Pin: ${product.usedDetails?.batteryHealth || product.specs?.battery || "Chưa rõ"}`,
        `Màn hình: ${product.specs?.screen || product.usedDetails?.screenStatus || "Chưa rõ"}`,
        `Camera: ${product.specs?.camera || "Chưa rõ"}`,
        `Ngoại hình: ${product.usedDetails?.bodyStatus || "Chưa rõ"}`,
        `Bảo hành: ${product.usedDetails?.warranty || "Chưa rõ"}`,
        `Face ID / Touch ID: ${product.usedDetails?.faceIdStatus || "Chưa rõ"}`,
        `Phụ kiện: ${product.usedDetails?.accessories || "Chưa rõ"}`,
        `Lịch sử sửa chữa: ${product.usedDetails?.repairHistory || "Chưa rõ"}`,
        `Ghi chú: ${product.usedDetails?.note || product.description || "Không có"}`,
        `Tồn kho: ${product.stock}`
    ];

    return parts.join(" | ");
}

function buildSuggestedProducts(products, currentProduct, replyText) {
    if (!replyText || typeof replyText !== "string") {
        return [];
    }

    const normalizedReply = normalizeVietnameseText(replyText);
    const rawReply = replyText.toLowerCase();
    const allCandidates = [];

    if (currentProduct) {
        allCandidates.push(currentProduct);
    }

    for (const product of products) {
        if (!allCandidates.some((item) => String(item._id) === String(product._id))) {
            allCandidates.push(product);
        }
    }

    const scoredMatches = [];

    for (const product of allCandidates) {
        const fullName = normalizeVietnameseText(product.name);
        const coreName = fullName
            .replace(/\b(64gb|128gb|256gb|512gb|1tb)\b/gi, "")
            .replace(/\b(cu 99%|cu dep|cu dung tot|moi|may moi|chinh hang)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        // Kiểm tra xem tên sản phẩm có xuất hiện trong đoạn văn bản trả lời của AI không
        let nameMatched = false;
        let matchIndex = -1;

        if (fullName.length > 3 && normalizedReply.includes(fullName)) {
            nameMatched = true;
            matchIndex = normalizedReply.indexOf(fullName);
        } else if (coreName.length > 3 && normalizedReply.includes(coreName)) {
            nameMatched = true;
            matchIndex = normalizedReply.indexOf(coreName);
        }

        // NẾU TÊN SẢN PHẨM KHÔNG XUẤT HIỆN TRONG VĂN BẢN TRẢ LỜI CỦA AI -> TUYỆT ĐỐ KHÔNG GÁN BÊN DƯỚI!
        if (!nameMatched) {
            continue;
        }

        let score = 10;

        // Nếu khớp đúng tên đầy đủ (ví dụ "iPhone 15 128GB"): +20 điểm
        if (fullName.length > 3 && normalizedReply.includes(fullName)) {
            score += 20;
        }

        // Nếu khớp thêm giá bán niêm yết trong văn bản: +30 điểm
        if (product.price) {
            const formattedPrice = formatPrice(product.price).toLowerCase();
            const plainDigits = String(product.price);
            const millionPrice = `${(product.price / 1000000).toFixed(1)}`.replace(".0", "");

            if (
                rawReply.includes(formattedPrice) ||
                rawReply.includes(plainDigits) ||
                normalizedReply.includes(millionPrice)
            ) {
                score += 30;
            }
        }

        scoredMatches.push({
            product,
            score,
            matchIndex
        });
    }

    // NẾU AI KHÔNG GỢI Ý/NHẮC TỚI SẢN PHẨM NÀO TRONG VĂN BẢN -> TRẢ VỀ MẢNG RỖNG (KHÔNG HIỆN THẺ)
    if (scoredMatches.length === 0) {
        return [];
    }

    // Ưu tiên sắp xếp theo thứ tự xuất hiện trong văn bản AI, sau đó theo điểm số khớp chính xác
    scoredMatches.sort((a, b) => {
        if (a.matchIndex !== b.matchIndex) {
            return a.matchIndex - b.matchIndex;
        }
        return b.score - a.score;
    });

    const selectedProducts = [];
    const seenIds = new Set();

    for (const item of scoredMatches) {
        const prod = item.product;
        const idStr = String(prod._id);
        if (!seenIds.has(idStr)) {
            seenIds.add(idStr);
            selectedProducts.push(prod);
        }
        if (selectedProducts.length >= CHATBOT_SUGGESTION_LIMIT) {
            break;
        }
    }

    return selectedProducts.map((product) => ({
        id: String(product._id),
        name: product.name,
        price: product.price,
        priceText: formatPrice(product.price),
        condition: product.condition,
        conditionLabel: getConditionLabel(product.condition),
        stock: Number(product.stock || 0),
        stockText: Number(product.stock || 0) > 0 ? `Còn ${product.stock} máy` : "Tạm hết hàng",
        storage: product.specs?.storage || "",
        batteryHealth: product.usedDetails?.batteryHealth || product.specs?.battery || "",
        image: product.images?.[0] || "",
        path: `/products/${product._id}`
    }));
}

async function callGemini(endpoint, prompt) {
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ]
    };

    let response;
    let data;

    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        data = await response.json();
    } catch {
        throw new Error("Không thể kết nối tới Gemini API");
    }

    if (!response.ok) {
        const geminiErrorMessage =
            data?.error?.message || "Gemini API trả về lỗi không xác định";

        throw new Error(`Gemini API lỗi: ${geminiErrorMessage}`);
    }

    return data;
}

function extractGeminiReply(data) {
    const reply =
        data?.candidates?.[0]?.content?.parts
            ?.map((part) => part?.text || "")
            .join("")
            .trim() || "";

    if (!reply) {
        throw new Error("Gemini không trả về nội dung phản hồi");
    }

    return reply;
}

function formatChatReply(reply) {
    return String(reply || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*[•●◦]\s+/gm, "- ")
        .trim();
}

function scoreBatteryHealth(product) {
    const batteryText = normalizeVietnameseText(
        product.usedDetails?.batteryHealth || product.specs?.battery || ""
    );

    if (!batteryText) {
        return 0;
    }

    const percentageMatch = batteryText.match(/(\d{2,3})/);

    if (percentageMatch) {
        const percentage = Number.parseInt(percentageMatch[1], 10);

        if (percentage >= 90) {
            return 6;
        }

        if (percentage >= 85) {
            return 4;
        }

        if (percentage >= 80) {
            return 2;
        }
    }

    if (containsAny(batteryText, ["tot", "khoe", "trau", "on"])) {
        return 4;
    }

    return 1;
}

function scoreCameraNeeds(product) {
    const cameraText = normalizeVietnameseText(
        `${product.specs?.camera || ""} ${product.description || ""} ${product.usedDetails?.note || ""}`
    );

    let score = 0;

    if (containsAny(cameraText, ["48mp", "50mp", "tele", "ultra", "portrait", "chan dung"])) {
        score += 5;
    } else if (containsAny(cameraText, ["12mp", "camera", "quay", "video"])) {
        score += 3;
    }

    if (containsAny(cameraText, ["chong rung", "night", "dem", "hdr"])) {
        score += 2;
    }

    return score;
}

function scoreSelfieCameraNeeds(product) {
    const cameraText = normalizeVietnameseText(
        `${product.specs?.camera || ""} ${product.description || ""} ${product.usedDetails?.note || ""}`
    );

    let score = 0;

    if (containsAny(cameraText, ["selfie", "tru depth", "true depth", "front", "camera truoc"])) {
        score += 5;
    }

    if (containsAny(cameraText, ["portrait", "chan dung", "facetime"])) {
        score += 2;
    }

    if (equalsIgnoreCase(product.brand, "Apple")) {
        score += 1;
    }

    return score;
}

function scoreGaming(product) {
    let score = 0;
    const chipText = normalizeVietnameseText(product.specs?.chip || "");
    const ramValue = parseNumber(product.specs?.ram);

    if (containsAny(chipText, ["a17", "a16", "a15", "snapdragon 8", "dimensity 8"])) {
        score += 5;
    } else if (containsAny(chipText, ["a14", "snapdragon 7", "dimensity 7"])) {
        score += 3;
    } else if (chipText) {
        score += 1;
    }

    if (ramValue >= 8) {
        score += 4;
    } else if (ramValue >= 6) {
        score += 3;
    } else if (ramValue >= 4) {
        score += 1;
    }

    return score;
}

function scoreStudyNeeds(product) {
    let score = 0;

    score += scoreBatteryHealth(product);
    score += scoreStudentBudget(product.price);

    if (
        equalsIgnoreCase(product.specs?.storage, "128GB") ||
        equalsIgnoreCase(product.specs?.storage, "256GB")
    ) {
        score += 3;
    } else if (equalsIgnoreCase(product.specs?.storage, "64GB")) {
        score += 1;
    }

    if (scoreCompactNeeds(product) > 0) {
        score += 1;
    }

    return score;
}

function scoreCompactNeeds(product) {
    const nameText = normalizeVietnameseText(product.name || "");
    const screenText = normalizeVietnameseText(product.specs?.screen || "");
    const screenSize = extractScreenSize(screenText);

    if (containsAny(nameText, ["mini", "se"])) {
        return 6;
    }

    if (screenSize > 0 && screenSize <= 6.1) {
        return 4;
    }

    if (screenSize > 0 && screenSize <= 6.3) {
        return 2;
    }

    return 0;
}

function scoreStudentBudget(price) {
    if (!Number.isFinite(price)) {
        return 0;
    }

    if (price <= 8000000) {
        return 6;
    }

    if (price <= 12000000) {
        return 4;
    }

    if (price <= 15000000) {
        return 2;
    }

    return 0;
}

function scoreByText(value, positiveKeywords) {
    const normalizedValue = normalizeVietnameseText(value);

    if (!normalizedValue) {
        return 0;
    }

    let score = 1;

    if (containsAny(normalizedValue, positiveKeywords)) {
        score += 4;
    }

    if (containsAny(normalizedValue, ["binh thuong", "hoat dong", "on"])) {
        score += 2;
    }

    if (containsAny(normalizedValue, ["loi", "hong", "kem"])) {
        score -= 3;
    }

    return score;
}

function extractScreenSize(screenText) {
    const screenMatch = String(screenText || "").match(/(\d+(?:\.\d+)?)/);
    return screenMatch ? Number.parseFloat(screenMatch[1]) : 0;
}

function getConditionLabel(condition) {
    if (condition === "used_99") {
        return "Cũ 99%";
    }

    if (condition === "used_good") {
        return "Cũ đẹp";
    }

    if (condition === "used_fair") {
        return "Cũ dùng tốt";
    }

    return "Máy mới";
}

function formatPrice(price) {
    if (!Number.isFinite(price)) {
        return "Chưa rõ";
    }

    return `${price.toLocaleString("vi-VN")}đ`;
}

function parseNumber(value) {
    const match = String(value || "").match(/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : 0;
}

function containsAny(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword));
}

function equalsIgnoreCase(left, right) {
    return normalizeVietnameseText(left) === normalizeVietnameseText(right);
}

function normalizeVietnameseText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkIsGreeting(text) {
    const clean = normalizeVietnameseText(text).trim();
    const exactGreetings = ["xin chao", "xin chap", "chao", "chao ban", "chao shop", "hi", "hello", "hey", "shop oi", "alo", "da", "vang"];

    if (exactGreetings.includes(clean)) return true;

    if (clean.length <= 15 && (clean.startsWith("chao") || clean.startsWith("hi") || clean.startsWith("hello") || clean.startsWith("xin chao"))) {
        const productKeywords = ["iphone", "samsung", "xiaomi", "oppo", "gia", "bao nhieu", "mua", "tim", "can", "nao", "may", "pin", "game", "tu van"];
        const hasProductKeyword = productKeywords.some((kw) => clean.includes(kw));
        if (!hasProductKeyword) return true;
    }

    return false;
}
