var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	then,			// Time last frame was rendered
	deltatime,		// Time between last and current frame
	mul = 100,		// pixels per meter multiplier
	g = 9.81,		// acceleration of gravity
	objects = [],	// All physics-bound objects
	spring,			// spring
	Ftest = 0;
	
function init() {
	// Set first time for animation deltatime loop
	then = Date.now();
	
	// Declare the canvas and rendering context
	canvas = document.getElementById("mainCanvas");
	ctx = canvas.getContext("2d");

	// Define the canvas
	canvas.width = 800;
	canvas.height = 600;
//	canvas.style.margin="0px auto";
	canvas.style.border="1px solid black";
	
	// Flip y-coordinates
	ctx.translate(0, canvas.height);
	ctx.scale(1, -1);
	
	// metersticks for rotational motion
/*	objects.push(
		meterstick1 = {
			child: function() { return objects[1]; },
			Rchild: 2,
			x: 5, // center of mass (CM)
			y: 3,
			length: 2, // in meters
			width: 0.2,
			angle: 85, // in degrees
			v: { x: 0, y: 0}, // linear velocity in m/s
			m: 2, // mass in kg
			angA: 0, // angular acceleration in radians/s^2
			angV: 0, // angular velocity in radians/s
			Icm: false, // inertia through CM
			axis: {
				fixed: true, // true if axis is fixed and not affected by physics other than player input
				x: 3, // x location
				y: 3, // y location
				Fx: 0, // force in x direction (N)
				Fy: 0, // force in y direction (N)
				ax: 0, // acceleration in x direction (m/s^2)
				ay: 0, // acceleration in y direction (m/s^2)
				vx: 0, // velocity in x direction (m/s)
				vy: 0, // velocity in y direction
				Tg: 0, // torque from gravity
				Ti: 0, // torque from player input
				Tjoint: 0, // torque from motion of object attached to joint
				Tn: 0 // net torque
				},
			r: 1, // lever arm distance for gravity, or distance from the applied force (gravity) to the axis
			Ip: false, // inertia through axis parallel to CM
			color: 'black',
			draw: function() {
				// mark axis
				ctx.beginPath();
				ctx.arc(this.axis.x * mul, this.axis.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'black';
				ctx.stroke();
				
				// mark center of mass (CM)
				ctx.beginPath();
				ctx.arc(this.x * mul, this.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'blue';
				ctx.stroke();
				
				// display stats
				document.getElementById("CMx").innerHTML = this.x;
				document.getElementById("CMy").innerHTML = this.y;
				document.getElementById("angle").innerHTML = this.angle;
				document.getElementById("angV").innerHTML = this.angV;
				document.getElementById("Ti").innerHTML = this.axis.Ti;
				
				// draw object
				ctx.save();
				ctx.translate(this.x * mul, this.y * mul);
				ctx.rotate(this.angle*Math.PI/180);
				ctx.strokeStyle = this.color;
				ctx.beginPath();
				ctx.rect(-this.length / 2 * mul, -this.width / 2 * mul, this.length * mul, this.width * mul);
				ctx.stroke();
				ctx.restore();
			}
		},
		meterstick2 = {
			attachedTo: function() { return objects[0]; },
			child: false,
			Rchild: 1,
			x: 0, // center of mass (CM)
			y: 0,
			length: 1, // in meters
			width: 0.2,
			angle: 180, // in degrees
			v: { x: 0, y: 0}, // linear velocity in m/s
			m: 0.1, // mass in kg
			angA: 0, // angular acceleration in radians/s^2
			angV: 0, // angular velocity in radians/s
			Icm: false, // inertia through CM
			axis: {
				fixed: false,
				x: 3, // x location
				y: 3, // y location
				ax: 0, // acceleration in x direction (m/s^2)
				ay: 0, // acceleration in y direction (m/s^2)
				vx: 0, // velocity in x direction (m/s)
				vy: 0, // velocity in y direction
				Tg: 0, // torque from gravity
				Ti: 0, // torque from player input
				Tjoint: 0, // torque from motion of object attatched to joint
				Tn: 0 // net torque
				},
			r: 0.5, // distance from CM to joint
			rJoint: 1, // distance from attachment point to parent object axis
			Ip: false, // inertia through axis parallel to CM
			color: 'black',
			draw: function() {
				// mark axis
				ctx.beginPath();
				ctx.arc(this.axis.x * mul, this.axis.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'black';
				ctx.stroke();
				
				// mark center of mass (CM)
				ctx.beginPath();
				ctx.arc(this.x * mul, this.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'blue';
				ctx.stroke();
				
				// draw object
				ctx.save();
				ctx.translate(this.x * mul, this.y * mul);
				ctx.rotate(this.angle*Math.PI/180);
				ctx.strokeStyle = this.color;
				ctx.beginPath();
				ctx.rect(-this.length / 2 * mul, -this.width / 2 * mul, this.length * mul, this.width * mul);
				ctx.stroke();
				ctx.restore();
			}
		}
		meterstick3 = {
			attachedTo: function() { return objects[1]; },
			child: false,
			x: 0, // center of mass (CM)
			y: 0,
			length: 1, // in meters
			width: 0.2,
			angle: -90, // in degrees
			v: { x: 0, y: 0}, // linear velocity in m/s
			m: 0.5, // mass in kg
			angA: 0, // angular acceleration in radians/s^2
			angV: 0, // angular velocity in radians/s
			Icm: false, // inertia through CM
			axis: {
				fixed: false,
				x: 3, // x location
				y: 3, // y location
				ax: 0, // acceleration in x direction (m/s^2)
				ay: 0, // acceleration in y direction (m/s^2)
				vx: 0, // velocity in x direction (m/s)
				vy: 0, // velocity in y direction
				Tg: 0, // torque from gravity
				Ti: 0, // torque from player input
				Tjoint: 0, // torque from motion of object attatched to joint
				Tn: 0 // net torque
				},
			r: 0.5, // distance from CM to joint
			rJoint: 0.5, // distance from attachment point to parent object axis
			Ip: false, // inertia through axis parallel to CM
			color: 'black',
			draw: function() {
				// mark axis
				ctx.beginPath();
				ctx.arc(this.axis.x * mul, this.axis.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'black';
				ctx.stroke();
				
				// mark center of mass (CM)
				ctx.beginPath();
				ctx.arc(this.x * mul, this.y * mul, 1, 0, 2*Math.PI);
				ctx.strokeStyle = 'blue';
				ctx.stroke();
	
				// display stats
				document.getElementById("CMx").innerHTML = this.x;
				document.getElementById("CMy").innerHTML = this.y;
				document.getElementById("angle").innerHTML = this.angle;
				document.getElementById("angV").innerHTML = this.angV;
				document.getElementById("Ti").innerHTML = this.axis.Ti;
				
				// draw object
				ctx.save();
				ctx.translate(this.x * mul, this.y * mul);
				ctx.rotate(this.angle*Math.PI/180);
				ctx.strokeStyle = this.color;
				ctx.beginPath();
				ctx.rect(-this.length / 2 * mul, -this.width / 2 * mul, this.length * mul, this.width * mul);
				ctx.stroke();
				ctx.restore();
			}
		}
	);
	
	// calculate some meterstick values
	for (var i = 0; i < objects.length; i++) {
		objects[i].r = objects[i].length / 2;
		objects[i].Icm = (1/12) * objects[i].m * Math.pow(objects[i].length,2);
		objects[i].Ip = objects[i].Icm + objects[i].m * Math.pow(objects[i].r,2);
	};*/
	
	// boxes for spring physics
	box1 = {
		CM: { x: 2, // meters
			  y: 3 },
		width: .5, // meters
		height: .5, // meters
		angle: 0, // degrees
		color: 'black',
		m: .5, // kg
		v: { x: 0, // meters per second
			 y: 0 },
		a: { x: 0, // meters per second squared
			 y: 0, },
		draw: function() {				
			// mark center of mass (CM)
			ctx.beginPath();
			ctx.arc(this.CM.x * mul, this.CM.y * mul, 1, 0, 2*Math.PI);
			ctx.strokeStyle = 'blue';
			ctx.stroke();

			// display stats
			document.getElementById("1-CMx").innerHTML = this.CM.x;
			document.getElementById("1-CMy").innerHTML = this.CM.y;
			document.getElementById("1-v").innerHTML = this.v.x;
			document.getElementById("1-a").innerHTML = this.a.x;
			
			// draw object
			ctx.save();
			ctx.translate(this.CM.x * mul, this.CM.y * mul);
			ctx.rotate(this.angle*Math.PI/180);
			ctx.strokeStyle = this.color;
			ctx.beginPath();
			ctx.rect(-this.width / 2 * mul, -this.height / 2 * mul, this.width * mul, this.height * mul);
			ctx.stroke();
			ctx.restore();
		}
	};
	box2 = {
		CM: {
			x: 5, // meters
			y: 3 // meters
			},
		width: .5, // meters
		height: .5, // meters
		angle: 0, // degrees
		color: 'black',
		m: .5, // kg
		v: { x: 0, // meters per second
			 y: 0 },
		a: { x: 0, // meters per second squared
			 y: 0, },
		draw: function() {				
			// mark center of mass (CM)
			ctx.beginPath();
			ctx.arc(this.CM.x * mul, this.CM.y * mul, 1, 0, 2*Math.PI);
			ctx.strokeStyle = 'blue';
			ctx.stroke();

			// display stats
			document.getElementById("2-CMx").innerHTML = this.CM.x;
			document.getElementById("2-CMy").innerHTML = this.CM.y;
			document.getElementById("2-v").innerHTML = this.v.x;
			document.getElementById("2-a").innerHTML = this.a.x;
			
			// draw object
			ctx.save();
			ctx.translate(this.CM.x * mul, this.CM.y * mul);
			ctx.rotate(this.angle*Math.PI/180);
			ctx.strokeStyle = this.color;
			ctx.beginPath();
			ctx.rect(-this.width / 2 * mul, -this.height / 2 * mul, this.width * mul, this.height * mul);
			ctx.stroke();
			ctx.restore();
		}
	};
	
	spring = {
		attachedTo1: function() { return box1; },
		attachedTo2: function() { return box2; },
		l: 2, // length at rest (meters)
		x: 1, //
		k: 10,// spring stiffness
		d: 0.5, // damping force
		dl: 0,// distance from resting length (meters)
		v: 0, // velocity relative to equilibrium (meters per second)
		a: 0  // acceleration relative to equilibrium (meters per second squared)
	};
	
	// Enable keyboard input
	window.addEventListener("keydown", onKeyDown, false);
	window.addEventListener("keyup", onKeyUp, false);
	
	physics();
	draw();
	displayFPS();
};

