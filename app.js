function setCookie(c_name, value, exdays)
{
  console.log("Storing access token " + value);
  var exdate=new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
  document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
  var c_value = document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1)
    {
    c_start = c_value.indexOf(c_name + "=");
    }
  if (c_start == -1)
    {
    c_value = null;
    }
  else
    {
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1)
    {
  c_end = c_value.length;
  }
  c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}

function userLoggedIn() {
  $("#disconnect-button").show();
  $("#connect-container").hide();
  showUserTracks();
}

function userLoggedOut() {
  $("#disconnect-button").hide();
  $("#connect-container").show();
  $("#tracklist-container").html("");
  $("#tracklist-container").hide();
}

function showUserTracks() {
  SC.get('/me/tracks', { filter: "public" }, function(data) { 

    // Display user tracks
    for (var i=0; i<data.length; i++) {
      var track = $( "<div  class='track' id='" + data[i].id + "'>" + data[i].user.username + ", "  + data[i].title + "</div>" );
      $("#tracklist-container").append(track); 
    }

    // On select event for tracks
    $(".track").on('click', function(e) {
      trackSelected($(this).attr("id"));
    }); 

    $("#tracklist-container").show();
  }); 
}

function trackSelected(trackId) {
  console.log("Track selected " + trackId);

  $("#tracklist-container").hide();

  $("#track-container").html("" + trackId);
  $("#track-container").show();

  // Drag & drop file upload event listeners
  var dragEl = $("#track-container");
  dragEl.on('dragenter', function (e) {
      e.stopPropagation();
      e.preventDefault();
      $(this).css('border', '2px solid #0B85A1');
  });
  dragEl.on('dragover', function (e) {
       e.stopPropagation();
       e.preventDefault();
  });
  dragEl.on('drop', function (e) {  
      $(this).css('border', '2px dotted #0B85A1');
      e.preventDefault();
      if (window.FileReader ) {
        var file = e.originalEvent.dataTransfer.files[0];
        attachImageToTrack( trackId, file);
      }
  });
}

function attachImageToTrack(trackId, file) {
    console.log(file);
    var r = new FileReader();
    if ( !file.type.match('image\/.*') )
      return false;
    
    // Display image in kaleidoscope
    r.onload = function( e ) {
      $(".ksc").css( 'background-image', [ 'url(', e.target.result, ')' ].join( '' ) );
    };
    
    r.readAsDataURL( file );

    // Save image file to Parse
    var name = "photo.jpg";
    var parseFile = new Parse.File(name, file);

    parseFile.save().then(function() {
      var newImage = new Parse.Object("Image");
      newImage.set("imageFile", parseFile);
      newImage.set("trackId", trackId);

      return newImage.save();
    }, function(error) {
      console.log("File could not be save to Parse");
    }).then(function(image) {
      console.log('New image object created');
    }, function (error) {
      console.log(error);
    });
} 

function getUrlParameters(name) {
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results != null ? results[1] : 0;
}


function bloom(trackId) {
  SC.get('/tracks/'+trackId, { }, function(track) {

    var Image = Parse.Object.extend("Image");
    var query = new Parse.Query(Image);
    query.equalTo("trackId", trackId);

    query.find().then(function(results) {
  
      // Store all image urls
      var kaleidoImages = new Array();
      if (results.length > 0) {
        for (var i = 0; i < results.length; i++) {
          var photo = results[i].get("imageFile");
          kaleidoImages.push(photo.url());
        }
      }
      else
        kaleidoImages.push("assets/photo.jpg");

      // Set up player
      setTrackPlayer(track, kaleidoImages);
      
    }, function(error) {
      console.log(error);
    });

  });
}

function positionString(sec) {
  var sec1 = 0;  // single seconds
  var sec2 = 0;  // tens of seconds
  var min = 0;  // minutes

  var sec2_tmp = sec; // stores seconds left after removing minutes
  var sec1_tmp = sec; // stores seconds left after tens of seconds

  // Minutes
  if (sec >= 60) {
    sec2_tmp = sec % 60; 
    min = (sec - sec2_tmp) / 60;
  }
  // Tens of seconds
  if (sec >= 10) {
    sec1_tmp = sec2_tmp % 10;
    sec2 = (sec2_tmp - sec1_tmp) / 10;
  }
  // Remaining seconds
  sec1 = sec1_tmp;

  return min + ":" + sec2 + sec1;
}

