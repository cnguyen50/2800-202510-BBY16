function loadHeaderFooter() {
    // Header HTML with logo and responsive nav
    const header = `
        <header>
            <nav class="navbar">
                <a href="/" class="logo">
                    <img src="/img/Community_logo.png" alt="CommUnity logo" height="26" />
                    <span class="site-title">CommUnity</span>
                </a>
                <input type="checkbox" id="nav-toggle" class="nav-toggle" />
                <label for="nav-toggle" class="nav-toggle-label">&#9776;</label>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/login">Login</a></li>    
                </ul>
            </nav>
        </header>
    `;

    // Footer HTML
    const footer = `
        <footer>
            <p>&copy; ${new Date().getFullYear()} My Website</p>
        </footer>
    `;

    // Insert header and footer into the DOM
    document.body.insertAdjacentHTML('afterbegin', header);
    document.body.insertAdjacentHTML('beforeend', footer);
}

// Example usage: call this function on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter();
});
