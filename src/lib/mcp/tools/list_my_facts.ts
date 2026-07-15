import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_facts",
  title: "List my Gemma facts",
  description:
    "List durable facts Gemma remembers about the signed-in operator (from gemma_facts). Optionally filter by room scope.",
  inputSchema: {
    scope_room: z
      .string()
      .optional()
      .describe("Optional room slug (e.g. 'outreach', 'radar') to scope facts to."),
    include_retired: z.boolean().optional().describe("Include retired facts. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ scope_room, include_retired }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("gemma_facts")
      .select("id,fact,scope_room,pinned,confidence,created_at,retired_at")
      .eq("user_id", ctx.getUserId())
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (scope_room) q = q.eq("scope_room", scope_room);
    if (!include_retired) q = q.is("retired_at", null);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { facts: data ?? [] },
    };
  },
});
