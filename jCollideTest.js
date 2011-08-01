$(document).ready( function (){
    $('body').css('overflow', 'hidden');

    world = $('<div></div>').css('border-style', 'solid').css('border-color', 'red').width(600).height(800).css('position', 'absolute').offset({left: 10, top: 10}).appendTo('body');

    for(var i = 0; i < 4; ++i){
	$('<div class="jBody"><p>Hello</p></div>').css('border-style', 'solid').width(100).height(75).css('position', 'absolute').offset({left: 30, top: 30 + 100*i}).appendTo(world);
    }
    var elems = $.map($('.jBody'), function(e){return new jcBody(e);});
    elems[0].velocity.x = 800;

    jcLoop(elems, 
	   jcGravity(new jcVec2(0, 100)));
});
