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
  name: "list_canon_pages",
  title: "List canon pages",
  description:
    "List active Sovereign OS canon pages (Watershed Thesis, Fire Defense, Below the Radar, Regenerative Gem, etc.) with slugs, audiences, and navigation notes.",
  inputSchema: {
    status: z
      .enum(["active", "draft", "retired", "any"])
      .optional()
      .describe("Filter by status. Defaults to active."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("canon_pages")
      .select("slug,title,url,audience,summary,navigation_notes,primary_regions,secondary_regions,status")
      .order("sort_order", { ascending: true });
    const effective = status ?? "active";
    if (effective !== "any") q = q.eq("status", effective);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { pages: data ?? [] },
    };
  },
});
