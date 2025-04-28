mapboxgl.accessToken = 'pk.eyJ1IjoibWFrZmF1YiIsImEiOiJjbTg2ZHBoODMwM2NtMm1xMnlmYXgzbTJuIn0.Q3Knt4QC1wNxRg0wGCc0Mw';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    center: [-105.265761, 40.006117], // starting [lng, lat] of CU Boulder
    zoom: 15.5 // starting zoom
});

const mapMarkers = [];

const events = window.geoEvents;

map.on('load', () => {
    console.log("Map has loaded"); // ← Add this
    map.addSource('places', {
        'type': 'geojson',
        'data': {
            type: 'FeatureCollection',
            features: []
        },
        dynamic: true
    });
    addMarkers(events);
});

function clearMarkers() {
    mapMarkers.every((marker) => marker.remove());
}

function addMarkers(events) {
    clearMarkers();

    map.getSource('places').setData(events);

    const usedCoords = new Set()
    /* For each feature in the GeoJSON object above: */
    for (const marker of events.features) {
        console.log("Creating marker for:", marker);

        let [lng, lat] = marker.geometry.coordinates;
        let coordKey = `${lng},${lat}`;
        
        let attempts = 0;
        while (usedCoords.has(coordKey) && attempts < 10){
            const offset = 0.0007;
            lng += (Math.random() - 0.5) * offset;
            lat += (Math.random() - 0.5) * offset;
            coordKey = `${lng},${lat}`;
            attempts++;
        }
        usedCoords.add(coordKey);

        const el = document.createElement('div');
        el.id = `marker-${marker.properties.eventID}`;
        el.className = 'marker';
        
        // color pins by category
        const categoryID = marker.properties.categoryID;
        console.log(categoryID);
        el.classList.add(`category-${categoryID}`);
        if (!categoryID) {
            el.classList.add('category-unknown');
        }
        
        el.innerHTML = '<i class="fa-solid fa-location-dot"></i>'

        // Click event listener
        el.addEventListener('click', () => {
            //console.log("Clicked marker for eventid:", marker.properties.eventID); //debug

            flyToEvent(marker);
            createPopUp(marker);

            const activeItem = document.querySelector('.sidebar-item.active');
            if (activeItem) activeItem.classList.remove('active');

            const target = document.querySelector(`#sidebar-item-${marker.properties.eventID}`);
            const sidebarContainer = document.querySelector('.sidebar-scroll-container');

            //Stop the zoom and scroll from scrolling the whole page down
            if (target && sidebarContainer) {
                
                const top = target.offsetTop - sidebarContainer.offsetTop;
                sidebarContainer.scrollTo({
                    top,
                    behavior: 'smooth'
                });

                target.classList.add('active');
            }

        });
        
        /**
        * Create a marker using the div element
        * defined above and add it to the map.
        **/
        const newMapMarker = new mapboxgl.Marker(el, { offset: [0, -23] })
            .setLngLat([lng, lat])
            .addTo(map);
        
        mapMarkers.push(newMapMarker);
    }
}

function flyToEvent(currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 17
    });
}

function createPopUp(currentFeature) {
    const popUps = document.getElementsByClassName('mapboxgl-popup');
    if (popUps[0]) popUps[0].remove();

    const { buildingName, roomNumber } = currentFeature.properties;

    const popupHTML = `
        <div>
            <strong>${buildingName || 'Unknown Building'}</strong>
            <div class="popup-room">Room: ${roomNumber || 'N/A'}</div>
        </div>
    `;

    const popup = new mapboxgl.Popup({ closeOnClick: false })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(popupHTML)
        .addTo(map);
}

// make global
window.clearMarkers = clearMarkers;
window.addMarkers = addMarkers;
