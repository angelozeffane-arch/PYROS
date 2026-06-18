#!/usr/bin/env node
// patch_v55.js — 3 patches : Comparateur prix, Edit mode global, Supabase Auth
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');
let html = fs.readFileSync(FILE, 'utf8');
let errors = [];

function patch(label, oldStr, newStr) {
  if (!html.includes(oldStr)) {
    errors.push('MISS: ' + label);
    return;
  }
  html = html.replace(oldStr, newStr);
  console.log('OK  : ' + label);
}

// ============================================================
// PATCH 1 — Comparateur de prix (renderAgentTab)
// ============================================================
patch('renderAgentTab → comparateur prix',
`function renderAgentTab(content,productName){
  var box=document.createElement('div');box.style.cssText='text-align:center;padding:24px 16px;';
  box.innerHTML='<div style="font-size:42px;margin-bottom:12px;">🤖</div><div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px;">Agent comparateur autonome</div><div style="font-size:12px;color:var(--text3);line-height:1.6;">Le vrai agent qui compare automatiquement les prix, frais de port et délais en temps réel sera ajouté ici via <b>Claude Code</b> (nécessite un backend pour interroger les sites).<br><br>Pour l\\u2019instant, utilise l\\u2019onglet <b>Comparer</b> qui ouvre tous les sites en 1 clic.</div>';
  content.appendChild(box);
}`,
`function renderAgentTab(content,productName){
  if(!state.priceComps)state.priceComps={};
  var key=((productName||'').toLowerCase().trim())||'_global';
  if(!state.priceComps[key])state.priceComps[key]=[];
  var entries=state.priceComps[key];
  var wrap=document.createElement('div');wrap.style.cssText='padding:12px 0;';
  var title=document.createElement('div');
  title.style.cssText='font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;';
  title.textContent='\\uD83D\\uDCCB Comparateur de prix'+(productName?' \\u2014 '+productName:'');
  wrap.appendChild(title);
  var sub=document.createElement('div');
  sub.style.cssText='font-size:11px;color:var(--text3);margin-bottom:12px;';
  sub.textContent='Note les prix trouv\\u00e9s sur les sites pour comparer. \\u2705 = meilleur prix.';
  wrap.appendChild(sub);
  var addBtn=document.createElement('button');addBtn.type='button';
  addBtn.style.cssText='background:var(--orange);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px;';
  addBtn.textContent='+ Ajouter un prix';
  wrap.appendChild(addBtn);
  function buildTable(){
    var old=wrap.querySelector('.pc-tbl');if(old)old.remove();
    if(!entries.length){
      var empty=document.createElement('div');empty.className='pc-tbl';
      empty.style.cssText='font-size:12px;color:var(--text3);padding:8px 0;text-align:center;';
      empty.textContent='Aucun prix enregistr\\u00e9. Commence par en ajouter un.';
      wrap.appendChild(empty);return;
    }
    var sorted=entries.slice().sort(function(a,b){return(parseFloat(a.price)||9999)-(parseFloat(b.price)||9999);});
    var bestPrice=parseFloat(sorted[0].price);
    var tbl=document.createElement('div');tbl.className='pc-tbl';
    tbl.style.cssText='border:0.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:8px;';
    sorted.forEach(function(e,i){
      var isBest=parseFloat(e.price)===bestPrice;
      var row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:8px;padding:9px 10px;font-size:12px;'
        +'background:'+(i%2===0?'var(--card)':'rgba(0,0,0,0.02)')+';'
        +'border-left:3px solid '+(isBest?'#16a34a':'transparent')+';';
      var badge=document.createElement('div');badge.style.cssText='font-size:14px;width:18px;text-align:center;flex-shrink:0;';
      badge.textContent=isBest?'\\u2705':'';
      var merchant=document.createElement('div');merchant.style.cssText='flex:1;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      merchant.textContent=e.merchant||'?';
      var priceEl=document.createElement('div');
      priceEl.style.cssText='font-weight:700;color:'+(isBest?'#16a34a':'var(--text)')+';white-space:nowrap;flex-shrink:0;';
      priceEl.textContent=(parseFloat(e.price)||0).toFixed(2)+'\\u20ac'+(e.unit?' / '+e.unit:'');
      var dateEl=document.createElement('div');dateEl.style.cssText='font-size:10px;color:var(--text3);white-space:nowrap;flex-shrink:0;';
      dateEl.textContent=e.date||'';
      var del=document.createElement('button');del.type='button';
      del.style.cssText='background:none;border:none;font-size:16px;cursor:pointer;padding:0 2px;color:#dc2626;flex-shrink:0;line-height:1;';
      del.textContent='\\u00d7';
      del.onclick=function(){state.priceComps[key]=state.priceComps[key].filter(function(x){return x.id!==e.id;});save();buildTable();};
      row.appendChild(badge);row.appendChild(merchant);row.appendChild(priceEl);row.appendChild(dateEl);row.appendChild(del);
      tbl.appendChild(row);
    });
    wrap.appendChild(tbl);
    var note=document.createElement('div');note.style.cssText='font-size:10px;color:var(--text3);text-align:center;';
    note.textContent=entries.length+' entr\\u00e9e'+(entries.length>1?'s':'')+' \\u2014 '+(productName?'produit : '+productName:'global');
    wrap.appendChild(note);
  }
  addBtn.onclick=function(){
    var existing=wrap.querySelector('.pc-form');if(existing){existing.remove();return;}
    var form=document.createElement('div');form.className='pc-form';
    form.style.cssText='background:var(--card);border:0.5px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;';
    function inp(ph,tp){
      var i=document.createElement('input');i.placeholder=ph;i.type=tp||'text';
      i.style.cssText='padding:8px;border:0.5px solid var(--border);border-radius:6px;font-size:12px;background:var(--bg);color:var(--text);width:100%;box-sizing:border-box;';
      return i;
    }
    var iMerchant=inp('Site / Marchand (ex: Metro, Rungis, Amazon...)');
    var iPrice=inp('Prix TTC en \\u20ac (ex: 4.50)','number');iPrice.step='0.01';iPrice.min='0';
    var iUnit=inp('Unit\\u00e9 (ex: kg, L, pi\\u00e8ce)');
    var iNote=inp('Note (optionnel)');
    var today=new Date();var p2=function(n){return(n<10?'0':'')+n;};
    var dateStr=today.getFullYear()+'-'+p2(today.getMonth()+1)+'-'+p2(today.getDate());
    var btns=document.createElement('div');btns.style.cssText='display:flex;gap:8px;';
    var saveF=document.createElement('button');saveF.type='button';
    saveF.style.cssText='flex:1;background:#16a34a;color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;';
    saveF.textContent='\\u2713 Enregistrer';
    var cancel=document.createElement('button');cancel.type='button';
    cancel.style.cssText='background:var(--border);color:var(--text);border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;';
    cancel.textContent='Annuler';
    saveF.onclick=function(){
      var merchant=(iMerchant.value||'').trim();var price=(iPrice.value||'').trim();
      if(!merchant||!price){iMerchant.style.outline='2px solid #dc2626';iPrice.style.outline='2px solid #dc2626';return;}
      entries.push({id:'pc_'+Date.now(),merchant:merchant,price:price,unit:(iUnit.value||'').trim(),date:dateStr,note:(iNote.value||'').trim()});
      save();form.remove();buildTable();
    };
    cancel.onclick=function(){form.remove();};
    btns.appendChild(saveF);btns.appendChild(cancel);
    form.appendChild(iMerchant);form.appendChild(iPrice);form.appendChild(iUnit);form.appendChild(iNote);form.appendChild(btns);
    wrap.insertBefore(form,addBtn.nextSibling);
  };
  buildTable();
  content.appendChild(wrap);
}`
);

