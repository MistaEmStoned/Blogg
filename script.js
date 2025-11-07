const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCJjhkq3KdB65hxp6-95fbgbwzWpWAucbI",
  authDomain: "blogg-b66ef.firebaseapp.com",
  projectId: "blogg-b66ef",
  storageBucket: "blogg-b66ef.firebasestorage.app",
  messagingSenderId: "866277401593",
  appId: "1:866277401593:web:324161cdeb92f09fd29328",
  measurementId: "G-N6Y00ZNR3J"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const postsEl = document.getElementById('posts');
const titleEl = document.getElementById('title');
const contentEl = document.getElementById('content');
const authorEl = document.getElementById('authorName');

const mobileModal = document.getElementById('mobileModal');
const mobileTitle = document.getElementById('mobileTitle');
const mobileContent = document.getElementById('mobileContent');
const mobileAuthor = document.getElementById('mobileAuthor');
const mobileSave = document.getElementById('mobileSave');
const mobileCancel = document.getElementById('mobileCancel');

const loginBtn = document.getElementById('loginBtn');

document.getElementById('newPostBtn').addEventListener('click',()=>mobileModal.style.display='flex');
mobileCancel.addEventListener('click',()=>mobileModal.style.display='none');

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function renderPosts(posts, currentUid){
  postsEl.innerHTML = '<h2 style="margin-top:0">Latest posts</h2>';
  posts.forEach(p=>{
    const wrap = document.createElement('article');
    wrap.className='post card';
    const date = new Date(p.date);
    const formattedDate = date.toLocaleString();
    wrap.innerHTML=`
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${formattedDate} · ${escapeHtml(p.authorName)}</div>
      <div class="excerpt">${escapeHtml(p.content).slice(0,160)}</div>
      <div style="margin-top:8px">
        ${p.authorId===currentUid ? `<button data-id="${p.id}" class="del" style="background:#ef4444">Delete</button>` : ''}
        <button data-id="${p.id}" class="open">Read</button>
      </div>
    `;
    postsEl.appendChild(wrap);
  });
}

function fetchAndRender(uid){
  db.collection('posts').orderBy('date','desc').get().then(snapshot=>{
    const posts = snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
    renderPosts(posts, uid || null);
  });
}

// Initial fetch for all users
fetchAndRender(null);

auth.onAuthStateChanged(user=>{
  const uid = user ? user.uid : null;
  loginBtn.textContent = user ? 'Sign Out' : 'Sign In';
  loginBtn.onclick = user ? ()=>auth.signOut() : ()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  fetchAndRender(uid);
  
  if(!user) return;

  function saveHandler(titleEl, contentEl, authorEl){
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();
    const authorName = authorEl.value.trim() || 'Anonymous';
    if(!title || !content){ alert('Title and content required'); return; }

    const postData = { title, content, authorName, authorId: uid, date: new Date().toISOString() };
    db.collection('posts').add(postData).then(()=>{
      titleEl.value=''; contentEl.value='';
      if(titleEl === mobileTitle) mobileModal.style.display='none';
      fetchAndRender(uid);
    });
  }

  document.getElementById('saveBtn').addEventListener('click',()=>saveHandler(titleEl, contentEl, authorEl));
  mobileSave.addEventListener('click',()=>saveHandler(mobileTitle, mobileContent, mobileAuthor));

  postsEl.addEventListener('click',e=>{
    const id = e.target.dataset.id;
    if(!id) return;
    if(e.target.classList.contains('del')){
      db.collection('posts').doc(id).get().then(doc=>{
        if(doc.exists && doc.data().authorId===uid){
          db.collection('posts').doc(id).delete().then(()=>fetchAndRender(uid));
        }
      });
      return;
    }
    if(e.target.classList.contains('open')){
      db.collection('posts').doc(id).get().then(doc=>{
        if(doc.exists) showModal(doc.data());
      });
    }
  });
});

function showModal(p){
  const modal = document.createElement('div');
  modal.style.position='fixed';
  modal.style.inset=0;
  modal.style.display='flex';
  modal.style.alignItems='center';
  modal.style.justifyContent='center';
  modal.style.background='rgba(0,0,0,0.4)';
  const date = new Date(p.date);
  const formattedDate = date.toLocaleString();
  modal.innerHTML = `
    <div style="max-width:720px;width:92%;background:white;border-radius:12px;padding:18px;box-shadow:0 10px 30px rgba(2,6,23,0.3)">
      <h2 style="margin-top:0">${escapeHtml(p.title)}</h2>
      <div style="color:var(--muted);margin-bottom:8px">${formattedDate} · ${escapeHtml(p.authorName)}</div>
      <div style="color:#111;font-size:15px;line-height:1.6">${escapeHtml(p.content).replace(/\n/g,'<br>')}</div>
      <div style="text-align:right;margin-top:16px"><button id="closeModal">Close</button></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeModal').addEventListener('click',()=>modal.remove());
}
