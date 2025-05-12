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
  // Remove asterisks
  const noAsterisks = response.replace(/\*/g, '');

  // Split the response into parts
  const parts = noAsterisks.split(/\d+\.\s*/);

  // Remove empty strings and trim whitespace
  // Retrieve title and items
  const title = parts[0].trim();
  const items = parts.slice(1).map((item,i) =>`${i + 1}. ${item.trim()}`);

  return {title, items};
}