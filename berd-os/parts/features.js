/* ===================== features: estimator, before/after, live chat, time of day, game, blog ===================== */
var BLOG = /*BLOG*/[]/*/BLOG*/;
var PR = Object.assign({
  currency:'$',
  types:{landing:[119,7],site:[239,14],shop:[419,21],webapp:[599,28],mobile:[959,35],bot:[179,7]}, // [from price, days]
  pagesIncluded:{landing:1,site:5,shop:5,webapp:5,mobile:5,bot:0},
  perPage:[30,1],
  feats:{pay:[96,3],admin:[144,4],booking:[120,4],account:[180,5],crm:[180,5],seo:[72,2],tgbot:[179,5]},
  perLang:[72,2],
  spread:1.35
}, CFG.pricing||{});

APPS.calc={w:1040,h:650,x:120,y:44};
APPS.blog={w:860,h:610,x:210,y:56};
APPS.game={w:420,h:600,x:430,y:40};
ORDER.splice(ORDER.indexOf('brief')+1,0,'calc');
ORDER.splice(ORDER.indexOf('about')+1,0,'blog');
SV.calc='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8"/><circle cx="9" cy="12" r=".6" fill="#fff"/><circle cx="12" cy="12" r=".6" fill="#fff"/><circle cx="15" cy="12" r=".6" fill="#fff"/><circle cx="9" cy="16" r=".6" fill="#fff"/><circle cx="12" cy="16" r=".6" fill="#fff"/><path d="M15 15v2" stroke="#CCFF00"/></svg>';
SV.blog='<svg viewBox="0 0 24 24" fill="none" stroke="#1B36F5" stroke-width="2" stroke-linecap="round"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 15.5h8M8 19h5"/></svg>';
SV.game='<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8.5" height="8.5" fill="#1B36F5"/><rect x="12.5" y="3" width="8.5" height="8.5" fill="#CCFF00"/><rect x="3" y="12.5" width="8.5" height="8.5" fill="#E01060"/><rect x="12.5" y="12.5" width="8.5" height="8.5" fill="#FFB800"/></svg>';

var _body=body;
body=function(id){
  if(id==='calc')return '<div class="calc" data-calc></div>';
  if(id==='blog')return '<div class="blog" data-blog></div>';
  if(id==='game')return '<div class="game" data-game tabindex="-1"></div>';
  return _body(id);
};
var _wire=wire;
wire=function(root,op){
  _wire(root,op);
  var x;
  if((x=root.querySelector('[data-calc]')))initCalc(x);
  if((x=root.querySelector('[data-blog]')))initBlog(x);
  if((x=root.querySelector('[data-game]')))initGame(x);
  if((x=root.querySelector('[data-batoggle]')))initBA(root);
};

