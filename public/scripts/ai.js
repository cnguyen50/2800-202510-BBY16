document.getElementById('ai-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const spinner = document.getElementById('spinner');
  const titleHeader = document.getElementById('ai-title');
  const list = document.getElementById('ai-list');

  spinner.style.display = 'block';
  titleHeader.style.display = 'none';
  list.style.display = 'none';

  try {
    const location = await getLocationData();
    const res = await fetch('/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: location.latitude, longitude: location.longitude, neighbourhood: location.neighbourhood, city: location.city })
    });


    const data = await res.json();
    console.log(data);
    const { title, items } = formatResponse(data.message);

    console.log(title);
    items.forEach(item => console.log(item));

    const titleHeader = document.getElementById('ai-title');
    const list = document.getElementById('ai-list');

    titleHeader.textContent = title;

    list.innerHTML = ''; // Clear existing list items
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    titleHeader.style.display = 'block';
    list.style.display = 'block';
  } catch (err) {
    console.error('Location or AI request failed:', err);
    document.getElementById('ai-response').textContent = 'Could not determine your location.';
  } finally {
    spinner.style.display = 'none';
  }
});

function formatResponse(response) {
  // 1. Normalise line-breaks & remove asterisks
  const lines = response
    .replace(/\*/g, '')           // no Markdown bullets
    .replace(/\r\n/g, '\n')       // Windows → Unix line-feeds
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);             // drop empty lines

  // 2. First line = title
  const title = lines.shift();

  // 3. Everything else = list items (lines starting with "-" or "N.")
  const items = lines
    .filter(l => /^[-•\u2022]|\d+\./.test(l))
    .map(l =>
      l.replace(/^[-•\u2022]\s*|\d+\.\s*/, '')  // strip bullet / number
    )
    .map((text, i) => `${i + 1}. ${text}`);     // add clean numbering

  return { title, items };
}

