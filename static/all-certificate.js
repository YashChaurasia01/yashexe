/* =========================================================
   PDF.js setup — renders PDF pages onto a <canvas> instead of
   relying on <embed>, because mobile browsers (Chrome Android,
   Safari iOS) refuse to render PDFs inline via <embed>.
   ========================================================= */
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* =========================================================
   CERTIFICATE DATA
   Add a new certificate by adding an object here:
   { title: "Name of certificate", file: "path/to/file", type: "image" | "pdf" }
   - type "image" works for .png, .jpg, .jpeg, .webp
   - type "pdf" works for .pdf files
   ========================================================= */
const certificates = [
    { title: "Flair Haven | Web Dev Workshop", file: "../static/img/horiz/h2.webp", type: "image" },
    { title: "University of Michigan | Python Basics", file: "../static/img/horiz/h5.webp", type: "image" },
    { title: "University of Michigan | Python Functions, Files and Dictionaries", file: "../static/img/horiz/h6.webp", type: "image" },
    { title: "University of Michigan | Data Collection and Processing with Python", file: "../static/img/horiz/h7.webp", type: "image" },
    { title: "University of Michigan | Python Classes and Inheritance", file: "../static/img/horiz/h8.webp", type: "image" },
    { title: "Scrimba | HTML & CSS Crash Course", file: "../static/img/horiz/h9.webp", type: "image" },
    { title: "Samatrix | Intro to Programming", file: "../static/img/horiz/h10.webp", type: "image" },
    { title: "Samatrix | Python", file: "../static/img/horiz/h11.webp", type: "image" },
    { title: "Samatrix | Natural Language Processing", file: "../static/img/horiz/q1.pdf", type: "pdf" },
    { title: "Samatrix | Data Science - Tools and Techniques", file: "../static/img/horiz/q2.pdf", type: "pdf" },
    { title: "Samatrix | Machine Learning & Pattern Recognition", file: "../static/img/horiz/q3.pdf", type: "pdf" },
    { title: "Samatrix | Deep Learning", file: "../static/img/horiz/q4.pdf", type: "pdf" },
    { title: "Samatrix | Data Visualization", file: "../static/img/horiz/q5.pdf", type: "pdf" },
    { title: "Samatrix | DevOps", file: "../static/img/horiz/q6.pdf", type: "pdf" },
    { title: "Samatrix | Deep Learning and Neural Networks", file: "../static/img/horiz/q7.pdf", type: "pdf" },
];

const grid = document.getElementById('certGrid');
const filtersWrap = document.getElementById('filters');
let activeFilter = 'all';

function iconForType(type) {
    return type === 'pdf' ? 'fa-file-pdf' : 'fa-file-image';
}

function buildPreview(cert) {
    if (cert.type === 'image') {
        return `<img src="${cert.file}" alt="${cert.title}" loading="lazy"
             onerror="this.closest('.cert-preview').innerHTML='<div class=&quot;pdf-fallback&quot;><i class=&quot;fa-solid fa-image-slash&quot;></i><span>Preview unavailable</span></div>'">`;
    }
    // PDF preview: rendered as a real bitmap via PDF.js instead of <embed>,
    // because mobile browsers refuse to render PDFs inline via <embed>.
    return `<canvas class="pdf-canvas"></canvas>
          <div class="pdf-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
}

function renderGrid() {
    const list = certificates.filter(c => activeFilter === 'all' || c.type === activeFilter);

    if (!list.length) {
        grid.innerHTML = `<div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <p>No certificates in this category yet.</p>
      </div>`;
        return;
    }

    grid.innerHTML = list.map((cert, i) => `
    <article class="cert-card" data-index="${certificates.indexOf(cert)}">
      <div class="cert-preview">
        ${buildPreview(cert)}
        <span class="cert-badge"><i class="fa-solid ${iconForType(cert.type)}"></i> ${cert.type}</span>
        <div class="expand-hint"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></div>
      </div>
      <div class="cert-info">
        <h3>${cert.title}</h3>
        <a class="cert-link" href="${cert.file}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
          View full file <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    </article>
  `).join('');

    grid.querySelectorAll('.cert-card').forEach(card => {
        const cert = certificates[+card.dataset.index];
        card.addEventListener('click', () => openModal(cert));
        if (cert.type === 'pdf') {
            renderPdfThumbnail(cert.file, card.querySelector('.pdf-canvas'), card.querySelector('.pdf-loading'));
        }
    });
}

/* Renders page 1 of a PDF onto a <canvas> — identical on desktop and
   mobile, unlike <embed>, which mobile browsers won't render inline. */
async function renderPdfThumbnail(url, canvas, loadingEl) {
    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 }); // 2x for sharpness; CSS fits it to the card
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        loadingEl?.remove();
    } catch (err) {
        console.error('PDF thumbnail failed:', err);
        canvas.closest('.cert-preview').innerHTML =
            `<div class="pdf-fallback"><i class="fa-solid fa-file-pdf"></i><span>Preview unavailable</span></div>`;
    }
}

filtersWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filtersWrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderGrid();
});

/* ===================== MODAL ===================== */
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalOpenFull = document.getElementById('modalOpenFull');
const modalClose = document.getElementById('modalClose');

function openModal(cert) {
    modalTitle.textContent = cert.title;
    modalOpenFull.href = cert.file;

    if (cert.type === 'image') {
        modalBody.innerHTML = `<img src="${cert.file}" alt="${cert.title}">`;
    } else {
        modalBody.innerHTML = `<canvas class="pdf-canvas"></canvas>
            <div class="pdf-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>`;
        renderPdfThumbnail(cert.file, modalBody.querySelector('.pdf-canvas'), modalBody.querySelector('.pdf-loading'));
    }

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { modalBody.innerHTML = ''; }, 300);
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ===================== THEME TOGGLE ===================== */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

function applyTheme(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

renderGrid();