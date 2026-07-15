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
  name: "remember_fact",
  title: "Remember a fact",
  description:
    "Save a durable fact into Gemma's memory layer (gemma_facts) for the signed-in operator. Optionally scope it to a room.",
  inputSchema: {
    fact: z.string().trim().min(3).describe("The fact to remember (atomic, one idea)."),
    scope_room: z
      .string()
      .optional()
      .describe("Optional room slug to scope the fact (e.g. 'outreach'). Omit for global."),
    pinned: z.boolean().optional().describe("Pin the fact so it always injects. Defaults to false."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ fact, scope_room, pinned }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("gemma_facts")
      .insert({
        user_id: ctx.getUserId(),
        fact,
        scope_room: scope_room ?? null,
        pinned: pinned ?? false,
      })
      .select("id,fact,scope_room,pinned,created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved fact ${data.id}` }],
      structuredContent: { fact: data },
    };
  },
});
