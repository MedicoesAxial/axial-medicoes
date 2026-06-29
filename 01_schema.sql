// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================
// Já preenchido com os dados do projeto da Construtora Axial.
// A chave "anon" é pública e PODE ficar aqui. Nunca use a "service_role".
// ============================================================

const SUPABASE_URL = "https://hrbmwajautzpvfkioawd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYm13YWphdXR6cHZma2lvYXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDE4NTEsImV4cCI6MjA5ODI3Nzg1MX0.Gf4U-QagqrV6jYb8Wet-sF4UWnU6NS3PuvbCT-E62oo";

// Não altere abaixo
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
