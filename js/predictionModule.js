const predictionFactory = () => {
    let _stop, _stopMarker;
    let _colorList;
    let _delayMinutes;

    const getRelativeDayTime = src =>
        moment(
            src -
            moment()
                .subtract(src.hour() < 4 ? 1 : 0, "days")
                .startOf("day")
        );

    const mapArrayOrObject = (aoo, func) => {
        if (Array.isArray(aoo)) {
            return aoo.map(func);
        }
        return [func(aoo)];
    };

    const processPrediction = prediction =>
        mapArrayOrObject(prediction, row => Number(row.epochTime));

    const processDirection = direction => {
        if (Array.isArray(direction)) {
            return direction.reduce(
                (accumulator, dir) =>
                    accumulator.concat(processPrediction(dir.prediction)),
                []
            );
        } else {
            return processPrediction(direction.prediction);
        }
    };

    const findLast = (array, func) => {
        for (let i = array.length - 1; i >= 0; i--) {
            if (func(array[i])) return array[i];
        }
        return null;
    };

    const processData = data => {
        if (
            (data.predictions === undefined || data.predictions.direction) ===
            undefined
        ) {
            return;
        }
        _stopMarker.stop.predictions = processDirection(
            data.predictions.direction
        );

        let pred = getRelativeDayTime(
            moment(Number(_stopMarker.stop.predictions[0]))
        );

        let closestSchedule = moment(
            findLast(_stopMarker.stop.schedule, sched =>
                pred.isAfter(moment(sched))
            )
        );

        _delayMinutes = moment
            .duration(pred.diff(closestSchedule))
            .asMinutes();
        let colorIndex = Math.round(_delayMinutes / 5);
        colorIndex =
            colorIndex >= _colorList.length
                ? _colorList.length - 1
                : colorIndex;
        _stopMarker.setStyle({ fillColor: _colorList[colorIndex] });
        _stopMarker.getPopup().setContent("<p>" + _stopMarker.stop.title + "<br>" + Math.round(_delayMinutes) + " min delay</p>")
        return Promise.resolve({
            "stop": _stop,
            "delay": _delayMinutes
        });
    };

    const fetchData = (agency, routeId, stop) => {
        return fetch(
            `http://webservices.nextbus.com/service/publicJSONFeed?command=predictions&a=${agency}&r=${routeId}&s=${stop}`
        ).then(response => {
            if (response.status !== 200) {
                console.log(
                    "Looks like there was a problem. Status Code: " +
                    response.status
                );
                return;
            }
            return response.json().then(processData);
        });
    };

    const getPrediction = (agency, routeId, stop, stopMarker, colorList) => {
        _stopMarker = stopMarker;
        _colorList = colorList;
        _stop = stop;
        return fetchData(agency, routeId, stop);
    };

    return { getPrediction };
};

export { predictionFactory };