/* ---------- estimator ---------- */
function money(n){return PR.currency+Math.round(n).toLocaleString('en-US')}
function initCalc(root){
  var C=T().calc,st={type:'site',pages:5,feats:{},langs:['hy']},prev={},sent=null;
  function estimate(){
    var t=PR.types[st.type],price=t[0],days=t[1];
    var inc=PR.pagesIncluded[st.type]||0,extra=st.type==='bot'||st.type==='landing'?0:Math.max(0,st.pages-inc);
    price+=extra*PR.perPage[0];days+=extra*PR.perPage[1];
    Object.keys(st.feats).forEach(function(k){if(st.feats[k]&&PR.feats[k]){price+=PR.feats[k][0];days+=PR.feats[k][1]}});
    price+=(st.langs.length-1)*PR.perLang[0];days+=(st.langs.length-1)*PR.perLang[1];
    var hi=Math.ceil(price*PR.spread/10)*10,dHi=Math.ceil(days*1.3);
    var time=dHi<=10?days+'–'+dHi+' '+C.days:Math.max(1,Math.round(days/7))+'–'+Math.ceil(dHi/7)+' '+C.weeks;
    return {lo:price,hi:hi,time:time};
  }
  function chip(group,key,label,on){return '<button type="button" class="cc'+(on?' on':'')+'" data-g="'+group+'" data-k="'+key+'" aria-pressed="'+!!on+'">'+esc(label)+'</button>'}
  function controls(){
    var h='<div class="cl"><h3>'+esc(C.title)+'</h3><p class="sub">'+esc(C.sub)+'</p>';
    h+='<h4>'+esc(C.type)+'</h4><div class="cg">'+Object.keys(C.types).map(function(k){return chip('type',k,C.types[k],st.type===k)}).join('')+'</div>';
    var showPages=!(st.type==='bot'||st.type==='landing');
    h+='<div class="pg"'+(showPages?'':' hidden')+'><h4>'+esc(C.pages)+' <b data-pv>'+st.pages+'</b></h4><input type="range" id="calc-pages" min="1" max="20" value="'+st.pages+'" aria-label="'+esc(C.pages)+'"></div>';
    h+='<h4>'+esc(C.features)+'</h4><div class="cg">'+Object.keys(C.feats).map(function(k){return chip('feat',k,C.feats[k],st.feats[k])}).join('')+'</div>';
    h+='<h4>'+esc(C.langs)+'</h4><div class="cg">'+[['hy','Հայերեն'],['ru','Русский'],['en','English']].map(function(l){return chip('lang',l[0],l[1],st.langs.indexOf(l[0])>=0)}).join('')+'</div></div>';
    return h;
  }
  function mockHTML(){
    var M=C.mock,f=st.feats,keys=[],h='';
    function blk(k,html){keys.push(k);return '<div class="mb'+(prev[k]?'':' pop')+'" data-mk="'+k+'">'+html+'</div>'}
    var navItems=[M.home,M.about,M.catalog,M.contact].slice(0,Math.min(4,Math.max(1,st.type==='landing'?1:st.pages)));
    if(st.type==='bot'){
      h='<div class="dv tgv"><div class="tgh"><i></i><b>Your Bot</b></div><div class="tgb">'+
        blk('m1','<div class="tm">👋 '+esc(M.home)+'</div>')+
        blk('kb','<div class="tk"><span>'+esc(M.catalog)+'</span><span>'+esc(M.contact)+'</span>'+(f.booking?'<span>'+esc(M.book)+'</span>':'')+(f.pay?'<span>💳 '+esc(M.pay)+'</span>':'')+'</div>')+
        (f.account?blk('acc','<div class="tm">👤 '+esc(M.login)+'</div>'):'')+(f.crm?blk('crm','<div class="tm me">CRM ✓</div>'):'')+
        (st.langs.length>1?blk('lang','<div class="tm">🌐 '+st.langs.join(' · ').toUpperCase()+'</div>'):'')+
        (f.admin?blk('adm','<div class="tm me">⚙︎ '+esc(M.admin)+'</div>'):'')+'</div></div>';
    }else if(st.type==='mobile'){
      h='<div class="dv phv"><div class="ph-in"><div class="isl"></div>'+
        blk('hero','<div class="mh"><b></b><i></i><i style="width:60%"></i><u></u></div>')+
        (f.booking?blk('book','<div class="cal">'+Array(14).join('<i></i>')+'<i class="on"></i></div>'):'')+
        (f.pay?blk('pay','<div class="payc">•••• 4242 <u></u></div>'):'')+
        (f.account?blk('acc','<div class="accr"><span></span><b></b></div>'):'')+
        blk('tab','<div class="tabbar">'+Array(Math.min(5,Math.max(2,st.pages))+1).join('<i></i>')+'</div>')+'</div></div>';
    }else{
      var dash=st.type==='webapp';
      h='<div class="dv brv"><div class="bt"><i></i><i></i><i></i><span>your-business.am</span></div><div class="bpage">'+
        blk('nav','<div class="mnav"><b>LOGO</b>'+navItems.map(function(n){return '<span>'+esc(n)+'</span>'}).join('')+(st.pages>4&&st.type!=='landing'?'<span>+'+(st.pages-4)+'</span>':'')+
          (st.langs.length>1?'<em>'+st.langs.join(' ').toUpperCase()+'</em>':'')+(f.account?'<span class="lg">'+esc(M.login)+'</span>':'')+((st.type==='shop'||f.pay)?'<span class="ct">🛒</span>':'')+'</div>')+
        (dash?blk('dash','<div class="dsh"><aside><i></i><i></i><i></i><i></i></aside><div><div class="kp"><i></i><i></i><i></i></div><div class="tb">'+Array(6).join('<i></i>')+'</div></div></div>')
             :blk('hero','<div class="mh"><b></b><i></i><i style="width:55%"></i><u></u></div>'))+
        (st.type==='shop'?blk('cat','<div class="grid4">'+Array(9).join('<i></i>')+'</div>'):'')+
        (f.booking?blk('book','<div class="cal">'+Array(14).join('<i></i>')+'<i class="on"></i></div>'):'')+
        (f.pay?blk('pay','<div class="payc">•••• 4242 <u>'+esc(M.pay)+'</u></div>'):'')+
        (f.seo?blk('seo','<div class="serp"><small>google.com</small><b>Your Business — '+esc(M.home)+'</b><i></i></div>'):'')+
        (st.type!=='landing'&&!dash?blk('pages','<div class="pgs">'+Array(Math.min(st.pages,8)+1).join('<i></i>')+'</div>'):'')+
        '</div>'+
        (f.admin?blk('adm','<div class="admp"><b>'+esc(M.admin)+'</b><i></i><i></i><i></i></div>'):'')+
        (f.tgbot?blk('tg','<div class="tgbub">✈︎ Bot</div>'):'')+
        (f.crm?blk('crm','<div class="crmc">CRM ⇄</div>'):'')+'</div>';
    }
    var seen={};keys.forEach(function(k){seen[k]=1});prev=seen;
    return h;
  }
  function render(){
    var e=estimate();
    root.innerHTML=controls()+'<div class="cr"><div class="stagebox">'+mockHTML()+'</div></div>'+
      '<div class="cb"><div class="est"><span>'+esc(C.price)+'</span><b data-price>'+money(e.lo)+' – '+money(e.hi)+'</b></div><div class="est"><span>'+esc(C.time)+'</span><b>'+esc(e.time)+'</b></div>'+
      '<form class="cf" data-cf novalidate><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input id="calc-name" placeholder="'+esc(C.name)+'" aria-label="'+esc(C.name)+'" autocomplete="name"><input id="calc-contact" placeholder="'+esc(C.contact)+'" aria-label="'+esc(C.contact)+'" autocomplete="tel"><button type="submit">'+esc(C.send)+'</button></form>'+
      '<p class="cn" data-cn>'+esc(sent==='sent'?C.sent:C.note)+'</p></div>';
    root.querySelectorAll('[data-g]').forEach(function(b){b.addEventListener('click',function(){
      var g=b.getAttribute('data-g'),k=b.getAttribute('data-k');
      if(g==='type'){st.type=k;if(k==='landing')st.pages=1;else if(st.pages<3)st.pages=5}
      else if(g==='feat')st.feats[k]=!st.feats[k];
      else{var i=st.langs.indexOf(k);if(i>=0){if(st.langs.length>1)st.langs.splice(i,1)}else st.langs.push(k)}
      track('calc_change',g+':'+k);keep(render);
    })});
    var r=root.querySelector('#calc-pages');
    if(r)r.addEventListener('input',function(){st.pages=+r.value;root.querySelector('[data-pv]').textContent=st.pages;var ee=estimate();root.querySelector('[data-price]').textContent=money(ee.lo)+' – '+money(ee.hi);
      root.querySelector('.stagebox').innerHTML=mockHTML();root.querySelectorAll('.cb .est b')[1].textContent=ee.time;fit()});
    requestAnimationFrame(fit);
    root.querySelector('[data-cf]').addEventListener('submit',function(ev){
      ev.preventDefault();var f=ev.target,name=f.querySelector('#calc-name').value.trim(),ct=f.querySelector('#calc-contact').value.trim(),cn=root.querySelector('[data-cn]');
      if(f.querySelector('.hp').value)return;
      if(!ct){cn.textContent=C.needContact;cn.classList.add('bad');f.querySelector('#calc-contact').focus();return}
      var ee=estimate(),ans={};
      ans[C.type]=C.types[st.type];
      if(!(st.type==='bot'||st.type==='landing'))ans[C.pages]=st.pages;
      ans[C.features]=Object.keys(st.feats).filter(function(k){return st.feats[k]}).map(function(k){return C.feats[k]}).join(', ')||'—';
      ans[C.langs]=st.langs.join(', ').toUpperCase();
      ans[C.price]=money(ee.lo)+' – '+money(ee.hi);ans[C.time]=ee.time;
      var btn=f.querySelector('button');btn.disabled=true;
      sendLead({type:'calc',answers:ans,name:name,contact:ct}).then(function(s){
        sent=s;btn.disabled=false;cn.classList.toggle('bad',s!=='sent');
        if(s==='sent'){cn.textContent=C.sent;track('calc_submit',st.type)}else{cn.innerHTML=esc(C.failed)+' '+contactsHTML()}
      });
    });
  }
  /* the mockup scales down to always fit the stage */
  function fit(){var cr=root.querySelector('.cr'),bx=root.querySelector('.stagebox');if(!cr||!bx)return;bx.style.transform='none';var sc=Math.min(1,(cr.clientHeight-36)/bx.scrollHeight,(cr.clientWidth-36)/bx.scrollWidth);bx.style.transform='scale('+Math.max(.4,sc)+')'}
  /* re-render without losing typed name/contact */
  function keep(fn){var n=root.querySelector('#calc-name'),c=root.querySelector('#calc-contact'),nv=n&&n.value,cv=c&&c.value;fn();if(nv)root.querySelector('#calc-name').value=nv;if(cv)root.querySelector('#calc-contact').value=cv}
  render();
}

