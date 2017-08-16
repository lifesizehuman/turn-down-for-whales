$(document).ready(function() {

// illegal character and copy paste prevention logic for submission form

  $('.key-filter').on("keydown", function () {
    if (event.key.replace(/[^\w\-. ]/g,'')=='') event.preventDefault();

  $('.key-filter').bind('copy paste', function (e) {
     e.preventDefault();
  });
});

// materialize select initialization

    $('select').material_select();

// ajax prefiter to enable CORS

    $.ajaxPrefilter(function(options) {
        if (options.crossDomain && $.support.cors) {
            options.url = "https://cors-anywhere.herokuapp.com/" + options.url;
        }
    });

// firebase initialization

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

// mapbox tile layer initialization

    var satellite = L.tileLayer(
            "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A", { id: "mapbox.outdoors" }),
        outdoors = L.tileLayer(
            "https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A", { id: "mapbox.outdoors" }),
        standard = L.tileLayer(
          "https://api.mapbox.com/styles/v1/lifesizehuman/cj6f69cwm1mry2rqixg8ieigr/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
          { id: "mapbox.standard"}),
        classic = L.tileLayer(
          "https://api.mapbox.com/styles/v1/lifesizehuman/cj6f6h72g28rz2rpjw2vana0x/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A",
          { id: "mapbox.classic"});


// leaflet map initialization

    var mymap = L.map("mapid", {
        center: [38, -123],
        zoom: 3,
        layers: [standard],
        scrollWheelZoom: false,
    });

// set up layer control for light and Satellite map layers

    var baseMaps = {
        Standard: standard,
        Classic: classic,
        Outdoors: outdoors,
        Satellite: satellite
    };

    L.control.layers(baseMaps).addTo(mymap);

// enable map scrolling on click

    mymap.on('click', function() {
        if (mymap.scrollWheelZoom.enabled()) {
            mymap.scrollWheelZoom.disable();
        } else {
            mymap.scrollWheelZoom.enable();
        }
    });

// get geographic coordinates on map click

    function onMapClick(mymap) {
        console.log(mymap.latlng.lat, mymap.latlng.lng);
        $("#latitude-input").val(mymap.latlng.lat);
        $("#longitude-input").val(mymap.latlng.lng);
    }

    mymap.on("click", onMapClick);

// leaflet layer group initialization

    var group = L.layerGroup([]).addTo(mymap);
    // var markers = new L.FeatureGroup();
    var recentGroup = L.layerGroup([]).addTo(mymap);
    var layer;

// populate map logic for whale hotline api species searches

    function populateMap() {
        var limit = $("#limit-input").val();
        var species = $("#species-input").val();
        var queryURL = "http://hotline.whalemuseum.org/api.json?species=" + species + "&limit=" + limit;
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

// integrates firebase entries into whale hotline api species searches

            database.ref("/sightings").limitToLast(15).on("child_added", function(childSnapshot) {

            var speciesSearch = $("select").val();
            var recSpecies = childSnapshot.val().species;
            var recDescription = childSnapshot.val().description;
            var recLat = childSnapshot.val().latitude;
            var recLong = childSnapshot.val().longitude;
            var recDate = childSnapshot.val().date;
            var recTime = childSnapshot.val().time;

          if (speciesSearch === recSpecies) {
            var recents = L.marker([recLat, recLong]).addTo(group);
            recents.bindPopup(
                "<p>" + "Species: " + recSpecies + "</p>" +
                "<p>" + "Description: " + recDescription + "</p>" +
                "<p>" + "Seen at: " + recLat + " / " + recLong + "</p>" +
                "<p>" + "On: " + recDate + " at " + recTime + "</p>"
            );
          } else return false;
          });

            $('select').change(function() {
                species = this.value;
            });
        });
    }

// limit slider logic

    var limitLabel = "Select a Search limit.";
    $('#limit-label').text(limitLabel);
    $('#limit-input').change(function() {
        limit = this.value;
        $('#limit-label').text(limit);
    });

// pushes species search queries to firebase

    function pushSearch() {
        var searchValue = $("select").val();
        database.ref("/search").push({
            search: searchValue
        });
    }

// lists 5 most recent species searches in table

    function prependSearches() {
        database.ref("/search").limitToLast(5).on("child_added", function(childSnapshot, prevChildKey) {

            var searchList = childSnapshot.val().search;
            var tableBody = $("#recent-searches > tbody");
            var tr = $("<tr>");
            var tdSearches = $("<td>").text(searchList);
            tr.prepend(tdSearches);
            tableBody.prepend(tr);
        });
    }

