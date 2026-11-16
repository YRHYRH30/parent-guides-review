const STORE = 'https://riddle-store-yh.netlify.app/api/store?id=';
const KEY = '6557dfb0-827c-4bdc-838e-526614e7f99a';
const LABELS = {approve:'אושר', reject:'נדחה', comment:'הערה נשמרה'};

async function sget(){
  const r = await fetch(STORE+KEY, {cache:'no-store'});
  if(r.status===404) return {approvals:{}};
  if(!r.ok) throw new Error('get '+r.status);
  return r.json();
}
async function sput(data){
  const r = await fetch(STORE+KEY, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if(!r.ok) throw new Error('put '+r.status);
}

function mount(el, cardId, saved){
  const cur = saved || {};
  el.innerHTML = `
    <h3>אישור הפתרון</h3>
    <div class="btns">
      <button type="button" class="yes" data-choice="approve" aria-pressed="false">מאשר</button>
      <button type="button" class="no" data-choice="reject" aria-pressed="false">דוחה</button>
      <button type="button" class="maybe" data-choice="comment" aria-pressed="false">הערה</button>
    </div>
    <textarea placeholder="הערה או נימוק (רשות)"></textarea>
    <div class="btns"><button type="button" class="save">שמירה</button></div>
    <div class="status"></div>`;
  const ta = el.querySelector('textarea');
  const st = el.querySelector('.status');
  const buttons = [...el.querySelectorAll('[data-choice]')];
  let choice = cur.status || '';
  if(cur.comment) ta.value = cur.comment;
  const paint = () => {
    buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.choice===choice ? 'true' : 'false'));
    if(cur.status){
      const when = cur.at ? new Date(cur.at).toLocaleString('he-IL', {timeZone:'Asia/Jerusalem'}) : '';
      st.textContent = (LABELS[cur.status]||cur.status) + (when ? ' · '+when+' (שעון ישראל)' : '');
      st.className = 'status ok';
    }
  };
  paint();
  buttons.forEach(b => b.onclick = () => { choice = b.dataset.choice; buttons.forEach(x => x.setAttribute('aria-pressed', x===b?'true':'false')); });
  el.querySelector('.save').onclick = async () => {
    if(!choice){ st.textContent='בחרו מאשר, דוחה או הערה.'; st.className='status err'; return; }
    st.textContent='שומר…'; st.className='status';
    try{
      const fresh = await sget();
      if(!fresh.approvals) fresh.approvals = {};
      fresh.approvals[cardId] = {status:choice, comment:ta.value.trim(), at:new Date().toISOString()};
      await sput(fresh);
      Object.assign(cur, fresh.approvals[cardId]);
      paint();
      st.textContent = 'נשמר. ' + (LABELS[choice]||'');
      st.className = 'status ok';
    }catch(e){
      st.textContent = 'השמירה נכשלה. אפשר לנסות שוב.';
      st.className = 'status err';
    }
  };
}

(async () => {
  let data = {approvals:{}};
  try { data = await sget(); } catch(_){}
  document.querySelectorAll('.approve').forEach(el => {
    const id = el.getAttribute('data-card');
    mount(el, id, (data.approvals||{})[id]);
  });
})();

const lb = document.getElementById('lb');
const lbImg = lb.querySelector('img');
document.querySelectorAll('.fig img').forEach(img => {
  img.addEventListener('click', () => {
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lb.hidden = false;
    lb.classList.add('on');
  });
});
function closeLb(){ lb.classList.remove('on'); lb.hidden = true; lbImg.src=''; }
lb.addEventListener('click', closeLb);
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLb(); });
