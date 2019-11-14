
const routeLayerModule = (() => {
    let _stopLayer, _pathLayer, _routeBBox;
    let _stopLayerMap = {};
    let _directionStops;

    const getStopMarker = stop => _stopLayer.getLayer(_stopLayerMap[stop]);
    const getDirectionStops = () => _directionStops;

    const processData = (data) => {

        let routePath = data.route.path.map(path => path.point.map(
            p => [p.lat, p.lon])
        );
        _pathLayer.addLayer(
            L.polyline(routePath, {
                //color: "#"+data.route.color,
                color: "#2f73ac",
                width: 3
            })
        );

        data.route.stop.forEach(s => {
            let stopMarker = L.circleMarker([s.lat, s.lon], {
                color: "#2f73ac",
                weight: 2,
                fillColor: "white",
                fillOpacity: 1,
                radius: 5
            }).bindPopup("<p>" + s.title + "</p>");

            stopMarker.stop = s;
            stopMarker.on("click", e => {
            });
            _stopLayer.addLayer(stopMarker);
            _stopLayerMap[s.tag] = _stopLayer.getLayerId(stopMarker);
        });

        _routeBBox = [
            [data.route.latMin, data.route.lonMin],
            [data.route.latMax, data.route.lonMax]
        ];

        _directionStops = data.route.direction.map(dir =>
            dir.stop.map(s => s.tag)
        );

        return Promise.resolve({
            "routeBBox": _routeBBox,
            "directionStops": _directionStops
        });
    };

    const init = (stopLayer, pathLayer, agency, routeId) => {
        _stopLayer = stopLayer;
        _pathLayer = pathLayer;
        _stopLayer.clearLayers();
        _pathLayer.clearLayers();
        return fetchData(agency, routeId);
    };

    const fetchData = (agency, routeId) => {
        return fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=${agency}&r=${routeId}`
        ).then(response => {
            if (response.status !== 200) {
                console.log(
                    "Looks like there was a problem. Status Code: " + response.status
                );
                return;
            }
            return response.json().then(processData);
        });
    };

    return { getStopMarker, init, getDirectionStops };
})()

export { routeLayerModule };