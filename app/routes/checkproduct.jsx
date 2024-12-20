import { json, redirect } from "@remix-run/node";
import { prisma } from "../server/db.server";
import { getSession } from "../server/auth.server.js";

import { authenticator } from "../server/auth.server.js";
export const loader = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  // Kiểm tra session để lấy userId
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    return json({ error: "User ID not found in session" }, { status: 400 });
  }

  // Kiểm tra xem người dùng đã có sản phẩm trong cơ sở dữ liệu chưa
  let products = await prisma.product.findMany({
    where: { userId: userId }, // Sử dụng userId từ session
  });

  // Nếu không có sản phẩm, tạo sản phẩm mặc định
  if (products.length === 0) {
    // Kiểm tra xem userId có tồn tại trong bảng User không
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return json({ error: "User not found in database" }, { status: 404 });
    }

    // Tạo sản phẩm mặc định
    const newProduct = await prisma.product.create({
      data: {
        name: "importify",
        description: "Mô tả mặc định cho sản phẩm",
        url: "/logo.png",
        userId: userId, // Gắn sản phẩm với userId từ session
      },
    });

    // Cập nhật lại danh sách sản phẩm sau khi tạo mới
    products = [newProduct];
  }

  // Trả về dữ liệu người dùng và sản phẩm
  return redirect("/products");
};
