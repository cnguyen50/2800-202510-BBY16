console.log("testing from inside map.js");

document.addEventListener('DOMContentLoaded', () => {
    //Init map inside div id='map'
    const map = L.map('map').setView(
        [49.2827, -123.1207], //set to Vancouver coords
        10 //zoom level
    )

      // 2) Load and display tile layers on the map. Requires attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
})