import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function PATCH(request, context) {
  const session = requireSessionUser(request);
  if (!session.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();
    const { title } = await request.json();
    const resolvedParams = await context.params;
    const id = Number(resolvedParams?.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid subsection id." }, { status: 400 });
    }

    const trimmed = (title || "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }

    const updated = await sql`
      UPDATE content_subsections
      SET title = ${trimmed}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title
    `;

    if (!updated.length) {
      return NextResponse.json({ error: "Subsection not found." }, { status: 404 });
    }

    logger.info("api/content/subsections PATCH", `Subsection #${id} renamed to "${trimmed}" by ${session.username}`);
    return NextResponse.json({ success: true, title: updated[0].title });
  } catch (error) {
    logger.error("api/content/subsections PATCH", error);
    return NextResponse.json({ error: "Unable to update subsection title." }, { status: 500 });
  }
}
