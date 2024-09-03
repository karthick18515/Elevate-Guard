let map, placesService, directionsService, directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -33.8688, lng: 151.2093 },
        zoom: 13
    });

    placesService = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    document.getElementById('find-elevation').addEventListener('click', findHighElevation);
}

function findHighElevation() {
    const startLocation = document.getElementById('start').value;
    const searchRadius = parseFloat(document.getElementById('radius').value) * 1000;

    const request = {
        query: startLocation,
        fields: ['geometry'],
    };

    placesService.findPlaceFromQuery(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const startLatLng = results[0].geometry.location;
            map.setCenter(startLatLng);

            searchNearbyHighElevation(startLatLng, searchRadius);
        } else {
            alert('Location not found.');
        }
    });
}

function searchNearbyHighElevation(startLatLng, radius) {
    const circle = new google.maps.Circle({
        center: startLatLng,
        radius: radius
    });

    const bounds = circle.getBounds();

    const request = {
        location: startLatLng,
        radius: radius,
        type: ['establishment'],
    };

    placesService.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            let highestPlace = null;
            let highestElevation = -Infinity;

            results.forEach(function(place) {
                const placeLatLng = place.geometry.location;

                const elevationService = new google.maps.ElevationService();
                elevationService.getElevationForLocations({ 'locations': [placeLatLng] }, function(elevations, status) {
                    if (status === google.maps.ElevationStatus.OK && elevations[0]) {
                        const elevation = elevations[0].elevation;
                        if (elevation > highestElevation) {
                            highestElevation = elevation;
                            highestPlace = place;
                        }
                    }
                });
            });

            if (highestPlace) {
                setTimeout(() => {
                    map.setCenter(highestPlace.geometry.location);
                    displayDirections(startLatLng, highestPlace.geometry.location);
                }, 2000); // Delay to ensure elevations are calculated
            }
        } else {
            alert('No high elevation areas found within the radius.');
        }
    });
}

function displayDirections(startLatLng, destinationLatLng) {
    const request = {
        origin: startLatLng,
        destination: destinationLatLng,
        travelMode: 'DRIVING',
    };

    directionsService.route(request, function(result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            alert('Directions request failed due to ' + status);
        }
    });
}

window.onload = initMap;
