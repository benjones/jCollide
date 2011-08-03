
/*damp = what % of speed to should objects have after collision
  wallFriction = what percentage of tangential speed to have after
*/
var jcGlobals = { defaultDamp : 0.45,
		  defaultFriction : 0.70,
		  wallDamp : 0.5,
		  wallFriction : 0.95};


function jcVec2(x,y){
    this.x = x;
    this.y = y;
}

/*
takes a jquery element that its attached to
*/
function jcBody(elem) {
    
    this.elem = $(elem);
    //this.elem.css('position' , 'relative');   
    this.acceleration = new jcVec2(0,0);
    this.velocity = new jcVec2(0,0);
    this.mass = 2;
    this.force = new jcVec2(0,0);
    var v = this.elem.offset();
    this.position = {top : v.top, left : v.left};
    this.damping = jcGlobals.defaultDamp;
    this.friction = jcGlobals.defaultFriction;
    this.jGroup = 1;


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
      curPos = this.elem.offset();
      if(Math.round(this.position.top) != 
	 Math.round(curPos.top)
	 || Math.round(this.position.left) != 
	 Math.round(curPos.left)) {
	
	this.elem.offset(this.position);
      }
    }
    
}

//collide bodies and add impulses
function jcCollide(b1, b2, dt){
  if(b1.jGroup != b2.jGroup)
    return;
  b1Pos = b1.position;
  b1Size = { left : b1.elem.width(),
	     top : b1.elem.height()};
  b2Pos = b2.position;
  b2Size = { left : b2.elem.width(),
	     top : b2.elem.height()};
  
  dx = jCollide1D(b1Pos.left, b1Pos.left + b1Size.left,
		  b2Pos.left, b2Pos.left + b2Size.left);
  if(dx != 0){
    dy = jCollide1D(b1Pos.top, b1Pos.top + b1Size.top,
		    b2Pos.top, b2Pos.top + b2Size.top);
    if(dy != 0){
      //collision
      var dampCoeff = Math.sqrt(b1.damping * b2.damping);
      var fricCoeff = Math.sqrt(b1.friction * b2.friction);
      var relV;
      var relVTan;
      var mag;
      var fric;
      var massFactor = (1.0/b1.mass + 1.0/b2.mass);
      if(Math.abs(dx) < Math.abs(dy)){
	//correct along x
	relV = (b2.velocity.x - b1.velocity.x ); 
	relVTan = (b2.velocity.y - b1.velocity.y);
	mag = (-(1 + dampCoeff)*relV
	       + dx/(dt))/
	  (massFactor*dt);
	
	fric = relVTan*(fricCoeff -1)/(massFactor*dt);
	
	b1.applyForce(new jcVec2(-mag, -fric));
	b2.applyForce(new jcVec2(mag, fric));
      } else {
		//correct along y
	      relV = (b2.velocity.y - b1.velocity.y);
	      relVTan = (b2.velocity.x - b1.velocity.x);
		mag = (-(1 + dampCoeff)*relV
		     + dy/(dt))/
		    (massFactor*dt);
		fric = relVTan*(fricCoeff -1)/(massFactor*dt);
		b1.applyForce(new jcVec2(-fric, -mag));
		b2.applyForce(new jcVec2(fric, mag));
	    }	    
	}
    }
    //no collision
}


//seg a1 is [a1, a2], seg b = [b1, b2]
//returns how deep it is, in the direction that b
//should be pushed to get it out
function jCollide1D(a1, a2, b1, b2){
    if(a2 <= b1 || a1 >= b2){//AABB or BBAA
	return 0;// no collision
    }
    if(b1 > a1){// b1 is between a1, a2
	if(a2 <= b2){// A B A B
	    //push right
	    return a2 - b1;
	}
	else{// A B B A
	    //push right or left
	    var overlap = b2 - b1;
	    //fix sign
	    if(b1 - a1 > b2 - a2){
		overlap *= -1;
	    } 
	    return overlap;
	}
    }
    //B A ...
    if(a2 <= b2){ //B A A B
	//push left or right
	var overlap = a2 - a1;
	if(a1 - b1 > a2 - b2){
	    overlap *= -1;
	}
	return overlap;
    }
    else { //B A B A
	return a1 - b2;//push left
    }
}


//apply impuleses to keep objects in the window
function jcBound(b, wSize, dt){
    var bPos = b.position;
    var bSize = { left: b.elem.width(),
		  top: b.elem.height()};
    var parent = b.elem.parent();
    var pPos = parent.offset();
    var pSize = {left: parent.width(),
		 top: parent.height()};

    if(bPos.left < pPos.left){
	var mag = (-b.velocity.x*(1 + jcGlobals.wallDamp) - 
		   (bPos.left - pPos.left)/(2*dt))*
	    b.mass/dt;
	var fric = b.velocity.y*(jcGlobals.wallFriction - 1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(mag ,fric));
    }
    if(bPos.top < pPos.top){
	var mag = (-b.velocity.y*
		   (1 + jcGlobals.wallDamp) - 
		   (bPos.top- pPos.top)/(2*dt))*b.mass/dt;
	var fric = b.velocity.x*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(fric,mag ));
    }
    if(bPos.left + bSize.left > (pPos.left + pSize.left) ){
	var mag = (-b.velocity.x*(1 + jcGlobals.wallDamp) - 
	     (bPos.left + bSize.left - (pPos.left + pSize.left))/(2*dt))*
		b.mass/dt;
	var fric = b.velocity.y*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(mag, fric));
    }
    if(bPos.top + bSize.top > (pPos.top + pSize.top)){
	var mag = (-b.velocity.y*
		   (1 + jcGlobals.wallDamp) -
		   (bPos.top + bSize.top - 
		    (pPos.top + pSize.top))/(2*dt))*b.mass/dt;
	var fric = b.velocity.x*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(fric, mag));
    }
}

function jcLoop(bodies, callback){
  var framerate = 60;
  var physFramerate = 240;
  var dt = 1.0/physFramerate;
  var bodies = bodies;
  var wSize = {left : $(document).width(),
	       top : $(document).height()};
  
  var timer = setInterval(function () {
      var len = bodies.length;
      for(var iter = 0; iter < physFramerate/framerate; ++iter){
	for(var i = 0; i < len; ++i){
	  bodies[i].clearForces();
	  jcBound(bodies[i], wSize, dt);
	}
	//do collisions
	for(var i = 0; i < len; ++i){
	  for(var j = 0; j < i; ++j){
	    jcCollide(bodies[i], bodies[j], dt);
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
