'use strict';
/* ===== helpers & state ===== */
const $=(s,e=document)=>e.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem('pos.'+k))??d}catch{return d}};
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const seed=()=>[]; // menu is loaded from Supabase (run supabase/menu_seed.sql)
const S={orders:LS('orders',[]),menu:LS('menu',null)||seed(),
 set:{store:'Demo Restaurant',org:'Demo Organization',addr:'Your address here',phone:'7707908494',gstin:'',gst:5,tables:12,cur:'₹',paper:'80',...LS('set',{})},
 staff:LS('staff',[{n:'Owner',r:'Owner'}]),user:'Owner',
 pend:{o:[],m:false,md:[],...LS('pend',{})},last:LS('last',null),bill:LS('bill',1000),tab:'live',q:''};
const save=()=>['orders','menu','set','staff','pend','last','bill'].forEach(k=>localStorage.setItem('pos.'+k,JSON.stringify(S[k])));
const fmt=n=>S.set.cur+(+n||0).toFixed(2);
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
const beep=()=>{try{const c=new AudioContext(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=880;o.start();setTimeout(()=>{o.stop();c.close()},250)}catch{}};
const find=id=>S.orders.find(o=>o.id==id);
const cur=()=>({n:'Owner',r:'Owner'});
const calc=it=>{const sub=it.reduce((a,i)=>a+i.qty*i.price,0),tax=+(sub*S.set.gst/100).toFixed(2);return{subtotal:sub,tax,total:+(sub+tax).toFixed(2)}};
const title=o=>o.table_no?'Table '+esc(o.table_no):esc(o.order_type);
const sessionStart=new Date();
const sheet=(h,cls='',lock)=>{const s=$('#sheet');s.className='sheet '+cls;s.onclick=null;s.innerHTML=(lock?'':'<button class="x" data-close aria-label="Close">✕</button>')+h;$('#modal').classList.remove('hidden');$('#modal').dataset.lock=lock?1:''};
const closeSheet=()=>$('#modal').classList.add('hidden');
const dt=d=>new Date(d).toLocaleString([],{dateStyle:'short',timeStyle:'short'});
const rcCSS=()=>{const n=S.set.paper=='58',w=n?48:72,f=n?11:13;return`.rc{box-sizing:border-box;width:${w}mm;max-width:100%;margin:0 auto;padding:2mm;background:#fff;color:#000;font:${f}px/1.35 ui-monospace,Menlo,Consolas,"Courier New",monospace}.rc h3{text-align:center;font-size:${f+3}px;margin:0 0 2px}.rc p{margin:4px 0;overflow-wrap:anywhere}.rc .c{text-align:center}.rc hr{border:0;border-top:1px dashed #000;margin:5px 0}.rc .ln{display:flex;justify-content:space-between;gap:6px}.rc .ln span:last-child{white-space:nowrap}.rc .b{font-weight:700;font-size:${f+1}px}.rc .it{margin:3px 0}.rc .it>div:first-child{overflow-wrap:anywhere}.rc .kl{display:grid;grid-template-columns:auto 1fr;gap:6px;font-weight:700;margin:3px 0}.rc .kl span{overflow-wrap:anywhere}`};
const printHTML=h=>{const p=S.set.paper,f=document.createElement('iframe');f.style.cssText='position:fixed;left:-9999px;top:0;border:0;height:300px;width:'+p+'mm';document.body.appendChild(f);const d=f.contentDocument;d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>html,body{margin:0;padding:0;background:#fff}body{width:'+p+'mm}</style></head><body>'+h+'</body></html>');d.close();
 setTimeout(()=>{const mm=Math.ceil(d.body.scrollHeight*25.4/96)+6,st=d.createElement('style');st.textContent='@page{size:'+p+'mm '+mm+'mm;margin:0}';d.head.appendChild(st);f.contentWindow.focus();f.contentWindow.print();setTimeout(()=>f.remove(),3000)},200)};
const touch=o=>{o.updated_at=new Date().toISOString();if(!S.pend.o.includes(o.id))S.pend.o.push(o.id);save();render();sync()};
const mdirty=()=>{S.pend.m=true;save();netpill();sync()};

/* ===== sync (Supabase REST, works offline-first) ===== */
const cfg=()=>window.SUPABASE_URL&&!/YOUR_/.test(window.SUPABASE_URL);
const api=(p,o={})=>fetch(SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/'+p,{...o,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}}).then(async r=>{const t=await r.text();if(!r.ok)throw new Error(t||r.status);return t?JSON.parse(t):null});
let busy=false,syncMsg='Not synced yet';
async function sync(){
 if(!cfg())return syncMsg='Supabase not configured (edit js/config.js)';
 if(!navigator.onLine)return syncMsg='Offline – will sync automatically';
 if(busy)return syncMsg;busy=true;
 try{
  if(S.pend.o.length){await api('orders?on_conflict=id',{method:'POST',body:JSON.stringify(S.orders.filter(o=>S.pend.o.includes(o.id)))});S.pend.o=[]}
  if(S.pend.md.length){await api('menu_items?id=in.('+encodeURIComponent(S.pend.md.map(i=>'"'+i+'"').join(','))+')',{method:'DELETE'});S.pend.md=[]}
  if(S.pend.m){await api('menu_items?on_conflict=id',{method:'POST',body:JSON.stringify(S.menu)});S.pend.m=false}
  try{if(S.pend.s||!localStorage.getItem('pos.sset')){await api('store_settings?on_conflict=id',{method:'POST',body:JSON.stringify([{id:'main',data:S.set}])});localStorage.setItem('pos.sset',1);S.pend.s=false}}catch{}
  const rm=await api('menu_items?select=*&order=cat,name');
  if(rm&&rm.length)S.menu=rm;else if(S.menu.length)await api('menu_items?on_conflict=id',{method:'POST',body:JSON.stringify(S.menu)});
  const ro=await api('orders?select=*&order=created_at.desc&limit=500');
  let nw=0;(ro||[]).forEach(r=>{const l=find(r.id);if(!l){S.orders.push(r);if(r.order_status=='live'&&String(r.staff).startsWith('Customer'))nw++}else if(!S.pend.o.includes(l.id)&&r.updated_at>l.updated_at)Object.assign(l,r)});if(nw){toast('🔔 '+nw+' new customer order'+(nw>1?'s':''));beep()}
  S.bill=Math.max(S.bill,...S.orders.filter(o=>/^B\d+$/.test(o.bill_no)).map(o=>+o.bill_no.slice(1)));
  S.last=new Date().toISOString();syncMsg='Synced ✔';
 }catch(e){syncMsg='Sync failed: '+String(e.message).slice(0,140)}
 busy=false;save();render();return syncMsg}

/* ===== main screen ===== */
const btn=b=>{const[a,l]=b[0].split('|');return`<button class="btn sm" data-a="${a}" data-id="${b[1]}">${l}</button>`};
const acts=o=>o.order_status=='live'?['kot|KOT','edit|EDIT','bill|BILL','cancel|CANCEL'].map(x=>btn([x,o.id])).join(''):o.order_status=='delivered'?['kot|KOT','bill|BILL'].map(x=>btn([x,o.id])).join(''):'<span class="tag">Cancelled</span>';
const card=o=>`<article class="card" data-open="${o.id}"><h3>${title(o)}</h3><small>#${esc(o.bill_no)} · ${o.items.length} item${o.items.length>1?'s':''}</small><div class="total">${fmt(o.total)}</div><div class="acts">${acts(o)}</div></article>`;
function netpill(){const n=S.pend.o.length+(S.pend.m?1:0)+S.pend.md.length,on=navigator.onLine;const e=$('#net');e.className=on?'on':'off';e.textContent=(on?'● Online':'● Offline')+(n?' · '+n+' pending':'')}
function render(){
 $('#tabs').innerHTML=[['live','Live Orders'],['delivered','Delivered Orders'],['cancelled','Cancel Orders']].map(([k,l])=>`<button class="tab ${S.tab==k?'on':''}" data-tab="${k}">${l}<i>${S.orders.filter(o=>o.order_status==k).length}</i></button>`).join('');
 const q=S.q.trim().toLowerCase();
 const L=S.orders.filter(o=>o.order_status==S.tab&&(!q||String(o.bill_no).toLowerCase().includes(q))).sort((a,b)=>b.created_at.localeCompare(a.created_at));
 $('#grid').innerHTML=L.length?L.map(card).join(''):`<div class="empty">No ${S.tab} orders${q?' matching "'+esc(S.q)+'"':''}. Tap <b>New Order +</b> to start.</div>`;
 netpill()}

/* ===== receipts ===== */
const receipt=o=>`<style>${rcCSS()}</style><div class="rc"><h3>${esc(S.set.store)}</h3><p class="c">${esc(S.set.addr)}<br>${esc(S.set.phone)}${S.set.gstin?'<br>GSTIN '+esc(S.set.gstin):''}</p><hr><p>Bill #${esc(o.bill_no)}<br>${title(o)}<br>${dt(o.created_at)}${o.customer_name||o.customer_phone?'<br>'+esc(o.customer_name)+' '+esc(o.customer_phone):''}</p><hr>${o.items.map(i=>`<div class="it"><div>${esc(i.name)}${i.size&&i.size!='Regular'?' ('+esc(i.size)+')':''}</div><div class="ln"><span>${i.qty} × ${(+i.price).toFixed(2)}</span><span>${(i.qty*i.price).toFixed(2)}</span></div></div>`).join('')}<hr><div class="ln"><span>Subtotal</span><span>${(+o.subtotal).toFixed(2)}</span></div><div class="ln"><span>GST ${S.set.gst}%</span><span>${(+o.tax).toFixed(2)}</span></div><div class="ln b"><span>Total</span><span>${fmt(o.total)}</span></div><hr><p class="c b">${o.payment_status=='paid'?'PAID · '+esc(o.payment_method):'UNPAID'}</p><p class="c">Thank you! Visit again</p></div>`;
const kotHTML=o=>`<style>${rcCSS()}</style><div class="rc"><h3>KOT</h3><p class="c b">${title(o)}</p><p>#${esc(o.bill_no)} · ${esc(o.order_type)}<br>${dt(new Date())}<br>By: ${esc(o.staff)}</p><hr>${o.items.map(i=>`<div class="kl"><span>${i.qty}×</span><span>${esc(i.name)}${i.size&&i.size!='Regular'?' ('+esc(i.size)+')':''}</span></div>`).join('')}${o.notes?'<hr><p>Note: '+esc(o.notes)+'</p>':''}</div>`;
const paperSel=(id,k)=>`<label class="hint">Paper <select data-ch="paper" data-id="${id}" data-kind="${k}" style="width:auto">${['80','58'].map(v=>`<option value="${v}" ${S.set.paper==v?'selected':''}>${v} mm</option>`).join('')}</select></label>`;
function openBill(id){const o=find(id);sheet(receipt(o)+paperSel(id,'bill')+`<div class="acts big">${o.payment_status=='paid'?'':`<select id="pm"><option>Cash<option>UPI<option>Card</select><button class="btn" data-a="pay" data-id="${id}">Mark Paid</button>`}<button class="btn" data-a="print" data-id="${id}">Print Bill</button></div>`,'bill')}

/* ===== new / edit order (menu composer) ===== */
function openOrder(id,tbl){
 const o=id?find(id):null;let cart=o?o.items.map(i=>({...i})):[],sz='';
 const cats=[...new Set(S.menu.map(m=>m.cat))],sizes=[...new Set(S.menu.map(m=>m.size).filter(Boolean))];
 sheet(`<div class="pos"><div class="l"><div class="row"><label class="search wide">🔍<input id="si" placeholder="Search items"></label><select id="sc"><option value="">Categories</option>${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div class="chips" id="ch"></div><div id="mi"></div></div><div class="r"><h3>${o?'Edit order #'+esc(o.bill_no):'New order'}</h3><input id="tn" placeholder="Table No." value="${esc(o?o.table_no:tbl||'')}"><input id="cn" placeholder="Customer Name" value="${esc(o?.customer_name)}"><input id="cp" placeholder="Customer Phone no" inputmode="tel" value="${esc(o?.customer_phone)}"><select id="ot">${['Dine-in','Takeaway','Delivery'].map(t=>`<option ${o?.order_type==t?'selected':''}>${t}</option>`).join('')}</select><input id="nt" placeholder="Notes" value="${esc(o?.notes)}"><select id="sb" title="Order by">${S.staff.map(s=>`<option ${(o?o.staff:S.user)==s.n?'selected':''}>${esc(s.n)}</option>`).join('')}</select><div id="cart" class="cart"></div><div id="ct" class="tot"></div><button class="btn big" id="sv">${o?'Update Order':'New Order +'}</button></div></div>`,'wide');
 const draw=()=>{const q=$('#si').value.toLowerCase(),c=$('#sc').value,T=calc(cart);
  $('#ch').innerHTML=['',...sizes].map(s=>`<button class="chip ${s==sz?'on':''}" data-s="${esc(s)}">${s?esc(s):'All sizes'}</button>`).join('');
  const L=S.menu.filter(m=>m.avail&&(!q||m.name.toLowerCase().includes(q))&&(!c||m.cat==c)&&(!sz||m.size==sz));
  $('#mi').innerHTML=cats.filter(k=>L.some(m=>m.cat==k)).map(k=>`<h4>${esc(k)}</h4><div class="tiles">${L.filter(m=>m.cat==k).map(m=>`<button class="tile" data-i="${esc(m.id)}"><b>${esc(m.name)}</b><small>${esc(m.size)}</small><span>${fmt(m.price)}</span></button>`).join('')}</div>`).join('')||'<div class="empty">No items found</div>';
  $('#cart').innerHTML=cart.map((i,n)=>`<div class="cl"><span>${esc(i.name)} <em>${esc(i.size)}</em></span><span class="qty"><button data-q="${n}" data-d="-1">−</button>${i.qty}<button data-q="${n}" data-d="1">+</button></span><b>${fmt(i.qty*i.price)}</b></div>`).join('')||'<div class="empty">Tap items to add</div>';
  $('#ct').innerHTML=`Subtotal ${fmt(T.subtotal)} · GST ${fmt(T.tax)}<br><b>Total ${fmt(T.total)}</b>`};
 const commit=()=>{if(!cart.length)return toast('Add at least one item');
  const ot=$('#ot').value,tn=$('#tn').value.trim();if(ot=='Dine-in'&&!tn)return toast('Enter table number');
  const f={table_no:tn,customer_name:$('#cn').value.trim(),customer_phone:$('#cp').value.trim(),notes:$('#nt').value.trim(),order_type:ot,staff:$('#sb').value,items:cart,...calc(cart)};
  if(o){Object.assign(o,f);touch(o);toast('Order updated')}
  else{const n={id:uid(),bill_no:'B'+(++S.bill),staff:S.user||cur().n,payment_status:'unpaid',payment_method:'',order_status:'live',created_at:new Date().toISOString(),...f};S.orders.push(n);touch(n);toast('Order '+n.bill_no+' created')}
  closeSheet();S.tab='live';render()};
 $('#sheet').onclick=e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.s!==undefined){sz=t.dataset.s;draw()}
  else if(t.dataset.i){const m=S.menu.find(x=>x.id==t.dataset.i),l=cart.find(x=>x.id==m.id);l?l.qty++:cart.push({id:m.id,name:m.name,size:m.size,qty:1,price:+m.price});draw()}
  else if(t.dataset.q){const l=cart[t.dataset.q];l.qty+=+t.dataset.d;if(l.qty<1)cart.splice(t.dataset.q,1);draw()}
  else if(t.id=='sv')commit()};
 $('#si').oninput=draw;$('#sc').onchange=draw;draw()}

/* ===== actions (data-a) ===== */
const A={
 view:id=>{const o=find(id);sheet(`<div class="dh"><h2>${title(o)}</h2><h2>${fmt(o.total)}</h2></div><div class="meta"><div>Customer name: <b>${esc(o.customer_name)||'-'}</b><br>Customer Phone no.: <b>${esc(o.customer_phone)||'-'}</b><br>Notes: <b>${esc(o.notes)||'-'}</b><br>Staff: <b>${esc(o.staff)}</b></div><div>Order no: <b>#${esc(o.bill_no)}</b><br>Order Type: <b>${esc(o.order_type)}</b><br>Payment Status: <b>${o.payment_status}</b><br>Order Status: <b>${o.order_status}</b></div></div><div class="lines">${o.items.map(i=>`<div><span>${esc(i.name)} <em>${esc(i.size)}</em></span><span>× ${i.qty}</span><span>${fmt(i.qty*i.price)}</span></div>`).join('')}</div><div class="acts big">${acts(o)}</div>`,'detail')},
 kot:id=>{const o=find(id);sheet(kotHTML(o)+paperSel(id,'kot')+`<div class="acts big"><button class="btn" data-a="printkot" data-id="${id}">Print KOT</button></div>`,'bill')},
 printkot:id=>printHTML(kotHTML(find(id))),
 paper:(id,el)=>{S.set.paper=el.value;save();el.dataset.kind=='kot'?A.kot(id):openBill(id)},
 edit:id=>openOrder(id),
 bill:id=>openBill(id),
 print:id=>printHTML(receipt(find(id))),
 newt:n=>openOrder(null,n),
 cancel:id=>{if(!confirm('Cancel this order?'))return;const o=find(id);o.order_status='cancelled';touch(o);closeSheet();toast('Order cancelled')},
 pay:id=>{const o=find(id);o.payment_status='paid';o.payment_method=$('#pm').value;o.order_status='delivered';o.items.forEach(i=>{const m=S.menu.find(x=>x.id==i.id);if(m)m.stock=Math.max(0,m.stock-i.qty)});S.pend.m=true;touch(o);openBill(id);toast('Payment received')},
 cd:()=>$('#drawer').classList.remove('open'),
 logout:()=>{A.cd();closeSheet();toast('Session restarted');setTimeout(()=>location.reload(),500)},
 link:()=>new URL('customer.html',location.href).href+(($('#ctn')||{}).value?.trim()?'?table='+encodeURIComponent($('#ctn').value.trim()):''),
 copylink:()=>{const u=A.link();(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('Customer link copied'),()=>prompt('Copy this link',u))},
 openlink:()=>window.open(A.link(),'_blank'),
 addm:()=>{const n=$('#mn').value.trim(),p=+$('#mp').value;if(!n||!p)return toast('Enter name and price');S.menu.push({id:uid(),name:n,cat:$('#mc').value.trim()||'General',size:$('#ms').value.trim(),price:p,avail:true,stock:50});mdirty();P.menu();toast('Item added')},
 delm:id=>{if(!confirm('Delete this item?'))return;S.menu=S.menu.filter(m=>m.id!=id);S.pend.md.push(id);mdirty();P.menu()},
 price:(id,el)=>{S.menu.find(m=>m.id==id).price=+el.value||0;mdirty();toast('Price updated')},
 avail:(id,el)=>{S.menu.find(m=>m.id==id).avail=el.checked;mdirty()},
 stk:(id,el)=>{const m=S.menu.find(x=>x.id==id);m.stock=Math.max(0,m.stock+ +el.dataset.d);mdirty();el.parentNode.querySelector('b').textContent=m.stock;el.closest('.row2').classList.toggle('low',m.stock<=5)},
 adds:()=>{const n=$('#sn').value.trim();if(!n)return toast('Enter a name');S.staff.push({n,r:'Staff'});save();P.staff()},
 dels:i=>{if(S.staff[i].n=='Owner')return toast('Owner cannot be removed');S.staff.splice(i,1);save();P.staff()},
 saveset:(id,el)=>{el.dataset.k.split(',').forEach(k=>{const v=$('#f_'+k).value;S.set[k]=typeof S.set[k]=='number'?+v||0:v});S.pend.s=true;save();render();sync();toast('Saved')},
 syncnow:async()=>{toast('Syncing…');await sync();P.sync()},
 install:()=>window.dip?window.dip.prompt():toast('Use browser menu → Install app / Add to Home screen'),
 wipe:()=>{if(!confirm('Erase ALL local data on this device? Unsynced orders will be lost.'))return;Object.keys(localStorage).filter(k=>k.startsWith('pos.')).forEach(k=>localStorage.removeItem(k));location.reload()},
 reload:()=>location.reload(),
 csv:()=>{const r=[['Bill','Date','Table','Type','Subtotal','GST','Total','Method'],...S.orders.filter(o=>o.payment_status=='paid').map(o=>[o.bill_no,o.created_at,o.table_no,o.order_type,o.subtotal,o.tax,o.total,o.payment_method])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([r.map(x=>x.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));a.download='sales-report.csv';a.click()}
};
A.saveorg=A.saveset;
const act=(a,id,el)=>A[a]?.(id,el);

/* ===== panels (top icons + drawer) ===== */
const formP=(t,fs,a)=>sheet(`<h2>${t}</h2><div class="fl">${fs.map(([k,l,ty,op])=>`<label>${l}${ty=='sel'?`<select id="f_${k}">${op.map(v=>`<option value="${v}" ${S.set[k]==v?'selected':''}>${v} mm</option>`).join('')}</select>`:`<input id="f_${k}" type="${ty||'text'}" value="${esc(S.set[k])}">`}</label>`).join('')}</div><button class="btn" data-a="${a}" data-k="${fs.map(f=>f[0])}">Save</button>`);
const orderRows=(L,label)=>L.map(o=>`<div class="row2"><span>#${esc(o.bill_no)} · ${title(o)}<small>${new Date(o.created_at).toLocaleString()} · ${o.payment_status}</small></span><b>${fmt(o.total)}</b><button class="btn sm" data-a="${label[0]}" data-id="${o.id}" style="padding:8px 12px">${label[1](o)}</button></div>`).join('')||'<div class="empty">Nothing here yet</div>';
const P={

 user:()=>sheet(`<h2>User</h2><p><b>Owner</b> · Full access</p><p class="hint">This device runs the Owner view. Customers order from their own phones with the customer link (Table panel → Copy customer link).</p><div class="acts big"><button class="btn" data-a="logout">Logout</button></div>`),
 analytics:()=>{const d=new Date().toDateString(),T=S.orders.filter(o=>new Date(o.created_at).toDateString()==d),pd=T.filter(o=>o.payment_status=='paid'),sales=pd.reduce((a,o)=>a+o.total,0),top={};
  T.filter(o=>o.order_status!='cancelled').forEach(o=>o.items.forEach(i=>top[i.name]=(top[i.name]||0)+i.qty));const tl=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5),mx=tl[0]?.[1]||1;
  sheet(`<h2>Analytics · Today</h2><div class="kpis">${[['Sales',fmt(sales)],['Orders',T.length],['Live',T.filter(o=>o.order_status=='live').length],['Cancelled',T.filter(o=>o.order_status=='cancelled').length],['Avg bill',fmt(pd.length?sales/pd.length:0)]].map(([a,b])=>`<div class="kpi"><small>${a}</small><b>${b}</b></div>`).join('')}</div><h4>Top items</h4>${tl.map(([n,q])=>`<div class="bar2"><span>${esc(n)}</span><i style="width:${q/mx*100}%"></i><b>${q}</b></div>`).join('')||'<div class="empty">No sales yet today</div>'}`)},
 tables:()=>{const occ={};S.orders.filter(o=>o.order_status=='live'&&o.table_no).forEach(o=>occ[o.table_no]=o);
  sheet(`<h2>Tables</h2><div class="form"><input id="ctn" placeholder="Table no. for customer link"><button class="btn" data-a="copylink">Copy customer link</button><button class="btn" data-a="openlink">Preview</button></div><div class="tbl">${Array.from({length:S.set.tables},(_,i)=>{const n=String(i+1),o=occ[n];return`<button class="tb ${o?'busy':''}" data-a="${o?'view':'newt'}" data-id="${o?o.id:n}"><b>${n}</b><small>${o?fmt(o.total):'Free'}</small></button>`}).join('')}</div>`)},
 menu:()=>sheet(`<h2>Menu</h2><div class="form"><input id="mn" placeholder="Item name"><input id="mc" list="cl" placeholder="Category"><datalist id="cl">${[...new Set(S.menu.map(m=>m.cat))].map(c=>`<option>${esc(c)}`).join('')}</datalist><input id="ms" placeholder="Size (Half/Full)"><input id="mp" type="number" placeholder="Price"><button class="btn" data-a="addm">Add</button></div>${S.menu.map(m=>`<div class="row2"><span>${esc(m.name)} <em>${esc(m.size)}</em><small>${esc(m.cat)}</small></span><input type="number" value="${m.price}" data-ch="price" data-id="${esc(m.id)}"><input type="checkbox" title="Available" ${m.avail?'checked':''} data-ch="avail" data-id="${esc(m.id)}"><button class="btn sm" data-a="delm" data-id="${esc(m.id)}" style="padding:8px 12px">Delete</button></div>`).join('')}`),
 inventory:()=>sheet(`<h2>Inventory</h2>${S.menu.map(m=>`<div class="row2 ${m.stock<=5?'low':''}"><span>${esc(m.name)} <em>${esc(m.size)}</em></span><span class="qty"><button data-a="stk" data-id="${esc(m.id)}" data-d="-1">−</button><b>${m.stock}</b><button data-a="stk" data-id="${esc(m.id)}" data-d="1">+</button></span></div>`).join('')}<p class="hint">Stock drops automatically when a bill is paid. Red = 5 or fewer.</p>`),
 kot:()=>sheet(`<h2>Kitchen / KOT</h2>${orderRows(S.orders.filter(o=>o.order_status=='live'),['kot',()=>'KOT'])}`),
 bills:()=>sheet(`<h2>Payment / Bills</h2>${orderRows(S.orders.filter(o=>o.order_status!='cancelled').sort((a,b)=>b.created_at.localeCompare(a.created_at)),['bill',o=>o.payment_status=='paid'?'Receipt':'Bill'])}`),
 staff:()=>sheet(`<h2>Staff & Permissions</h2><p class="hint">Owner has full access. Add staff names to choose who took an order.</p><div class="form"><input id="sn" placeholder="Staff name"><button class="btn" data-a="adds">Add</button></div>${S.staff.map((s,i)=>`<div class="row2"><span>${esc(s.n)} <em>${s.r}</em></span>${s.n=='Owner'?'':`<button class="btn sm" data-a="dels" data-id="${i}" style="padding:8px 12px">Remove</button>`}</div>`).join('')}`),
 report:()=>{const by={};S.orders.filter(o=>o.payment_status=='paid').forEach(o=>{const d=o.created_at.slice(0,10),r=by[d]||(by[d]={n:0,s:0,t:0,g:0});r.n++;r.s+=o.subtotal;r.t+=o.tax;r.g+=o.total});
  const rows=Object.entries(by).sort().reverse(),T=rows.reduce((a,[,r])=>({n:a.n+r.n,s:a.s+r.s,t:a.t+r.t,g:a.g+r.g}),{n:0,s:0,t:0,g:0});
  sheet(`<h2>Report & Tax summary</h2><div class="kpis">${[['Bills',T.n],['Sales (ex-tax)',fmt(T.s)],['GST collected',fmt(T.t)],['Gross',fmt(T.g)]].map(([a,b])=>`<div class="kpi"><small>${a}</small><b>${b}</b></div>`).join('')}</div><table><tr><th>Date<th>Bills<th>Sales<th>GST<th>Total</tr>${rows.map(([d,r])=>`<tr><td>${d}<td>${r.n}<td>${fmt(r.s)}<td>${fmt(r.t)}<td>${fmt(r.g)}</tr>`).join('')}</table><button class="btn" data-a="csv">Export CSV</button>`)},
 settings:()=>formP('Store settings',[['store','Store name'],['gst','GST %','number'],['tables','Number of tables','number'],['cur','Currency symbol'],['paper','Receipt paper width (KOT & Bill)','sel',['80','58']]],'saveset'),
 org:()=>formP('Organizations & Store',[['org','Organization'],['addr','Address'],['phone','Phone'],['gstin','GSTIN']],'saveorg'),
 device:()=>sheet(`<h2>Device & Sessions</h2><p>User: <b>${esc(cur().n)}</b> (${cur().r})<br>Session started: <b>${sessionStart.toLocaleString()}</b><br>Network: <b>${navigator.onLine?'Online':'Offline'}</b><br>Screen: <b>${screen.width}×${screen.height}</b><br>Installed app: <b>${matchMedia('(display-mode: standalone)').matches?'Yes':'No (browser tab)'}</b></p><p class="hint">${esc(navigator.userAgent)}</p><div class="acts big"><button class="btn" data-a="install">Install app</button><button class="btn" data-a="wipe">Clear local data</button></div>`),
 sync:()=>sheet(`<h2>Sync Status</h2><p>Network: <b>${navigator.onLine?'Online':'Offline'}</b><br>Supabase: <b>${cfg()?'Configured':'Not configured'}</b><br>Pending orders: <b>${S.pend.o.length}</b> · menu changes: <b>${S.pend.m?'yes':'no'}</b><br>Last sync: <b>${S.last?new Date(S.last).toLocaleString():'never'}</b><br>Status: <b>${esc(syncMsg)}</b></p><div class="acts big"><button class="btn" data-a="syncnow">Sync now</button></div>`),
 help:()=>sheet(`<h2>Help & Support</h2><p><a href="tel:7707908494" style="color:var(--a);font-weight:800;font-size:22px">📞 7707908494</a></p><ol style="margin:12px 0 12px 20px;line-height:1.8"><li><b>New Order +</b>: pick items, fill table/customer, save.</li><li><b>KOT</b> prints the kitchen slip, <b>Edit</b> changes items, <b>Bill</b> opens the receipt.</li><li>Mark Paid moves the order to Delivered.</li><li>Everything works offline and syncs automatically when online.</li></ol><div class="acts big"><button class="btn" data-a="reload">Reload app</button></div>`)
};
const go=k=>{A.cd();if(k=='orders'){closeSheet();S.tab='live';render()}else P[k]()};

/* ===== events & boot ===== */
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(b){e.stopPropagation();return act(b.dataset.a,b.dataset.id,b)}
 if(e.target.closest('[data-close]'))return closeSheet();
 const t=e.target.closest('[data-tab]');if(t){S.tab=t.dataset.tab;return render()}
 const o=e.target.closest('[data-open]');if(o)return A.view(o.dataset.open);
 const g=e.target.closest('[data-go]');if(g)return go(g.dataset.go);
 if(e.target.id=='modal'&&!$('#modal').dataset.lock)closeSheet();
 if(e.target.id=='drawer')A.cd()});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.ch)act(t.dataset.ch,t.dataset.id,t)});
