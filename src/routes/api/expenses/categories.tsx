/**
 * Expense Categories API
 * GET  /api/expenses/categories          → list categories ของ user
 * POST /api/expenses/categories          → สร้าง category ใหม่
 * PATCH/DELETE ผ่าน /api/expenses/categories/:id (ไฟล์แยก)
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  getCategoriesByUser,
  createCategory,
  seedDefaultCategories,
} from "@/features/expenses/services/category.server";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อหมวดหมู่").max(50),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "รูปแบบสีไม่ถูกต้อง (#RRGGBB)")
    .optional(),
});

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    // Seed default categories ถ้ายังไม่มี
    await seedDefaultCategories(session.user.id);

    const categories = await getCategoriesByUser(session.user.id);
    return Response.json({ success: true, data: categories });
  } catch (error) {
    console.error("[GET /api/expenses/categories]", error);
    return Response.json({ error: "ไม่สามารถดึงหมวดหมู่ได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body = await request.json();
    const input = createCategorySchema.parse(body);

    const category = await createCategory({
      ...input,
      userId: session.user.id,
    });

    return Response.json(
      { success: true, data: category, message: "สร้างหมวดหมู่สำเร็จ" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/expenses/categories]", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    // Handle Prisma unique constraint error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "หมวดหมู่นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น" },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "ไม่สามารถสร้างหมวดหมู่ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/expenses/categories")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
