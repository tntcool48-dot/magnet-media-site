// Track what is currently on screen to prevent duplicates
let currentlyShownIds = [];

async function loadRandomReels() {
    try {
        const response = await fetch('videos.json');
        const allVideos = await response.json();

        // 1. Separate videos into "Fresh" (not shown) and "Stale" (currently shown)
        const freshVideos = allVideos.filter(vid => !currentlyShownIds.includes(vid.id));
        const staleVideos = allVideos.filter(vid => currentlyShownIds.includes(vid.id));

        // 2. Shuffle both lists individually
        // (Using a simple random sort)
        freshVideos.sort(() => 0.5 - Math.random());
        staleVideos.sort(() => 0.5 - Math.random());

        // 3. Create the new lineup
        // Priority: Use all fresh videos first. If we need more to fill 3 slots, grab from stale.
        let selection = [];
        
        if (freshVideos.length >= 3) {
            // Best case: We have enough new videos to completely refresh the feed
            selection = freshVideos.slice(0, 3);
        } else {
            // Fallback: We don't have enough new videos (e.g. only 5 total videos).
            // Use all the fresh ones, then fill the rest with stale ones.
            selection = freshVideos.concat(staleVideos.slice(0, 3 - freshVideos.length));
        }

        // 4. Save these IDs so we know what to avoid next time
        currentlyShownIds = selection.map(v => v.id);

        // 5. Update the HTML (Title Logic Removed)
        for (let i = 0; i < 3; i++) {
            if (selection[i]) {
                const container = document.getElementById(`slot-${i+1}`);
                
                // Clear previous iframe
                container.innerHTML = '';
                
                // Build Instagram Embed
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.instagram.com/p/${selection[i].id}/embed/captioned/`; 
                iframe.className = "reel-iframe";
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('allowtransparency', 'true');
                
                container.appendChild(iframe);
                
                // Note: We no longer look for or update 'rand-title'
            }
        }

    } catch (error) { 
        console.error("Error loading videos:", error); 
    }
}

/* === ADVANCED PLAYER MANAGER (Exclusive Play + Auto-Buttons) === */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Find all video wrappers (Hero excluded)
    const wrappers = document.querySelectorAll('.video-wrapper-clean');

    wrappers.forEach(wrapper => {
        const video = wrapper.querySelector('video');
        if (!video) return;

        // 2. Inject the Custom Play Button (So you don't have to edit HTML)
        const btn = document.createElement('div');
        btn.className = 'play-btn';
        btn.innerHTML = '▶'; // You can also use an SVG icon here if you want
        wrapper.appendChild(btn);

        // 3. Click Button -> Play Video
        btn.addEventListener('click', () => {
            video.play();
        });

        // 4. Logic: When video plays...
        video.addEventListener('play', () => {
            // Hide this button
            btn.classList.add('hidden');
            
            // PAUSE OTHERS (Exclusive Play)
            document.querySelectorAll('video').forEach(otherVid => {
                if (otherVid !== video && otherVid.id !== 'bg-video') {
                    otherVid.pause();
                }
            });
        });

        // 5. Logic: When video pauses...
        video.addEventListener('pause', () => {
            // Show the button again
            btn.classList.remove('hidden');
        });
        
        // 6. Click Video to Toggle (Optional Quality of Life)
        // If they click the video itself (not controls), toggle play/pause
        video.addEventListener('click', (e) => {
            // Don't trigger if they clicked the native controls at the bottom
            if (e.offsetY < video.offsetHeight - 50) { 
                if (video.paused) video.play();
                else video.pause();
            }
        });
    });
});

/* === LANGUAGE MANAGER === */
function toggleLanguage() {
    document.body.classList.toggle('arabic-mode');
    updateNavText();
    
    // Save preference so it remembers when they refresh
    const isArabic = document.body.classList.contains('arabic-mode');
    localStorage.setItem('preferredLang', isArabic ? 'ar' : 'en');
}

function updateNavText() {
    // Helper to flip the Navbar links since they aren't simple blocks
    const isArabic = document.body.classList.contains('arabic-mode');
    const links = document.querySelectorAll('.nav-links a');
    
    links.forEach(link => {
        if (isArabic) {
            if(link.dataset.ar) link.innerText = link.dataset.ar;
        } else {
            if(link.dataset.en) link.innerText = link.dataset.en;
        }
    });
}

// === AUTO-DETECT ON LOAD ===
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if they have a saved preference
    const saved = localStorage.getItem('preferredLang');
    
    // 2. Check if their browser is set to Arabic (e.g., 'ar', 'ar-JO', 'ar-SA')
    const browserLang = navigator.language || navigator.userLanguage;
    const isArabicBrowser = browserLang.startsWith('ar');

    // Logic: If saved is 'ar' OR (no save AND browser is arabic) -> Switch
    if (saved === 'ar' || (!saved && isArabicBrowser)) {
        document.body.classList.add('arabic-mode');
        updateNavText();
    }
});

/* === SMART NAVBAR LOGIC === */
let lastScrollY = window.scrollY;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // 1. Determine Direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // SCROLLING DOWN -> Hide Navbar
        navbar.classList.add('nav-hidden');
    } else {
        // SCROLLING UP -> Show Navbar
        navbar.classList.remove('nav-hidden');
    }

    // 2. Determine Background (Transparent at top, Solid otherwise)
    if (currentScrollY > 50) {
        navbar.classList.add('nav-solid');
        navbar.classList.remove('nav-transparent');
    } else {
        navbar.classList.remove('nav-solid');
        navbar.classList.add('nav-transparent');
    }

    lastScrollY = currentScrollY;
});


// Run immediately when page loads
window.onload = loadRandomReels;;