$('#topnav').innerHTML=[['orders','🛒','Orders'],['analytics','📊','Analytics'],['tables','🪑','Table'],['user','👤','User'],['menu','🍽️','Menu'],['inventory','📋','Inventory']].map(([k,i,l])=>`<button data-go="${k}"><span>${i}</span>${l}</button>`).join('');
$('#drawer').innerHTML=`<aside class="dr"><div class="dh"><b>☰ Navigation</b><button data-a="cd" style="width:auto;font-size:22px">✕</button></div>${[['operations',[['orders','🛒','Orders'],['kot','🍽️','Kitchen/KOT'],['bills','👛','Payment/Bills']]],['business management',[['staff','👤','Staff & Permissions'],['report','📈','Report & Tax summary']]],['system',[['settings','⚙️','Store settings'],['org','🏪','Organizations & Store'],['device','📱','Device & Sessions'],['sync','🔄','Sync Status'],['help','❓','Help & Support']]]].map(([h,L])=>`<h5>${h}</h5>${L.map(([k,i,l])=>`<button data-go="${k}"><span>${i}</span>${l}</button>`).join('')}`).join('')}<button class="out" data-a="logout"><span>⎋</span>Logout</button></aside>`;
$('#burger').onclick=()=>$('#drawer').classList.add('open');
$('#q').oninput=e=>{S.q=e.target.value;render()};
$('#newBtn').onclick=()=>openOrder();
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.dip=e});
addEventListener('online',()=>{netpill();sync()});addEventListener('offline',netpill);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();sync();setInterval(sync,15000);
