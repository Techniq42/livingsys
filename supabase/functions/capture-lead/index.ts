import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://livingsys.lovable.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strip HTML tags to prevent stored XSS
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

const LeadSchema = z.object({
  first_name: z.string().min(1).max(100).transform(s => stripHtml(s.trim())),
  last_name: z.string().min(1).max(100).transform(s => stripHtml(s.trim())),
  email: z.string().email().max(320).transform(s => s.trim().toLowerCase()),
  phone: z.string().max(20).transform(s => stripHtml(s.trim())).nullable().optional(),
  path: z.enum(["architect", "operator"]),
  user_agent: z.string().max(500).nullable().optional(),
  referrer: z.string().url().max(2048).nullable().optional().or(z.literal("")).or(z.null()),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const result = LeadSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: result.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { first_name, last_name, email, phone, path, user_agent, referrer } = result.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name,
        last_name,
        email,
        phone: phone || null,
        path,
        user_agent: user_agent || null,
        referrer: referrer || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
