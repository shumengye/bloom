function startCaleidoscope(f) {

    $(".caleido_cont").each(function(i){ 
    $(this).find(".ksc").each(function(i){ 
      $(this).css({ "background-position-x": 0, "background-position-y": 0  });
      $(this).animate({ "background-position-x": "100%", "background-position-y": "80%" }, 15000);
    });   
  });
}

(function($){

  startCaleidoscope();

})(jQuery);

