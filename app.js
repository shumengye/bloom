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
          //animateSegment(el, posX, posY); 
        }
      );    
  return this;
}

function readFile( file ) {
    console.log(file);
    var r = new FileReader();
    if ( !file.type.match('image\/.*') ) {
      return false;
    }
    
    r.onload = function( e ) {
      $(".ksc").css( 'background-image', [ 'url(', e.target.result, ')' ].join( '' ) );
    };
    
    r.readAsDataURL( file );


    var name = "photo.jpg";
    var parseFile = new Parse.File(name, file);
    parseFile.save().then(function() {
      console.log("file saved to parse");
      var newImage = new Parse.Object("Image");
      newImage.set("imageFile", parseFile);
      newImage.save(null, {

        success: function(Image) {
            console.log('New image object created');
        },
        error: function(Image, error) {  
            console.log(error);
          }
      });

    }, function(error) {
      console.log(error);
    });

  } 



(function($){

  // Parse setup
  Parse.initialize("fw2COe7Saq0JmTzWM6uargnLAotp1FnEiGb00xdX", "kraIdPRJY5EwCGRQBV3cDlHj1F4EMB9weRbkp2Kt");


  //------------------------------
  //
  // Kaleidoscope animation
  //
  //------------------------------
  startCaleidoscope();


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