function physics() {
	// define time passed since last frame was drawn (in seconds)
	now = Date.now();
	dt = (now - then) / 1000;
	
	// spring physics
//	spring.dl = spring.attachedTo2().CM.x - spring.attachedTo1().CM.x - spring.l;
//	var Frestoring = -spring.k * spring.dl;
//	var Fdamping = -spring.d * box2.v.x;
//	document.getElementById("test").innerHTML = Frestoring;
	
	// linear motion
/*	box1.a.x = -Frestoring / box1.m;
	box1.v.x += box1.a.x * spring.d * dt;
	box1.CM.x += box1.v.x * dt;*/
	
	var I = Ftest * dt; // impulse
	box1.v.x = box1.v.x + I;
	document.getElementById("test").innerHTML = I;
	box1.CM.x = box1.CM.x + box1.v.x * dt;
	
//	var Frestoring = -spring.k * spring.x;
//	var Fnet = Frestoring;
//	var lambda = Fnet;
	
	var m = box2.m;
	var beta = 1;
	var gamma = 0.1;
	spring.v = (spring.v - beta/(m*gamma) * spring.x) / (1 + dt/(m*gamma)) - I;
	
	spring.x = spring.x + dt * spring.v;
	
//	spring.v = spring.v + dt * Fnet / box2.m;
//	spring.x = spring.x + spring.v * dt;
	
	box2.CM.x = box1.CM.x + 2 + spring.x;
	
/*	box2.a.x = Frestoring / box2.m;
	box2.v.x += box2.a.x * spring.d * dt;
	box2.CM.x += box2.v.x * dt; */
	

	// spring physics test (WARNING: explodes!)
/*	spring.dl = Math.sqrt(Math.pow(spring.attachedTo2().CM.x - spring.attachedTo1().CM.x,2) + Math.pow(spring.attachedTo2().CM.y - spring.attachedTo1().CM.y,2)) - spring.l;	
	var dx = spring.attachedTo2().CM.x - spring.attachedTo1().CM.x;
	var dy = spring.attachedTo2().CM.y - spring.attachedTo1().CM.y;
	var modX;
	var modY;
	if (dx >= 0) { modX = 1; } else { modX = -1; };
	if (dy >= 0) { modY = 1; } else { modY = -1; };
	var Frestoring = -spring.k * spring.dl;
	var angle = dy/dx;
	var FrestoringX = Math.cos(angle) * Frestoring;
	var FrestoringY = Frestoring - FrestoringX;
	document.getElementById("test").innerHTML = angle;
	
	// linear motion
	box1.a.x = -modX * FrestoringX / box1.m;
	box1.v.x += box1.a.x * dt;
	box1.CM.x += box1.v.x * dt;
	box1.a.y = -modY * FrestoringY / box1.m;
	box1.v.y += box1.a.y * dt;
	box1.CM.y += box1.v.y * dt;
	
	box2.a.x = modX * FrestoringX / box2.m;
	box2.v.x += box2.a.x * dt;
	box2.CM.x += box2.v.x * dt;
	box2.a.y = modY * FrestoringY / box1.m;
	box2.v.y += box2.a.y * dt;
	box2.CM.y += box2.v.y * dt;*/
	
	function axisMotion(obj) {
		/////////////////////
		//// AXIS MOTION ////
		/////////////////////
		
		obj.axis.ax = obj.axis.Fx / obj.m;
		obj.axis.ay = obj.axis.Fy / obj.m;
		obj.axis.vx += obj.axis.ax * deltatime;
		obj.axis.vy += obj.axis.ay * deltatime;
		obj.axis.x += obj.axis.vx * deltatime;
		obj.axis.y += obj.axis.vy * deltatime;
		
	};
	
	function rotationalMotion(obj) {		
		///////////////////////
		// ROTATIONAL MOTION //
		///////////////////////
		
		// GRAVITY
		
		// calculate force of gravity (Fg)
		var Fg = obj.m * g;
		// calculate r perpendicular (RgP)
		var RgP = obj.r * -Math.cos(obj.angle * Math.PI/180);
		// calculate force perpendicular to object angle (Fgp)
		var Fgp = RgP * Fg;
		// calculate torque from gravity
		obj.axis.Tg = obj.r * Fgp;
		
		// AXIS MOVEMENT IN X DIRECTION
		
		// calculate r perpendicular (RaxisXP)
		var RaxisXP = obj.r * -Math.cos((obj.angle + 90) * Math.PI/180);
		// calculate force perpendicular to CM
		var FaxisXP = obj.m * obj.axis.ax * RaxisXP;
		// calculate torque from axis movement
		var TaxisX = obj.r * FaxisXP;

		// AXIS MOVEMENT IN Y DIRECTION
		
		// calculate r perpendicular (RaxisYP)
		var RaxisYP = obj.r * -Math.cos(obj.angle * Math.PI/180);
		// calculate force perpendicular to CM
		var FaxisYP = obj.m * obj.axis.ay * RaxisYP;
		// calculate torque from axis movement
		var TaxisY = obj.r * FaxisYP;
		
		var Taxis = TaxisX + TaxisY;
		
		// TORQUE FROM ATTACHED CHILD OBJECT
		
		if (obj.child) {
			// force of gravity of child object
			var FgChild = 1/12 * g * obj.child().m;
			// FgChild perpendicular to current object
			var FgChildP = FgChild * obj.Rchild * -Math.cos(obj.angle * Math.PI/180);
			// resulting torque
			var Tchild = obj.Rchild * FgChildP;
//			document.getElementById("test").innerHTML = Tchild+"<br/>"+obj.axis.Tg;
		} else {
			var Tchild = 0;
		};
		
		// PLAYER TORQUE INPUT
		var Tg = obj.axis.Tg;
		var Ti = obj.axis.Ti;
		var Tjoint = obj.axis.Tjoint;
//		document.getElementById("test").innerHTML = Tjoint;
		
		// calculate net torque
		obj.axis.Tn = Tg + Ti + Taxis + Tjoint + Tchild;
		// calculate angular acceleration (alpha)
		obj.angA = obj.axis.Tn / obj.Ip;
		
		// calculate new angular velocity
		obj.angV += obj.angA * deltatime;
		// calculate new object angle
		obj.angle += (obj.angV * deltatime) / (Math.PI/180);
		// update CM location
		obj.x = obj.r * Math.cos(obj.angle*Math.PI/180) + obj.axis.x;
		obj.y = obj.r * Math.sin(obj.angle*Math.PI/180) + obj.axis.y;
	};
	
	// rotational motion loop
	/*for (var i=0; i < objects.length; i++) {
		if (objects[i].axis.fixed) {
			axisMotion(objects[i]);
		};
		
		if (objects[i].attachedTo) {
			objects[i].axis.x = objects[i].rJoint * Math.cos(objects[i].attachedTo().angle*Math.PI/180) + objects[i].attachedTo().x;
			objects[i].axis.y = objects[i].rJoint * Math.sin(objects[i].attachedTo().angle*Math.PI/180) + objects[i].attachedTo().y;
			objects[i].axis.ax = objects[i].rJoint * objects[i].attachedTo().angA * -Math.sin((objects[i].attachedTo().angle) * Math.PI/180);
			objects[i].axis.ay = objects[i].rJoint * objects[i].attachedTo().angA * Math.cos((objects[i].attachedTo().angle) * Math.PI/180);
//			console.log(-Math.cos((objects[i].attachedTo().angle - 90) * Math.PI/180));
//			document.getElementById("test").innerHTML = Math.cos((objects[i].attachedTo().angle) * Math.PI/180);
		};
		
		rotationalMotion(objects[i]);
		
		if (objects[i].attachedTo) {
			// calculate forces from current object on parent object
			var R = Math.sqrt((objects[i].x-objects[i].attachedTo().axis.x)*(objects[i].x-objects[i].attachedTo().axis.x)+(objects[i].y-objects[i].attachedTo().axis.y)*(objects[i].y-objects[i].attachedTo().axis.y));
			var Fp = objects[i].m * g * R * -Math.cos(objects[i].angle * Math.PI/180);
			objects[i].attachedTo().axis.Tjoint = Fp * R;
			document.getElementById("test").innerHTML = Fp * R;
			
			var a = objects[i].angA * objects[i].r;
			var F = objects[i].m * a;
			var Fp = F * -Math.cos((objects[i].angle - objects[i].attachedTo().angle) * Math.PI/180);
			document.getElementById("test").innerHTML = objects[i].angle - objects[i].attachedTo().angle;
			objects[i].attachedTo().axis.Tjoint = Fp * objects[i].rJoint;
		};
	};*/
	
	
	then = now; // define time at which last frame was drawn for deltatime calculation
	setTimeout(physics, 1000 / 60);
};

