// Admin page script: user accounts + admin story editing (uses same STORAGE_KEY)
const STORAGE_KEY = 'enhanced_stories_v1';
const USERS_KEY = 'enhanced_users_v1';

let stories = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

// ensure default admin exists
if(!users.length){
  users.push({username:'admin', password:'mypassword', isAdmin:true});
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const $ = id => document.getElementById(id);
const authSection = $('authSection');
const adminPanel = $('adminPanel');
const storyList = $('storyList');
const storyEditSection = $('storyEditSection');

function saveStories(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(stories)); }
function saveUsers(){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

// parse italic (same as main)
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

// Auth
let currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
function updateAuthUI(){
  if(currentUser){
    $('authMsg').innerText = '';
    $('authUser').classList.add('hidden'); $('authPass').classList.add('hidden');
    $('loginBtn').classList.add('hidden'); $('registerBtn').classList.add('hidden');
    $('logoutBtn').classList.remove('hidden');
    $('loggedAs').innerText = 'Logged in as: ' + currentUser.username + (currentUser.isAdmin ? ' (admin)' : '');
    if(currentUser.isAdmin){
      adminPanel.classList.remove('hidden');
      $('changePassSection').classList.remove('hidden');
    } else {
      adminPanel.classList.add('hidden');
      $('changePassSection').classList.remove('hidden');
    }
  } else {
    $('authUser').classList.remove('hidden'); $('authPass').classList.remove('hidden');
    $('loginBtn').classList.remove('hidden'); $('registerBtn').classList.remove('hidden');
    $('logoutBtn').classList.add('hidden');
    $('loggedAs').innerText = '';
    adminPanel.classList.add('hidden');
    $('changePassSection').classList.add('hidden');
    storyEditSection.innerHTML = '';
  }
}
updateAuthUI();

$('loginBtn').onclick = ()=>{
  const u = $('authUser').value.trim(); const p = $('authPass').value;
  const found = users.find(x=>x.username===u && x.password===p);
  if(found){ currentUser = {username:found.username, isAdmin:found.isAdmin}; sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); updateAuthUI(); renderStoryList(); $('authMsg').innerText='Logged in'; }
  else $('authMsg').innerText='Wrong credentials';
};

$('registerBtn').onclick = ()=>{
  const u = $('authUser').value.trim(); const p = $('authPass').value;
  if(!u || !p){ $('authMsg').innerText='Enter username & password'; return; }
  if(users.some(x=>x.username===u)){ $('authMsg').innerText='Username taken'; return; }
  users.push({username:u, password:p, isAdmin:false});
  saveUsers();
  $('authMsg').innerText='Registered — now login';
};

$('logoutBtn').onclick = ()=>{
  currentUser = null; sessionStorage.removeItem('currentUser'); updateAuthUI(); $('authMsg').innerText='Logged out';
};

$('changePassBtn').onclick = ()=>{
  const np = $('newPass').value;
  if(!np || !currentUser){ alert('Login first'); return; }
  // update in users list
  const u = users.find(x=>x.username===currentUser.username);
  if(u){ u.password = np; saveUsers(); alert('Password changed'); $('newPass').value=''; }
};

// Admin panel functions
function renderStoryList(){
  storyList.innerHTML = '';
  stories.forEach(s=>{
    const div = document.createElement('div');
    div.className='card';
    div.innerHTML = `<strong>${s.title}</strong> — Tags: ${s.tags.join(', ')} <div style="margin-top:6px"><button class="btn" onclick="editStoryAdmin('${s.id}')">Edit</button> <button class="btn" onclick="deleteStoryAdmin('${s.id}')">Delete</button></div>`;
    storyList.appendChild(div);
  });
}
function readFileAsDataURL(f){ return new Promise(res=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(f); }); }

