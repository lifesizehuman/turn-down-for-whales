$(document).ready(function() {
  $.ajaxPrefilter(function(options) {
    if (options.crossDomain && $.support.cors) {
      options.url = "https://cors-anywhere.herokuapp.com/" + options.url;
    }
  });

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
    {
      id: "mapbox.outdoors"
    }
  ),
    dark = L.tileLayer(
      "https://api.mapbox.com/styles/v1/lifesizehuman/cj65p1axm6m8t2smwy6tvcm62/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
      { id: "mapbox.dark" }
    );

  var mymap = L.map("mapid", {
    center: [38, -123],
    zoom: 3,
    layers: [outdoors]
  });

  var baseMaps = {
    Dark: dark,
    Satellite: outdoors
  };

  L.control.layers(baseMaps).addTo(mymap);

  mymap.once("focus", function() {
    mymap.scrollWheelZoom.enable();
  });
  mymap.on("click", function() {
    if (mymap.scrollWheelZoom.enabled()) {
      mymap.scrollWheelZoom.disable();
      // layers
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

  L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
    {
      maxZoom: 18,
      id: "mapbox.outdoors"
    }
  ).addTo(mymap);

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
          "<p>" +
            "Species: " +
            response[i].species +
            "</p>" +
            "<p>" +
            "Description: " +
            response[i].description +
            "</p>" +
            "<p>" +
            "Seen at: " +
            response[i].latitude +
            " / " +
            response[i].longitude +
            "</p>" +
            "<p>" +
            "On: " +
            response[i].sighted_at +
            "</p>"
        );
      }

      $("select").change(function() {
        species = this.value;
      });
    });
  }

  function clearMap() {
    group.clearLayers();
  }

  $(document).on("click", "#submit", function(event) {
    clearMap();
    populateMap();

    var searchValue = $("select").val();

    database.ref("/search").push({
      search: searchValue
    });

    database
      .ref("/search")
      .on("child_added", function(childSnapshot, prevChildKey) {
        var searchList = childSnapshot.val().search;

        var tableBody = $("#recent-searches > tbody");
        var tr = $("<tr>");

        var tdSearches = $("<td>").text(searchList);

        tr.append(tdSearches);
        tableBody.append(tr);
      });
  });

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

    var speciesControl = $("#species-control").val();
    var description = $("#sighting-description").val();
    var sightingDate = $("#sighting-date").val();
    var sightingTime = $("#sighting-time").val();
    var latitude = $("#latitude-input").val();
    var longitude = $("#longitude-input").val();

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
    .ref("/sightings")
    .on("child_added", function(childSnapshot, prevChildKey) {
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

          var layer = L.marker(
            [empLat, empLong]
            // , {icon: myIcon}
          );
          layer.addTo(group);
          layer.bindPopup();
          layer.setPopupContent(
            "<p>" +
              "Species: " +
              empSpecies +
              "</p>" +
              "<p>" +
              "Description: " +
              empDescription +
              "</p>" +
              "<p>" +
              "Seen at: " +
              empLat +
              " / " +
              empLong +
              "</p>" +
              "<p>" +
              "On: " +
              empTime +
              " on " +
              empDate +
              "</p>"
          );
        }
        recentPop();
      });
    });
});

var facts = ["fact1", "fact2", "fact3", "fact4"];

var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

$("#fact-button").on("click", function() {
  $("#fact-display").empty();

  var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

  $("#fact-display").append(whaleFactDisplay);
});
