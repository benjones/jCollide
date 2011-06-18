$(document).ready( function (){
    $('body').css('overflow', 'hidden');
    for(var i = 0; i < 1; ++i){
	$('<div><p>Hello</p></div>').css('border-style', 'solid').width(100).height(75).css('position', 'absolute').offset({left: 30, top: 30 + 100*i}).appendTo("body");
    }
    var elems = $.map($('div'), function(e){return new jcBody(e);});
    elems[0].velocity.x = 500;

    jcLoop(elems, 
	   jcGravity(new jcVec2(0, 100)));
});