// ============================================================
// PATCH 2a — renderMetierSection : edit mode (renommer + emoji)
// ============================================================
patch('renderMetierSection + editMode',
`function renderMetierSection(container,tabId){
  var info=METIER_INFO[tabId]||{label:'Section',emoji:'📁'};
  var hdr=document.createElement('div');hdr.className='section-header';
  hdr.innerHTML='<span class="section-label">'+info.emoji+' '+info.label+'</span>';
  container.appendChild(hdr);
  renderAllergenStrip(container);
  renderSectionProducts(container,tabId,info.label);
  renderModuleContent(container,tabId,info.label);
}`,
`function renderMetierSection(container,tabId){
  var info=METIER_INFO[tabId]||{label:'Section',emoji:'\\uD83D\\uDCC1'};
  var customLabel=(state.cardLabels&&state.cardLabels[tabId])||info.label;
  var customEmoji=(state.cardEmojis&&state.cardEmojis[tabId])||info.emoji;
  var hdr=document.createElement('div');hdr.className='section-header';
  var lbl=document.createElement('span');lbl.className='section-label';lbl.textContent=customEmoji+' '+customLabel;
  hdr.appendChild(lbl);
  container.appendChild(hdr);
  if(editMode){
    var editRow=document.createElement('div');editRow.style.cssText='display:flex;gap:6px;margin-top:6px;margin-bottom:2px;';
    var ren=document.createElement('button');ren.type='button';ren.className='sec-reset';ren.textContent='\\u270e Renommer';
    ren.onclick=function(){uiPrompt('Nouveau nom :',function(v){if(!v||!v.trim())return;if(!state.cardLabels)state.cardLabels={};state.cardLabels[tabId]=v.trim();save();renderAll();},customLabel);};
    var emoBtn=document.createElement('button');emoBtn.type='button';emoBtn.className='sec-reset';emoBtn.textContent='\\uD83D\\uDE00 Emoji';
    emoBtn.onclick=function(){openEmojiPicker(function(e){if(!state.cardEmojis)state.cardEmojis={};state.cardEmojis[tabId]=e;save();renderAll();});};
    editRow.appendChild(ren);editRow.appendChild(emoBtn);
    container.appendChild(editRow);
  }
  renderAllergenStrip(container);
  renderSectionProducts(container,tabId,customLabel);
  renderModuleContent(container,tabId,customLabel);
}`
);