function setTrackPlayer(trackObj, kaleidoImages) {
  // Title and username
  $("#track-player").find(".tracktitle").html(trackObj.title);
  $("#track-player").find(".username").html(trackObj.user.username);
  $("#track-player").find(".titles").attr("href", trackObj.permalink_url);
  $("#track-player").show();

  var playing = false; 
  var sound;

  SC.stream("/tracks/" + trackObj.id, function(streamed){
    sound = streamed;
  });

  // Set first image for kaleidoscope
  setKaleidoImage(kaleidoImages[0]);
  // Preload remaining images
  for (var i = 1; i < kaleidoImages.length; i++) {
    var img = new Image();
    img.src = kaleidoImages[i];
  }
  var currentImage = 0;
  // Check if there are more than one image, imagePivot is interval to next image in seconds
  if (kaleidoImages.length > 1)
    var imagePivot = Math.floor( Math.floor(trackObj.duration / 1000) / kaleidoImages.length );
  else
    var imagePivot = 0;

  $("#playcircle").on('click', function (e) {  
    // Play button was clicked
    if (!playing) {
      playing = true;
      $("#playbutton").hide();
      $("#pausebutton").show();

      sound.play({ 

        // Position related updates
        whileplaying: function() { 
          // Update position
          var sec = Math.floor(sound.position/1000);
          $("#track-player").find(".time").html(positionString(sec));

          // Check if the next image should be displayed 
          if (imagePivot > 0 && sec > imagePivot && currentImage < (kaleidoImages.length-1)) {
            currentImage++;
            setKaleidoImage(kaleidoImages[currentImage]);
            imagePivot += imagePivot;
          }
        },

        // Track has ended
        onfinish: function() {
          playing = false;
          trackFinished(kaleidoImages[0]);
        }

      });

      // Animate Kaleidoscope
      startKaleido();
    }
    // Pause button was clicked
    else {
      playing = false;
      sound.pause();
      $("#playbutton").show();
      $("#pausebutton").hide();

      // Pause Kaleidoscope animation
      $(".caleido_cont").find(".ksc" ).stop();
    }
  });
}

function trackFinished(imageUrl) {
  $(".caleido_cont").find(".ksc" ).stop();
  setKaleidoImage(imageUrl);
  $("#track-player").find(".time").html("0:00");
  $("#playbutton").show();
  $("#pausebutton").hide();
}

function setKaleidoImage(url) {
  $(".caleido .ksc").css("background-image", "url('" + url + "')");
}

function startKaleido() {
    $(".caleido_cont").each(function(i){ 
    $(this).find(".ksc").each(function(i){ 
      $(this).css({ "background-position-x": 0, "background-position-y": 0  });
      animateSegment(this, "100%", "80%");
    });   
  });
}

function animateSegment(el, posX, posY) {
  var s = el;
  $(el).animate(
        { "background-position-x": posX, "background-position-y": posY },
        10000,
        'linear',
        function() {
          $(el).css({backgroundPosition:'0px 0px'});
          animateSegment(el, posX, posY); 
        }
      );    
  return this;
}


(function($){

  //------------------------------
  //
  // Init
  //
  //------------------------------

  // Parse setup
  Parse.initialize("fw2COe7Saq0JmTzWM6uargnLAotp1FnEiGb00xdX", "kraIdPRJY5EwCGRQBV3cDlHj1F4EMB9weRbkp2Kt");

  // SoundCloud setup
  SC.initialize({
    client_id: "c35c98d3e6f2e8f3eb8662e8af9800fc",
    redirect_uri: "https://dl.dropboxusercontent.com/u/986362/soundflower/callback.html",
    access_token: getCookie("SC_SoundFlower"),
    scope: 'non-expiring'
  });


  var paramTrack = getUrlParameters("track");
  if (paramTrack) {
    // Playback mode
    console.log(paramTrack);
    bloom(paramTrack);
  }
  else {
    startKaleido();

    // Create mode, check if user is logged in
    var act = getCookie("SC_SoundFlower");
    if (act == null || act == "" || act==undefined) {
      console.log("Not logged in " + act);
      $("#connect-container").show();
    }
    else {
      console.log("Logged in " + act);

      userLoggedIn();
    }
  }


  //------------------------------
  //
  // Connect with SoundCloud
  //
  //------------------------------

  //setCookie('SC_SoundFlower', "", 30); 

  $("#connect-button").on('click', function (e)  {
     SC.connect(function(){
        // Store access token
        setCookie('SC_SoundFlower', SC.accessToken(), 30);
        userLoggedIn();
      
      })
  });

  $("#disconnect-button").on('click', function (e)  {
    SC.accessToken(null); 
    setCookie('SC_SoundFlower', "", 30);  
    userLoggedOut();
  });  

  //------------------------------
  //
  // File upload
  //
  //------------------------------

  $(document).on('dragenter', function (e) 
  {
      e.stopPropagation();
      e.preventDefault();
  });
  $(document).on('dragover', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  });
  $(document).on('drop', function (e) 
  {
      e.stopPropagation();
      e.preventDefault();
  });

})(jQuery);

