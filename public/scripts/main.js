document.addEventListener("DOMContentLoaded", () => {
    fetch("../text/nav.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("navPlaceholder").innerHTML += data;
      })
      .catch(err => console.error("Error loading nav:", err));
});