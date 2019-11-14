
const delayInterpolator = (() => {
    let _directionStops;
    let _stopDelayMap;

    const init = (directionStops) => {
        _directionStops = directionStops;
        _stopDelayMap = {};
        reset();
    };

    const reset = () => {
        _directionStops.forEach(dir => {
            dir.forEach(s => {
                _stopDelayMap[s] = -1;
            })
        });
    }


    const setDelay = (stop, delay) => {
        _stopDelayMap[stop] = delay;
    };

    const interpolate = (arr) => {
        let first = _stopDelayMap[arr[0]];
        let last = _stopDelayMap[arr[arr.length - 1]];
        let delta = (last - first) / (arr.length - 1);
        for (let i = 1, d = first + delta; i < arr.length - 1; i++ , d += delta) {
            _stopDelayMap[arr[i]] = d;
        }
    };

    const processDelay = () => {
        _directionStops.forEach(dir => {
            let collector = [];
            for (let i = 0; i < dir.length; i++) {
                if (_stopDelayMap[dir[i]] >= 0) {
                    if (collector.length > 1) {
                        collector.push(dir[i]);
                        interpolate(collector);
                    }
                    collector = [dir[i]];
                } else {
                    if (collector.length > 0) {
                        collector.push(dir[i]);
                    }
                }
            }
        });
    };

    const render = (colorList, getStopMarker) => {
        for (stop in _stopDelayMap) {
            let stopMarker = getStopMarker(stop);

            let delayMinutes = _stopDelayMap[stop];
            let statusText = "Data Unavailable";
            if (delayMinutes >= 0) {
                let colorIndex = Math.round(delayMinutes / 5);
                colorIndex =
                    colorIndex >= colorList.length
                        ? colorList.length - 1
                        : colorIndex;
                stopMarker.setStyle({ fillColor: colorList[colorIndex] });
                statusText = Math.round(delayMinutes) + " min delay";
            }
            stopMarker.getPopup().setContent("<p>" + stopMarker.stop.title + "<br>" + statusText + "</p>");
        }
    }

    return { init, reset, setDelay, processDelay, render };

})();

export { delayInterpolator };