// /public/scripts/loadHeaderFooter.js

function loadHeaderFooter() {
    // Header HTML
    const header = `
        <header>
            <nav>
                <ul>
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
    // Replace 'false' with your actual login check
    loadHeaderFooter(false);
});