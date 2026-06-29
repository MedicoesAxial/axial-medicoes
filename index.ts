// ============================================================
// EDGE FUNCTION: criar-operador
// ============================================================
// Cria login/senha de operador. Só o ADMIN logado consegue chamar.
// Usa a SERVICE_ROLE_KEY (que NUNCA pode ir pro navegador) com segurança,
// pois roda no servidor do Supabase.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) valida quem está chamando (tem que ser admin)
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401, headers: cors });
    }
    const { data: perfil } = await userClient
      .from("perfis").select("role").eq("id", user.id).single();
    if (!perfil || perfil.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar logins." }), { status: 403, headers: cors });
    }

    // 2) lê dados do novo operador
    const { nome, email, senha, role } = await req.json();
    if (!nome || !email || !senha || senha.length < 6) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: cors });
    }

    // 3) cria o usuário com a service_role (já confirma o e-mail)
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: novo, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role: role === "admin" ? "admin" : "operador" },
    });
    if (cErr) {
      return new Response(JSON.stringify({ error: cErr.message }), { status: 400, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true, id: novo.user?.id }), { status: 200, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
