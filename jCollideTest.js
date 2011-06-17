$(document).ready( function (){
    for(var i = 0; i < 4; ++i){
	$('<div><p>Hello</p></div>').css('border-style', 'solid').appendTo("body");
    }
    var elems = $.map($('div'), function(e){return new jcBody(e);});
    jcLoop(elems,
		    jcGravity(new jcVec2(0, 10)));
});