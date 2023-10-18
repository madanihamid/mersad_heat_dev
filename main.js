import "./style.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import KML from "ol/format/KML.js";
import VectorSource from "ol/source/Vector.js";
import { Heatmap as HeatmapLayer, Vector as crash_vectorayer } from "ol/layer.js";
import { Icon, Style } from "ol/style.js";
import Draw, { createBox, createRegularPolygon } from "ol/interaction/Draw.js";
import GeoJSON from "ol/format/GeoJSON.js";
import * as turf from "@turf/turf";

const baseurl = '185.83.113.201'
const appport = '3222'


const draw_source = new VectorSource({ wrapX: false });

const draw_vector = new crash_vectorayer({
  source: draw_source,
});




console.log("789");
// fetch("http://localhost:3000/getKML") // Replace with your server URL
//   .then((response) => response.text())
//   .then((kmlData) => {
//     const kmlFormat = new KML({ extractStyles: false });
//     const features = kmlFormat.readFeatures(kmlData);
//     crash_source.addFeatures(features);

//   })
//   .catch((error) => {
//     console.error(error);
//   });

let crash_source;
let crash_vector;
let heatvector;



const jarhistyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    scale: 0.05,
    src: "./placeholder3.png",
  }),
});

const footistyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    scale: 0.05,
    src: "./placeholder.png",
  }),
});

const khesaratistyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    scale: 0.05,
    src: "./placeholder4.png",
  }),
});



// const crash_vector = new crash_vectorayer({
//   minZoom: 15.5,
//   source: crash_source,
//   style: function (feature) {
//     const type = feature.get("type");
//     switch (type) {
//       case "جرحی":
//         return jarhistyle;
//         break;
//       case "فوتی":
//         return footistyle;
//         break;
//       default:
//         return khesaratistyle;
//     }
//   },
// });

// const heatvector = new HeatmapLayer({
//   maxZoom: 15.5,
//   source: crash_source,
//   radius: 5,
// });

const map = new Map({
  
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    // heatvector,
    // crash_vector,
    draw_vector,
  ],
  view: new View({
    center: [51.67576318712841, 32.654381618104665],
    projection: "EPSG:4326",
    zoom: 12,
  }),
});

function get_crash_source() {
  map.removeLayer(crash_vector);
  map.removeLayer(heatvector);

  crash_source = new VectorSource({
  url: `http://${baseurl}:${appport}/getKML`,

  // url: 'http://localhost:3000/getKML',
  format: new KML({ extractStyles: false }),
});
crash_vector = new crash_vectorayer({
  minZoom: 15.5,
  source: crash_source,
  style: function (feature) {
    const type = feature.get("type");
    switch (type) {
      case "جرحی":
        return jarhistyle;
        break;
      case "فوتی":
        return footistyle;
        break;
      default:
        return khesaratistyle;
    }
  },
});
heatvector = new HeatmapLayer({
  maxZoom: 15.5,
  source: crash_source,
  radius: 5,
});
map.addLayer(heatvector)
map.addLayer(crash_vector)
}


const typeSelect = document.getElementById("type");

let draw = new Draw({
  type: "Circle",

});


function addInteraction() {
  const value = typeSelect.value;
  if (value == "Box") {
    draw = new Draw({
      source: draw_source,
      type: "Circle",
      geometryFunction: createBox(),
    });
    map.addInteraction(draw);
    draw.on("drawstart", drawstart)

  } else if (value !== "None") {
    draw = new Draw({
      source: draw_source,
      type: typeSelect.value,
    });
    map.addInteraction(draw);
    draw.on("drawstart", drawstart)
 
  }
}

function drawstart(evt) {
  const ndraw = evt.draw;
    if (draw_vector.getSource().getFeatures().length >= 1) {
    map.removeInteraction(draw);
    map.removeLayer(draw_vector);
    draw_vector.getSource().clear();
    map.addLayer(draw_vector);
    addInteraction();
  }
  
}

draw.on("drawstart", drawstart)

typeSelect.onchange = function () {
  map.removeInteraction(draw);
  addInteraction();
};

document.getElementById("undo").addEventListener("click", function () {
  var myArray = [];

  if (typeSelect.value == "Circle") {
    draw_vector.getSource().forEachFeature(function (polyfeature) {
      var circuleradios = polyfeature.getGeometry().getRadius();
      console.log(circuleradios);
      var circulecenter = polyfeature.getGeometry().getCenter();
      console.log(circulecenter);
      var options = { steps: 10, units: "degrees" };
      var circle = turf.circle(circulecenter, circuleradios, options);

      crash_vector.getSource().forEachFeature(function (pointfeature) {
        var mypointcoords = pointfeature.values_.geometry.flatCoordinates;
        var mypoint = turf.point(mypointcoords);

        if (turf.booleanIntersects(circle, mypoint)) {
          myArray.push(pointfeature.get("fid"));
        }
      });
      console.log(myArray);
    });
  } else {
    draw_vector.getSource().forEachFeature(function (polyfeature) {
      var format = new GeoJSON();
      var geoJsonStr = format.writeFeatures(draw_source.getFeatures());
      var searchWithin = turf.polygon(
        JSON.parse(geoJsonStr).features[0].geometry.coordinates
      );
      console.log(searchWithin);
      crash_vector.getSource().forEachFeature(function (pointfeature) {
        var mypointcoords = pointfeature.values_.geometry.flatCoordinates;
        var mypoint = turf.point(mypointcoords);

        if (turf.booleanIntersects(searchWithin, mypoint)) {
          myArray.push(pointfeature.get("fid"));
        }
      });
      console.log(myArray);
      console.log(draw_vector.getSource().getFeatures().length);

    });
  }
});



console.log("789");


var zone_layer = [];



const get_zone = () => {
  map.removeLayer(zone_layer);
  var zonenumber = document.getElementById("zone").value;
  zone_layer = new crash_vectorayer({
    source: new VectorSource({
      url: `http://${baseurl}:${appport}/get_zone?zonenumber=${zonenumber}`,
      format: new KML({ extractStyles: false }),
    }),
  });

  map.addLayer(zone_layer);

};

const clear_zone = () => {
  zone_layer.getSource().clear();

  map.removeLayer(zone_layer);
};

document.getElementById("get_zone").addEventListener("click", get_zone);

document.getElementById("clear_zone").addEventListener("click", clear_zone);
document.getElementById("get_points").addEventListener("click", get_crash_source);


