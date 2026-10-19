'use strict';
/* Customer order page: scan QR -> pick items -> place order (goes to the owner's Live Orders) */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem('cust.'+k))??d}catch{return d}},SV=(k,v)=>localStorage.setItem('cust.'+k,JSON.stringify(v));
const cfg=()=>window.SUPABASE_URL&&!/YOUR_/.test(window.SUPABASE_URL);
const api=(p,o={})=>fetch(SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+p,{...o,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'}}).then(async r=>{const t=await r.text();if(!r.ok)throw new Error(t||r.status);return t?JSON.parse(t):null});
let menu=LS('menu',[]),set={store:'Aristo Beans',gst:5,cur:'₹',phone:'',...LS('set',{})},cart=[],sz='',last=LS('last',null),poll=null;
const table0=new URLSearchParams(location.search).get('table')||'';
const form={tn:table0,cn:LS('name',''),cp:LS('phone',''),nt:''};
const fmt=n=>set.cur+(+n||0).toFixed(2);
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)};
const calc=()=>{const sub=cart.reduce((a,i)=>a+i.qty*i.price,0),tax=+(sub*set.gst/100).toFixed(2);return{subtotal:sub,tax,total:+(sub+tax).toFixed(2)}};
const sheet=h=>{const s=$('#sheet');s.dataset.k='';s.innerHTML='<button class="x" data-close aria-label="Close">✕</button>'+h;$('#modal').classList.remove('hidden')};
const closeSheet=()=>{$('#modal').classList.add('hidden');clearInterval(poll)};
const inCart=id=>cart.find(i=>i.id==id);
const tile=m=>{const l=inCart(m.id);return`<div class="tile"><b>${esc(m.name)}</b><small>${esc(m.size)}</small><span>${fmt(m.price)}</span>${l?`<div class="qty"><button data-q="${esc(m.id)}" data-d="-1">−</button><b>${l.qty}</b><button data-q="${esc(m.id)}" data-d="1">+</button></div>`:`<button class="btn sm" data-add="${esc(m.id)}">Add</button>`}</div>`};

function fillCats(){const c=$('#sc'),v=c.value;c.innerHTML='<option value="">All categories</option>'+[...new Set(menu.map(m=>m.cat))].map(k=>`<option>${esc(k)}</option>`).join('');c.value=v}
function draw(){
 $('#sn').textContent=set.store;$('#tb').textContent='Table '+table0;$('#tb').hidden=!table0;$('#mine').hidden=!last;
 const cats=[...new Set(menu.map(m=>m.cat))],sizes=[...new Set(menu.map(m=>m.size).filter(Boolean))],q=$('#si').value.toLowerCase(),c=$('#sc').value;
 $('#ch').innerHTML=sizes.length>1?['',...sizes].map(s=>`<button class="chip ${s==sz?'on':''}" data-s="${esc(s)}">${s?esc(s):'All sizes'}</button>`).join(''):'';
 const L=menu.filter(m=>(!q||m.name.toLowerCase().includes(q))&&(!c||m.cat==c)&&(!sz||m.size==sz));
 $('#mi').innerHTML=cats.filter(k=>L.some(m=>m.cat==k)).map(k=>`<h4>${esc(k)}</h4><div class="tiles">${L.filter(m=>m.cat==k).map(tile).join('')}</div>`).join('')||`<div class="empty">${menu.length?'No items found':'Loading menu…'}</div>`;
 const n=cart.reduce((a,i)=>a+i.qty,0);$('#cbar').classList.toggle('hidden',!n);$('#cc').textContent=n+' item'+(n>1?'s':'')+' · '+fmt(calc().total)}
async function load(){
 if(!cfg()||!navigator.onLine)return;
 try{const m=await api('menu_items?select=*&avail=eq.true&order=cat,name');if(m&&m.length){menu=m;SV('menu',m);fillCats()}}catch{}
 try{const s=await api('store_settings?id=eq.main&select=data');if(s&&s[0]){set={...set,...s[0].data};SV('set',set)}}catch{}
 draw()}
