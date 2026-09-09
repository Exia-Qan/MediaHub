
const firebaseConfig = {
  apiKey: "AIzaSyAUyaoTV6IqEm7IAc0HWN9WQfPLKoaCJdI",
  authDomain: "mediahub-939f5.firebaseapp.com",
  projectId: "mediahub-939f5",
  storageBucket: "mediahub-939f5.firebasestorage.app",
  messagingSenderId: "1083226186253",
  appId: "1:1083226186253:web:956d88e6e0cfd0b832ab44",
  measurementId: "G-YYCF83XSWK"
};


let auth, db;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("✅ Firebase connected successfully!");
} catch (error) {
    console.error("❌ Firebase Init Error:", error);
}


const library = [
    {
        id: "anime1", type: "anime", title: "Naruto Shippuden", tags: ["Action", "Ninja", "Shonen"],
        quality: "HD", year: "2002", rating: "8.7",
        desc: "Naruto Uzumaki is a loud, hyperactive ninja who dreams of becoming the Hokage.",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwPx9LbVvuC17uHKI_IuQKSi0jY1r1c6o3mo1dE_q163J28rQtDTxUJQo&s=10",
        content: { "Season 1 - Episode 1": ["assets/anime/Naruto shippuden/Season1/nsep01.mp4"] }
    },
    {
        id: "manga1", type: "manga", title: "One Piece", tags: ["Action", "Adventure", "Pirates"],
        quality: "HD", year: "1997", rating: "9.2",
        desc: "Monkey D. Luffy and his crew search for the legendary One Piece.",
        poster: "https://ia601805.us.archive.org/19/items/opp_20260909/opp.jpg",
        content: { "Chapter 1": ["assets/manga/OnePiece/Chapter1/uone_piece_v001-005.jpg"] }
    },
    {
        id: "webtoon1", type: "webtoon", title: "Solo Leveling", tags: ["Action", "Fantasy", "System"],
        quality: "4K", year: "2018", rating: "9.5",
        desc: "The weakest hunter becomes the only one who can level up.",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNVuYnydQtl0DmTKSs1cgJ0GJdA5_1r1xaL4Ck8qnreBtSH3R_la4vdBQ&s=10",
        content: { "Chapter 1": ["assets/webtoons/SoloLeveling/Chapter1/solo_leveling_ch000_p001.webp"] }
    },
    {
        id: "anime2", type: "anime", title: "Haikyuu", tags: ["Comedy", "Sport", "Shonen"],
        quality: "HD", year: "2014", rating: "8.8",
        desc: "Hinata Shoyo strives to become a great volleyball player.",
        poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL4Vk4UMknsxFCwaAutE2A8z06PTtn-LelFp8n1O3NrRGNd_mMW7dkUoBs&s=10",
        content: { "Episode 1": ["assets/anime/Haikyuu/Season1/haikyuuep01.mp4"] }
    }
];

let state = { category: 'all', searchQuery: '', activeTag: 'all', user: null };
let currentSeries = null;



if (auth) {
    auth.onAuthStateChanged(user => {
        state.user = user;
        updateUIForUser(user);
    });
}

function updateUIForUser(user) {
    const authBtn = document.getElementById('auth-btn');
    const avatar = document.getElementById('user-avatar');
    if (!authBtn || !avatar) return;
    if (user) {
        authBtn.innerText = "Logout";
        avatar.innerText = user.email[0].toUpperCase();
    } else {
        authBtn.innerText = "Login";
        avatar.innerText = "G";
    }
}

async function handleAuth() {
    if (!auth) return alert("Firebase not connected!");

    if (state.user) {
        try {
            await auth.signOut();
            alert("Logged out successfully!");
        } catch (error) {
            alert("Logout error: " + error.message);
        }
    } else {
        // PRO FIX: Ask for choice to avoid invalid-credentials error
        const choice = prompt("Type '1' to Login or '2' to Sign Up:");
        if (choice === '1') {
            const email = prompt("Login - Enter Email:");
            const password = prompt("Login - Enter Password:");
            if (email && password) {
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                    alert("Welcome back!");
                } catch (e) { alert("Login Failed: Check your email/password."); }
            }
        } else if (choice === '2') {
            const email = prompt("Sign Up - Enter Email:");
            const password = prompt("Sign Up - Enter Password (min 6 chars):");
            if (email && password) {
                try {
                    await auth.createUserWithEmailAndPassword(email, password);
                    alert("Account created and logged in!");
                } catch (e) { alert("Signup Error: " + e.message); }
            }
        } else {
            alert("Invalid choice. Please select 1 or 2.");
        }
    }
    toggleProfile();
}



async function addToMyList() {
    if (!state.user) return alert("Please login first!");
    try {
        await db.collection("users").doc(state.user.uid).set({
            favorites: firebase.firestore.FieldValue.arrayUnion(currentSeries.id)
        }, { merge: true });
        alert("Added to My List!");
    } catch (e) { alert("Error: " + e.message); }
}