/* ---------- before / after ---------- */
var BA={dent:1,nairi:1};
var _bb=browserBody;
browserBody=function(p){
  var h=_bb(p);if(!BA[p.id])return h;
  var B=T().ba;
  h=h.replace('<span class="demo">','<button type="button" class="batab" data-batoggle aria-pressed="false">'+esc(B.tab)+'</button><span class="demo">');
  var old='<div class="old"><div class="ot">'+esc(p.name.toUpperCase())+' — Official Web Site</div><marquee>*** Welcome to our website!!! Call us today ***</marquee>'+
    '<table><tr><td>Home</td><td>About us</td><td>Services</td><td>Contacts</td></tr></table><div class="ob"><div class="oimg">IMAGE</div><p>We are the best company in the city. We provide high quality services for our clients since 2009. For more information please call or visit our office.</p></div>'+
    '<p class="oc">Visitors: 000417 · Best viewed in Internet Explorer 6.0</p></div>';
  var ba='<div class="ba" data-ba hidden><div class="bal">'+old+'</div><div class="bar2" data-baafter>'+mock(p)+'</div><span class="lb l">'+esc(B.before)+'</span><span class="lb r">'+esc(B.after)+'</span><span class="handle" data-bh></span>'+
    '<input type="range" min="0" max="100" value="50" class="bars" data-bar aria-label="'+esc(B.hint)+'"><span class="bahint">'+esc(B.hint)+' · '+esc(B.sample)+'</span></div>';
  return h.replace('<div class="view" data-view>','<div class="view" data-view>'+ba);
};
function initBA(root){
  var t=root.querySelector('[data-batoggle]'),ba=root.querySelector('[data-ba]'),r=ba.querySelector('[data-bar]'),af=ba.querySelector('[data-baafter]'),hd=ba.querySelector('[data-bh]');
  function set(v){af.style.clipPath='inset(0 0 0 '+v+'%)';hd.style.left=v+'%'}
  set(50);
  r.addEventListener('input',function(){set(r.value)});
  t.addEventListener('click',function(){var on=ba.hidden;ba.hidden=!on;t.setAttribute('aria-pressed',on);if(on){track('before_after');r.value=50;set(50);
    if(!RM&&af.animate){var v=50;var k=[50,18,82,50];k.forEach(function(x,i){setTimeout(function(){r.value=x;set(x)},i*420)})}}});
}

