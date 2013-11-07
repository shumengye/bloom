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


function startCaleidoscope(f) {

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
          console.log("anim finished");
          $(el).css({backgroundPosition:'0px 0px'});
          animateSegment(el, posX, posY); 
        }
      );    
  return this;
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
  SC.get('/me/tracks', function(data) { 

    for (var i=0; i<data.length; i++) {
      console.log(data[i]);
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

  // Create new track on server
  createNewTrack(trackId);

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

function createNewTrack(trackId) {
  // Check if Parse object already exists for this track, create one if needed
  var ParseTrack = Parse.Object.extend("Track");
  var query = new Parse.Query(ParseTrack);
  query.equalTo("trackId", trackId);
  
  query.first().then(function(object) {
    if (object == undefined) {
        var newTrack = new Parse.Object("Track");
        newTrack.set("trackId", trackId);
        return newTrack.save();
    }
    return;
  }).then(function(track) {
    if (track != undefined)
      console.log('New track object created');
    else
      console.log('Track already exists on Parse');
    console.log(track);
  }, function(error) {
    console.log(error);
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

      // Link image object to track object
      var track = new Parse.Object("Track");
      track.id = trackId;
      newImage.set("track", track);
      
      return newImage.save();
    }, function(error) {
      console.log("File could not be save to Parse");
    }).then(function(image) {
      console.log('New image object created');
    }, function (error) {
      console.log(error);
    });
} 


(function($){

  // Parse setup
  Parse.initialize("fw2COe7Saq0JmTzWM6uargnLAotp1FnEiGb00xdX", "kraIdPRJY5EwCGRQBV3cDlHj1F4EMB9weRbkp2Kt");

  // SoundCloud setup
  SC.initialize({
    client_id: "c35c98d3e6f2e8f3eb8662e8af9800fc",
    redirect_uri: "https://dl.dropboxusercontent.com/u/986362/soundflower/callback.html",
    access_token: getCookie("SC_SoundFlower"),
    scope: 'non-expiring'
  });


  //------------------------------
  //
  // Kaleidoscope animation
  //
  //------------------------------
  startCaleidoscope();

  //------------------------------
  //
  // Connect with SoundCloud
  //
  //------------------------------

  //setCookie('SC_SoundFlower', "", 30); 

  var act = getCookie("SC_SoundFlower");
  if (act == null || act == "" || act==undefined) {
    console.log("Not logged in " + act);
    
  }
  else {
    console.log("Logged in " + act);

    userLoggedIn();
  }

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
  var dragEl = $("#circle");
  dragEl.on('dragenter', function (e) 
  {
      e.stopPropagation();
      e.preventDefault();
      $(this).css('border', '2px solid #0B85A1');
      console.log("file dragged");
  });
  dragEl.on('dragover', function (e) 
  {
       e.stopPropagation();
       e.preventDefault();
  });
  dragEl.on('drop', function (e) 
  {
   
      $(this).css('border', '2px dotted #0B85A1');
      e.preventDefault();
      if (window.FileReader ) {
        var file = e.originalEvent.dataTransfer.files[0];
        readFile( file );
        console.log("file dropped " + file);
      }
  });

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

