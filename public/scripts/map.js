console.log("testing from inside map.js");

document.addEventListener('DOMContentLoaded', () => {
    //Init map inside div id='map'
    const map = L.map('map').setView(
        [49.2827, -123.1207], //set to Vancouver coords
        10 //zoom level
    )

      // 2) Load and display tile layers on the map. Requires attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    //Checking geolocation service is supported by browser
    if (!navigator.geolocation) {
        document.getElementById('location-info').textContent = 'Geolocation not supported';
        return;
    }

    //Requesting user's position
    navigator.geolocation.getCurrentPosition(
        //on success callback
        async ({ coords }) => {
            const { latitude, longitude } = coords;

            //Re-center the map to user's current position
            map.setView([latitude, longitude], 15);

            //Drop a pin on user's current location
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup("📍 You're Here!!")
                .openPopup();
        },

        //Error callback
        (err) => {
            console.log("Error: ", err);
            document.getElementById('location-info').textContent =
            'Location unavailable';
        }
    )
})