/* ---------- live chat (replies from Telegram appear here) ---------- */
function getSid(){try{var s=localStorage.getItem('berd-chat-sid');if(!s){s=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem('berd-chat-sid',s)}return s}catch(e){return window.__sid||(window.__sid=Math.random().toString(36).slice(2,12))}}
function loadHist(){try{return JSON.parse(localStorage.getItem('berd-chat-log')||'[]')}catch(e){return []}}
function saveHist(h){try{localStorage.setItem('berd-chat-log',JSON.stringify(h.slice(-60)))}catch(e){}}
function liveChat(root,form){
  var t=T(),Lv=t.live,log=root.querySelector('[data-log]'),ep=(CFG.leadEndpoint||'').replace(/\/$/,''),sid=getSid(),hist=loadHist(),timer=null,last=0,dead=false;
  var cin=root.querySelector('#c-contact');cin.title=Lv.optional;
  log.insertAdjacentHTML('beforeend','<div class="msg in">'+esc(Lv.intro)+'</div>');
  function add(who,text,ts){
    var m=document.createElement('div');m.className='msg '+(who==='me'?'out':'in')+(who==='team'?' team':'');
    if(who==='team'){var b=document.createElement('b');b.textContent=Lv.team;m.appendChild(b)}
    m.appendChild(document.createTextNode(text));var s=document.createElement('small');var d=new Date(ts||Date.now());s.textContent=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);m.appendChild(s);
    log.appendChild(m);log.scrollTop=log.scrollHeight;
  }
  hist.forEach(function(m){add(m.w,m.x,m.t);if(m.w==='team')last=Math.max(last,m.t)});
  function poll(){
    if(dead||!ep)return;
    if(!root.isConnected){clearInterval(timer);return}
    if(document.hidden)return;
    fetch(ep+'/chat?s='+encodeURIComponent(sid)+'&after='+last).then(function(r){if(r.status===404||r.status===501){dead=true;clearInterval(timer);return null}return r.ok?r.json():null}).then(function(j){
      if(!j||!j.replies)return;
      j.replies.forEach(function(rp){if(rp.t>last){last=rp.t;add('team',rp.text,rp.t);hist.push({w:'team',x:rp.text,t:rp.t});track('chat_reply_seen')}});
      saveHist(hist);
    }).catch(function(){});
  }
  function startPoll(){if(!timer&&ep){poll();timer=setInterval(poll,4000)}}
  if(hist.length)startPoll();
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var m=root.querySelector('#c-msg'),n=root.querySelector('#c-name'),txt=(m.value||'').trim(),name=(n.value||'').trim(),ct=(cin.value||'').trim();
    if(!txt){m.focus();m.placeholder=t.chat.needMsg;return}
    if(form.querySelector('.hp').value)return;
    var first=!hist.some(function(h){return h.w==='me'});
    add('me',txt);hist.push({w:'me',x:txt,t:Date.now()});saveHist(hist);m.value='';
    var btn=form.querySelector('button[type=submit]');btn.disabled=true;
    sendLead({type:'chat',session:sid,name:name,contact:ct,message:txt}).then(function(st){
      btn.disabled=false;
      if(st==='sent'){if(first)add('team',Lv.sent);startPoll();track('chat_message')}
      else add('team',(st==='off'?t.chat.off:t.chat.err).replace('{n}',name?', '+name:''));
    });
  });
}

