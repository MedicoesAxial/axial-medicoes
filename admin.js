// ============================================================
// MÓDULO ADMIN (obras, fornecedores, operadores, acessos)
// ============================================================

// ---------- OBRAS ----------
async function renderObras(){
  const el = $('#view-obras');
  const { data:obras } = await supabaseClient.from('obras').select('*').order('nome');
  const linhas = (obras||[]).map(o=>`
    <tr>
      <td>${esc(o.nome)}</td><td>${esc(o.centro_custo||'-')}</td>
      <td>${o.ativa?'Ativa':'Inativa'}</td>
      <td class="acoes"><button class="btn btn-secundario btn-sm" onclick="editObra('${o.id}','${esc(o.nome)}','${esc(o.centro_custo||'')}',${o.ativa})">Editar</button></td>
    </tr>`).join('');
  el.innerHTML = `
    <div class="card">
      <h2>Obras <button class="btn btn-primary btn-sm" onclick="editObra()">+ Nova obra</button></h2>
      <div id="formObra"></div>
      <table><thead><tr><th>Nome</th><th>Centro de custo</th><th>Status</th><th></th></tr></thead>
        <tbody>${linhas||'<tr><td colspan="4" class="lista-vazia">Nenhuma obra.</td></tr>'}</tbody></table>
    </div>`;
}
function editObra(id='',nome='',cc='',ativa=true){
  $('#formObra').innerHTML = `
    <div class="grid grid-3" style="margin-bottom:16px">
      <div><label>Nome da obra</label><input id="ob_nome" value="${esc(nome)}"></div>
      <div><label>Centro de custo</label><input id="ob_cc" value="${esc(cc)}"></div>
      <div><label>Status</label><select id="ob_ativa"><option value="true" ${ativa?'selected':''}>Ativa</option><option value="false" ${!ativa?'selected':''}>Inativa</option></select></div>
      <div style="grid-column:1/-1"><button class="btn btn-primary btn-sm" onclick="salvarObra('${id}')">Salvar</button>
      <button class="btn btn-secundario btn-sm" onclick="$('#formObra').innerHTML=''">Cancelar</button></div>
    </div>`;
}
async function salvarObra(id){
  const reg = { nome:$('#ob_nome').value.trim(), centro_custo:$('#ob_cc').value.trim()||null, ativa:$('#ob_ativa').value==='true' };
  if(!reg.nome){ toast('Informe o nome.','erro'); return; }
  const q = id ? supabaseClient.from('obras').update(reg).eq('id',id) : supabaseClient.from('obras').insert(reg);
  const { error } = await q;
  if(error){ toast(error.message,'erro'); return; }
  toast('Obra salva.','ok');
  // recarrega obras acessíveis
  const { data } = await supabaseClient.from('obras').select('*').eq('ativa',true).order('nome');
  OBRAS_ACESSIVEIS = data||[];
  renderObras();
}

// ---------- FORNECEDORES ----------
async function renderFornecedores(){
  const el = $('#view-fornecedores');
  const { data:fs } = await supabaseClient.from('fornecedores').select('*').order('nome');
  const linhas = (fs||[]).map(f=>`
    <tr><td>${esc(f.nome)}</td><td>${esc(f.cnpj||'-')}</td><td>${esc(f.objeto||'-')}</td>
      <td>${f.ativo?'Ativo':'Inativo'}</td>
      <td class="acoes"><button class="btn btn-secundario btn-sm" onclick="editForn('${f.id}','${esc(f.nome)}','${esc(f.cnpj||'')}','${esc(f.objeto||'')}',${f.ativo})">Editar</button></td>
    </tr>`).join('');
  el.innerHTML = `
    <div class="card">
      <h2>Fornecedores <button class="btn btn-primary btn-sm" onclick="editForn()">+ Novo fornecedor</button></h2>
      <div id="formForn"></div>
      <table><thead><tr><th>Nome</th><th>CNPJ</th><th>Objeto</th><th>Status</th><th></th></tr></thead>
        <tbody>${linhas||'<tr><td colspan="5" class="lista-vazia">Nenhum fornecedor.</td></tr>'}</tbody></table>
    </div>`;
}
function editForn(id='',nome='',cnpj='',objeto='',ativo=true){
  $('#formForn').innerHTML = `
    <div class="grid grid-4" style="margin-bottom:16px">
      <div><label>Nome / Contratada</label><input id="fn_nome" value="${esc(nome)}"></div>
      <div><label>CNPJ</label><input id="fn_cnpj" value="${esc(cnpj)}"></div>
      <div><label>Objeto</label><input id="fn_obj" value="${esc(objeto)}" placeholder="LOCAÇÃO DE EQUIPAMENTOS"></div>
      <div><label>Status</label><select id="fn_ativo"><option value="true" ${ativo?'selected':''}>Ativo</option><option value="false" ${!ativo?'selected':''}>Inativo</option></select></div>
      <div style="grid-column:1/-1"><button class="btn btn-primary btn-sm" onclick="salvarForn('${id}')">Salvar</button>
      <button class="btn btn-secundario btn-sm" onclick="$('#formForn').innerHTML=''">Cancelar</button></div>
    </div>`;
}
async function salvarForn(id){
  const reg = { nome:$('#fn_nome').value.trim(), cnpj:$('#fn_cnpj').value.trim()||null,
                objeto:$('#fn_obj').value.trim().toUpperCase()||null, ativo:$('#fn_ativo').value==='true' };
  if(!reg.nome){ toast('Informe o nome.','erro'); return; }
  const q = id ? supabaseClient.from('fornecedores').update(reg).eq('id',id) : supabaseClient.from('fornecedores').insert(reg);
  const { error } = await q;
  if(error){ toast(error.message,'erro'); return; }
  FORNECEDORES = []; // limpa cache
  toast('Fornecedor salvo.','ok');
  renderFornecedores();
}

