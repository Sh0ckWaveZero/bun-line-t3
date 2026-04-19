/**
 * Individual Category API
 * PATCH /api/expenses/categories/:id  → แก้ไขหมวดหมู่
 * DELETE /api/expenses/categories/:id → ลบหมวดหมู่
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getCategoryById,
  updateCategory,
  deactivateCategory,
} from "@/features/expenses/services/category.server"

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const updateCategorySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อหมวดหมู่").max(50).optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "รูปแบบสีไม่ถูกต้อง (#RRGGBB)")
    .optional(),
  isActive: z.boolean().optional(),
})

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

async function getCategory(request: Request, categoryId: string) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const category = await getCategoryById(categoryId, session.user.id)
    if (!category) {
      return Response.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 })
    }

    return Response.json({ success: true, data: category })
  } catch (error) {
    console.error("[GET /api/expenses/categories/:id]", error)
    return Response.json({ error: "ไม่สามารถดึงหมวดหมู่ได้" }, { status: 500 })
  }
}

async function updateCategoryHandler(request: Request, categoryId: string) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const body = await request.json()
    const input = updateCategorySchema.parse(body)

    const category = await updateCategory(categoryId, session.user.id, input)

    return Response.json({
      success: true,
      data: category,
      message: "แก้ไขหมวดหมู่สำเร็จ",
    })
  } catch (error) {
    console.error("[PATCH /api/expenses/categories/:id]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    // Handle Prisma unique constraint error
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Response.json(
        { error: "หมวดหมู่นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น" },
        { status: 409 }
      )
    }
    return Response.json({ error: "ไม่สามารถแก้ไขหมวดหมู่ได้" }, { status: 500 })
  }
}

async function deleteCategoryHandler(request: Request, categoryId: string) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    await deactivateCategory(categoryId, session.user.id)

    return Response.json({
      success: true,
      message: "ลบหมวดหมู่สำเร็จ",
    })
  } catch (error) {
    console.error("[DELETE /api/expenses/categories/:id]", error)
    // Handle foreign key constraint (มี transaction ใช้อยู่)
    if (error && typeof error === "object" && "code" in error && "code" in error && error.code === "P2003") {
      return Response.json(
        { error: "ไม่สามารถลบหมวดหมู่ที่มีรายการใช้งานอยู่" },
        { status: 400 }
      )
    }
    return Response.json({ error: "ไม่สามารถลบหมวดหมู่ได้" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────

export const Route = createFileRoute("/api/expenses/categories/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => getCategory(request, params.id),
      PATCH: ({ request, params }) => updateCategoryHandler(request, params.id),
      DELETE: ({ request, params }) => deleteCategoryHandler(request, params.id),
    },
  },
})
