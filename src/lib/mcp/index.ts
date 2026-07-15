import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listCanonPagesTool from "./tools/list_canon_pages";
import listMyFactsTool from "./tools/list_my_facts";
import rememberFactTool from "./tools/remember_fact";

// Build the OAuth issuer from the direct Supabase host (never the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time — keeps this entry import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sovereign-os-mcp",
  title: "Sovereign OS MCP",
  version: "0.1.0",
  instructions:
    "Sovereign OS coordination infrastructure for Fellowship of Living Systems. " +
    "Tools act as the signed-in operator against their own data. " +
    "Use `list_canon_pages` to browse canon (Watershed Thesis, Fire Defense, Below the Radar, Regenerative Gem). " +
    "Use `list_my_facts` and `remember_fact` to read and extend Gemma's durable memory layer. " +
    "Use `echo` to verify connectivity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, listCanonPagesTool, listMyFactsTool, rememberFactTool],
});
