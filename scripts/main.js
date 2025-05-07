window.onload = async function() {
    try {
        const response = await fetch('/news'); // Get the news data from backend
        const newsData = await response.json(); // Parse JSON data
        
        displayNews(newsData); // Call function to render the news on the page
    } catch (error) {
        console.error('Error fetching news data:', error);
    }
};

// Function to render the news on the page
function displayNews(news) {
    const newsContainer = document.getElementById('news-container'); // The div where you want to display news

    news.forEach(item => {
        const newsPost = document.createElement('div');
        newsPost.classList.add('news-post'); // Add a class for styling

        // Create HTML structure for each news post
        newsPost.innerHTML = `
            <h2>${item.title}</h2>
            <p>${item.body}</p>
            <img src="${item.image_url}" alt="${item.title}" />
            <p><strong>Neighborhood:</strong> ${item.neighborhood}</p>
            <p><strong>Posted on:</strong> ${new Date(item.created_at).toLocaleDateString()}</p>
        `;

        // Append each news post to the news container
        newsContainer.appendChild(newsPost);
    });
}