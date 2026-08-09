const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Tạo mảng vector embedding từ văn bản truyền vào bằng Gemini REST API.
 * @param {string} text Văn bản câu hỏi hoặc mô tả sản phẩm cần biểu diễn dưới dạng vector.
 * @returns {Promise<number[]>} Mảng các số thực biểu diễn tọa độ vector (768 chiều).
 */
export async function generateEmbedding(text) {
  const trimmedText = String(text || "").trim();
  if (!trimmedText) {
    throw new Error("Văn bản để tạo embedding không được rỗng");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trong cấu hình môi trường (.env)");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const requestBody = {
    model: `models/${EMBEDDING_MODEL}`,
    content: {
      parts: [
        {
          text: trimmedText
        }
      ]
    }
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
  } catch (err) {
    throw new Error(`Lỗi kết nối API Embedding: ${err.message}`);
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || "Không thể lấy embedding từ Gemini API";
    throw new Error(`Embedding API trả về lỗi: ${errorMsg}`);
  }

  const embeddingValues = data?.embedding?.values;
  if (!Array.isArray(embeddingValues) || embeddingValues.length === 0) {
    throw new Error("Định dạng mảng vector nhận về từ Gemini API không hợp lệ");
  }

  return embeddingValues;
}
