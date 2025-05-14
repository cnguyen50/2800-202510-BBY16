
const listEl = document.getElementById('notif-list');
const socket = io('/');

/* ---------- helpers ---------- */
function render(n) {
const li   = document.createElement('li');
li.dataset.id = n._id;
li.className  = n.read ? '' : 'unread';

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
switch (n.type) {
    case 'comment'       : return '💬 Someone commented on your post';
    case 'event-reminder': return `⏰ Your event “${n.data.title}” starts in 1 h`;
    case 'poll-reminder' : return `⏰ Poll “${n.data.title}” closes in 1 h`;
    default              : return n.type;
}
}

async function markRead(li, tick) {
if (!li.classList.contains('unread')) return;      // already read
li.classList.remove('unread');
tick.classList.add('done');
try {
    await fetch(`/api/notifications/${li.dataset.id}/read`, { method:'PATCH' });
} catch (_) { console.warn('Failed to mark read'); }
}

/* ---------- bootstrap ---------- */
fetch('/api/notifications')
.then(r => r.json())
.then(arr => arr.forEach(render));

/* ---------- realtime ---------- */
socket.on('notification', n => render(n));
