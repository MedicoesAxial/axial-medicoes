// ============================================================
// MÓDULO DE MEDIÇÕES
// ============================================================
let UNIDADES = [];
let FORNECEDORES = [];

async function carregarRefs(){
  if(!UNIDADES.length){
    const { data:u } = await supabaseClient.from('unidades').select('*').order('sigla');
    UNIDADES = u || [];
  }
  if(!FORNECEDORES.length){
    const { data:f } = await supabaseClient.from('fornecedores').select('*').eq('ativo',true).order('nome');
    FORNECEDORES = f || [];
  }
}

// ---------- LISTA DE MEDIÇÕES ----------
async function renderMedicoes(){
  await carregarRefs();
  const el = $('#view-medicoes');

  if(!OBRAS_ACESSIVEIS.length){
    el.innerHTML = `<div class="card"><div class="lista-vazia">
      Você ainda não tem nenhuma obra liberada.<br>Solicite ao administrador.</div></div>`;
    return;
  }

  const { data:medicoes } = await supabaseClient
    .from('medicoes')
    .select('*, obras(nome), fornecedores(nome)')
    .order('criado_em',{ascending:false});

  const linhas = (medicoes||[]).map(m=>`
    <tr>
      <td>${esc(m.obras?.nome||'')}</td>
      <td>${esc(m.fornecedores?.nome||'')}</td>
      <td class="num">${m.rm_numero}</td>
      <td>${dataBR(m.periodo_inicio)} a ${dataBR(m.periodo_fim)}</td>
      <td><span class="badge ${m.status==='finalizada'?'badge-admin':'badge-operador'}">${m.status}</span></td>
      <td class="acoes">
        <button class="btn btn-secundario btn-sm" onclick="abrirMedicao('${m.id}')">Abrir</button>
      </td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="card">
      <h2>Medições
        <button class="btn btn-primary btn-sm" onclick="novaMedicao()">+ Nova medição</button>
      </h2>
      <div class="tabela-scroll">
        <table>
          <thead><tr><th>Obra</th><th>Fornecedor</th><th class="num">RM</th><th>Período</th><th>Status</th><th></th></tr></thead>
          <tbody>${linhas || '<tr><td colspan="6" class="lista-vazia">Nenhuma medição ainda.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

// ---------- NOVA MEDIÇÃO ----------
async function novaMedicao(){
  const el = $('#view-medicoes');
  const optsObra = OBRAS_ACESSIVEIS.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join('');
  const optsForn = FORNECEDORES.map(f=>`<option value="${f.id}" data-objeto="${esc(f.objeto||'')}">${esc(f.nome)}</option>`).join('');

  el.innerHTML = `
    <div class="card">
      <h2>Nova medição <button class="btn btn-secundario btn-sm" onclick="renderMedicoes()">Voltar</button></h2>
      <div id="msgNova"></div>
      <div class="grid grid-3">
        <div><label>Obra / Centro de custo</label><select id="nm_obra">${optsObra}</select></div>
        <div><label>Fornecedor (contratada)</label><select id="nm_forn">${optsForn}</select></div>
        <div><label>RM nº</label><input type="number" id="nm_rm" value="1" min="1"></div>
        <div><label>Período — início</label><input type="date" id="nm_ini" value="${hojeISO()}"></div>
        <div><label>Período — fim</label><input type="date" id="nm_fim" value="${hojeISO()}"></div>
        <div><label>Mês de referência</label><input type="month" id="nm_mes"></div>
        <div><label>Sub-contrato nº</label><input type="text" id="nm_sub"></div>
        <div style="grid-column:1/-1"><label>Objeto</label><input type="text" id="nm_obj" placeholder="LOCAÇÃO DE EQUIPAMENTOS"></div>
      </div>
      <small class="dica">Para somar com o período anterior do mesmo fornecedor/obra, depois de criar é só usar o mesmo fornecedor + RM seguinte; o sistema encadeia automaticamente.</small>
      <button class="btn btn-primary btn-full" onclick="criarMedicao()">Criar medição</button>
    </div>`;

  // preenche objeto ao trocar fornecedor
  $('#nm_forn').addEventListener('change', e=>{
    const objeto = e.target.selectedOptions[0]?.dataset.objeto || '';
    if(!$('#nm_obj').value) $('#nm_obj').value = objeto;
  });
  $('#nm_forn').dispatchEvent(new Event('change'));
}

async function criarMedicao(){
  const obra_id = $('#nm_obra').value;
  const fornecedor_id = $('#nm_forn').value;
  const rm = parseInt($('#nm_rm').value);
  const ini = $('#nm_ini').value, fim = $('#nm_fim').value;
  const mesV = $('#nm_mes').value;
  const mes = mesV ? mesV+'-01' : ini;

  if(!obra_id || !fornecedor_id || !rm || !ini || !fim){
    $('#msgNova').innerHTML = '<div class="msg msg-erro">Preencha obra, fornecedor, RM e período.</div>';
    return;
  }

  // procura medição anterior (mesmo fornecedor+obra, RM imediatamente menor)
  const { data:ant } = await supabaseClient.from('medicoes')
    .select('id, rm_numero').eq('obra_id', obra_id).eq('fornecedor_id', fornecedor_id)
    .lt('rm_numero', rm).order('rm_numero',{ascending:false}).limit(1);
  const anterior_id = ant && ant.length ? ant[0].id : null;

  const { data, error } = await supabaseClient.from('medicoes').insert({
    obra_id, fornecedor_id, rm_numero:rm,
    periodo_inicio:ini, periodo_fim:fim, mes_referencia:mes,
    sub_contrato:$('#nm_sub').value || null,
    objeto:$('#nm_obj').value || null,
    medicao_anterior_id: anterior_id,
    criado_por: PERFIL.id
  }).select().single();

  if(error){
    $('#msgNova').innerHTML = `<div class="msg msg-erro">${esc(error.message)}</div>`;
    return;
  }

  // se há medição anterior, copia os itens (carregando o "antes medido")
  if(anterior_id){
    const { data:itensAnt } = await supabaseClient.from('medicao_itens')
      .select('*').eq('medicao_id', anterior_id).order('ordem');
    if(itensAnt && itensAnt.length){
      const novos = itensAnt.map(i=>({
        medicao_id:data.id, ordem:i.ordem, item_codigo:i.item_codigo,
        descricao:i.descricao, dimensoes:i.dimensoes, unidade:i.unidade,
        qtd_total:i.qtd_total, preco_unitario:i.preco_unitario, qtd_periodo:0
      }));
      await supabaseClient.from('medicao_itens').insert(novos);
    }
  }
  abrirMedicao(data.id);
}

// ---------- ABRIR / EDITAR MEDIÇÃO ----------
let MEDICAO_ATUAL = null;
let ITENS_ATUAIS = [];

async function abrirMedicao(id){
  await carregarRefs();
  const { data:m } = await supabaseClient.from('medicoes')
    .select('*, obras(nome,centro_custo), fornecedores(nome)').eq('id', id).single();
  MEDICAO_ATUAL = m;

  const { data:itens } = await supabaseClient.from('v_medicao_itens')
    .select('*').eq('medicao_id', id).order('ordem');
  ITENS_ATUAIS = itens || [];

  desenharMedicao();
}

function desenharMedicao(){
  const m = MEDICAO_ATUAL;
  const el = $('#view-medicoes');
  const optsUn = s => UNIDADES.map(u=>`<option ${u.sigla===s?'selected':''}>${u.sigla}</option>`).join('');
  const bloqueado = m.status==='finalizada';

  const linhas = ITENS_ATUAIS.map((it,idx)=>`
    <tr data-id="${it.id}">
      <td><input class="col-mini" value="${esc(it.item_codigo||'')}" onchange="editarItem('${it.id}','item_codigo',this.value)" ${bloqueado?'disabled':''}></td>
      <td><input style="text-transform:uppercase;min-width:200px" value="${esc(it.descricao||'')}" onchange="editarItem('${it.id}','descricao',this.value.toUpperCase())" ${bloqueado?'disabled':''}></td>
      <td><input class="col-mini" value="${esc(it.dimensoes||'')}" onchange="editarItem('${it.id}','dimensoes',this.value)" ${bloqueado?'disabled':''}></td>
      <td><select onchange="editarItem('${it.id}','unidade',this.value)" ${bloqueado?'disabled':''}>${optsUn(it.unidade)}</select></td>
      <td><input type="number" class="col-mini num" value="${it.qtd_total}" step="0.0001" onchange="editarItem('${it.id}','qtd_total',this.value)" ${bloqueado?'disabled':''}></td>
      <td><input type="number" class="col-med num" value="${it.preco_unitario}" step="0.0001" onchange="editarItem('${it.id}','preco_unitario',this.value)" ${bloqueado?'disabled':''}></td>
      <td class="num">${brl(it.preco_total)}</td>
      <td class="num">${num(it.qtd_antes)}</td>
      <td class="num">${brl(it.valor_antes)}</td>
      <td><input type="number" class="col-mini num" value="${it.qtd_periodo}" step="0.0001" onchange="editarItem('${it.id}','qtd_periodo',this.value)" ${bloqueado?'disabled':''}></td>
      <td class="num">${brl(it.valor_periodo)}</td>
      <td class="num">${num(it.qtd_acumulada)}</td>
      <td class="num">${brl(it.valor_acumulado)}</td>
      <td>${bloqueado?'':`<button class="btn btn-perigo btn-sm" onclick="excluirItem('${it.id}')">✕</button>`}</td>
    </tr>`).join('');

  // totais
  const totPeriodo = ITENS_ATUAIS.reduce((s,i)=>s+Number(i.valor_periodo),0);
  const totAnterior = ITENS_ATUAIS.reduce((s,i)=>s+Number(i.valor_antes),0);
  const totAcum = ITENS_ATUAIS.reduce((s,i)=>s+Number(i.valor_acumulado),0);
  const liquido = totPeriodo - Number(m.desconto||0) - Number(m.retencao||0);

  el.innerHTML = `
    <div class="card">
      <h2>RM ${m.rm_numero} — ${esc(m.fornecedores.nome)}
        <button class="btn btn-secundario btn-sm" onclick="renderMedicoes()">Voltar à lista</button>
      </h2>
      <div class="grid grid-4">
        <div><strong>Obra:</strong><br>${esc(m.obras.nome)}</div>
        <div><strong>Centro de custo:</strong><br>${esc(m.obras.centro_custo||'-')}</div>
        <div><strong>Objeto:</strong><br>${esc(m.objeto||'-')}</div>
        <div><strong>Período:</strong><br>${dataBR(m.periodo_inicio)} a ${dataBR(m.periodo_fim)}</div>
      </div>
      ${bloqueado?'<div class="msg msg-info">Medição finalizada (somente leitura).</div>':''}

      <div class="tabela-scroll" style="margin-top:18px">
        <table>
          <thead>
            <tr>
              <th>Item</th><th>Descrição dos serviços</th><th>Dimensões</th><th>UN</th>
              <th class="num">Qtd total</th><th class="num">Preço unit.</th><th class="num">Preço total</th>
              <th class="num">Qtd antes</th><th class="num">Valor antes</th>
              <th class="num">Qtd período</th><th class="num">Valor período</th>
              <th class="num">Qtd acum.</th><th class="num">Valor acum.</th><th></th>
            </tr>
          </thead>
          <tbody>${linhas || '<tr><td colspan="14" class="lista-vazia">Nenhum item. Adicione abaixo.</td></tr>'}</tbody>
        </table>
      </div>
      ${bloqueado?'':'<button class="btn btn-secundario btn-sm" style="margin-top:12px" onclick="adicionarItem()">+ Adicionar item</button>'}

      <div class="grid grid-2" style="margin-top:20px">
        <div><label>Desconto / Acréscimo (R$)</label>
          <input type="number" step="0.01" value="${m.desconto}" onchange="editarMedicao('desconto',this.value)" ${bloqueado?'disabled':''}></div>
        <div><label>Retenções (R$)</label>
          <input type="number" step="0.01" value="${m.retencao}" onchange="editarMedicao('retencao',this.value)" ${bloqueado?'disabled':''}></div>
        <div style="grid-column:1/-1"><label>Observações</label>
          <textarea onchange="editarMedicao('observacoes',this.value)" ${bloqueado?'disabled':''}>${esc(m.observacoes||'')}</textarea></div>
      </div>

      <div class="totais">
        <div class="total-box"><div class="rotulo">Total anterior</div><div class="valor">${brl(totAnterior)}</div></div>
        <div class="total-box"><div class="rotulo">Total no período (bruto)</div><div class="valor">${brl(totPeriodo)}</div></div>
        <div class="total-box"><div class="rotulo">Total acumulado</div><div class="valor">${brl(totAcum)}</div></div>
        <div class="total-box destaque"><div class="rotulo">Líquido a pagar</div><div class="valor">${brl(liquido)}</div></div>
      </div>

      ${bloqueado?'':`
      <div class="toolbar" style="margin-top:20px">
        <div class="spacer"></div>
        <button class="btn btn-primary" onclick="finalizarMedicao()">Finalizar medição</button>
      </div>`}
    </div>`;
}

async function adicionarItem(){
  const prox = ITENS_ATUAIS.length+1;
  const { error } = await supabaseClient.from('medicao_itens').insert({
    medicao_id: MEDICAO_ATUAL.id, ordem: prox, item_codigo: `1.1.${prox}`,
    descricao:'NOVO ITEM', unidade:'UN', qtd_total:0, preco_unitario:0, qtd_periodo:0
  });
  if(error){ toast(error.message,'erro'); return; }
  abrirMedicao(MEDICAO_ATUAL.id);
}

async function editarItem(id, campo, valor){
  const numericos = ['qtd_total','preco_unitario','qtd_periodo'];
  if(numericos.includes(campo)) valor = parseFloat(valor)||0;
  const { error } = await supabaseClient.from('medicao_itens').update({[campo]:valor}).eq('id',id);
  if(error){ toast(error.message,'erro'); return; }
  // recarrega para recalcular as fórmulas (view)
  abrirMedicao(MEDICAO_ATUAL.id);
}

async function excluirItem(id){
  if(!confirm('Excluir este item?')) return;
  await supabaseClient.from('medicao_itens').delete().eq('id',id);
  abrirMedicao(MEDICAO_ATUAL.id);
}

async function editarMedicao(campo, valor){
  const numericos = ['desconto','retencao'];
  if(numericos.includes(campo)) valor = parseFloat(valor)||0;
  await supabaseClient.from('medicoes').update({[campo]:valor}).eq('id',MEDICAO_ATUAL.id);
  MEDICAO_ATUAL[campo]=valor;
  if(numericos.includes(campo)) abrirMedicao(MEDICAO_ATUAL.id);
}

async function finalizarMedicao(){
  if(!confirm('Finalizar a medição? Depois ela ficará somente leitura.')) return;
  await supabaseClient.from('medicoes').update({status:'finalizada'}).eq('id',MEDICAO_ATUAL.id);
  toast('Medição finalizada.','ok');
  abrirMedicao(MEDICAO_ATUAL.id);
}