$('addStoryBtn').onclick = async ()=>{
  if(!currentUser || !currentUser.isAdmin){ alert('Only admins can add stories'); return; }
  const title = $('storyTitle').value.trim(); if(!title){ alert('Enter title'); return; }
  const tags = $('storyTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const file = $('storyThumbnail').files[0];
  const id = 's'+Date.now();
  const newStory = {id,title,thumbnail:'',tags,views:0,bookmarks:0,ratings:[],seasons:['Season 1'],currentSeason:'Season 1',pages:[],comments:[]};
  if(file){ newStory.thumbnail = await readFileAsDataURL(file); }
  stories.unshift(newStory); saveStories(); renderStoryList(); $('storyTitle').value=''; $('storyTags').value=''; $('storyThumbnail').value='';
};

function editStoryAdmin(id){
  const s = stories.find(x=>x.id===id);
  storyEditSection.innerHTML = '';
  const panel = document.createElement('div'); panel.className='card';
  panel.innerHTML = `<h3>Edit: ${s.title}</h3>
    <input id="editTitle" value="${s.title}">
    <input id="editTags" value="${s.tags.join(', ')}">
    <div id="pagesEditor"></div>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="addPageBtn">Add Page</button><button class="btn" id="saveEditBtn">Save</button></div>
    <div style="margin-top:8px"><small>Live preview updates as you type (actions in *asterisks* will be italicized unless inside quotes)</small></div>
  `;
  storyEditSection.appendChild(panel);

  function renderPages(){
    const pagesEditor = $('pagesEditor');
    pagesEditor.innerHTML = '';
    s.pages.forEach((p,idx)=>{
      const div = document.createElement('div');
      div.className='card';
      div.innerHTML = `<h4>Page ${idx+1}</h4>
        <textarea id="pageText${idx}" rows="4">${p.text.replace(/</g,'&lt;')}</textarea>
        <input type="file" id="pageImg${idx}" accept="image/*">
        <div class="preview" id="preview${idx}"></div>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" onclick="movePageAdmin('${s.id}',${idx},-1)">⬆</button><button class="btn" onclick="movePageAdmin('${s.id}',${idx},1)">⬇</button><button class="btn" onclick="deletePageAdmin('${s.id}',${idx})">Delete</button></div>`;
      pagesEditor.appendChild(div);
      const ta = document.getElementById('pageText'+idx);
      const pv = document.getElementById('preview'+idx);
      // initial preview
      pv.innerHTML = parseActionsItalic(escapeHtml(p.text)).replace(/\n/g,'<br>');
      // live update
      ta.addEventListener('input', ()=> {
        pv.innerHTML = parseActionsItalic(escapeHtml(ta.value)).replace(/\n/g,'<br>');
      });
    });
  }
  renderPages();

  $('addPageBtn').onclick = ()=> {
    s.pages.push({text:'New page...',image:''});
    renderPages();
  };
  $('saveEditBtn').onclick = async ()=>{
    s.title = $('editTitle').value.trim();
    s.tags = $('editTags').value.split(',').map(t=>t.trim()).filter(Boolean);
    for(let i=0;i<s.pages.length;i++){
      const ta = document.getElementById('pageText'+i);
      if(ta) s.pages[i].text = ta.value;
      const fileInput = document.getElementById('pageImg'+i);
      if(fileInput && fileInput.files[0]) s.pages[i].image = await readFileAsDataURL(fileInput.files[0]);
    }
    saveStories(); renderStoryList(); alert('Saved');
  };
}

function movePageAdmin(id,idx,dir){
  const s = stories.find(x=>x.id===id);
  const newIdx = idx+dir;
  if(newIdx<0||newIdx>=s.pages.length) return;
  const tmp = s.pages[newIdx]; s.pages[newIdx]=s.pages[idx]; s.pages[idx]=tmp;
  saveStories(); editStoryAdmin(id);
}
function deletePageAdmin(id,idx){
  const s = stories.find(x=>x.id===id);
  s.pages.splice(idx,1);
  saveStories(); editStoryAdmin(id);
}
function deleteStoryAdmin(id){
  if(!currentUser || !currentUser.isAdmin){ alert('Only admins'); return; }
  if(confirm('Delete story?')){ stories = stories.filter(x=>x.id!==id); saveStories(); renderStoryList(); storyEditSection.innerHTML=''; }
}

$('exportAllBtn').onclick = ()=> {
  const blob = new Blob([JSON.stringify(stories, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stories_backup.json'; document.body.appendChild(a); a.click(); a.remove();
};

// initial render if admin logged in
if(currentUser && currentUser.isAdmin) renderStoryList();

// keep session across reload (sessionStorage stores currentUser)