/* ---------- time of day ---------- */
function todNow(){var h=new Date().getHours();return h>=5&&h<12?'morning':h>=12&&h<18?'day':h>=18&&h<22?'evening':'night'}
function applyTod(){
  var d=todNow(),g=T().tod&&T().tod[d];
  os.setAttribute('data-tod',d);$('#phone').setAttribute('data-tod',d);
  var el=$('#todGreet');if(!el){el=document.createElement('p');el.id='todGreet';el.className='greet';var h=$('.hero h1');h.parentNode.insertBefore(el,h)}
  el.textContent=g||'';
  var pe=$('#pGreet');if(!pe){pe=document.createElement('p');pe.id='pGreet';pe.className='greet';var w=$('.phone .wid h1');w.parentNode.insertBefore(pe,w)}
  pe.textContent=g||'';
  if(!$('.stars')){var s=document.createElement('div');s.className='stars';s.innerHTML=Array(40).join('<i></i>');$('#wall').appendChild(s);
    s.querySelectorAll('i').forEach(function(i){i.style.left=(Math.random()*100)+'%';i.style.top=(Math.random()*55)+'%';i.style.animationDelay=(Math.random()*3)+'s'})}
}
var _as=applyStatic;applyStatic=function(){_as();applyTod()};
setInterval(applyTod,60000);

