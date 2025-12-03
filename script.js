// Main site script (reader and public actions)
const STORAGE_KEY = 'enhanced_stories_v1';
let stories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
if(!stories.length){
  stories.push({
    id: 'story1',
    title: 'My First Adventure',
    thumbnail: '',
    tags: ['Adventure'],
    views:0, bookmarks:0, ratings:[], seasons:['Season 1'], currentSeason:'Season 1',
    pages: [
      {text: "Once upon a time *he moved slowly*, the wind glanced over the trees.", image:''},
      {text: 'She whispered, "I will stay." Then *the door slammed* behind her.', image:''}
    ],
    comments: []
  });
  save();
}

const $ = id => document.getElementById(id);
const storiesGrid = $('storiesGrid');
const searchInput = $('searchInput');
const filterSelect = $('filterSelect');
const bookContainer = $('bookContainer');

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(stories)); }

// Italic parser for actions outside quotes (same rules as admin)
function parseActionsItalic(raw){
  const parts = raw.split(/(".*?"|'.*?')/s);
  return parts.map(part=>{
    if(/^["']/.test(part)){
      return part.replace(/\*(.*?)\*/gs,'$1');
    } else {
      return part.replace(/\*(.*?)\*/gs, '<em>$1</em>');
    }
  }).join('');
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function average(arr){ return arr && arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '0.0'; }

function renderStories(filter=''){
  storiesGrid.innerHTML = '';
  let list = stories.filter(s=>{
    return s.title.toLowerCase().includes(filter.toLowerCase()) ||
           s.tags.some(t=>t.toLowerCase().includes(filter.toLowerCase()));
  });
  const type = filterSelect.value;
  if(type==='topRated') list.sort((a,b)=> (b.ratings.reduce((x,y)=>x+y,0)/(b.ratings.length||1)) - (a.ratings.reduce((x,y)=>x+y,0)/(a.ratings.length||1)) );
  if(type==='mostViewed') list.sort((a,b)=>b.views - a.views);
  if(type==='recent') list.sort((a,b)=>b.id.localeCompare(a.id));

  list.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'story-card';
    card.innerHTML = `
      <img src="${s.thumbnail||'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'300\'><rect width=\'100%\' height=\'100%\' fill=\'%23ddd\'/></svg>'}" alt="">
      <div class="meta">
        <h3>${s.title}</h3>
        <div class="small">Tags: ${s.tags.join(', ')}</div>
        <div class="small">Views: ${s.views} • Rating: ${average(s.ratings)}</div>
        <div class="btn-group">
          <button class="btn" onclick="openReader('${s.id}')">Read</button>
          <button class="btn" onclick="downloadStory('${s.id}')">Download</button>
          <button class="btn" onclick="toggleBookmark('${s.id}')">${s.bookmarks? 'Unbookmark' : 'Bookmark'}</button>
        </div>
      </div>
    `;
    storiesGrid.appendChild(card);
  });
}

function openReader(id){
  const s = stories.find(x=>x.id===id);
  if(!s) return;
  s.views++; save();
  bookContainer.innerHTML = '';
  bookContainer.classList.remove('hidden');
  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<h2>${s.title}</h2><div class="controls"><button class="btn" onclick="closeReader()">Close</button><button class="btn" onclick="exportStoryHTML('${s.id}')">Export HTML</button></div>`;
  bookContainer.appendChild(header);

  s.pages.forEach((p,i)=>{
    const page = document.createElement('article');
    page.className = 'book-page';
    const img = p.image ? `<img src="${p.image}" style="max-width:100%;display:block;margin-bottom:8px">` : '';
    page.innerHTML = `<h4>Page ${i+1}</h4>${img}<div class="story-text">${parseActionsItalic(escapeHtml(p.text)).replace(/\n/g,'<br>')}</div>`;
    bookContainer.appendChild(page);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

function closeReader(){ bookContainer.classList.add('hidden'); bookContainer.innerHTML=''; renderStories(searchInput.value); }

function toggleBookmark(id){ const s=stories.find(x=>x.id===id); s.bookmarks = s.bookmarks?0:1; save(); renderStories(); }
function downloadStory(id){
  const s = stories.find(x=>x.id===id);
  const blob = new Blob([JSON.stringify(s, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = (s.title||'story')+'.json'; document.body.appendChild(a); a.click(); a.remove();
}

function exportStoryHTML(id){
  const s = stories.find(x=>x.id===id);
  let html = `<!doctype html><meta charset="utf-8"><title>${s.title}</title><style>body{font-family:Arial;padding:20px}</style><h1>${s.title}</h1>`;
  s.pages.forEach((p,i)=>{
    html += `<section><h3>Page ${i+1}</h3>${p.image?'<img src="'+p.image+'" style="max-width:100%"><br/>':''}<div>${parseActionsItalic(escapeHtml(p.text)).replace(/\n/g,'<br>')}</div></section>`;
  });
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = (s.title||'story')+'.html'; document.body.appendChild(a); a.click(); a.remove();
}

document.getElementById('randomStoryBtn').onclick = ()=> {
  const s = stories[Math.floor(Math.random()*stories.length)];
  if(s) openReader(s.id);
};
document.getElementById('themeSwitch').onclick = ()=> {
  document.body.classList.toggle('dark'); document.body.classList.toggle('light'); localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
};
if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
searchInput.addEventListener('input', ()=> renderStories(searchInput.value));
filterSelect.addEventListener('change', ()=> renderStories(searchInput.value));
renderStories();