async function showMyList() {
    if (!state.user) return alert("Please login first!");
    showPage('gallery-page');
    document.getElementById('category-title').innerText = "My Favorites";
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = "Loading...";
    try {
        const doc = await db.collection("users").doc(state.user.uid).get();
        if (!doc.exists || !doc.data().favorites) {
            grid.innerHTML = "Your list is empty!";
            return;
        }
        const favorites = doc.data().favorites;
        grid.innerHTML = '';
        library.filter(item => favorites.includes(item.id)).forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => openDetails(item);
            card.innerHTML = `<div class="poster-container"><img src="${item.poster}"><div class="badge">${item.quality}</div></div><div class="card-info"><h4>${item.title}</h4></div>`;
            grid.appendChild(card);
        });
    } catch (e) { alert("Error: " + e.message); }
}



function toggleProfile() {
    const menu = document.getElementById('profile-menu');
    if (menu) menu.classList.toggle('active');
}

function showPage(pageId) {
    ['gallery-page', 'detail-page', 'selection-page', 'viewer-page'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    if(target) target.classList.remove('hidden');
    window.scrollTo(0,0);
}

function updateSearch() {
    state.searchQuery = document.getElementById('search-input').value.toLowerCase();
    renderGallery();
}

function setCategory(cat) {
    state.category = cat; state.activeTag = 'all';
    renderGallery(); showPage('gallery-page');
}

function setGenre(genre) {
    state.activeTag = genre; state.category = 'all';
    renderGallery(); showPage('gallery-page');
}

function resetFilters() {
    state = { ...state, category: 'all', searchQuery: '', activeTag: 'all' };
    document.getElementById('search-input').value = '';
    renderGallery(); showPage('gallery-page');
}

function renderGallery() {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const titleEl = document.getElementById('category-title');
    if (state.activeTag !== 'all') titleEl.innerText = state.activeTag;
    else if (state.category !== 'all') titleEl.innerText = state.category.toUpperCase();
    else if (state.searchQuery !== '') titleEl.innerText = `Search: ${state.searchQuery}`;
    else titleEl.innerText = "All Content";

    const filtered = library.filter(item => {
        const matchesCat = (state.category === 'all' || item.type === state.category);
        const matchesTag = (state.activeTag === 'all' || item.tags.includes(state.activeTag));
        const matchesSearch = (item.title.toLowerCase().includes(state.searchQuery) || item.tags.some(t => t.toLowerCase().includes(state.searchQuery)));
        return matchesCat && matchesTag && matchesSearch;
    });

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetails(item);
        card.innerHTML = `<div class="poster-container"><img src="${item.poster}"><div class="badge">${item.quality || 'HD'}</div></div><div class="card-info"><h4>${item.title}</h4></div>`;
        grid.appendChild(card);
    });
}

function openDetails(item) {
    currentSeries = item;
    showPage('detail-page');
    document.getElementById('detail-img').src = item.poster;
    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-year').innerText = item.year;
    document.getElementById('detail-rating').innerText = `⭐ ${item.rating}`;
    document.getElementById('detail-type').innerText = item.type.toUpperCase();
    document.getElementById('detail-desc').innerText = item.desc;
    const genreContainer = document.getElementById('detail-genres');
    genreContainer.innerHTML = '';
    item.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'genre-pill';
        span.innerText = tag;
        span.onclick = () => setGenre(tag);
        genreContainer.appendChild(span);
    });
    document.getElementById('watch-btn').onclick = () => openSelection(item);
}

function openSelection(item) {
    showPage('selection-page');
    document.getElementById('series-title').innerText = item.title;
    const list = document.getElementById('chapter-list');
    list.innerHTML = '';
    Object.keys(item.content).forEach(chap => {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn';
        btn.innerText = chap;
        btn.onclick = () => openViewer(chap);
        list.appendChild(btn);
    });
}

function openViewer(chap) {
    showPage('viewer-page');
    document.getElementById('current-chapter-title').innerText = chap;
    const area = document.getElementById('content-area');
    area.innerHTML = '';
    const files = currentSeries.content[chap];
    if (currentSeries.type === 'anime') {
        const v = document.createElement('video');
        v.src = files[0]; v.controls = true; v.autoplay = true;
        area.appendChild(v);
    } else {
        if(currentSeries.type === 'webtoon') area.classList.add('webtoon-mode');
        else area.classList.remove('webtoon-mode');
        files.forEach(src => {
            const img = document.createElement('img');
            img.src = src; area.appendChild(img);
        });
    }
}

function renderFooterGenres() {
    const list = document.getElementById('genre-list');
    if (!list) return;
    const allTags = [];
    library.forEach(item => item.tags.forEach(t => { if(!allTags.includes(t)) allTags.push(t); }));
    allTags.sort().forEach(tag => {
        const li = document.createElement('li');
        li.innerText = tag;
        li.onclick = () => setGenre(tag);
        list.appendChild(li);
    });
}

window.onload = () => {
    renderGallery();
    renderFooterGenres();
};