function chg(id,d){const l=inCart(id);if(!l)return;l.qty+=d;if(l.qty<1)cart.splice(cart.indexOf(l),1);draw();if($('#sheet').dataset.k=='cart'&&!$('#modal').classList.contains('hidden'))openCart()}
function openCart(){
 if(!cart.length)return closeSheet();const T=calc();
 sheet(`<h2>Your order</h2>${cart.map(i=>`<div class="cl"><span>${esc(i.name)} <em>${esc(i.size)}</em></span><span class="qty"><button data-q="${esc(i.id)}" data-d="-1">−</button>${i.qty}<button data-q="${esc(i.id)}" data-d="1">+</button></span><b>${fmt(i.qty*i.price)}</b></div>`).join('')}<div class="tot" style="margin:10px 0">Subtotal ${fmt(T.subtotal)} · GST ${fmt(T.tax)}<br><b>Total ${fmt(T.total)}</b></div><div class="fl"><input data-f="tn" placeholder="Table No." value="${esc(form.tn)}"><input data-f="cn" placeholder="Your name (optional)" value="${esc(form.cn)}"><input data-f="cp" placeholder="Phone no (optional)" inputmode="tel" value="${esc(form.cp)}"><input data-f="nt" placeholder="Notes for the kitchen (optional)" value="${esc(form.nt)}"></div><button class="btn big wide" id="place">Place Order</button>`);
 $('#sheet').dataset.k='cart'}
async function place(){
 const tn=form.tn.trim();if(!tn)return toast('Please enter your table number');if(!cart.length)return;
 if(!cfg())return toast('Ordering is not set up yet');if(!navigator.onLine)return toast('You are offline – connect to place your order');
 const T=calc(),now=new Date().toISOString(),id=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
 const o={id,bill_no:'Q'+String(Date.now()).slice(-5),table_no:tn,customer_name:form.cn.trim(),customer_phone:form.cp.trim(),notes:form.nt.trim(),staff:'Customer (QR)',order_type:'Dine-in',payment_status:'unpaid',payment_method:'',order_status:'live',items:cart.map(({id,name,size,qty,price})=>({id,name,size,qty,price:+price})),subtotal:T.subtotal,tax:T.tax,total:T.total,created_at:now,updated_at:now};
 const b=$('#place');b.disabled=true;b.textContent='Placing…';
 try{await api('orders',{method:'POST',body:JSON.stringify([o])});SV('name',form.cn);SV('phone',form.cp);cart=[];last={id,bill:o.bill_no,table:tn,st:'live'};SV('last',last);draw();showStatus()}
 catch(e){b.disabled=false;b.textContent='Place Order';toast('Could not place order, please try again')}}
const statusHTML=s=>{const m={live:['👨‍🍳','Order received','Your order is being prepared.'],delivered:['✅','Completed','Thank you! Enjoy your meal.'],cancelled:['❌','Order cancelled','Please speak to our staff.']}[s]||['⏳','Checking…',''];return`<div class="status"><div class="big">${m[0]}</div><h2>${m[1]}</h2><p>${m[2]}</p><p class="hint">Order #${esc(last.bill)} · Table ${esc(last.table)}${set.phone?'<br>Need help? <a href="tel:'+esc(set.phone)+'">'+esc(set.phone)+'</a>':''}</p></div><button class="btn wide" data-more>Order more</button>`};
function showStatus(){
 if(!last)return;let st=last.st||'';const paint=()=>sheet(statusHTML(st));paint();
 const chk=async()=>{try{const r=await api('orders?id=eq.'+encodeURIComponent(last.id)+'&select=order_status');if(r&&r[0]&&r[0].order_status!=st){st=r[0].order_status;last.st=st;SV('last',last);paint()}}catch{}};
 chk();clearInterval(poll);poll=setInterval(chk,6000)}

document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t){if(e.target.id=='modal')closeSheet();return}
 if(t.dataset.add){const m=menu.find(x=>x.id==t.dataset.add);cart.push({id:m.id,name:m.name,size:m.size,price:+m.price,qty:1});draw()}
 else if(t.dataset.q)chg(t.dataset.q,+t.dataset.d);
 else if(t.dataset.s!==undefined){sz=t.dataset.s;draw()}
 else if(t.dataset.close!==undefined||t.dataset.more!==undefined)closeSheet();
 else if(t.id=='vc')openCart();else if(t.id=='mine')showStatus();else if(t.id=='place')place()});
document.addEventListener('input',e=>{if(e.target.dataset.f)form[e.target.dataset.f]=e.target.value});
$('#si').oninput=draw;$('#sc').onchange=draw;
fillCats();draw();load();setInterval(load,60000);addEventListener('online',load);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});