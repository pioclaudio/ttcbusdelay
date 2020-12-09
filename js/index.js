import { routeListModule } from "./routeListModule.js";

const colorList = ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

var mymap = L.map("mapid").setView([43.653908, -79.384293], 13);
var accessToken = 'pk.eyJ1IjoiYnNoaXJvIiwiYSI6ImNpbHZxbmRrNDAxbW10eWtydjh6bGZyeXQifQ.Qw9BoP7S9dlGj9DY4khofA';

var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
  attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  tileSize: 512,
  zoomOffset: -1
}).addTo(mymap);


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


L.Control.Info = L.Control.extend({
    onAdd: function (map) {
        let div = L.DomUtil.create('div');

        div.innerHTML = '<i class="fa fa-info-circle"></i>';

        div.onclick = (e) => {
            modal.show();
        }
        return div;
    },

});

var info = new L.Control.Info({ position: 'bottomleft' }).addTo(mymap);
var modal = L.control.window(mymap, { 
    title: 'About',
    content: '<p>This app shows the delay of a bus from a scheduled stop.</p> <h3>Usage</h3> <p><ol><li> Select a route from the drop down menu.</li> <li> Stops are shown in a color representing the delay of bus arrival. Refer to legend.</li> <li>Click a stop to see detailed information.</li></ol></p>  <h3>Data</h3> <p>Bus data from nextbus.com.</p> <h3>Disclaimer</h3> <p>The website makes no warranty, expressed or implied, as to the results obtained from the use of the information on the website. The website shall have no liability for the accuracy of the information and cannot be held liable for any third-party claims or losses of any damages.</p><h3>Feedback</h3><p>me@pioclaudio.com</p>',
    modal: true
});

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
// mymap.locate({ setView: true, maxZoom: 16 });

// function onLocationFound(e) {
//     var radius = e.accuracy;

//     L.marker(e.latlng).addTo(mymap)
//         .bindPopup("You are within " + radius + " meters from this point").openPopup();

//     L.circle(e.latlng, radius).addTo(mymap);
// }

// mymap.on('locationfound', onLocationFound);