function displayFPS() {
	document.getElementById("FPS").innerHTML = 1 / dt;
	setTimeout(displayFPS, 500);
};

/**************************************************
** KEYBOARD INPUT
**************************************************/
var up = false,
	left = false,
	right = false,
	down = false,
	A = false,
	S = false,
	W = false,
	D = false;
	
function onKeyDown(e) {
	var that = this,
		c = e.keyCode;
	switch (c) {
		// Controls
		case 37: // Left
			if (left == false) {
				left = true;
				objects[1].axis.Ti = -1;
			};
			break;
		case 38: // Up
			if (up == false) {
				up = true;
				Ftest = 10;
			};
			break;
		case 39: // Right
			if (right == false) {
				right = true;
				objects[1].axis.Ti = 1;
			};
			break;
		case 40: // Down
			if (down == false) {
				down = true;
				Ftest = -10;
			};
			break;
		case 65: // A
			if (A == false) {
				A = true;
				objects[0].axis.Fx = -10;
			};
			break;
		case 68: // D
			if (D == false) {
				D = true;
				objects[0].axis.Fx = 10;
			};
			break;
		case 87: // W
			if (W == false) {
				W = true;
				objects[0].axis.Fy = 10;
			};
			break;
		case 83: // S
			if (S == false) {
				S = true;
				objects[0].axis.Fy = -10;
			};
			break;
	};
};

