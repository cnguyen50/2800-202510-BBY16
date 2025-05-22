document.addEventListener('DOMContentLoaded', () => {
    const svgIcons = document.querySelectorAll(".svg-icon");

    svgIcons.forEach(icon => {
        icon.style.top = Math.floor(Math.random() * 90) + "vh"; 
        icon.style.left = Math.floor(Math.random() * 90) + "vw";
        icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    });

    //Init map inside div id='map'
    const map = L.map('map').setView(
        [49.2827, -123.1207], //set to Vancouver coords
        10 //zoom level
    )

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

    clusterBtn.classList.remove('active');
    nearbyBtn .classList.remove('active');

    let nearbyEvents = [];
    let allEvents = [];

    //Custom leaflet icon for user's location
    const userIcon = new L.Icon({
        iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    function shortLoc(location) {
        const parts = location.split(',').map(s => s.trim());
        if (parts.length >= 4) {
            return `${parts[0]}, ${parts[1]}, ${parts[3]}`;
        } else if (parts.length >= 2) {
            return `${parts[0]}, ${parts[1]}`;
        }
        return location;
    }

    function addEvent(e, group) {
        const date = new Date(e.event_date);
        const formattedDate = date.toLocaleDateString('en-CA', {
            month:'long',
            day:'numeric',
            year:'numeric'
        });
        const location = shortLoc(e.location);

        // <strong>${e.event_name}</strong><br>
        // <span>${location}</span><br>
        // <a href="#" class="details-link" data-id="${e._id}">See More Details</a>
        const eventInfoHTML = `
            <div class="event-popup">
                <h3 class="event-popup__title">${e.event_name}</h3>
                <p class="event-popup__loc">${shortLoc(e.location)}</p>
                <a href="#" class="event-popup__link" data-id="${e._id}">See More Details</a>
            </div>
        `

        const marker = L.marker([e.lat, e.lng])
            .addTo(map)
            .bindPopup(eventInfoHTML, {
                className: 'custom-event-popup'
            });
    
        marker.on('popupopen', (evt) => {
            // Grabbing the just opened popup element
            const popupEl = evt.popup.getElement();
            const link = popupEl.querySelector('.event-popup__link');
            if (!link) return;
    
            link.addEventListener('click', (clickEvt) => {
                clickEvt.preventDefault();
                const id = clickEvt.target.dataset.id;
                const cardWrapper = document.querySelector(`.event-col[data-id="${id}"]`);
                const card = document.querySelector(`#event-list .card[data-id="${id}"]`);
    
                //checks if wrapper is shown in your current filter
                if (clusterBtn.classList.contains('active')) {
                    // all events view
                    document.querySelectorAll('.event-col')
                    .forEach(c => c.style.display = '');
                } else {
                    // nearby view, hide everything then show this one
                    document.querySelectorAll('.event-col')
                    .forEach(c => c.style.display = 'none');
                    if (cardWrapper) cardWrapper.style.display = '';
                }
                
                setTimeout(() => {
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        card.classList.add('highlight');
                        setTimeout(() => card.classList.remove('highlight'), 2000);
                    }
                }, 50);

            }, { once: true });
        });
    
        group.addLayer(marker);
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
            map.setView([latitude, longitude], 13);

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

                //Update the div with id=location-info
                document.getElementById('location-info').textContent =
                `📍 Current Location: ${neighbourhood} | ${city}, ${region}`;

            } catch (err) {
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

                // hide all cards
                document.querySelectorAll('.event-col').forEach(c => c.style.display = 'none');

                //then un-hide only the ones in nearbyEvents
                nearbyEvents.forEach(e => {
                    const col = document.querySelector(`.event-col[data-id="${e._id}"]`);
                    if (col) col.style.display = '';
                });

                allEvents.forEach(e => {
                    if (typeof e.lat === 'number' && typeof e.lng === 'number') {
                        addEvent(e, clusterGroup);
                    }
                });

                //Made the nearby button active by default
                nearbyBtn.classList.add('active');
                clusterBtn.classList.remove('active');

                // Start by adding nearby view
                map.addLayer(nearbyGroup);

                clusterBtn.addEventListener('click', () => {
                    map.removeLayer(nearbyGroup);
                    map.addLayer(clusterGroup);
                    map.setView([49.2827, -123.1207], 10);

                    document.querySelectorAll('.event-col').forEach(col => col.style.display = '');

                    // toggle button styles 
                    clusterBtn.classList.add('active');
                    nearbyBtn.classList.remove('active');
                });
                
                nearbyBtn.addEventListener('click', () => {
                    map.removeLayer(clusterGroup);
                    map.addLayer(nearbyGroup);
                    map.setView([latitude, longitude], 14);

                    document.querySelectorAll('.event-col').forEach(col => col.style.display = 'none');
                    
                    nearbyEvents.forEach(e => {
                        const col = document.querySelector(`.event-col[data-id="${e._id}"]`);
                        if (col) col.style.display = '';
                    });

                    // toggle button styles 
                    nearbyBtn.classList.add('active');
                    clusterBtn.classList.remove('active');
                });

            } catch (err) {
                console.error('Could not load neighbourhood events', err);
            }
        },

        //Error callback
        (err) => {
            document.getElementById('location-info').textContent =
            'Location unavailable';
        }
    )
})