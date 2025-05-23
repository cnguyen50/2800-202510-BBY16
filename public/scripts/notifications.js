//note: ai assistance was used here, particularly to handle the socket instance

// ---------- SVG background positioning ----------
document.addEventListener("DOMContentLoaded", () => {
    const svgIcons = document.querySelectorAll(".bg-svg-icon");
    svgIcons.forEach(icon => {
        icon.style.top = Math.floor(Math.random() * 90) + "vh";
        icon.style.left = Math.floor(Math.random() * 90) + "vw";
        icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    });
});

const listEl = document.getElementById('notif-list');
const socket = io('/');

/* ---------- helpers ---------- */
function render(n) {
    const li = document.createElement('li');
    li.dataset.id = n._id;
    li.className = n.read ? '' : 'unread';

    /* ✓-icon element */
    const tick = document.createElement('span');
    tick.className = 'check' + (n.read ? ' done' : '');
    tick.textContent = '✓';
    tick.title = 'Mark as read';
    tick.onclick = () => markRead(li, tick);

    /* message body */
    const body = document.createElement('div');
    body.innerHTML =
        `<div>${humanText(n)}</div>
    <small>${new Date(n.created_at).toLocaleString()}</small>`;

    li.append(tick, body);
    listEl.prepend(li);
}

function humanText(n) {
    const who = n.data?.from_username || 'Someone';
    switch (n.type) {
        case 'comment': return `💬 ${who} commented on your post`;
        case 'event-reminder': return `⏰ Your event “${n.data.title}” starts in 1 h`;
        case 'poll-reminder': return `⏰ Poll “${n.data.title}” closes in 1 h`;
        default: return n.type;
    }
}

async function markRead(li, tick) {
    if (!li.classList.contains('unread')) return;      // already read
    li.classList.remove('unread');
    tick.classList.add('done');
    try {
        await fetch(`/api/notifications/${li.dataset.id}/read`, { method: 'PATCH' });
    } catch (_) { console.warn('Failed to mark read'); }
}

/* ---------- bootstrap ---------- */
fetch('/api/notifications')
    .then(r => r.json())
    .then(arr => arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach(render));

/* ---------- realtime ---------- */
socket.on('notification', n => render(n));
