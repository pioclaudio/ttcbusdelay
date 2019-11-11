
import { vehicleLayerModule } from "./vehicleLayerModule";


var stopLayerMap = {};
const colorList = ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

var mymap = L.map("mapid").setView([43.653908, -79.384293], 13);
var baseMap = L.tileLayer(
	"https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
	{
		attribution:
			'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: "mapbox.streets",
		accessToken:
			"pk.eyJ1IjoibGJzaGlybyIsImEiOiJjajh2dW52eWUxZzQ0MnhxejdmaGpmcWJ6In0.L8rJt1jyN5m0yyaDi-MddA"
	}
).addTo(mymap);

var stopLayer = L.layerGroup([]).addTo(mymap);
var pathLayer = L.layerGroup([]).addTo(mymap);
var vehicleLayer = L.layerGroup([]).addTo(mymap);
var vehicleIntervalId;
var latenessIntervalId;

var agency = 'ttc';
var routeId = '60';


const populateDropdown = (agency) => {
	fetch(
		`http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=${agency}`
	).then( response => {
		if (response.status !== 200) {
			console.log("Looks like there was a problem. Status Code: " + response.status);
			return;
		}
		response.json().then( data => {
			let select = document.getElementById("routeSelect");
			data.route.forEach( route => {
				
				let option = document.createElement("option");
				option.text = route.title;
				option.value = route.tag;
				select.add(option);
			})
		
			select.onchange = (e) => {
				routeId = e.target.value;
				loadRouteConfig(agency, routeId);
				startLatenessEstimatorPoll(agency, routeId);
			}

			select.value = '60';
			select.dispatchEvent(new Event("change"));

		})
	})

};


const loadRouteConfig = (agency, routeId) => {
	stopLayerMap = {};
	fetch(
		`http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=${agency}&r=${routeId}`
	).then( response => {
		if (response.status !== 200) {
			console.log("Looks like there was a problem. Status Code: " + response.status);
			return;
		}

		response.json().then( data => {
			stopLayer.clearLayers();
			pathLayer.clearLayers();

			let routePath = data.route.path.map( path => path.point.map( 
				p => [p.lat, p.lon])
			);
			pathLayer.addLayer(
				L.polyline(routePath, {
					//color: "#"+data.route.color,
					color: "#2f73ac",
					width: 3
				})
			);

			data.route.stop.forEach( s => {
				let stopMarker = L.circleMarker([s.lat, s.lon], {
					color: "#2f73ac",
					weight: 2,
					fillColor: "white",
					fillOpacity: 1,
					radius: 5
				}).bindPopup(s.title);
				
				stopMarker.stop = s;
				stopMarker.on("click", function(e) {
					//console.log(e.target.stop);
				});
				stopLayer.addLayer(stopMarker);
				stopLayerMap[s.tag] = stopLayer.getLayerId(stopMarker);
			});
			//console.log(stopLayerMap);
			mymap.fitBounds([
				[data.route.latMin, data.route.lonMin],
				[data.route.latMax, data.route.lonMax]
			]);
			
			startVehiclePoll(agency, routeId);
		});
	});
};


const startVehiclePoll = (agency, routeId) => {
	stopVehiclePoll();
    vehicleLocationCallback(agency, routeId);
	vehicleIntervalId = setInterval(vehicleLocationCallback, 10000, agency, routeId);
};
const stopVehiclePoll = () => {
	clearInterval(vehicleIntervalId);
}

const startLatenessEstimatorPoll = (agency, routeId) => {
	latenessEstimator(agency, routeId);
	latenessIntervalId = setInterval(latenessEstimator, 60000,agency, routeId)
};
const stopLatenessEstimatorPoll = () => {
	clearInterval(latenessIntervalId);
}


var myIcon = L.divIcon({ 
    className: "fa fa-bus", 
    iconAnchor: [12, 13] 
});
var myNavIcon = L.divIcon({
	className: "fa fa-map-marker",
	iconAnchor: [13, 15]
});

const processArrayOrObject = (aoo, func) => {
	if (Array.isArray(aoo)) {
		aoo.forEach(func);
	} else {
		func(aoo);
	}
}