/* ---------- hidden game: BERD Blocks ---------- */
var gameFound=false;
function openGame(src){
  if(!gameFound){gameFound=true;track('easter_egg',src);toast(T().game.found)}
  api.open('game');
}
function toast(msg){var t=document.createElement('div');t.className='toast';t.textContent=msg;(phoneMode()?document.body:os).appendChild(t);setTimeout(function(){t.classList.add('out')},2600);setTimeout(function(){t.remove()},3200)}
(function triggers(){
  var clicks=[],typed='';
  function tap(){var now=Date.now();clicks=clicks.filter(function(c){return now-c<2500});clicks.push(now);if(clicks.length>=5){clicks=[];openGame('logo')}}
  $('.menubar .mk').addEventListener('click',tap);
  $('.phone .wid .mk').addEventListener('click',tap);
  document.addEventListener('keydown',function(e){
    var tg=e.target;if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'))return;
    typed=(typed+(e.key||'')).slice(-4).toLowerCase();if(typed==='berd')openGame('typed');
  });
})();
function initGame(root){
  var G=T().game,W=10,H=20,S=21,COL=['#1B36F5','#CCFF00','#E01060','#FFB800','#ffffff'];
  var SH=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
  var best=0;try{best=+localStorage.getItem('berd-blocks-best')||0}catch(e){}
  root.innerHTML='<div class="gtop"><div><small>'+esc(G.score)+'</small><b data-s>0</b></div><div><small>'+esc(G.lines)+'</small><b data-l>0</b></div><div><small>'+esc(G.best)+'</small><b data-b>'+best+'</b></div></div>'+
    '<div class="gwrap"><canvas width="'+W*S+'" height="'+H*S+'" data-cv></canvas><div class="gov" data-ov><b>'+esc(G.title)+'</b><button type="button" data-go>'+esc(G.start)+'</button><small>'+esc(G.help)+'</small></div></div>'+
    '<div class="gpad"><button type="button" data-a="left" aria-label="←">←</button><button type="button" data-a="rot" aria-label="↻">↻</button><button type="button" data-a="right" aria-label="→">→</button><button type="button" data-a="drop" aria-label="↓">⤓</button></div>';
  var cv=root.querySelector('[data-cv]'),cx=cv.getContext('2d'),ov=root.querySelector('[data-ov]');
  var grid,cur,score,lines,running=false,raf=0,acc=0,lastT=0;
  function piece(){var s=SH[Math.random()*SH.length|0];return {m:s.map(function(r){return r.slice()}),x:3,y:0,c:COL[Math.random()*4|0]}}
  function fits(p,dx,dy,m){m=m||p.m;for(var y=0;y<m.length;y++)for(var x=0;x<m[y].length;x++)if(m[y][x]){var nx=p.x+x+dx,ny=p.y+y+dy;if(nx<0||nx>=W||ny>=H||(ny>=0&&grid[ny][nx]))return false}return true}
  function rot(m){return m[0].map(function(_,i){return m.map(function(r){return r[i]}).reverse()})}
  function cell(x,y,c){cx.fillStyle=c;cx.fillRect(x*S+1,y*S+1,S-2,S-2);cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(x*S+1,y*S+1,S-2,4)}
  function draw(){cx.fillStyle='#0d0e14';cx.fillRect(0,0,W*S,H*S);cx.strokeStyle='rgba(255,255,255,.04)';
    for(var x=0;x<=W;x++){cx.beginPath();cx.moveTo(x*S,0);cx.lineTo(x*S,H*S);cx.stroke()}
    grid.forEach(function(r,y){r.forEach(function(c,x){if(c)cell(x,y,c)})});
    if(cur){var gy=0;while(fits(cur,0,gy+1))gy++;cur.m.forEach(function(r,y){r.forEach(function(v,x){if(v){cx.fillStyle='rgba(255,255,255,.08)';cx.fillRect((cur.x+x)*S+1,(cur.y+y+gy)*S+1,S-2,S-2)}})});
      cur.m.forEach(function(r,y){r.forEach(function(v,x){if(v&&cur.y+y>=0)cell(cur.x+x,cur.y+y,cur.c)})})}}
  function hud(){root.querySelector('[data-s]').textContent=score;root.querySelector('[data-l]').textContent=lines;root.querySelector('[data-b]').textContent=best}
  function lock(){cur.m.forEach(function(r,y){r.forEach(function(v,x){if(v&&cur.y+y>=0)grid[cur.y+y][cur.x+x]=cur.c})});
    var n=0;for(var y=H-1;y>=0;y--){if(grid[y].every(Boolean)){grid.splice(y,1);grid.unshift(Array(W).fill(0));n++;y++}}
    if(n){lines+=n;score+=[0,100,300,500,800][n]}
    cur=piece();if(!fits(cur,0,0))over();hud()}
  function over(){running=false;cancelAnimationFrame(raf);if(score>best){best=score;try{localStorage.setItem('berd-blocks-best',best)}catch(e){}}hud();track('game_over',String(score));
    ov.hidden=false;ov.querySelector('b').textContent=G.over+' · '+score;ov.querySelector('[data-go]').textContent=G.again}
  function act(a){if(!running)return;if(a==='left'&&fits(cur,-1,0))cur.x--;else if(a==='right'&&fits(cur,1,0))cur.x++;else if(a==='rot'){var m=rot(cur.m);if(fits(cur,0,0,m))cur.m=m;else if(fits(cur,-1,0,m)){cur.x--;cur.m=m}else if(fits(cur,1,0,m)){cur.x++;cur.m=m}}
    else if(a==='down'){if(fits(cur,0,1))cur.y++;else lock()}else if(a==='drop'){while(fits(cur,0,1)){cur.y++;score+=2}lock()}draw()}
  function loop(t){if(!running)return;if(!root.isConnected){running=false;return}var sp=Math.max(110,620-lines*18);acc+=t-(lastT||t);lastT=t;if(acc>sp){acc=0;act('down')}raf=requestAnimationFrame(loop)}
  function start(){grid=[];for(var i=0;i<H;i++)grid.push(Array(W).fill(0));cur=piece();score=0;lines=0;running=true;ov.hidden=true;hud();draw();lastT=0;acc=0;raf=requestAnimationFrame(loop);root.focus();track('game_start')}
  ov.querySelector('[data-go]').addEventListener('click',start);
  root.querySelectorAll('[data-a]').forEach(function(b){b.addEventListener('click',function(){act(b.getAttribute('data-a'));root.focus()})});
  root.addEventListener('keydown',function(e){var k={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rot',ArrowDown:'down',' ':'drop'}[e.key];if(k){e.preventDefault();act(k)}});
  grid=[];for(var i=0;i<H;i++)grid.push(Array(W).fill(0));draw();
}

/* ---------- blog ---------- */
function blogUrl(slug){try{return new URL((L==='hy'?'':L+'/')+'blog/'+slug+'/',CFG.siteUrl).href}catch(e){return '#'}}
function initBlog(root){
  var B=T().blog;
  function list(){
    root.innerHTML='<div class="bl-h"><h3>'+esc(B.title)+'</h3><p>'+esc(B.sub)+'</p></div><div class="bl-list">'+BLOG.map(function(a){var x=a[L]||a.hy;
      return '<button type="button" class="bl-card" data-slug="'+a.slug+'"><span class="bl-bar" style="background:'+a.color+'"></span><span class="bl-meta">'+a.date.split('-').reverse().join('.')+' · '+a.read+' '+esc(B.min)+'</span><b>'+esc(x.title)+'</b><span>'+esc(x.desc)+'</span><em>'+esc(B.read)+' →</em></button>'}).join('')+'</div>';
    root.querySelectorAll('[data-slug]').forEach(function(b){b.addEventListener('click',function(){read(b.getAttribute('data-slug'))})});
  }
  function read(slug){
    var a=BLOG.filter(function(x){return x.slug===slug})[0],x=a[L]||a.hy;track('blog_read',slug);
    root.innerHTML='<div class="bl-r"><div class="bl-nav"><button type="button" data-back>'+esc(B.back)+'</button><a href="'+esc(blogUrl(slug))+'" target="_blank" rel="noopener">'+esc(B.open)+'</a></div>'+
      '<article><span class="bl-meta"><i style="background:'+a.color+'"></i>'+a.date.split('-').reverse().join('.')+' · '+a.read+' '+esc(B.min)+'</span><h1>'+esc(x.title)+'</h1><p class="bl-lead">'+esc(x.desc)+'</p>'+x.body+'</article></div>';
    root.querySelector('[data-back]').addEventListener('click',list);
    var sc=root.closest('.wbody')||root.closest('.sbody');if(sc)sc.scrollTop=0;
  }
  list();
}
