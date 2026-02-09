
const yesBtn = document.getElementById('yesBtn');
const yesExBtn = document.getElementById('yesExBtn');
const noBtn = document.getElementById('noBtn');
const messageDiv = document.getElementById('valentineMessage');
const container = document.querySelector('.container');
const choicesDiv = document.querySelector('.choices');

// capture base sizes from computed styles so growth is proportional
const yesComputed = window.getComputedStyle(yesBtn);
const containerComputed = container ? window.getComputedStyle(container) : null;
const choicesComputed = choicesDiv ? window.getComputedStyle(choicesDiv) : null;
const baseFontPx = parseFloat(yesComputed.fontSize) || 16;
const basePadY = parseFloat(yesComputed.paddingTop) || 12;
const basePadX = parseFloat(yesComputed.paddingLeft) || 24;
const baseContainerPadY = containerComputed ? parseFloat(containerComputed.paddingTop) || 32 : 32;
const baseContainerPadX = containerComputed ? parseFloat(containerComputed.paddingLeft) || 24 : 24;
const baseGap = choicesComputed && (choicesComputed.gap || choicesComputed.columnGap) ? parseFloat(choicesComputed.gap || choicesComputed.columnGap) : 16;
const baseMaxWidth = containerComputed && containerComputed.maxWidth !== 'none' ? parseFloat(containerComputed.maxWidth) || 400 : 400;
const questionP = document.querySelector('.valentine-question p');
const questionComputed = questionP ? window.getComputedStyle(questionP) : null;
const baseQuestionFontPx = questionComputed ? parseFloat(questionComputed.fontSize) || 20 : 20;


let enlargeScale = 1;

function resetButtonSizes() {
    // remove inline sizing so CSS returns to control
    enlargeScale = 1;
    yesBtn.style.fontSize = '';
    yesExBtn.style.fontSize = '';
    yesBtn.style.padding = '';
    yesExBtn.style.padding = '';
    // restore No button to default
    noBtn.classList.remove('small');
    noBtn.style.width = '';
    noBtn.style.height = '';
    noBtn.style.fontSize = '';
    noBtn.style.padding = '';
    if (container) {
        container.style.padding = '';
        container.style.maxWidth = '';
    }
    if (choicesDiv) choicesDiv.style.gap = '';
    if (questionP) questionP.style.fontSize = '';
}

yesBtn.addEventListener('click', function() {
    // go to success page
    window.location.href = 'valentine_success.html';
});

// --- Make collage images draggable (pointer events, works with mouse and touch) ---
const collageImgs = document.querySelectorAll('.collage img');
// Load saved positions (if any) so dragged images persist across reloads
function loadCollagePositions() {
    collageImgs.forEach(img => {
        const idClass = Array.from(img.classList).find(c => /^c\d+$/.test(c));
        if (!idClass) return;
        const raw = localStorage.getItem('collage-pos-' + idClass);
        if (!raw) return;
        try {
            const pos = JSON.parse(raw);
            if (typeof pos.left === 'number') img.style.left = pos.left + 'px';
            if (typeof pos.top === 'number') img.style.top = pos.top + 'px';
            img.style.right = '';
            img.style.bottom = '';
        } catch (e) {}
    });
}

loadCollagePositions();

collageImgs.forEach(img => {
    let dragging = false;
    let pointerId = null;
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;

    function toPx(val) { return parseFloat(val) || 0; }

    img.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        img.setPointerCapture(e.pointerId);
        pointerId = e.pointerId;
        dragging = true;
        img.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        // ensure inline left/top exist (absolute positioning)
        const rect = img.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
        img.style.left = origLeft + 'px';
        img.style.top = origTop + 'px';
        img.style.right = '';
        img.style.bottom = '';
        // raise z-index while dragging so it's visible
        img.dataset.zBefore = img.style.zIndex || '';
        img.style.zIndex = 9999;
    });

    img.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        img.style.left = (origLeft + dx) + 'px';
        img.style.top = (origTop + dy) + 'px';
    });

    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        if (pointerId != null && e && e.pointerId) img.releasePointerCapture(e.pointerId);
        img.classList.remove('dragging');
        // restore z-index if needed
        img.style.zIndex = img.dataset.zBefore || '';
        // persist final position to localStorage
        try {
            const idClass = Array.from(img.classList).find(c => /^c\d+$/.test(c));
            if (idClass) {
                const left = parseFloat(img.style.left) || 0;
                const top = parseFloat(img.style.top) || 0;
                localStorage.setItem('collage-pos-' + idClass, JSON.stringify({ left, top }));
            }
        } catch (e) {}
        pointerId = null;
    }

    img.addEventListener('pointerup', endDrag);
    img.addEventListener('pointercancel', endDrag);
});

yesExBtn.addEventListener('click', function() {
    // treat this as a non-final enthusiastic reply — do not navigate
    messageDiv.textContent = "It's a yes or no question! But I appreciate the enthusiasm 😄";
    messageDiv.classList.remove('hidden');
    resetButtonSizes();
});


noBtn.addEventListener('click', function() {
    // show wrong answer message, then enlarge the Yes buttons and the card (no navigation)
    messageDiv.textContent = "Wrong Answer!";
    messageDiv.classList.remove('hidden');
    enlargeScale += 0.15;
    const newFont = baseFontPx * enlargeScale;
    const newPadY = basePadY * enlargeScale;
    const newPadX = basePadX * enlargeScale;
    yesBtn.style.fontSize = newFont + 'px';
    yesExBtn.style.fontSize = newFont + 'px';
    yesBtn.style.padding = `${newPadY}px ${newPadX}px`;
    yesExBtn.style.padding = `${newPadY}px ${newPadX}px`;
    // scale container padding and max-width so card grows with buttons
    if (container) {
        container.style.padding = `${baseContainerPadY * enlargeScale}px ${baseContainerPadX * enlargeScale}px`;
        container.style.maxWidth = (baseMaxWidth * enlargeScale) + 'px';
    }
    if (choicesDiv) choicesDiv.style.gap = (baseGap * enlargeScale) + 'px';
    // scale the question text proportionally as well
    if (questionP) questionP.style.fontSize = (baseQuestionFontPx * enlargeScale) + 'px';
    // shrink No button into a small square while others are larger
    noBtn.classList.add('small');
    // make No button smaller proportionally as others grow
    const baseNo = 88; // matches CSS small width
    const newNo = Math.max(40, Math.round(baseNo / enlargeScale));
    noBtn.style.width = newNo + 'px';
    noBtn.style.height = newNo + 'px';
    // reduce font-size slightly for very small buttons
    noBtn.style.fontSize = (14 * Math.min(1, baseNo / newNo)) + 'px';
});
