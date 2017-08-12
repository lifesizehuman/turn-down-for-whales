$(document).ready(function() {

  $('select').material_select();

  $.ajaxPrefilter(function(options) {
    if (options.crossDomain && $.support.cors) {
      options.url = "https://cors-anywhere.herokuapp.com/" + options.url;
    }
  });

  generateFact();

  var config = {
    apiKey: "AIzaSyAqMI1aab7fpTQsdo7zUXnXAhnIwVTdBAs",
    authDomain: "turn-down-for-whales.firebaseapp.com",
    databaseURL: "https://turn-down-for-whales.firebaseio.com",
    projectId: "turn-down-for-whales",
    storageBucket: "turn-down-for-whales.appspot.com",
    messagingSenderId: "612763934802"
  };
  firebase.initializeApp(config);

  var database = firebase.database();

  var outdoors = L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
    {id: "mapbox.outdoors"}),
    light = L.tileLayer(
      "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
      { id: "mapbox.light" });

  var mymap = L.map("mapid", {
    center: [38, -123],
    zoom: 3,
    layers: [outdoors],
    scrollWheelZoom: false
  });

  var baseMaps = {
    Light: light,
    Satellite: outdoors
  };

  L.control.layers(baseMaps).addTo(mymap);

  $("#learn").on("click", function() {
  window.open(
  'https://marine-conservation.org/',
  '_blank'
)
  });

    $("#volunteer").on("click", function() {
  window.open(
  'https://healthebay.org/take-part/',
  '_blank'
)
  });

        $("#donate").on("click", function() {
  window.open(
  'https://www.edf.org/',
  '_blank'
)
  });

  mymap.on('click', function() {
  if (mymap.scrollWheelZoom.enabled()) {
    mymap.scrollWheelZoom.disable();
  } else {
    mymap.scrollWheelZoom.enable();
    }
  });

  function onMapClick(mymap) {
    console.log(mymap.latlng.lat, mymap.latlng.lng);
    $("#latitude-input").val(mymap.latlng.lat);
    $("#longitude-input").val(mymap.latlng.lng);
  }

  var myIcon = L.icon({
    iconUrl: "assets/tail-icon.png",
    shadowIcon: "assets/whale-tail-shadow.png",
    iconSize: [37, 37],
    shadowSize: [32, 37],
    // iconAnchor: [16, 37],
    shadowAnchor: [4, 62],
    popupAnchor: [0, -37]
  });

  var group = L.layerGroup([]).addTo(mymap);
  var markers = new L.FeatureGroup();
  var layer;

  mymap.on("click", onMapClick);

  function populateMap() {
    var species = $("#species-input").val();
    var queryURL = "http://hotline.whalemuseum.org/api.json?species=" + species;

    $.ajax({
      url: queryURL,
      method: "GET"
    }).done(function(response) {
      for (var i = 0; i < response.length; i++) {
        var layer = L.marker(
          [response[i].latitude, response[i].longitude]
          // ,{icon: myIcon}
        );
        layer.addTo(group);

        layer.bindPopup(
            "<p>" + "Species: " + response[i].species + "</p>" +
            "<p>" + "Description: " + response[i].description + "</p>" +
            "<p>" + "Seen at: " + response[i].latitude + " / " + response[i].longitude + "</p>" +
            "<p>" + "On: " + response[i].sighted_at + "</p>");
          }

      $('select').change(function() {
        species = this.value;
      });
    });
  }

var llBounds = mymap.getBounds();

  function clearMap() {
    group.clearLayers();
  }
  

function recentSearch() {

  var searchValue = $("select").val();
  database.ref("/search").push({
    search: searchValue

  });

  database
    .ref("/search").limitToLast(5).on("child_added", function(childSnapshot, prevChildKey) {

      var searchList = childSnapshot.val().search;
      var tableBody = $("#recent-searches > tbody");
      var tr = $("<tr>");
      var tdSearches = $("<td>").text(searchList);

      tr.append(tdSearches);
      tableBody.append(tr);
    });
  }

  $(document).on("click", "#submit", function(event) {
    clearMap();
    populateMap();
    mymap.fitBounds(llBounds);
  });

recentSearch();

  $("#getLocation").on("click", function(event) {
    event.preventDefault();
    if ("geolocation" in navigator) {
      console.log("geolocation IS available");
    } else {
      console.log("geolocation IS NOT available");
    }

    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    function success(pos) {
      var crd = pos.coords;

      $("#latitude-input").val(`${crd.latitude}`);
      $("#longitude-input").val(`${crd.longitude}`);

    }

    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);

  });

  $("#submit-sighting").on("click", function(event) {

    event.preventDefault();
    group.clearLayers();

    var speciesControl = $("#species-control").val();
    var description = $("#sighting-description").val();
    var sightingDate = $("#sighting-date").val();
    var sightingTime = $("#sighting-time").val();
    var latitude = $("#latitude-input").val();
    var longitude = $("#longitude-input").val();


    var slayer = L.marker([latitude, longitude]).addTo(group);
    slayer.bindPopup(
      "<p>" + "Species: " + speciesControl + "</p>" +
      "<p>" + "Description: " + description + "</p>" +
      "<p>" + "Seen at: " + latitude + " / " + longitude + "</p>" +
      "<p>" + "On: " + sightingDate + " at " + sightingTime + "</p>"
    );

    database.ref("/sightings").push({
      species: speciesControl,
      description: description,
      date: sightingDate,
      time: sightingTime,
      latitude: latitude,
      longitude: longitude
    });

    $("#species-control").val("");
    $("#sighting-description").val("");
    $("#sighting-date").val("");
    $("#sighting-time").val("");
    $("#latitude-input").val("");
    $("#longitude-input").val("");

  });

  database
    .ref("/sightings").limitToLast(5).on("child_added", function(childSnapshot, prevChildKey) {

      console.log(childSnapshot.val());

      var empSpecies = childSnapshot.val().species;
      var empDescription = childSnapshot.val().description;
      var empLat = childSnapshot.val().latitude;
      var empLong = childSnapshot.val().longitude;
      var empDate = childSnapshot.val().date;
      var empTime = childSnapshot.val().time;

      var tableBody = $("#species-table > tbody");

      var tr = $("<tr>");

      var tdSpecies = $("<td>").text(empSpecies);
      var tdDescription = $("<td>").text(empDescription);
      var tdLocation = $("<td>").text(empLat + empLong);
      var tdDate = $("<td>").text(empDate);
      var tdTime = $("<td>").text(empTime);

      tr.append(tdSpecies, tdDescription, tdLocation, tdDate, tdTime);
      tableBody.append(tr);

      $("#recent-sighting").on("click", function(event) {

        event.preventDefault();

        function recentPop() {
          var mSpecies = $("<h6>").text(empSpecies);
          var mDescription = $("<h6>").text(empDescription);
          var mLocation = $("<h6>").text(empLat + empLong);
          var mDate = $("<h6>").text(empDate);
          var mTime = $("<h6>").text(empTime);

          var layer = L.marker([empLat, empLong]
            // , {icon: myIcon}
          );
          layer.addTo(group);
          layer.bindPopup();
          layer.setPopupContent(
              "<p>" + "Species: " + empSpecies + "</p>" +
              "<p>" + "Description: " + empDescription + "</p>" +
              "<p>" + "Seen at: " + empLat + " / " + empLong + "</p>" +
              "<p>" + "On: " + empTime + " on " + empDate + "</p>");
        }
        recentPop();
        mymap.fitBounds(llBounds);
      });
    });
  });

var facts = ["Moby Dick by Herman Melville was based on a real whale named Mocha Dick. #mochadick", "Female Humpback Whales have BFFs and reunite each year. #squadgoals", "The Blue Whale is the largest animal that has ever lived on earth.", "Beluga Whales love music and even sometimes join in synchronized dance. #bumpinbeluga", "Bowhead Whales can live for over 200 years.", "Some whales imitate human speech. A captive whale called Lugosi at the Vancouver Aquarium could reportedly say its own name.", "Whales feed by swallowing their weight in water.", "Sperm Whales sleep standing up. Scientists think they dive down and grab snatches of sleep that can last up to about 12 minutes and then slowly drift to the surface head-first.", "In any area shared by whales, everyone sings the same song. Over time, the song will change, and if the new song is catchy enough, it will spread to other populations of whales. When a new whalesong comes out, it is sometimes a sort of remix of the previous song", "Whales adopt other animals, and sometimes treat objects as surrogate babies."];

var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

function generateFact() {
  var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

  $("#fact-display").text(whaleFactDisplay);

}

$("#fact-button").on("click", function() {
generateFact();
});
