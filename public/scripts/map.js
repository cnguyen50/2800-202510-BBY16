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
    
    //Custom BootStrap icon for user's location
    const userIcon = L.divIcon({
    className: "",
    html: `<i class="bi bi-geo-alt-fill text-danger" style="font-size: 2rem;"></i>`,
    iconAnchor: [16, 32]
    });

    //Requesting user's position
    navigator.geolocation.getCurrentPosition(
        //on success callback
        async ({ coords }) => {
            const { latitude, longitude } = coords;

            //Re-center the map to user's current position
            map.setView([latitude, longitude], 15);

            //Drop a pin on user's current location with a popup
            L.marker([latitude, longitude], {icon: userIcon})
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
                    new URLSearchParams({
                        format: 'json',
                        lat: latitude,
                        lon: longitude,
                        addressdetails: 1, // need to access the address elementss
                        zoom: 14 // neighbourhood zoom level
                });

                //Fetching neighbourhood info
                const nomRes = await fetch(nomURL);
                const nomResData = await nomRes.json();

                // Extracted neighbourhood from address object
                const address = nomResData.address || "Can't find address";
                const currentNeighbourhood = address.neighbourhood || 'Unknown';

                //Update the div with id=location-info
                document.getElementById('location-info').textContent =
                `📍 ${city}, ${region} | Your Neighbourhood: ${neighbourhood} | Your Current Neighbourhood: ${currentNeighbourhood}`;

            } catch (err) {
                console.log('Location info fetch error:', err);
                document.getElementById('location-info').textContent = 'Could not load location info';
            }

            //Fetch and render neighbourhood events
            try {
                const mapDataRes = await fetch('/map/data', { credentials: 'include' });
                if (!mapDataRes.ok) throw new Error(await mapDataRes.text());
                const events = await mapDataRes.json();


                events.forEach(e => {
                    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                        // parsing date
                        const date = new Date(e.event_date);

                        // Parsed location to be shorter
                        const parts = e.location.split(',').map(s => s.trim());
                        const foramttedLoc = parts.length >= 3
                            ? `${parts[0]}, ${parts[2]}`
                            : e.location;

                        const formattedDate = date.toLocaleDateString('en-CA', {
                            month: 'long',
                            day:   'numeric',
                            year:  'numeric'
                        });

                        const eventInfoHTML = `
                            <strong>${e.event_name}</strong><br>
                            <span>${foramttedLoc}</span><br>
                            <span>${formattedDate}</span><br>
                            <em>${e.description || ''}</em>
                        `

                        L.marker([e.lat, e.lng])
                        .addTo(map)
                        .bindPopup(eventInfoHTML);
                    }
                });
            } catch (err) {
                console.error('Could not load neighbourhood events', err);
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