// ============================================================
// PATCH 2b — renderCustomSection : edit mode (renommer + emoji)
// ============================================================
patch('renderCustomSection + editMode',
`function renderCustomSection(container,tabId){
  var cs=(state.customSections||[]).find(function(s){return s.id===tabId;});
  if(!cs){activeTab='__home__';return renderAll();}
  var hdr=document.createElement('div');hdr.className='section-header';
  hdr.innerHTML='<span class="section-label">'+(cs.emoji||'📁')+' '+cs.label+'</span>';
  container.appendChild(hdr);
  renderAllergenStrip(container);
  renderSectionProducts(container,tabId,cs.label);
  renderModuleContent(container,tabId,cs.label);
  // Bouton supprimer
  var del=document.createElement('button');del.className='sec-reset';del.style.marginTop='20px';
  del.innerHTML='🗑 Supprimer cette section';
  del.onclick=function(){uiConfirm('Supprimer la section « '+cs.label+' » ?',function(){state.customSections=state.customSections.filter(function(s){return s.id!==tabId;});save();goHome();});};
  container.appendChild(del);
}`,
`function renderCustomSection(container,tabId){
  var cs=(state.customSections||[]).find(function(s){return s.id===tabId;});
  if(!cs){activeTab='__home__';return renderAll();}
  var hdr=document.createElement('div');hdr.className='section-header';
  hdr.innerHTML='<span class="section-label">'+(cs.emoji||'\\uD83D\\uDCC1')+' '+cs.label+'</span>';
  container.appendChild(hdr);
  if(editMode){
    var editRow=document.createElement('div');editRow.style.cssText='display:flex;gap:6px;margin-top:6px;margin-bottom:2px;';
    var ren=document.createElement('button');ren.type='button';ren.className='sec-reset';ren.textContent='\\u270e Renommer';
    ren.onclick=function(){uiPrompt('Nouveau nom :',function(v){if(!v||!v.trim())return;cs.label=v.trim();save();renderAll();},cs.label);};
    var emoBtn=document.createElement('button');emoBtn.type='button';emoBtn.className='sec-reset';emoBtn.textContent='\\uD83D\\uDE00 Emoji';
    emoBtn.onclick=function(){openEmojiPicker(function(e){cs.emoji=e;save();renderAll();});};
    editRow.appendChild(ren);editRow.appendChild(emoBtn);
    container.appendChild(editRow);
  }
  renderAllergenStrip(container);
  renderSectionProducts(container,tabId,cs.label);
  renderModuleContent(container,tabId,cs.label);
  if(editMode){
    var del=document.createElement('button');del.className='sec-reset';del.style.cssText='margin-top:20px;color:#dc2626;';
    del.innerHTML='\\uD83D\\uDDD1 Supprimer cette section';
    del.onclick=function(){uiConfirm('Supprimer la section \\u00ab '+cs.label+' \\u00bb ?',function(){state.customSections=state.customSections.filter(function(s){return s.id!==tabId;});save();goHome();});};
    container.appendChild(del);
  }
}`
);

