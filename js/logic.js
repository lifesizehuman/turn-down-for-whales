$(document).ready(function() {

    $.ajaxPrefilter(function(options) {
        if (options.crossDomain && $.support.cors) {
            options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
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

    var mymap = L.map('mapid').setView([48, -123], 6);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3h5aTIwYm95MzJ0YmZrMDN1Z3BwIn0.ArVX3kcpkvnawxCcNcCWhg'
    }).addTo(mymap);

    var group = L.layerGroup([])
        .addTo(mymap);

    $("#submit").on('click', function(event) {

        var species = $('#species-input').val();

        var queryURL = "http://hotline.whalemuseum.org/api.json?species=" + species;

        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function(response) {

                for (var i = 0; i < response.length; i++) {

                var marker1 = L.marker([response[i].latitude, response[i].longitude]);
                group.addLayer();

                marker1.bindPopup(
                    "<p>" + "Species: " + response[i].species + "</p>" +
                    "<p>" + "Description: " + response[i].description + "</p>" +
                    "<p>" + "Seen at: " + response[i].latitude + " / " + response[i].longitude + "</p>" +
                    "<p>" + "On: " + response[i].sighted_at + "</p>"
                ).openPopup();
            }
            $('select').change(function() {
                species = this.value;
            })
        })
        group.clearLayers();
    })

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

            // console.log('Your current position is:');
            // console.log(`${crd.latitude}`);
            // console.log(`${crd.longitude}`);
            // console.log(`More or less ${crd.accuracy} meters.`);
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
        // var userName = $('#username').val.trim();

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
                // "</td><td>" + empBilled + 
                "</td></tr>");

            // for (var i = 0; i < childSnapshot.length; i++) {

            //     var marker2 = L.marker([childSnapshot[i].latitude, childSnapshot[i].longitude]);
            //     group.addLayer(marker2);

            //     marker2.bindPopup(
            //         "<p>" + "Species: " + response[i].species + "</p>" +
            //         "<p>" + "Description: " + response[i].description + "</p>" +
            //         "<p>" + "Seen at: " + response[i].latitude + " / " + response[i].longitude + "</p>" +
            //         "<p>" + "On: " + response[i].sighted_at + "</p>"
            //     ).openPopup();
            // }
        });
    })
