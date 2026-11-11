const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const decode=value=>JSON.parse(value.slice(4));
function browser({consent=false,manual='',landing='/ru/services/talent-and-gamedev-visas-uae',exit='/ru/career',host='www.futura.law',defer=false}={}){
 const listeners={},reads=[],callbacks=[],touch={at:'2026-11-11T10:00:00.000Z',landing:landing+'?email=private%40example.com',page:'https://'+host+landing,referrer:'https://www.google.com/',utm:{utm_campaign:'original-campaign',utm_term:'provided-keyword'}};
 let allowed=consent;const attrs={href:'https://calendly.com/a-karpenko-futura/30min'+(manual?'?utm_content='+encodeURIComponent(manual):'')};
 const link={tagName:'A',getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};
 const document={readyState:'complete',referrer:'',querySelectorAll:s=>s==='form'?[]:[link],addEventListener:(k,f)=>listeners[k]=f};
 const window={location:new URL('https://'+host+exit),localStorage:{getItem:()=>JSON.stringify(touch),setItem:()=>{}},FuturaConsent:{analyticsAllowed:()=>allowed},gtag:(cmd,id,key,cb)=>{reads.push(key);if(defer)callbacks.push(()=>cb(key==='client_id'?'123.456':'1794390000'));else cb(key==='client_id'?'123.456':'1794390000');}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/lead-source.js','utf8'),{window,document,URL,URLSearchParams,WeakMap,Date,String,JSON});
 return{link,attrs,reads,callbacks,document,window,content:()=>new URL(attrs.href).searchParams.get('utm_content'),choice:v=>{allowed=v;listeners['futura:consent']();},click:()=>listeners.click({target:link})};
}
test('landing, exit and first time are distinct and query strings are excluded',()=>{const b=browser(),a=decode(b.content());assert.equal(a[0],'/ru/career');assert.equal(a[1],'/ru/services/talent-and-gamedev-visas-uae');assert.equal(a[2],'2026-11-11T10:00:00.000Z');assert(!b.content().includes('email'));assert.equal(b.reads.length,0);});
test('analytics IDs only with consent, revoked context removed even before click',()=>{
 const b=browser({consent:true});let c=decode(b.content());assert.equal(c[3],'123.456');assert.equal(c[4],'1794390000');b.choice(false);c=decode(b.content());assert.equal(c[3],'');assert.equal(c[4],'');
});
test('late analytics callbacks cannot restore revoked identifiers',()=>{const b=browser({consent:true,defer:true});b.choice(false);b.callbacks.forEach(f=>f());assert.equal(decode(b.content())[3],'');});
test('manual content and campaign tags preserved',()=>{const b=browser({manual:'campaign-banner'});assert.equal(b.content(),'campaign-banner');const u=new URL(b.attrs.href);assert.equal(u.searchParams.get('utm_campaign'),'original-campaign');assert.equal(u.searchParams.get('utm_term'),'provided-keyword');});
test('SPA click refreshes exit without overwriting first landing',()=>{const b=browser();b.window.location=new URL('https://www.futura.law/ru/company');b.click();const c=decode(b.content());assert.equal(c[0],'/ru/company');assert.equal(c[1],'/ru/services/talent-and-gamedev-visas-uae');});
test('UTM stays within 255 and long path never silently truncated',()=>{for(const n of [50,150,230,270]){const b=browser({consent:true,landing:'/'+ 'a'.repeat(n)});assert(b.content().length<=255);const c=b.content().startsWith('FT1:')?decode(b.content()):null;if(c)assert.equal(c[1],'/'+ 'a'.repeat(n));else assert.equal(b.content(),'/ru/career');}});
test('new format limited to Law, AE legacy remains',()=>{const b=browser({host:'www.futura.ae',consent:true});assert.equal(b.content(),'/ru/career');assert.equal(b.reads.length,0);});
