
/*damp = what % of speed to should objects have after collision
  wallFriction = what percentage of tangential speed to have after
*/
var jcGlobals = { damp : .5,
		wallFriction : .95};


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

//collide bodies and add impulses
function jcCollide(b1, b2, dt){
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
	    if(Math.abs(dx) < Math.abs(dy)){
		//correct along x
		var mag = (-(1 + jcGlobals.damp)*
		    (b2.velocity.x - b1.velocity.x ) + dx/(dt))/
		    ((1.0/b1.mass + 1.0/b2.mass)*dt);
		b1.applyForce(new jcVec2(-mag, 0));
		b2.applyForce(new jcVec2(mag, 0));
	    } else {
		//correct along y
		var mag = (-(1 + jcGlobals.damp)*
		    (b2.velocity.y - b1.velocity.y) + dy/(dt))/
		    ((1.0/b1.mass + 1.0/b2.mass)*dt);
		b1.applyForce(new jcVec2(0, -mag));
		b2.applyForce(new jcVec2(0, mag));
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
    if(bPos.left < 0){
	var mag = (-b.velocity.x*(1 + jcGlobals.damp) - 
		   bPos.left/(2*dt))*
	    b.mass/dt;
	var fric = b.velocity.y*(jcGlobals.wallFriction - 1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(mag ,fric));
    }
    if(bPos.top < 0){
	var mag = (-b.velocity.y*
		   (1 + jcGlobals.damp) - 
		   bPos.top/(2*dt))*b.mass/dt;
	var fric = b.velocity.x*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(fric,mag ));
    }
    if(bPos.left + bSize.left > wSize.left ){
	var mag = (-b.velocity.x*(1 + jcGlobals.damp) - 
	     (bPos.left + bSize.left - wSize.left)/(2*dt))*
		b.mass/dt;
	var fric = b.velocity.y*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(mag, fric));
    }
    if(bPos.top + bSize.top > wSize.top){
	var mag = (-b.velocity.y*
		   (1 + jcGlobals.damp) -
		   (bPos.top + bSize.top - 
		    wSize.top)/(2*dt))*b.mass/dt;
	var fric = b.velocity.x*(jcGlobals.wallFriction -1)*
		    b.mass/dt;
	b.applyForce(new jcVec2(fric, mag));
    }
}

function jcLoop(bodies, callback){
  var framerate = 60;
  var physFramerate = 480;
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
