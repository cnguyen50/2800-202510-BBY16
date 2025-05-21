console.log("testing from inside map.js");

document.addEventListener('DOMContentLoaded', () => {
    //Init map inside div id='map'
    const map = L.map('map').setView(
        [49.2827, -123.1207], //set to Vancouver coords
        10 //zoom level
    )
    const listContainer = document.getElementById('event-list');

    //Load and display tile layers on the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);
    
    //Toggle control
    const clusterGroup = L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        showCoverageOnHover: false
    });

    clusterGroup.on('clusterclick', e => {
        map.fitBounds(e.layer.getBounds())
    })

    const nearbyGroup = L.layerGroup({
        zoomToBoundsOnClick: true,
        showCoverageOnHover: false
    });

    nearbyGroup.on('clusterclick', e => {
        map.fitBounds(e.layer.getBounds())
    })

    const clusterBtn = document.getElementById('toggle-cluster');
    const nearbyBtn = document.getElementById('toggle-near');

    let nearbyEvents = [];
    let allEvents = [];

    //Custom BootStrap icon for user's location
    const userIcon = L.divIcon({
        className: "",
        html: `<i class="bi bi-geo-alt-fill text-danger" style="font-size: 2rem;"></i>`,
        iconAnchor: [16, 32]
    });

    function shortLoc(location) {
        const parts = location.split(',').map(s => s.trim());
        return parts.length >= 3 ? 
            `${parts[0]}, ${parts[2]}`
            : location;
    }

    function addEvent(e, group) {
        const date = new Date(e.event_date);
        const formattedDate = date.toLocaleDateString('en-CA', {
            month:'long',
            day:'numeric',
            year:'numeric'
        });
        const location = shortLoc(e.location);

        const eventInfoHTML = `
            <strong>${e.event_name}</strong><br>
            <span>${location}</span><br>
            <a href="#" class="details-link" data-id="${e._id}">See More Details</a>
        `

        const marker = L.marker([e.lat, e.lng])
            .addTo(map)
            .bindPopup(eventInfoHTML);
    
        marker.on('popupopen', () => {
            const link = document.querySelector('.details-link');
            if (!link) return;
    
            link.addEventListener('click', (evt) => {
                evt.preventDefault();
                const id = evt.target.dataset.id;
                const card = document.querySelector(`#event-list .card[data-id="${id}"]`);
    
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 2000);
                }
            }, { once: true });
        });
    
        group.addLayer(marker);
    
        const card = document.createElement('div');
        card.className = 'card mb-2';
        card.dataset.id = e._id;
        card.innerHTML = `
            <div class="card-body">
            <h5 class="card-title">${e.event_name}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${formattedDate}</h6>
            <p class="card-text">${location}</p>
            <p class="card-text">${e.description || ''}</p>
            </div>
        `;
    
        listContainer.appendChild(card);
    }

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
                nearbyEvents = await mapDataRes.json();

                const allRes = await fetch('/events', { credentials: 'include' });
                if (!allRes.ok) throw new Error(await allRes.text());
                allEvents = await allRes.json();

                //add only if lat/lng are numbers
                nearbyEvents.forEach(e => {
                    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                        addEvent(e, nearbyGroup);
                    }
                });

                allEvents.forEach(e => {
                    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                        addEvent(e, clusterGroup);
                    }
                });

                // Start in nearby view
                map.addLayer(nearbyGroup);

                clusterBtn.addEventListener('click', () => {
                    map.removeLayer(nearbyGroup);
                    map.addLayer(clusterGroup);
                    map.setView([49.2827, -123.1207], 10);
                    listContainer.innerHTML = '';

                    allEvents.forEach(e => {
                        if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                            addEvent(e, clusterGroup);
                        }
                    });
                });
                
                nearbyBtn.addEventListener('click', () => {
                    map.removeLayer(clusterGroup);
                    map.addLayer(nearbyGroup);
                    map.setView([latitude, longitude], 15);
                    listContainer.innerHTML = '';

                    nearbyEvents.forEach(e => {
                        if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                            addEvent(e, nearbyGroup);
                        }
                    });
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