// ============================================================
// PATCH 3 — Supabase Auth (remplace showGate + sbHeaders)
// ============================================================

// 3a : sbHeaders utilise le token auth si disponible
patch('sbHeaders → utilise token auth',
`function sbHeaders(extra){var h={'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY};if(extra){for(var k in extra)h[k]=extra[k];}return h;}`,
`function sbGetToken(){try{var s=JSON.parse(localStorage.getItem('mep_sb_auth')||'null');if(s&&s.access_token&&s.expires_at>Date.now()/1000+30)return s.access_token;}catch(e){}return null;}
function sbHeaders(extra){var tok=sbGetToken()||SB_KEY;var h={'apikey':SB_KEY,'Authorization':'Bearer '+tok};if(extra){for(var k in extra)h[k]=extra[k];}return h;}`
);

// 3b : showGate → propose login Supabase OU code legacy
patch('showGate → Supabase Auth + code legacy',
`var ACCESS_CODE='giorgionolinominusbrutus';
function accessOK(){try{return localStorage.getItem('mep_access')==='ok';}catch(e){return true;}}
function showGate(){
  var ov=document.createElement('div');ov.className='gate-ov';
  var box=document.createElement('div');box.className='gate-box';
  box.innerHTML='<div class="gate-title">PYROS</div><div class="gate-sub">Angelo Zeffane</div><div class="gate-msg">Entre le code d\\'accès</div>';
  var inp=document.createElement('input');inp.type='password';inp.className='gate-input';inp.placeholder='Code';inp.autocomplete='off';
  var btn=document.createElement('button');btn.type='button';btn.className='gate-btn';btn.textContent='Entrer';
  var err=document.createElement('div');err.className='gate-err';
  function tryCode(){if((inp.value||'').trim().toLowerCase()===ACCESS_CODE.toLowerCase()){try{localStorage.setItem('mep_access','ok');}catch(e){}try{document.body.removeChild(ov);}catch(e){}bootApp();}else{err.textContent='Code incorrect';inp.value='';try{inp.focus();}catch(e){}}}
  btn.onclick=tryCode;inp.addEventListener('keydown',function(e){if(e.key==='Enter')tryCode();});
  box.appendChild(inp);box.appendChild(btn);box.appendChild(err);ov.appendChild(box);document.body.appendChild(ov);
  setTimeout(function(){try{inp.focus();}catch(e){}},80);
}`,
`var ACCESS_CODE='giorgionolinominusbrutus';
function accessOK(){
  try{
    // Session Supabase Auth valide ?
    var s=JSON.parse(localStorage.getItem('mep_sb_auth')||'null');
    if(s&&s.access_token&&s.expires_at>Date.now()/1000+30)return true;
    // Code legacy
    return localStorage.getItem('mep_access')==='ok';
  }catch(e){return true;}
}
function sbAuthSignIn(email,password,onOk,onErr){
  fetch(SB_URL+'/auth/v1/token?grant_type=password',{
    method:'POST',
    headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({email:email,password:password})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.access_token){
      try{localStorage.setItem('mep_sb_auth',JSON.stringify(d));localStorage.setItem('mep_access','ok');}catch(e){}
      onOk(d);
    } else {
      onErr(d.error_description||d.msg||'Identifiants incorrects');
    }
  }).catch(function(e){onErr('Hors-ligne ou erreur r\\u00e9seau');});
}
function sbAuthSignOut(){
  try{localStorage.removeItem('mep_sb_auth');localStorage.removeItem('mep_access');}catch(e){}
  location.reload();
}
function showGate(){
  var ov=document.createElement('div');ov.className='gate-ov';
  var box=document.createElement('div');box.className='gate-box';
  box.innerHTML='<div class="gate-title">PYROS</div><div class="gate-sub">Angelo Zeffane</div>';
  // Tabs
  var tabs=document.createElement('div');tabs.style.cssText='display:flex;gap:4px;margin-bottom:14px;';
  var tEmail=document.createElement('button');tEmail.type='button';tEmail.className='gate-btn';tEmail.style.cssText='flex:1;font-size:11px;padding:6px;opacity:1;';tEmail.textContent='\\uD83D\\uDD12 Compte';
  var tCode=document.createElement('button');tCode.type='button';tCode.className='gate-btn';tCode.style.cssText='flex:1;font-size:11px;padding:6px;opacity:.5;background:var(--border);color:var(--text);';tCode.textContent='\\uD83D\\uDD11 Code';
  tabs.appendChild(tEmail);tabs.appendChild(tCode);
  box.appendChild(tabs);
  // Views
  var vEmail=document.createElement('div');
  var emailInp=document.createElement('input');emailInp.type='email';emailInp.className='gate-input';emailInp.placeholder='Email';emailInp.autocomplete='email';
  var passInp=document.createElement('input');passInp.type='password';passInp.className='gate-input';passInp.placeholder='Mot de passe';passInp.autocomplete='current-password';passInp.style.marginTop='8px';
  var loginBtn=document.createElement('button');loginBtn.type='button';loginBtn.className='gate-btn';loginBtn.textContent='Connexion';
  vEmail.appendChild(emailInp);vEmail.appendChild(passInp);vEmail.appendChild(loginBtn);
  var vCode=document.createElement('div');vCode.style.display='none';
  var codeInp=document.createElement('input');codeInp.type='password';codeInp.className='gate-input';codeInp.placeholder='Code d\\u2019acc\\u00e8s';codeInp.autocomplete='off';
  var codeBtn=document.createElement('button');codeBtn.type='button';codeBtn.className='gate-btn';codeBtn.textContent='Entrer';
  vCode.appendChild(codeInp);vCode.appendChild(codeBtn);
  var err=document.createElement('div');err.className='gate-err';
  box.appendChild(vEmail);box.appendChild(vCode);box.appendChild(err);
  tEmail.onclick=function(){vEmail.style.display='';vCode.style.display='none';tEmail.style.opacity='1';tCode.style.opacity='.5';tCode.style.background='var(--border)';tCode.style.color='var(--text)';tEmail.style.background='';};
  tCode.onclick=function(){vCode.style.display='';vEmail.style.display='none';tCode.style.opacity='1';tEmail.style.opacity='.5';tEmail.style.background='var(--border)';tEmail.style.color='var(--text)';tCode.style.background='';setTimeout(function(){try{codeInp.focus();}catch(e){}},50);};
  function doLogin(){
    var email=(emailInp.value||'').trim();var pass=(passInp.value||'').trim();
    if(!email||!pass){err.textContent='Email et mot de passe requis';return;}
    loginBtn.textContent='...';err.textContent='';
    sbAuthSignIn(email,pass,function(){try{document.body.removeChild(ov);}catch(e){}bootApp();},function(msg){err.textContent=msg;loginBtn.textContent='Connexion';});
  }
  loginBtn.onclick=doLogin;
  passInp.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  function doCode(){
    if((codeInp.value||'').trim().toLowerCase()===ACCESS_CODE.toLowerCase()){
      try{localStorage.setItem('mep_access','ok');}catch(e){}
      try{document.body.removeChild(ov);}catch(e){}bootApp();
    } else {err.textContent='Code incorrect';codeInp.value='';try{codeInp.focus();}catch(e){}}
  }
  codeBtn.onclick=doCode;codeInp.addEventListener('keydown',function(e){if(e.key==='Enter')doCode();});
  ov.appendChild(box);document.body.appendChild(ov);
  setTimeout(function(){try{emailInp.focus();}catch(e){}},80);
}`
);

// ============================================================
// Validation JS
// ============================================================
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
let jsOk = true;
if (scriptMatch) {
  for (const blk of scriptMatch) {
    const inner = blk.replace(/<script[^>]*>/i,'').replace(/<\/script>/i,'');
    try { new Function(inner); } catch(e) { console.error('JS ERROR in block:', e.message.slice(0,100)); jsOk = false; }
  }
}

if (errors.length) {
  console.error('\nPATCH MANQUÉS:\n' + errors.join('\n'));
  process.exit(1);
}
if (!jsOk) { process.exit(2); }

fs.writeFileSync(FILE, html, 'utf8');
console.log('\nv55 écrit avec succès — ' + Math.round(html.length/1024) + ' KB');
