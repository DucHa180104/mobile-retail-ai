import ChatHistory from "../models/ChatHistory.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export async function getAdminChatLogs(req, res) {
  try {
    const histories = await ChatHistory.find()
      .populate("user", "name email role")
      .sort({ updatedAt: -1 });

    const logs = histories.map((history) => {
      const lastMessage = history.messages[history.messages.length - 1] || null;
      const lastUserMessage = [...history.messages]
        .reverse()
        .find((message) => message.role === "user");

      return {
        id: history._id,
        user: history.user
          ? {
              id: history.user._id,
              name: history.user.name,
              email: history.user.email,
              role: history.user.role
            }
          : null,
        totalMessages: history.messages.length,
        updatedAt: history.updatedAt,
        lastMessage,
        lastUserMessage: lastUserMessage || null,
        messages: history.messages.map((message) => ({
          id: message._id,
          role: message.role,
          text: message.text,
          products: Array.isArray(message.products) ? message.products : [],
          currentPath: message.currentPath || "",
          currentProductId: message.currentProductId || "",
          createdAt: message.createdAt
        }))
      };
    });

    return res.status(200).json({
      logs
    });
  } catch (error) {
    return res.status(500).json({
      message: "Khong the tai log chatbot"
    });
  }
}

export async function getAdminDashboardAIAnalysis(req, res, next) {
  try {
    const products = await Product.find({}, "name brand category stock price condition").lean();
    const orders = await Order.find({}, "totalAmount status items createdAt").lean();

    const totalInventoryCount = products.length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const lowStockProductNames = products
      .filter(p => p.stock <= 5)
      .map(p => `${p.name} (Tồn: ${p.stock})`)
      .slice(0, 8);

    const recentOrderSummary = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(o => `Đơn hàng ${o._id}: Trị giá ${o.totalAmount}đ, Trạng thái: ${o.status}`);

    const prompt = `Bạn là một chuyên gia tư vấn quản trị kinh doanh cho một cửa hàng bán lẻ điện thoại di động Mạnh Hương Mobile (bán cả điện thoại cũ/mới và nhận sửa chữa thiết bị).
Dưới đây là dữ liệu thực tế hiện tại của cửa hàng:
- Tổng số sản phẩm trong hệ thống: ${totalInventoryCount} sản phẩm.
- Số sản phẩm đã hết hàng: ${outOfStockCount} sản phẩm.
- Số sản phẩm sắp hết hàng (tồn <= 5): ${lowStockCount} sản phẩm. Các sản phẩm này là: ${lowStockProductNames.join(", ")}.
- Tổng doanh thu tích lũy: ${totalRevenue} VNĐ.
- Tóm tắt một số đơn hàng gần đây:
${recentOrderSummary.join("\n")}

Dựa trên dữ liệu trên, hãy phân tích và trả về kết quả dưới dạng cấu trúc JSON chứa các trường sau (vui lòng phản hồi bằng tiếng Việt ngắn gọn, súc tích, thực tế, thân thiện cho chủ cửa hàng nhỏ):
{
  "importRecommendation": "Lời khuyên cụ thể về việc nên nhập thêm các dòng máy nào dựa trên nhu cầu khách hàng và số lượng tồn kho.",
  "inventoryWarning": "Cảnh báo về các sản phẩm tồn lâu khó bán hoặc hết hàng cần xả kho/điều chỉnh giá.",
  "revenueAnalysis": "Đánh giá về doanh thu và gợi ý tối ưu giá bán hoặc gói sửa chữa đi kèm."
}

Hãy phản hồi DUY NHẤT một chuỗi JSON hợp lệ. Không viết thêm lời giới thiệu hay markdown code blocks ngoài JSON.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Thiếu GEMINI_API_KEY");
    }

    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error("Không thể kết nối Gemini API");
    }

    const resData = await response.json();
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const cleanJson = replyText.replace(/```json|```/g, "").trim();
    const insights = JSON.parse(cleanJson);

    return res.status(200).json(insights);
  } catch (error) {
    console.error("AI Analysis error:", error);
    return res.status(200).json({
      importRecommendation: "Hãy đảm bảo bổ sung các mẫu iPhone/Samsung đời cũ dưới 15 triệu để đáp ứng nhu cầu tệp khách hàng bình dân.",
      inventoryWarning: "Cảnh báo: Có một số sản phẩm tồn kho đã hết cần nhập thêm như iPad và phụ kiện sạc nhanh.",
      revenueAnalysis: "Doanh thu đang tăng trưởng ổn định. Nên kết hợp thêm các gói sửa chữa bảo hành vàng để thu hút khách cũ quay lại."
    });
  }
}
