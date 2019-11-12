import { predictionFactory } from "./predictionModule.js";

const delayProcessorModule = (() => {
    let _intervalId;
    let _agency, _routeId;
    let _getStopMarker;
    let _colorList;

    const getRelativeDayTime = src =>
        moment(
            src -
            moment()
                .subtract(src.hour() < 4 ? 1 : 0, "days")
                .startOf("day")
        );

    const groupbyStop = (tr, groupbyStopDict) => {
        let dayTime = getRelativeDayTime(moment());

        tr.reduce((obj, block) => {
            block.stop.forEach(s => {
                if (!obj.hasOwnProperty(s.tag)) {
                    obj[s.tag] = [];
                }
                if (
                    s.epochTime != "-1" &&
                    moment(Number(s.epochTime)).isBetween(
                        dayTime.clone().add(-1, "h"),
                        dayTime.clone().add(1, "h")
                    )
                ) {
                    obj[s.tag].push(Number(s.epochTime));
                }
            });
            return obj;
        }, groupbyStopDict);
    };

    const startInterval = (agency, routeId, colorList, getStopMarker) => {
        _agency = agency;
        _routeId = routeId;
        _colorList = colorList;
        _getStopMarker = getStopMarker;
        stopInterval();
        getStopSchedule(agency, routeId);
        _intervalId = setInterval(getStopSchedule, 60000, agency, routeId);
    };

    const stopInterval = () => {
        if (_intervalId) clearInterval(_intervalId);
    };

    const getStopSchedule = (agency, routeId) => {
        fetchData(agency, routeId);
    };

    const processData = data => {
        let groupbyStopDict = {};
        groupbyStop(data.route[0].tr, groupbyStopDict);
        groupbyStop(data.route[1].tr, groupbyStopDict); //opposite direction

        for (stop in groupbyStopDict) {
            let stopMarker = _getStopMarker(stop);
            if (stopMarker === undefined)
                continue;
            stopMarker.stop.schedule = groupbyStopDict[stop];

            predictionFactory().getPrediction(
                _agency,
                _routeId,
                stop,
                stopMarker,
                _colorList
            );
        }
    };

    const fetchData = (agency, routeId) => {
        fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=schedule&a=${agency}&r=${routeId}`
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

    return { startInterval, stopInterval };
})();

export { delayProcessorModule };
