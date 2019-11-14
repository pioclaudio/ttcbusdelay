import { vehicleLayerModule } from "./vehicleLayerModule.js";
import { routeLayerModule } from "./routeLayerModule.js";
import { delayProcessorModule } from "./delayProcessorModule.js";


const routeListModule = (() => {
    let _stopLayer, _pathLayer, _vehicleLayer, _colorList, _map;
    let _agency = 'ttc';
    let _routeId;
    const init = (stopLayer, pathLayer, vehicleLayer, map, colorList) => {
        _stopLayer = stopLayer;
        _pathLayer = pathLayer;
        _vehicleLayer = vehicleLayer;
        //_agency = agency;
        _colorList = colorList;
        _map = map;

        fetchData(_agency);
    }

    const processData = (data) => {
        let select = document.getElementById("routeSelect");
        data.route.forEach(route => {
            let option = document.createElement("option");
            option.text = route.title;
            option.value = route.tag;
            select.add(option);
        });

        select.onchange = e => {
            _routeId = e.target.value;
            let p = routeLayerModule.init(
                _stopLayer,
                _pathLayer,
                _agency,
                _routeId
            );
            vehicleLayerModule.startInterval(_vehicleLayer, _agency, _routeId);

            p.then(routeLayerData => {
                _map.fitBounds(routeLayerData.routeBBox);
                delayProcessorModule.startInterval(
                    _agency,
                    _routeId,
                    _colorList,
                    routeLayerModule.getStopMarker,
                    routeLayerData.directionStops
                );
            });
            document.activeElement.blur();

        };

        select.value = "60";
        select.dispatchEvent(new Event("change"));
    };

    const fetchData = (agency) => {
        fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=${agency}`
        ).then(response => {
            if (response.status !== 200) {
                console.log(
                    "Looks like there was a problem. Status Code: " +
                    response.status
                );
                return;
            }
            response.json().then(processData);
        });
    };

    return { init };
})();

export { routeListModule };