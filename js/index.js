import { routeListModule } from "./routeListModule.js";

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

var info = L.control();
info.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info");
    div.innerHTML =
        "<h4>TTC Realtime Bus Delay (minutes)</h4>" +
        '<select id="routeSelect"></select>';
    return div;
};
info.addTo(mymap);

var legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info legend"),
        grades = [0, 5, 10, 15, 20];
    let content = "<ul>"
    for (var i = 0; i < grades.length; i++) {
        content +=
            '<li><i style="background:' +
            colorList[grades[i] / 5] +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] ? "&ndash;" + grades[i + 1] : "+") +
            '</li>';
    }
    content += "</ul>";
    div.innerHTML = content;
    return div;
};
legend.addTo(mymap);

var stopLayer = L.layerGroup([]).addTo(mymap);
var pathLayer = L.layerGroup([]).addTo(mymap);
var vehicleLayer = L.layerGroup([]).addTo(mymap);

//---------------------------------------------------------------------------
// var baseMaps = {
// 	Base: baseMap
// };
// var featureLayers = {
//  Paths: pathLayer;
// 	Stops: stopLayer,
// 	Bus: vehicleLayer,
// };
// L.control.layers(baseMaps, featureLayers).addTo(mymap);
//---------------------------------------------------------------------------


routeListModule.init(stopLayer, pathLayer, vehicleLayer, mymap, colorList);

