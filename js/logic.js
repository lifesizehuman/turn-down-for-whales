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

                var marker = L.marker([response[i].latitude, response[i].longitude]);
                group.addLayer(marker);

                marker.bindPopup(
                    "<p>" + "Species: " + response[i].animal + "</p>" +
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

    $('#submit-sighting').on('click', function(event) {
        event.preventDefault();

        var speciesControl = $('#species-control').val();
        var description = $('#sighting-description').val();
        var sightingDate = $('#sighting-date').val().trim;
        var sightingTime = $('#sighting-time').val().trim;
        // var userName = $('#username').val.trim();

        database.ref().push({
            species: speciesInput,
            description: description
        })
    })
})