
const routeLayerModule = (() => {
    let _stopLayer, _pathLayer, _map;
    let _stopLayerMap = {};

    // const fitBounds = (map) => {
    //     map.fitBounds(routeBBox);
    // };

    const getStopMarker = stop => _stopLayer.getLayer(_stopLayerMap[stop]);

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
            }).bindPopup("<p>"+s.title+"</p>");

            stopMarker.stop = s;
            stopMarker.on("click", e => {
                //console.log(e.target.stop);
            });
            _stopLayer.addLayer(stopMarker);
            _stopLayerMap[s.tag] = _stopLayer.getLayerId(stopMarker);
        });

        // let routeBBox = [
        //   [data.route.latMin, data.route.lonMin],
        //   [data.route.latMax, data.route.lonMax]
        // ];
        // _map.fitBounds(routeBBox);

        _map.fitBounds([
            [data.route.latMin, data.route.lonMin],
            [data.route.latMax, data.route.lonMax]
        ]);
    };

    const init = (stopLayer, pathLayer, agency, routeId, map) => {
        _stopLayer = stopLayer;
        _pathLayer = pathLayer;
        _map = map;
        _stopLayer.clearLayers();
        _pathLayer.clearLayers();
        fetchData(agency, routeId);
    };

    const fetchData = (agency, routeId) => {
        fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=${agency}&r=${routeId}`
        ).then(function (response) {
            if (response.status !== 200) {
                console.log(
                    "Looks like there was a problem. Status Code: " + response.status
                );
                return;
            }
            response.json().then(processData);
        });
    };

    return { getStopMarker, init };
})()

export { routeLayerModule };