// reset leaflet map bounds

    var llBounds = mymap.getBounds();

// leaflet clear map logic

    function clearMap() {
      group.clearLayers();
    }

    function clearRecents() {
      recentGroup.clearLayers();
    }

// submit species search logic

    $(document).on("click", "#submit", function(event) {
        event.preventDefault();
        clearMap();
        clearRecents();
        populateMap();
        mymap.fitBounds(llBounds);
        pushSearch();
    });

    prependSearches();

// HTML geolocation button logic

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

//submit sighting button logic

    $(document).ready(function() {

        $('#species-control, #sighting-description, #latitude-input, #longitude-input, #sighting-date, #sighting-time').on('change', function() {
            if (allFilled()) $('#submit-sighting').removeAttr('disabled');
        });

        function allFilled() {
            var filled = true;
            $('body input').each(function() {
                if ($(this).val() == '') filled = false;
            });
            return filled;
        }
});

// submit sighting logic

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

// recent sightings table logic

        database.ref("/sightings").limitToLast(5).on("child_added", function(childSnapshot, prevChildKey) {

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
            var tdLocation = $("<td>").text("Lat: " + empLat + " / " + "Long: " + empLong);
            var tdDate = $("<td>").text(empDate);
            var tdTime = $("<td>").text(empTime);

            tr.prepend(tdSpecies, tdDescription, tdLocation, tdDate, tdTime);
            tableBody.prepend(tr);


// populates map with recent sightings

        function recentPop() {

            var attach = L.marker([empLat, empLong]).addTo(recentGroup);

            attach.bindPopup();
            attach.setPopupContent(
                "<p>" + "Species: " + empSpecies + "</p>" +
                "<p>" + "Description: " + empDescription + "</p>" +
                "<p>" + "Seen at: " + empLat + " / " + empLong + "</p>" +
                "<p>" + "On: " + empTime + " on " + empDate + "</p>");
        }

// checks recent group for existing layers and clears if they exist

function checkLayers() {
        if (recentGroup.hasLayer() != true) {
          recentPop();
        } else clearRecents();
      }

// recent sighting search button logic

        $(document).on("click", "#recent-sighting", function(event) {
            event.preventDefault();
            clearMap();
            checkLayers();
            mymap.fitBounds(llBounds);
        });
      });

//fact generator logic

    var facts = ["Moby Dick by Herman Melville was based on a real whale named Mocha Dick. #mochadick", "Female Humpback Whales have BFFs and reunite each year. #squadgoals", "The Blue Whale is the largest animal that has ever lived on earth.", "Beluga Whales love music and even sometimes join in synchronized dance. #bumpinbeluga", "Bowhead Whales can live for over 200 years.", "Some whales imitate human speech. A captive whale called Lugosi at the Vancouver Aquarium could reportedly say its own name.", "Whales feed by swallowing their weight in water.", "Sperm Whales sleep standing up. Scientists think they dive down and grab snatches of sleep that can last up to about 12 minutes and then slowly drift to the surface head-first.", "In any area shared by whales, everyone sings the same song. Over time, the song will change, and if the new song is catchy enough, it will spread to other populations of whales.", "Whales adopt other animals, and sometimes treat objects as surrogate babies."];

    var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

    function generateFact() {
        var whaleFactDisplay = facts[Math.floor(Math.random() * facts.length)];

        $("#fact-display").text(whaleFactDisplay);

    }

    $("#fact-button").on("click", function() {
        generateFact();
    });

    //timepicker and datepicker pulled from materialize docs

    $('.timepicker').pickatime({
        default: 'now', // Set default time: 'now', '1:30AM', '16:30'
        fromnow: 0, // set default time to * milliseconds from now (using with default = 'now')
        twelvehour: false, // Use AM/PM or 24-hour format
        donetext: 'OK', // text for done-button
        cleartext: 'Clear', // text for clear-button
        canceltext: 'Cancel', // Text for cancel-button
        autoclose: false, // automatic close timepicker
        ampmclickable: true, // make AM PM clickable
        aftershow: function() {} //Function for after opening timepicker
    });

    $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year,
        today: 'Today',
        clear: 'Clear',
        close: 'Ok',
        closeOnSelect: false // Close upon selecting a date,
    });

    generateFact();

});

// materialize modal initialization

$(document).ready(function(){
    $('.modal').modal();
  });
