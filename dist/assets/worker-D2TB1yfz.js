(function(){"use strict";class h extends EventTarget{emitContig(s){this.dispatchEvent(new CustomEvent("data",{detail:s}))}end(){this.dispatchEvent(new Event("end"))}}const p=(e,s,t)=>e+s.substring(t-1),m=(e,s,t,a,i,n,d,E,g)=>{const l=d.get(e);if(!l||l.length===0){const o=t.join(",");i.has(o)||(i.add(o),g.emitContig(a));return}for(const o of l){if(s.has(o.id))continue;const u=t.length===0?n.get(o.id).label:p(a,n.get(o.id).label,E);s.add(o.id),t.push(o.id),m(o.to,s,t,u,i,n,d,E,g),s.delete(o.id),t.pop()}if(t.length>0){const o=t.join(",");i.has(o)||(i.add(o),g.emitContig(a))}},w=(e,s)=>{const t=new Map;e.forEach(n=>{const d=t.get(n.from)||[];d.push({from:n.from,to:n.to,id:n.id}),t.set(n.from,d)});const a=new Map(e.map(n=>[n.id,n])),i=new h;return setTimeout(()=>{t.forEach((n,d)=>{m(d,new Set,[],"",new Set,a,t,s,i)}),i.end()},0),i},c=new Set;let f=0;const r=()=>{const e=Array.from(c);if(f<e.length){const s=e.slice(f);self.postMessage(JSON.stringify(s)),f=e.length}};self.onmessage=async e=>{const{edgesData:s,k:t}=e.data;self.postMessage("start");const a=w(s,t);a.addEventListener("data",i=>{const n=i.detail;c.add(n),c.size%100===0&&r()}),a.addEventListener("end",()=>{r(),self.postMessage("end")})}})();