function onKeyUp(e) {
	var that = this,
		c = e.keyCode;
	switch (c) {
		case 37: // Left
			left = false;
			objects[1].axis.Ti = 0;
			break;
		case 38: // Up
			up = false;
			Ftest = 0;
			break;
		case 39: // Right
			right = false;
			objects[1].axis.Ti = 0;
			break;
		case 40: // Down
			down = false;
			Ftest = 0;
			break;
		case 65: // A
			A = false;
			objects[0].axis.Fx = 0;
			break;
		case 68: // D
			D = false;
			objects[0].axis.Fx = 0;
			break;
		case 87: // W
			W = false;
			objects[0].axis.Fy = 0;
			break;
		case 83: // S
			S = false;
			objects[0].axis.Fy = 0;
			break;
	};
};

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe the canvas clean
	
	ctx.strokeStyle = 'black';
	for (var i = 1; i < canvas.height / mul; i++) { // y-axis stripes
		ctx.beginPath();
		ctx.moveTo(0, mul*i);
		ctx.lineTo(10, mul*i);
		ctx.stroke();
	};
	for (var i = 1; i < canvas.width / mul; i++) { // x-axis stripes
		ctx.beginPath();
		ctx.moveTo(mul*i, 0);
		ctx.lineTo(mul*i, 10);
		ctx.stroke();
	};
	
/*	for (var i = 0; i < objects.length; i++) {
		objects[i].draw();
	};*/
	
	box1.draw();
	box2.draw();
	
	// spring stats
	document.getElementById("S-k").innerHTML = spring.k;
	document.getElementById("S-dl").innerHTML = spring.dl;
	
	window.requestAnimFrame(draw);
};

/**************************************************
** SUPPORTING FUNCTIONS
**************************************************/

function getTopLeft(object) {
	var point = [];
	point.x = object.x - (object.length / 2);
	point.y = object.y + (object.width / 2);
	return point;
};
function getTopRight(object) {
	var point = [];
	point.x = object.x + (object.length / 2);
	point.y = object.y + (object.width / 2);
	return point;
};
function getBottomLeft(object) {
	var point = [];
	point.x = object.x - (object.length / 2);
	point.y = object.y - (object.width / 2);
	return point;
};
function getBottomRight(object) {
	var point = [];
	point.x = object.x + (object.length / 2);
	point.y = object.y - (object.width / 2);
	return point;
};