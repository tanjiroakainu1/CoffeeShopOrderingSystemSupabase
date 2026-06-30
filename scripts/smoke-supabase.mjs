/**
 * Smoke test: verify Supabase connectivity and core tables (run with `npm run test:supabase`).
 * Requires react-web/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(url, key);

const tables = [
  "profiles",
  "product_categories",
  "catalog_products",
  "orders",
  "customer_preferences",
  "customer_menu_favorites",
  "cafe_payment_settings",
  "account_recovery_requests",
];

async function main() {
  console.log("Supabase smoke test →", url);
  let ok = 0;
  for (const table of tables) {
    const { error, count } = await sb.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`✗ ${table}:`, error.message);
    } else {
      console.log(`✓ ${table} (${count ?? 0} rows accessible)`);
      ok += 1;
    }
  }
  const { error: rpcErr } = await sb.rpc("recovery_list_for_email", { p_email: "test@example.com" });
  if (rpcErr) {
    console.warn("⚠ recovery_list_for_email RPC:", rpcErr.message);
  } else {
    console.log("✓ recovery_list_for_email RPC");
  }
  console.log(`\n${ok}/${tables.length} tables OK`);
  process.exit(ok === tables.length ? 0 : 1);
}

void main();
