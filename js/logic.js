
$(document).ready(function() {



    $.ajaxPrefilter(function(options) {
        if (options.crossDomain && $.support.cors) {
            options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
        }
    })

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

    var mymap = L.map('mapid').setView([38, -123], 3);


    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3h5aTIwYm95MzJ0YmZrMDN1Z3BwIn0.ArVX3kcpkvnawxCcNcCWhg'
    }).addTo(mymap);

    var group = L.layerGroup([])
        .addTo(mymap);

    var markers = new L.FeatureGroup();

    function populateMap() {
        var species = $('#species-input').val();
        var queryURL = "http://hotline.whalemuseum.org/api.json?species=" + species;

        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function(response) {

            for (var i = 0; i < response.length; i++) {

                var marker = L.marker([response[i].latitude, response[i].longitude]);

                marker.bindPopup(
                    "<p>" + "Species: " + response[i].species + "</p>" +
                    "<p>" + "Description: " + response[i].description + "</p>" +
                    "<p>" + "Seen at: " + response[i].latitude + " / " + response[i].longitude + "</p>" +
                    "<p>" + "On: " + response[i].sighted_at + "</p>"
                );
                markers.addLayer(marker);
            }

            $('select').change(function() {
                species = this.value;
            })
        })
        mymap.addLayer(markers);
        return false;
    }

    function clearMap() {
        mymap.removeLayer(markers);
        group.clearLayers();
    }

    $("#submit").on('click', function(event) {
        populateMap();
        var recentSearches = [];
        var searchValue = $('select').val();

        recentSearches.push(searchValue);

        for (var i = 0; i < recentSearches.length; i++) {
            $('#recent-searches > tbody').append(
                "<tr><td>" + recentSearches[i] +
                "</td></tr>");
        }
    })

    var popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent(e.latlng.toString())
            .openOn(mymap);
    }

    mymap.on('click', onMapClick);

    $('#getLocation').on('click', function(event) {
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

            $('#latitude-input').val(`${crd.latitude}`);
            $('#longitude-input').val(`${crd.longitude}`);
        };

        function error(err) {
            console.warn(`ERROR(${err.code}): ${err.message}`);
        };

        navigator.geolocation.getCurrentPosition(success, error, options);
    })

    $('#submit-sighting').on('click', function(event) {
        event.preventDefault();

        var speciesControl = $('#species-control').val();
        var description = $('#sighting-description').val();
        var sightingDate = $('#sighting-date').val();
        var sightingTime = $('#sighting-time').val();
        var latitude = $('#latitude-input').val();
        var longitude = $('#longitude-input').val();

        database.ref().push({
            species: speciesControl,
            description: description,
            date: sightingDate,
            time: sightingTime,
            latitude: latitude,
            longitude: longitude
        })

        $('#species-control').val('');
        $('#sighting-description').val('');
        $('#sighting-date').val('');
        $('#sighting-time').val('');
        $('#latitude-input').val('');
        $('#longitude-input').val('');
    })

    database.ref().on("child_added", function(childSnapshot, prevChildKey) {

        console.log(childSnapshot.val());

        // Store everything into a variable.
        var empSpecies = childSnapshot.val().species;
        var empDescription = childSnapshot.val().description;
        var empLat = childSnapshot.val().latitude;
        var empLong = childSnapshot.val().longitude;
        var empDate = childSnapshot.val().date;
        var empTime = childSnapshot.val().time;

        $("#species-table > tbody").append(
            "<tr><td>" + empSpecies +
            "</td><td>" + empDescription +
            "</td><td>" + "Lat: " + empLat + " / Long: " + empLong +
            "</td><td>" + empDate +
            "</td><td>" + empTime +
            "</td></tr>");

        $('#recent-sighting').on('click', function(event) {
            event.preventDefault();

            var empSpecies = childSnapshot.val().species;
            var empDescription = childSnapshot.val().description;
            var empLat = childSnapshot.val().latitude;
            var empLong = childSnapshot.val().longitude;
            var empDate = childSnapshot.val().date;
            var empTime = childSnapshot.val().time;

            var marker = L.marker([empLat, empLong]);
            group.addLayer(marker);

            marker.bindPopup(
                "<p>" + "Species: " + empSpecies + "</p>" +
                "<p>" + "Description: " + empDescription + "</p>" +
                "<p>" + "Seen at: " + empLat + " / " + empLong + "</p>" +
                "<p>" + "On: " + empTime + " on " + empDate + "</p>"
            );
        })
    })

    $('#clear-map').on('click', function(event) {
        markers.clearLayers();
        group.clearLayers();
    })
})
