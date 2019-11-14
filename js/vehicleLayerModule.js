
const vehicleLayerModule = (() => {
    let _vehicleLayer, _intervalId;
    const busIcon = L.divIcon({
        className: "fa fa-bus",
        iconAnchor: [12, 13]
    });
    const navIcon = L.divIcon({
        className: "fa fa-map-marker",
        iconAnchor: [13, 15]
    });

    const forEachArrayOrObject = (aoo, func) => {
        if (Array.isArray(aoo)) {
            aoo.forEach(func);
        } else {
            func(aoo);
        }
    }

    const startInterval = (vehicleLayer, agency, routeId) => {
        _vehicleLayer = vehicleLayer;
        stopInterval();
        getVehicleLocations(agency, routeId);
        _intervalId = setInterval(getVehicleLocations, 10000, agency, routeId);
    };

    const stopInterval = () => {
        if (_intervalId)
            clearInterval(_intervalId);
    };

    const getVehicleLocations = (agency, routeId) => {
        let epochTime = Math.floor(Date.now() / 1000);
        fetchData(agency, routeId, epochTime);
    };

    const processData = (data) => {
        _vehicleLayer.clearLayers();
        if (!("vehicle" in data))
            return;

        forEachArrayOrObject(data.vehicle, s => {
            if (s.dirTag === undefined)
                return;
            let popupText = s.dirTag.split("_").pop();

            _vehicleLayer.addLayer(
                L.marker([s.lat, s.lon], {
                    icon: navIcon,
                    rotationAngle: 180 + Number(s.heading)
                })
            );
            _vehicleLayer.addLayer(
                L.marker([s.lat, s.lon], { icon: busIcon })
                    .bindPopup(popupText)
            );
        });
    };

    const fetchData = (agency, routeId, epochTime) => {
        fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=${agency}&r=${routeId}&t=${epochTime}`
        ).then(response => {
            if (response.status !== 200) {
                console.log("Looks like there was a problem. Status Code: " + response.status);
                return;
            }
            response.json().then(processData);
        })
    };

    return { startInterval, stopInterval };
})();

export { vehicleLayerModule };