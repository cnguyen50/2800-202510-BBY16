console.log("testing from inside map.js");

document.addEventListener('DOMContentLoaded', () => {
    //Init map inside div id='map'
    const map = L.map('map').setView(
        [49.2827, -123.1207], //set to Vancouver coords
        10 //zoom level
    )

      //Load and display tile layers on the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

            //Drop a pin on user's current location with a popup
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup("📍 You're Here!!")
                .openPopup();

            //fetching and display location info (city, region and current neighbourhood)
            try {
                // Fetching city and region with IP-API
                const ipRes = await fetch('https://ipapi.co/json/');
                const { city, region } = await ipRes.json();

                //Fetching users static neighbourhood value from login form
                const meRes = await fetch('/users/me', { credentials: 'include' });
                const { neighbourhood } = await meRes.json();
                
                //Reverse geocoded to get current neighbourhood with Nominatim as per documentation
                const nomURL = 'https://nominatim.openstreetmap.org/reverse?' +
                    newURLSearchParams({
                        format: 'json',
                        lat: latitude,
                        lon: longitude,
                        addressdetails: 1, // need to access the address elementss
                        zoom: 14 // neighbourhood zoom level
                })

                //Update the div with id=location-info
                document.getElementById('location-info').textContent =
                `📍 ${city}, ${region} — Your Neighbourhood: ${neighbourhood}`;

            } catch (err) {
                console.log('Location info fetch error:', err);
                document.getElementById('location-info').textContent = 'Could not load location info';
            }
        },

        //Error callback
        (err) => {
            console.log("Error: ", err);
            document.getElementById('location-info').textContent =
            'Location unavailable';
        }
    )
})