// ---------- OPERADORES (criação de login/senha) ----------
async function renderOperadores(){
  const el = $('#view-operadores');
  const { data:ps } = await supabaseClient.from('perfis').select('*').order('nome');
  const linhas = (ps||[]).map(p=>`
    <tr><td>${esc(p.nome)}</td><td>${esc(p.email)}</td>
      <td><span class="badge ${p.role==='admin'?'badge-admin':'badge-operador'}">${p.role}</span></td>
      <td>${p.ativo?'Ativo':'Inativo'}</td></tr>`).join('');
  el.innerHTML = `
    <div class="card">
      <h2>Operadores</h2>
      <div class="msg msg-info">O operador criado aqui só verá obras que você liberar na aba “Liberar Obras”.</div>
      <div class="grid grid-4" style="margin:16px 0">
        <div><label>Nome</label><input id="op_nome"></div>
        <div><label>E-mail</label><input id="op_email" type="email"></div>
        <div><label>Senha provisória</label><input id="op_senha" type="text" placeholder="mín. 6 caracteres"></div>
        <div><label>Perfil</label><select id="op_role"><option value="operador">Operador</option><option value="admin">Administrador</option></select></div>
        <div style="grid-column:1/-1"><button class="btn btn-primary btn-sm" onclick="criarOperador()">Criar login</button></div>
      </div>
      <table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
        <tbody>${linhas||''}</tbody></table>
    </div>`;
}

async function criarOperador(){
  const nome = $('#op_nome').value.trim();
  const email = $('#op_email').value.trim();
  const senha = $('#op_senha').value;
  const role = $('#op_role').value;
  if(!nome||!email||senha.length<6){ toast('Preencha nome, e-mail e senha (mín. 6).','erro'); return; }

  // chama Edge Function (usa service_role no servidor, com segurança)
  const { data:{ session } } = await supabaseClient.auth.getSession();
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/criar-operador`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}` },
    body: JSON.stringify({ nome, email, senha, role })
  });
  const out = await resp.json();
  if(!resp.ok){ toast(out.error||'Erro ao criar.','erro'); return; }
  toast('Login criado com sucesso.','ok');
  renderOperadores();
}

// ---------- LIBERAR OBRAS PARA OPERADORES ----------
async function renderAcessos(){
  const el = $('#view-acessos');
  const { data:ops } = await supabaseClient.from('perfis').select('*').eq('role','operador').eq('ativo',true).order('nome');
  const { data:obras } = await supabaseClient.from('obras').select('*').eq('ativa',true).order('nome');
  const { data:acessos } = await supabaseClient.from('acesso_obra').select('*');

  const mapa = {};
  (acessos||[]).forEach(a=>{ (mapa[a.user_id]=mapa[a.user_id]||new Set()).add(a.obra_id); });

  const blocos = (ops||[]).map(op=>{
    const liberadas = mapa[op.id] || new Set();
    const checks = (obras||[]).map(o=>`
      <label style="display:flex;align-items:center;gap:8px;font-weight:400;text-transform:none">
        <input type="checkbox" style="width:auto" ${liberadas.has(o.id)?'checked':''}
          onchange="toggleAcesso('${op.id}','${o.id}',this.checked)"> ${esc(o.nome)}
      </label>`).join('');
    return `<div class="card">
      <h2>${esc(op.nome)} <span class="chip">${esc(op.email)}</span></h2>
      <div class="grid grid-3">${checks||'<div>Nenhuma obra cadastrada.</div>'}</div>
    </div>`;
  }).join('');

  el.innerHTML = blocos || `<div class="card"><div class="lista-vazia">Nenhum operador cadastrado ainda.</div></div>`;
}

async function toggleAcesso(user_id, obra_id, liberar){
  if(liberar){
    const { error } = await supabaseClient.from('acesso_obra').insert({ user_id, obra_id });
    if(error){ toast(error.message,'erro'); return; }
    toast('Obra liberada.','ok');
  } else {
    const { error } = await supabaseClient.from('acesso_obra').delete().match({ user_id, obra_id });
    if(error){ toast(error.message,'erro'); return; }
    toast('Acesso removido.','ok');
  }
}
