
/*rest = restitution coefficient, quadratic in distance
  damp = damping coefficient
pad = "buffer" around objects for collision detection,
compensating for use of penalty forces
 */
var jcGlobals = { rest : 30,
		  damp : 50,
		  pad : 10};

function jcVec2(x,y){
    this.x = x;
    this.y = y;
}

/*
takes a jquery element that its attached to
*/
function jcBody(elem) {
    
    this.elem = $(elem);
    console.log(this.elem.offset());
    //this.elem.css('position' , 'relative');   
    this.acceleration = new jcVec2(0,0);
    this.velocity = new jcVec2(0,0);
    this.mass = 2;
    this.force = new jcVec2(0,0);
    var v = this.elem.offset();
    console.log(v);
    console.log(v.top);
    this.position = {top : v.top, left : v.left};
    console.log(this.position);
    console.log(this.position.top);
    console.log(this.elem.offset());

    this.applyForce = function(f){
	this.force.x += f.x;
	this.force.y += f.y;
    }
    this.clearForces = function(){
	this.force.x = 0;
	this.force.y = 0;
    }
    //FIXME, multiple steps, stable integrator
    this.update = function(dt){
	this.acceleration.x = this.force.x/this.mass;
	this.acceleration.y = this.force.y/this.mass;

	this.velocity.x += this.acceleration.x*dt;
	this.velocity.y += this.acceleration.y*dt;


	this.position.left += this.velocity.x *dt;
	this.position.top += this.velocity.y*dt;

    }
    this.reposition = function(){
      this.elem.offset(this.position);
    }
    
}

//collide bodies and add penalty forces
function jcCollide(b1, b2){
    b1Pos = b1.elem.offset();
    b1Size = { left : b1.elem.width(),
	       top : b1.elem.height()};
    b2Pos = b2.elem.offset();
    b2Size = { left : b2.elem.width(),
	       top : b2.elem.height()};

    if((b2Pos.left >= b1Pos.left) && (b2Pos.left <= (b1Pos.left + b1Size.left))){
	//b2 left side intersects w/ b1.  Might be completely inside, or right side might be outside
	if((b2Pos.left + b2Size.left) >= b1Pos.left && (b2Pos.left + b2Size.left) <= (b1Pos.left + b1Size.left)){
	    //b2 is completely inside the x coordinate
	    var cy = jc_checkY(b1Pos, b1Size, b2Pos, b2Size);
	    if(cy != null){
	      var f = new jcVec2(0, cy*Math.abs(cy)*jcGlobals.rest);
		var g = new jcVec2(-f.x, -f.y);
		b1.applyForce(g);
		b2.applyForce(f);
	    }
	} else {
	    //b2's right side sticks out
	    var cy = jc_checkY(b1Pos, b1Size, b2Pos, b2Size);
	    if(cy != null){
	      var f = new jcVec2(0, cy*Math.abs(cy)*jcGlobals.rest);
		var g = new jcVec2(-f.x, -f.y);
		b1.applyForce(g);
		b2.applyForce(f);
	    }
	}
    }
    else if((b2Pos.left + b2Size.left) >= b1Pos.left && (b2Pos.left + b2Size.left) <= (b1Pos.left + b1Size.left)){
	//the right endpoint of b2 penetrates in X, left is outside
	var cy = jc_checkY(b1Pos, b1Size, b2Pos, b2Size);
	if(cy != null){
	  var f = new jcVec2(0, cy*Math.abs(cy)*jcGlobals.rest);
		var g = new jcVec2(-f.x, -f.y);
		b1.applyForce(g);
		b2.applyForce(f);
	}
    }
}
//returns penetration distance or 0 if none
function jc_checkY(b1Pos, b1Size, b2Pos, b2Size){

    if((b2Pos.top >= b1Pos.top) && (b2Pos.top <= (b1Pos.top + b1Size.top))){
	if((b2Pos.top + b2Size.top) >= b1Pos.top && (b2Pos.top + b2Size.top) <= (b1Pos.top + b1Size.top)){
	    //push toward the minimum distance
	    var r1 = b1Pos.top - b2Pos.top;
	    var r2 = (b1Pos.top + b1Size.top) - (b2Pos.top + b2Size.top);
	    if(Math.abs(r1) <= Math.abs(r2)){
		return r1;
	    }
	    return r2;
	    
	} else {
	    //push toward bottom
	    return (b1Pos.top + b1Size.top) - b2Pos.top;
	}
    }
    else if((b2Pos.top + b2Size.top) >= b1Pos.top && (b2Pos.top + b2Size.top) <= (b1Pos.top + b1Size.top)){
	//push toward top
	return b1Pos.top - b2Pos.top;
    }
    return null;
}
//apply penalty forces to keep the objects in the window
function jcBound(b, wSize){
    var bPos = b.elem.offset();
    var bSize = { left: b.elem.width(),
		  top: b.elem.height()};
    if(bPos.left < jcGlobals.pad){
      var mag = -bPos.x + jcGlobals.pad;
      b.applyForce(new jcVec2(mag*Math.abs(mag)*jcGlobals.rest - b.velocity.x*jcGlobals.damp, 0));
    }
    if(bPos.top < jcGlobals.pad){
      var mag = -bPos.top + jcGlobals.pad;
      b.applyForce(new jcVec2(0,mag*Math.abs(mag)*jcGlobals.rest - b.velocity.y*jcGlobals.damp));
    }
    if(bPos.left + bSize.left > wSize.left - jcGlobals.pad){
      var mag = (wSize.left - jcGlobals.pad - 
		 bPos.left - 
		 bSize.left);
      b.applyForce(new jcVec2(mag*Math.abs(mag)*jcGlobals.rest - b.velocity.x*jcGlobals.damp,
				0));
    }
    if(bPos.top + bSize.top > wSize.top - jcGlobals.pad){
      var mag =  (wSize.top - jcGlobals.pad -
		  bPos.top - 
		  bSize.top);
      b.applyForce(new jcVec2(0,mag*Math.abs(mag)*jcGlobals.rest - 
			      b.velocity.y*jcGlobals.damp));
    }
}

function jcLoop(bodies, callback){
  var framerate = 60;
  var physFramerate = 600;
  var dt = 1.0/physFramerate;
  var bodies = bodies;
  var wSize = {left : $(document).width(),
	       top : $(document).height()};
  
  var timer = setInterval(function () {
      var len = bodies.length;
      for(var iter = 0; iter < physFramerate/framerate; ++iter){
	for(var i = 0; i < len; ++i){
	  bodies[i].clearForces();
	  jcBound(bodies[i], wSize);
	}
	//do collisions
	for(var i = 0; i < len; ++i){
	  for(var j = 0; j < i; ++j){
	    jcCollide(bodies[i], bodies[j]);
	  }
	}
	callback(bodies);
	
	for(var i = 0; i < len; ++i){
	  bodies[i].update(dt);
	}
      }
      for(var i = 0; i < len; ++i){
	bodies[i].reposition();
	  }
    }, 1000/framerate);
}

function jcGravity(g){
    return function(bodies){
	var len = bodies.length;
	for(var i = 0; i < len; ++i){
	    var b = bodies[i];
	    b.applyForce(new jcVec2(b.mass*g.x, b.mass*g.y));
	}
    }
}
