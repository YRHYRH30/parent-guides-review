/* Shared NOTES_KEY + commit preserve all existing shot/video notes unchanged.
   Asset notes use video=asset-… and asset=asset-…; never numeric shot ids. */
(function(){
  const cards=[...document.querySelectorAll('[data-asset-id]')];
  const pending=new Set();
  const draftKey=id=>'gallery-draft:'+id;
  function status(card,text){card.querySelector('.asset-save-status').textContent=text}
  function assetNotes(id){return notes.filter(n=>n.video===id&&n.asset===id)}
  function refresh(){
    cards.forEach(card=>{
      const list=card.querySelector('.asset-note-list');
      list.replaceChildren();
      assetNotes(card.dataset.assetId).sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))).forEach(n=>{
        const row=document.createElement('div');row.className='asset-saved-note'+(n.status==='done'?' is-done':'');
        const text=document.createElement('div');text.textContent=n.text||'';row.append(text);
        const meta=document.createElement('small');
        const date=new Date(n.at);meta.textContent=Number.isNaN(date.getTime())?'':date.toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})+' · שעון ישראל';row.append(meta);
        const edit=document.createElement('button');edit.type='button';edit.textContent='עריכה';
        edit.onclick=async()=>{
          const value=prompt('איפה לשים את הפריט?',n.text||'');if(value===null||!value.trim())return;
          if(pending.has(card.dataset.assetId))return;
          pending.add(card.dataset.assetId);edit.disabled=true;status(card,'שומר…');
          const ok=await commit(fresh=>fresh.map(m=>m.id===n.id&&m.video===card.dataset.assetId&&m.asset===card.dataset.assetId?{...m,text:value.trim()}:m));
          pending.delete(card.dataset.assetId);edit.disabled=false;status(card,ok?'✔ נשמר':'⚠ לא נשמר — נסו שוב');
        };row.append(edit);list.append(row);
      });
    });
  }
  cards.forEach(card=>{
    const id=card.dataset.assetId,input=card.querySelector('textarea'),save=card.querySelector('[data-asset-save]');
    input.value=LS(draftKey(id))||'';
    input.addEventListener('input',()=>{LS(draftKey(id),input.value);status(card,'טיוטה — לחצו לשמירה משותפת')});
    async function send(){
      const text=input.value.trim();if(!text||pending.has(id))return;
      pending.add(id);save.disabled=true;status(card,'שומר…');
      const n={id:uuid(),video:id,asset:id,t:0,scope:'general',text,files:[],status:'new',at:new Date().toISOString()};
      const ok=await commit(fresh=>[...fresh,n]);
      pending.delete(id);save.disabled=false;
      if(ok&&input.value.trim()===text){input.value='';LS(draftKey(id),'')}
      status(card,ok?'✔ נשמר במאגר המשותף':'⚠ לא נשמר — הטיוטה נשארה, נסו שוב');
    }
    save.addEventListener('click',send);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send()}});
  });
  document.addEventListener('review-notes-updated',refresh);
  // Only one clip at a time; do not change the primary film or its source.
  document.querySelectorAll('.asset-media video').forEach(clip=>clip.addEventListener('play',()=>{
    document.querySelectorAll('video').forEach(other=>{if(other!==clip)other.pause()});
  }));
  v.addEventListener('play',()=>document.querySelectorAll('.asset-media video').forEach(clip=>clip.pause()));
  refresh();
})();
