:root{
  --axial-azul:#1B7BB8;
  --axial-azul-claro:#4BA3D3;
  --axial-azul-escuro:#155F8F;
  --cinza-texto:#3a3f44;
  --cinza-borda:#d8dee4;
  --cinza-fundo:#f4f6f8;
  --cinza-claro:#fbfcfd;
  --verde:#2e9e5b;
  --vermelho:#cf3b3b;
  --amarelo:#e0a106;
  --sombra:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.04);
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Segoe UI',Arial,Helvetica,sans-serif;
  background:var(--cinza-fundo);
  color:var(--cinza-texto);
  font-size:14px;
}
a{color:var(--axial-azul);text-decoration:none}
.hidden{display:none !important}

/* ---------- LOGIN ---------- */
.login-wrap{
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#eef3f7 0%,#dce6ef 100%);
}
.login-card{
  background:#fff;padding:40px;border-radius:14px;box-shadow:var(--sombra);
  width:100%;max-width:380px;text-align:center;
}
.login-card img{max-width:200px;margin-bottom:24px}
.login-card h1{font-size:18px;color:var(--axial-azul-escuro);margin-bottom:24px;font-weight:600}

/* ---------- FORM ---------- */
label{display:block;text-align:left;font-size:12px;font-weight:600;color:#667;margin:12px 0 4px}
input,select,textarea{
  width:100%;padding:9px 11px;border:1px solid var(--cinza-borda);
  border-radius:7px;font-size:14px;font-family:inherit;background:#fff;
}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--axial-azul);box-shadow:0 0 0 3px rgba(27,123,184,.12)}
textarea{resize:vertical;min-height:60px}

button,.btn{
  cursor:pointer;border:none;border-radius:7px;padding:9px 16px;font-size:14px;
  font-weight:600;font-family:inherit;transition:.15s;
}
.btn-primary{background:var(--axial-azul);color:#fff}
.btn-primary:hover{background:var(--axial-azul-escuro)}
.btn-secundario{background:#eef2f5;color:var(--cinza-texto)}
.btn-secundario:hover{background:#e0e6eb}
.btn-perigo{background:#fbeaea;color:var(--vermelho)}
.btn-perigo:hover{background:#f5d6d6}
.btn-sm{padding:5px 10px;font-size:12px}
.btn-full{width:100%;margin-top:18px}

/* ---------- LAYOUT APP ---------- */
.topbar{
  background:#fff;border-bottom:1px solid var(--cinza-borda);
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 22px;box-shadow:var(--sombra);position:sticky;top:0;z-index:50;
}
.topbar img{height:34px}
.topbar .user{display:flex;align-items:center;gap:14px;font-size:13px}
.badge{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}
.badge-admin{background:#e7f0fa;color:var(--axial-azul-escuro)}
.badge-operador{background:#eaf6ee;color:var(--verde)}

.tabs{display:flex;gap:4px;background:#fff;padding:0 22px;border-bottom:1px solid var(--cinza-borda)}
.tab{padding:12px 18px;cursor:pointer;font-weight:600;color:#889;border-bottom:3px solid transparent}
.tab.ativo{color:var(--axial-azul);border-bottom-color:var(--axial-azul)}
.tab:hover{color:var(--axial-azul)}

.container{max-width:1280px;margin:22px auto;padding:0 22px}
.card{background:#fff;border-radius:12px;box-shadow:var(--sombra);padding:22px;margin-bottom:20px}
.card h2{font-size:16px;color:var(--axial-azul-escuro);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}

/* ---------- TABELAS ---------- */
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:var(--axial-azul);color:#fff;padding:9px 8px;text-align:left;font-weight:600;font-size:12px}
th.num,td.num{text-align:right}
td{padding:7px 8px;border-bottom:1px solid var(--cinza-borda)}
tr:hover td{background:var(--cinza-claro)}
tbody tr.grupo td{background:#eef3f7;font-weight:700;color:var(--axial-azul-escuro)}
.tabela-scroll{overflow-x:auto}

/* inputs dentro da tabela de medição */
table input,table select{padding:5px 6px;font-size:12px;border-radius:5px}
.col-mini{width:70px}.col-med{width:120px}

/* ---------- GRID FORM ---------- */
.grid{display:grid;gap:14px}
.grid-2{grid-template-columns:1fr 1fr}
.grid-3{grid-template-columns:1fr 1fr 1fr}
.grid-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:760px){.grid-2,.grid-3,.grid-4{grid-template-columns:1fr}}

/* ---------- TOTAIS ---------- */
.totais{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
.total-box{background:var(--cinza-claro);border:1px solid var(--cinza-borda);border-radius:10px;padding:14px}
.total-box .rotulo{font-size:11px;color:#889;text-transform:uppercase;font-weight:700}
.total-box .valor{font-size:20px;font-weight:700;color:var(--axial-azul-escuro);margin-top:4px}
.total-box.destaque{background:var(--axial-azul);border-color:var(--axial-azul)}
.total-box.destaque .rotulo,.total-box.destaque .valor{color:#fff}

/* ---------- MENSAGENS ---------- */
.msg{padding:10px 14px;border-radius:8px;margin:12px 0;font-size:13px}
.msg-erro{background:#fbeaea;color:var(--vermelho);border:1px solid #f0c4c4}
.msg-ok{background:#eaf6ee;color:var(--verde);border:1px solid #c4e6cf}
.msg-info{background:#e7f0fa;color:var(--axial-azul-escuro);border:1px solid #c4daf0}

.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.toolbar .spacer{flex:1}
.lista-vazia{text-align:center;color:#99a;padding:40px 0}
.chip{display:inline-block;background:#eef3f7;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px}
.acoes{display:flex;gap:6px}
small.dica{color:#99a;font-size:11px;display:block;margin-top:3px}
