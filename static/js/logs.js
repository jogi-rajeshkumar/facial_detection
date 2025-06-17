
// static/js/logs.js
console.log("Logs page loaded.");
document.querySelectorAll('.thumbnail').forEach((thumb) => {
    thumb.addEventListener('click', () => {
        const meta = thumb.querySelector('.metadata');
        if (meta) {
            meta.style.display = meta.style.display === 'none' ? 'block' : 'none';
        }
    });
});
