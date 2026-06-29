// ============================================================
// APP CORE - sessão, perfil, navegação, utilitários
// ============================================================
let PERFIL = null;          // { id, nome, email, role }
let OBRAS_ACESSIVEIS = [];  // obras que o usuário pode ver

// ---------- utilitários ----------
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const isAdmin = () => PERFIL && PERFIL.role === 'admin';

function brl(v){
  return (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function num(v){ return (Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4}); }
function dataBR(d){ if(!d) return ''; const [a,m,dd]=d.split('-'); return `${dd}/${m}/${a}`; }
function hojeISO(){ return new Date().toISOString().slice(0,10); }
function esc(s){ return (s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function toast(msg, tipo='info'){
  const div = document.createElement('div');
  div.className = `msg msg-${tipo}`;
  div.textContent = msg;
  div.style.position='fixed'; div.style.top='70px'; div.style.right='22px';
  div.style.zIndex='999'; div.style.maxWidth='340px'; div.style.boxShadow='var(--sombra)';
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 3500);
}

// ---------- inicialização ----------
(async function init(){
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href='index.html'; return; }

  // carrega perfil
  const { data:perfil, error } = await supabaseClient
    .from('perfis').select('*').eq('id', session.user.id).single();
  if(error || !perfil){ alert('Perfil não encontrado. Contate o administrador.'); await sair(); return; }
  PERFIL = perfil;

  $('#userNome').textContent = perfil.nome;
  const badge = $('#userBadge');
  badge.textContent = perfil.role;
  badge.classList.add(perfil.role==='admin'?'badge-admin':'badge-operador');

  // mostra/esconde abas de admin
  if(!isAdmin()) $$('.admin-only').forEach(t=>t.classList.add('hidden'));

  // carrega obras acessíveis
  const { data:obras } = await supabaseClient.from('obras').select('*').eq('ativa', true).order('nome');
  OBRAS_ACESSIVEIS = obras || [];

  // navegação por abas
  $$('.tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      $$('.tab').forEach(t=>t.classList.remove('ativo'));
      tab.classList.add('ativo');
      const v = tab.dataset.view;
      ['medicoes','obras','fornecedores','operadores','acessos'].forEach(name=>{
        $('#view-'+name).classList.toggle('hidden', name!==v);
      });
      renderView(v);
    });
  });

  renderView('medicoes');
})();

async function sair(){
  await supabaseClient.auth.signOut();
  location.href='index.html';
}
$('#btnSair')?.addEventListener('click', sair);

function renderView(v){
  if(v==='medicoes')     renderMedicoes();
  if(v==='obras')        renderObras();
  if(v==='fornecedores') renderFornecedores();
  if(v==='operadores')   renderOperadores();
  if(v==='acessos')      renderAcessos();
}