const vehicleLocationCallback = (agency, routeId) => {
    let epochTime = Math.floor(Date.now() / 1000);
    fetch(
		`http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=${agency}&r=${routeId}&t=${epochTime}`
	).then(function(response) {
		if (response.status !== 200) {
			console.log( "Looks like there was a problem. Status Code: " + response.status );
			return;
		}

		response.json().then(function(data) {
			vehicleLayer.clearLayers();
			if (!("vehicle" in data))
				return;
			// data.vehicle.forEach(s => {
            //     vehicleLayer.addLayer(
			// 		L.marker([s.lat, s.lon], {
			// 			icon: myNavIcon,
			// 			rotationAngle: 180 + Number(s.heading)
			// 		})
			// 	);
			// 	//vehicleLayer.addLayer(L.circle([s.lat, s.lon], busProp))
			// 	vehicleLayer.addLayer(
            //         L.marker([s.lat, s.lon], { icon: myIcon })
            //         .bindPopup(s.dirTag)
            //     );
			// });
			
			processArrayOrObject(data.vehicle, s => {
                vehicleLayer.addLayer(
					L.marker([s.lat, s.lon], {
						icon: myNavIcon,
						rotationAngle: 180 + Number(s.heading)
					})
				);
				vehicleLayer.addLayer(
                    L.marker([s.lat, s.lon], { icon: myIcon })
                    .bindPopup(s.dirTag)
                );
            });
		});
	});
};

//day starts at 4am ends before 4am
const getRelativeDayTime = src => moment(src - moment().subtract(src.hour() < 4 ? 1 : 0, "days").startOf("day"));

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
				//if (s.tag === "stop") print(s);
				//obj[s.tag].push(s.content);
				obj[s.tag].push(Number(s.epochTime));
			}
		});
		return obj;
	}, groupbyStopDict);
}

const latenessEstimator = (agency, routeId) => {
	stopLatenessEstimatorPoll();
    fetch(
		`http://webservices.nextbus.com/service/publicJSONFeed?command=schedule&a=${agency}&r=${routeId}`
	).then( function(response) {
        if (response.status !== 200) {
            console.log(
                "Looks like there was a problem. Status Code: " +
                    response.status
            );
            return;
        }

        response.json().then(function(data) {
			let now = moment();
			//day starts at 4am ends before 4am
			let dayTime = moment(now - moment().subtract(now.hour()<4?1:0,'days').startOf("day"));
            //let serviceRoute = data.route.find(e => e.serviceClass === "sat");
			//let serviceRoute = data.route[0];
			// let blockRange = serviceRoute.tr.filter(block => 
			// 	block.stop.some(s => 
			// 			s.epochTime != "-1" &&
			// 			moment(Number(s.epochTime)).isBetween(
			// 				dayTime.clone().add(-1, "h"),
			// 				dayTime.clone().add(1, "h")
			// 			)
			// 	)
			// );
			// console.log(blockRange);

			//console.log(serviceRoute.tr);
			let groupbyStopDict = {};
			// serviceRoute.tr.reduce((obj, block) => {
			// 	block.stop.forEach(s => {
			// 		if (!obj.hasOwnProperty(s.tag)) {
			// 			obj[s.tag] = [];
			// 		}
			// 		if (
			// 			s.epochTime != "-1" &&
			// 			moment(Number(s.epochTime)).isBetween(
			// 				dayTime.clone().add(-1, "h"),
			// 				dayTime.clone().add(1, "h")
			// 			)
			// 		) {
			// 			if (s.tag === "stop")
			// 				print(s);
			// 			obj[s.tag].push(s.content);
			// 			//obj[s.tag].push(s.epochTime);
			// 		}
			// 	});
			// 	return obj;
			// }, groupbyStopDict);
			groupbyStop(data.route[0].tr, groupbyStopDict);
			groupbyStop(data.route[1].tr, groupbyStopDict);	//opposite direction
			//console.log(groupbyStopDict);

			for (stop in groupbyStopDict) {
				//console.log(stop +": "+ stopLayerMap[stop]);
				stopLayer.getLayer(stopLayerMap[stop]).stop.schedule = groupbyStopDict[stop];

				// stopLayer.getLayer(stopLayerMap[stop]).setStyle({
				// 	//color: "#2f73ac",
				// 	//weight: 2,
				// 	fillColor: "red",
				// 	//fillOpacity: 1,
				// 	//radius: 5
				// });

				// let stoptag = stop.includes("_ar")? stop.slice(0,stop.length-3):stop;
				// console.log(stoptag);
				// console.log(
				// 	stopLayer.getLayer(stopLayerMap[stoptag]).stop.stopId
				// );
				loadPrediction(agency, routeId, stop);
			}




        });
    });

};

