var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	then,			// Time last frame was rendered
	t = 0,			// Time since start of simulation (seconds)
	dt,				// Time between last and current frame
	mul = 40,		// pixels per meter multiplier
	g = 9.81,		// acceleration of gravity
	objects = [],	// All physics-bound objects
	constraints = []; // All constraints / springs
	
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
	
	// set objects
	objects.push(
		box1 = {
			// primary
			pos: { x: 3, y: 8 }, // center of mass position
			angle: 0, // (radians) (>0 means CCW)
			p: { x: 0, y: 0 }, // momentum (vector)
			angularP: 0, // angular momentum
			Finput: { x: 0, y: 0 },
			Fnet: { x: 0, y: 0 }, // applied net force (vector)
			
			// secondary
			v: { x: 0, y: 0 }, // velocity (vector)
			angularV: 0, // angular velocity
			
			// constants
			mass: 5, // (kg)
			inverseMass: 0, // = 1 / mass
			inertia: 0,
			inverseInertia: 0,
			Fg: { x: 0, y: 0 }, // force of gravity
			
			// draw vars
			shape: 'square',
			width: 1, // (m)
			height: 1
		},
		circle1 = {
			// primary
			pos: { x: 10, y: 10 }, // center of mass position
			angle: 0, // (radians) (>0 means CCW)
			p: { x: 0, y: 0 }, // momentum (vector)
			angularP: 0, // angular momentum
			Finput: { x: 0, y: 0 },
			Fnet: { x: 0, y: 0 }, // applied net force (vector)
			
			// secondary
			v: { x: 0, y: 0 }, // vector
			angularV: 0, // angular velocity
			
			// constants
			mass: 100, // (kg)
			inverseMass: 0, // = 1 / mass
			inertia: 0,
			inverseInertia: 0,
			Fg: { x: 0, y: 0 }, // force of gravity
			
			// draw vars
			shape: 'circle',
			radius: 1, // (m)
			
			// test
			Flinear: { x: 0, y: 0 },
			p: { x: 0, y: 0 }, // point of force application relative to object
			dPerpendicular: { x: 0, y: 0 },
			angularForce: { x: 0, y: 0}
		}
	);
	
	// set constants
	for (var i=0; i<objects.length; i++) {
		objects[i].inverseMass = 1 / objects[i].mass;
		if (objects[i].shape == 'square') {
			objects[i].inertia = (1/12) * objects[i].mass * (Math.pow(objects[i].height,2) + Math.pow(objects[i].width,2));
		} else if (objects[i].shape == 'circle') {
			objects[i].inertia = (1/2) * objects[i].mass * Math.pow(objects[i].radius,2);
		};
		if (objects[i].inertia !== 0) {
			objects[i].inverseInertia = 1 / objects[i].inertia;
		};
//		objects[i].Fg.y = objects[i].mass * -g;
	};
	
	constraints.push (
		constraint1 = {
			// constants
			frequency: 5,
			dampingRatio: 0.5,
			
			// variables
			beta: .5,
			gamma: 0.01,
			point1: { x: 0, y: 0 },	// attachment points
			point2: { x: 0, y: 0 },
			d: 0,					// desired distance between attachment points
			c: { x: 0, y: 0 },		// position error or distance from spring equilibrium
			v: { x: 0, y: 0 }		// velocity
		}
	);
	
	// Enable keyboard input
	window.addEventListener("keydown", onKeyDown, false);
	window.addEventListener("keyup", onKeyUp, false);
	
	physics();
	draw();
	displayFPS();
};
/////////////
// PHYSICS //
/////////////
function physics() {
	now = Date.now();
	dt = (now - then) / 1000;
	t += dt;
	
	for (var i=0; i<objects.length; i++) {
	
//		var Flinear = { x: 1, y: -.5 };
//		var d = { x: -.8, y: 1.2 }; // point of force application relative to object
//		objects[i].Flinear = Flinear;
//		objects[i].d = d;
		
		// LINEAR MOTION
		
		// sum forces to net force
		objects[i].Fnet = sumVectors(objects[i].Finput, objects[i].Fg);
		// update momentum from applied force
		objects[i].p = sumVectors(objects[i].p, scalarVector(objects[i].Fnet, dt));
		// update velocity from momentum
		objects[i].v = sumVectors(objects[i].p, scalarVector(objects[i].p, objects[i].inverseMass));
		
		// ROTATIONAL MOTION
		
//		var torque = cross(d, Flinear);
//		objects[i].angularP = torque * dt;
		// update angular velocity from angular momentum
		objects[i].angularV += objects[i].angularP * objects[i].inverseInertia;
		// update angle
		objects[i].angle += objects[i].angularV * dt;
	};
	
	for (i = 0; i < constraints.length; i++) {
		// SOLVE CONSTRAINTS
		constraints[0].point1.x = objects[1].radius * Math.cos(objects[1].angle) + objects[1].pos.x;
		constraints[0].point1.y = objects[1].radius * Math.sin(objects[1].angle) + objects[1].pos.y;
//		constraints[0].point1 = objects[1].pos;
		constraints[0].point2 = objects[0].pos;
		constraints[0].c = subtractVectors(constraints[0].point2, constraints[0].point1);
		
	/*	// get tangential velocity vector
		var vPoint1 = { x: 0, y: 0 };
		vPoint1 = scalarVector(subtractVectors(constraints[0].point1, objects[1].pos), objects[1].angularV);
		var temp = vPoint1.x;
		vPoint1.x = vPoint1.y;
		vPoint1.y = temp;
		vPoint1 = sumVectors(vPoint1, objects[1].v);
		// get relative velocity
		var vRel = dot(subtractVectors(vPoint1, objects[0].v), constraints[0].c);
		// get effective mass
		var mEff = 1 / vRel;
		// get k (spring stiffness) and c (damper)
		var k = mEff * constraints[0].frequency * constraints[0].frequency;
		var c = 2 * mEff * constraints[0].dampingRatio * constraints[0].frequency;
		// get softness parameters
//		constraints[0].gamma = 1 / (c + dt*k);
//		constraints[0].beta = (dt*k) / (c + dt*k);
//		document.getElementById("test").innerHTML = constraints[0].gamma+"<br/>"+constraints[0].beta;
		*/
		
		constraints[0].v.x = (constraints[0].v.x - constraints[0].beta/(objects[0].mass*constraints[0].gamma) * constraints[0].c.x) / (1 + dt/(objects[0].mass*constraints[0].gamma));
		constraints[0].v.y = (constraints[0].v.y - constraints[0].beta/(objects[0].mass*constraints[0].gamma) * constraints[0].c.y) / (1 + dt/(objects[0].mass*constraints[0].gamma));
		objects[0].v = scalarVector(sumVectors(objects[0].v, constraints[0].v), objects[1].mass / (objects[0].mass + objects[1].mass));
		objects[1].v = scalarVector(sumVectors(objects[1].v, constraints[0].v), objects[0].mass / (objects[0].mass + objects[1].mass * -1));
		objects[1].angularV = cross(objects[1].v, subtractVectors(objects[1].pos, constraints[0].point1));
	};
	
	for (i = 0; i < objects.length; i++) {
		// update position
		objects[i].pos = sumVectors(objects[i].pos, scalarVector(objects[i].v, dt));
	};
	
	then = now; // define time at which last frame was drawn for deltatime calculation
	setTimeout(physics, 1000 / 60);
};
//////////
// DRAW //
//////////
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
	
	for (var i=0; i<objects.length; i++) { // draw objects
		ctx.beginPath(); // mark center of mass (CM)
		ctx.arc(objects[i].pos.x * mul, objects[i].pos.y * mul, 1, 0, 2*Math.PI);
		ctx.strokeStyle = 'blue';
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(constraints[0].point1.x * mul, constraints[0].point1.y * mul, .1 * mul, 0, 2*Math.PI);
		ctx.strokeStyle = 'orange';
		ctx.stroke();
		
		ctx.save(); // draw object
		ctx.translate(objects[i].pos.x * mul, objects[i].pos.y * mul);
		ctx.beginPath(); // draw velocity vector
		ctx.moveTo(0, 0);
		ctx.lineTo(objects[i].v.x * mul, objects[i].v.y * mul);
		ctx.strokeStyle = 'blue';
		ctx.stroke();
/*		ctx.beginPath(); // draw net force vector
		ctx.moveTo(0, 0);
		ctx.lineTo(objects[i].Fnet.x * mul, objects[i].Fnet.y * mul);
		ctx.strokeStyle = 'red';
		ctx.stroke();*/
/*		ctx.beginPath(); // draw distance d between CM and point of force application
		ctx.moveTo(0, 0);
		ctx.lineTo(objects[i].d.x * mul, objects[i].d.y *mul);
		ctx.strokeStyle = 'orange';
		ctx.stroke();
		ctx.beginPath(); // draw Flinear
		ctx.moveTo(objects[i].d.x * mul, objects[i].d.y * mul);
		ctx.lineTo(objects[i].d.x * mul + objects[i].Flinear.x * mul, objects[i].d.y * mul + objects[i].Flinear.y *mul);
		ctx.strokeStyle = 'red';
		ctx.stroke();*/
		
		ctx.rotate(objects[i].angle);
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		if (objects[i].shape == 'square') {
			ctx.rect(-objects[i].width / 2 * mul, -objects[i].height / 2 * mul, objects[i].width * mul, objects[i].height * mul);
			ctx.stroke();
		} else if (objects[i].shape == 'circle') {
			ctx.arc(0, 0, objects[i].radius * mul, 0, 2*Math.PI);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0,0);
			ctx.lineTo(objects[i].radius * mul, 0);
			ctx.stroke();
		};
		ctx.restore();
	};
	
	// update stats
	document.getElementById("t").innerHTML = t;
	
	window.requestAnimFrame(draw);
};
function displayFPS() {
	document.getElementById("FPS").innerHTML = 1 / dt;
	setTimeout(displayFPS, 500);
};
////////////////////
// HELP FUNCTIONS //
////////////////////
function sumVectors(vector1, vector2) {
	var result = [];
	result.x = vector1.x + vector2.x;
	result.y = vector1.y + vector2.y;
	return result;
};
function subtractVectors(vector1, vector2) {
	var result = [];
	result.x = vector1.x - vector2.x;
	result.y = vector1.y - vector2.y;
	return result;
};
function scalarVector(vector, scalar) {
	var result = [];
	result.x = vector.x * scalar;
	result.y = vector.y * scalar;
	return result;
};
function dot(vector1, vector2) {
	return vector1.x * vector2.x + vector1.y * vector2.y;
};
function cross(vector1, vector2) {
	return (vector1.x * vector2.y) - (vector1.y * vector2.x);
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
				objects[0].p.x = -100;
			};
			break;
		case 38: // Up
			if (up == false) {
				up = true;
				objects[0].p.y = 100;
			};
			break;
		case 39: // Right
			if (right == false) {
				right = true;
				objects[0].p.x = 100;
			};
			break;
		case 40: // Down
			if (down == false) {
				down = true;
				objects[0].p.y = -100;
			};
			break;
		case 65: // A
			if (A == false) {
				A = true;
			};
			break;
		case 68: // D
			if (D == false) {
				D = true;
			};
			break;
		case 87: // W
			if (W == false) {
				W = true;
			};
			break;
		case 83: // S
			if (S == false) {
				S = true;
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
			objects[0].p.x = 0;
			break;
		case 38: // Up
			up = false;
			objects[0].p.y = 0;
			break;
		case 39: // Right
			right = false;
			objects[0].p.x = 0;
			break;
		case 40: // Down
			down = false;
			objects[0].p.y = 0;
			break;
		case 65: // A
			A = false;
			break;
		case 68: // D
			D = false;
			break;
		case 87: // W
			W = false;
			break;
		case 83: // S
			S = false;
			break;
	};
};