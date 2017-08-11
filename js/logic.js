


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
    mymap.once('focus', function() { mymap.scrollWheelZoom.enable(); });
    mymap.on('click', function() {
  if (mymap.scrollWheelZoom.enabled()) {
    mymap.scrollWheelZoom.disable();
    }
    else {
    mymap.scrollWheelZoom.enable();
    }
  });

var myIcon = L.icon({
    iconUrl: 'assets/whale-icon.png',
    iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});


    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlmZXNpemVodW1hbiIsImEiOiJjajV5N3hleDIwZjE5MnFsbmVrMjNscWJqIn0.epziWwc2W3ssEQt2Cjcm1A', {

        maxZoom: 18,
        id: 'mapbox.outdoors',
    }).addTo(mymap);

    var group = L.layerGroup([]).addTo(mymap);
    var markers = new L.FeatureGroup();
    var layer;

function populateMap() {
        var species = $('#species-input').val();
        var queryURL = "http://hotline.whalemuseum.org/api.json?species=" + species;

        $.ajax({
            url: queryURL,
            method: "GET"
        }).done(function(response) {

            for (var i = 0; i < response.length; i++) {

                var layer = L.marker([response[i].latitude, response[i].longitude]
                  ,{icon: myIcon}
                );
                layer.addTo(group);

                layer.bindPopup(
                    "<p>" + "Species: " + response[i].species + "</p>" +
                    "<p>" + "Description: " + response[i].description + "</p>" +
                    "<p>" + "Seen at: " + response[i].latitude + " / " + response[i].longitude + "</p>" +
                    "<p>" + "On: " + response[i].sighted_at + "</p>"
                );
            }

            $('select').change(function() {
                species = this.value;
            })
        })
    }

    function clearMap() {
      group.clearLayers();
    }

    $(document).on('click', "#submit", function(event) {
      //  $('#mapid').empty();
        clearMap();
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
        var description = $('#sighting-description').text();
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

        var empSpecies = childSnapshot.val().species;
        var empDescription = childSnapshot.val().description;
        var empLat = childSnapshot.val().latitude;
        var empLong = childSnapshot.val().longitude;
        var empDate = childSnapshot.val().date;
        var empTime = childSnapshot.val().time;

        // function  (empDescription)  {
        //     return $( $.parseHTML(html) ).text();
        // }
        //
        //
        // empDescription = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");


        $("#species-table > tbody").append(
            "<tr><td>" + empSpecies +
            "</td><td>" + empDescription +
            "</td><td>" + "Lat: " + empLat + " / Long: " + empLong +
            "</td><td>" + empDate +
            "</td><td>" + empTime +
            "</td></tr>");

    $('#recent-sighting').on('click', function(event) {
        event.preventDefault();

        function recentPop() {

                    var layer = L.marker([empLat, empLong]
                      , {icon: myIcon}
                    ).addTo(group);
                    layer.addTo(group);
                    layer.bindPopup(
                        "<p>" + "Species: " + empSpecies + "</p>" +
                        "<p>" + "Description: " + empDescription + "</p>" +
                        "<p>" + "Seen at: " + empLat + " / " + empLong + "</p>" +
                        "<p>" + "On: " + empTime + " on " + empDate + "</p>"
                    );
                  }
        // clearMap();
        recentPop();
    })
  })

  //   var ref = firebase.database().ref("turn-down-for-whales");
  //   ref.once("value")
  // .then(function(snapshot) {
  //   var a = snapshot.numChildren(); // 1 ("name")
  //   var b = snapshot.child("name").numChildren(); // 2 ("first", "last")
  //   var c = snapshot.child("name/first").numChildren(); // 0
  // });

    });