const mapArrayOrObject = (aoo, func) => {
	if (Array.isArray(aoo)) {
		return aoo.map(func);
	}
	return [func(aoo)];
};

const processPrediction = prediction =>
	mapArrayOrObject(prediction, row => Number(row.epochTime));

const processDirection = (direction) => {
	if (Array.isArray(direction)) {
		return direction.reduce((accumulator, dir) => accumulator.concat(processPrediction(dir.prediction)),[]
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

const loadPrediction = (agency, routeId, stop) => {
    fetch(
		`http://webservices.nextbus.com/service/publicJSONFeed?command=predictions&a=${agency}&r=${routeId}&s=${stop}`
	).then( response => {
		if (response.status !== 200) {
			console.log(
				"Looks like there was a problem. Status Code: " +
					response.status
			);
			return;
		}

		response.json().then( data => {
			//console.log(data.predictions);
			let currentLayer = stopLayer.getLayer(stopLayerMap[stop]);
			if (data.predictions.direction === undefined)
				return;
			currentLayer.stop.predictions = processDirection(
				data.predictions.direction);	

			let pred = getRelativeDayTime(moment(Number(currentLayer.stop.predictions[0])));

			//console.log("pred  "+ pred.toString());
			// currentLayer.stop.schedule.forEach( sched =>
			// 	console.log( moment(sched).toString() )
			// );

			let closestSchedule = moment(
				findLast(currentLayer.stop.schedule, sched =>
					pred.isAfter(moment(sched))
				)
			);
			//console.log(closestSchedule.toString());
			//reverseFind(currentLayer.stop.schedule, sched => pred.isAfter(
			//s		moment(sched)));

			//console.log(currentLayer.stop.schedule);
			// let closestSchedule = moment(
			// 	currentLayer.stop.schedule.find( sched => pred.isAfter(
			// 		moment(sched)))
			// );

			//console.log("sched "+closestSchedule.toString());

			let duration = moment.duration(pred.diff(closestSchedule));
			let minutesLate = duration.asMinutes()
			//console.log(minutesLate);
			let colorIndex = Math.round(minutesLate / 5);
			colorIndex = colorIndex >= colorList.length ? colorList.length - 1: colorIndex;

			currentLayer.setStyle({
				//color: colorList[]
				//weight: 2,
				fillColor: colorList[colorIndex]
				//fillOpacity: 1,
				//radius: 5
			});
		});
	});
};


// loadRouteConfig(agency, routeId);
// latenessEstimator(agency, routeId);

// var baseMaps = {
// 	Base: baseMap
// };
// var featureLayers = {
// 	Stops: stopLayer,
// 	Bus: vehicleLayer,
// };
// L.control.layers(baseMaps, featureLayers).addTo(mymap);


//---------------------------------------------------------------------------

var info = L.control();

info.onAdd = function(map) {
	this._div = L.DomUtil.create("div", "info");
	this.update();
	return this._div;
};
info.update = function(props) {
	this._div.innerHTML =
		"<h4>TTC Realtime Bus Delay (minutes)</h4>"+
		'<select id="routeSelect"></select>'
};
info.addTo(mymap);

var legend = L.control({ position: "bottomright" });
legend.onAdd = function(map) {
	var div = L.DomUtil.create("div", "info legend"),
		grades = [0, 5, 10, 15, 20];
	for (var i = 0; i < grades.length; i++) {
		div.innerHTML +=
			'<i style="background:' +
			colorList[grades[i]/5] +
			'"></i> ' +
			grades[i] +
			(grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
	}
	return div;
};
legend.addTo(mymap);

populateDropdown(agency);
