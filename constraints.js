var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	then,			// Time last frame was rendered
	t = 0,			// Time since start of simulation (seconds)
	dt,				// Time between last and current frame
	mul = 40,		// pixels per meter multiplier
	g = 9.81,		// acceleration of gravity
	objects = [],	// All physics-bound objects
	springs = [], // All springs / springs
	joints = [];	// List of distance joints
	
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
			pos: { x: 6.5, y: 8 }, // center of mass position
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
			inverseMass: 0, // equals 1 divided by mass
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
			pos: { x: 5, y: 7 }, // center of mass position
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
			inverseMass: 0, // equals 1 divided by mass
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
		},
		circle2 = {
			// primary
			pos: { x: 14, y: 8 }, // center of mass position
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
			inverseMass: 0, // equals 1 divided by mass
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
		},
		circle3 = {
			// primary
			pos: { x: 14, y: 3 }, // center of mass position
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
			inverseMass: 0, // equals 1 divided by mass
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
	
	springs.push (
		spring1 = {
			// constants
			object1: 2,
			object2: 3,
			relDistToCM1: -1,// distance from object 1 CM to spring attachment point
			relDistToCM2: 1,// distance from object 2 CM to spring attachment point
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
	
	joints.push (
		joint1 = {
			object1: 0,
			object2: 1,
			distance: 1
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
	
		// LINEAR MOTION
		
		// sum forces to net force
		objects[i].Fnet = sumVectors(objects[i].Finput, objects[i].Fg);
		// update momentum from applied force
		objects[i].p = sumVectors(objects[i].p, scalarVector(objects[i].Fnet, dt));
		// update velocity from momentum
		objects[i].v = sumVectors(objects[i].p, scalarVector(objects[i].p, objects[i].inverseMass));
		
		// ROTATIONAL MOTION
		
		// update angular velocity from angular momentum
		objects[i].angularV += objects[i].angularP * objects[i].inverseInertia;
		// update angle
		objects[i].angle += objects[i].angularV * dt;
	};
	
	// soft constraint solver / spring constraint solver
	for (i = 0; i < springs.length; i++) {
		var o1 = springs[i].object1;
		var o2 = springs[i].object2;
		springs[i].point1.x = springs[i].relDistToCM1 * Math.cos(objects[o2].angle) + objects[o2].pos.x;
		springs[i].point1.y = springs[i].relDistToCM1 * Math.sin(objects[o2].angle) + objects[o2].pos.y;
//		springs[i].point1 = objects[o2].pos;
//		springs[i].point2 = objects[o1].pos;
		springs[i].point2.x = springs[i].relDistToCM2 * Math.cos(objects[o1].angle) + objects[o1].pos.x;
		springs[i].point2.y = springs[i].relDistToCM2 * Math.sin(objects[o1].angle) + objects[o1].pos.y;		
		springs[i].c = subtractVectors(springs[i].point2, springs[i].point1);
		
		springs[i].v.x = (springs[i].v.x - springs[i].beta/(objects[o1].mass*springs[i].gamma) * springs[i].c.x) / (1 + dt/(objects[o1].mass*springs[i].gamma));
		springs[i].v.y = (springs[i].v.y - springs[i].beta/(objects[o1].mass*springs[i].gamma) * springs[i].c.y) / (1 + dt/(objects[o1].mass*springs[i].gamma));
		objects[o1].v = scalarVector(sumVectors(objects[o1].v, springs[i].v), objects[o2].mass / (objects[o1].mass + objects[o2].mass));
		objects[o2].v = scalarVector(sumVectors(objects[o2].v, springs[i].v), -objects[o1].mass / (objects[o1].mass + objects[o2].mass));
		objects[o1].angularV = cross(objects[o1].v, subtractVectors(objects[o1].pos, springs[i].point2));
		objects[o2].angularV = cross(objects[o2].v, subtractVectors(objects[o2].pos, springs[i].point1));
	};
	
	// hard constraint solver (equality constraint)
	for (i = 0; i < joints.length; i++) {
		var o1 = joints[i].object1;
		var o2 = joints[i].object2;
		var axis = subtractVectors(objects[o2].pos, objects[o1].pos);
		var currentDistance = Math.sqrt((Math.pow(axis.x,2)+Math.pow(axis.y,2)));
		var unitAxis = scalarVector(axis,(1/currentDistance));
		var relVel = dot(subtractVectors(objects[o2].v,objects[o1].v),unitAxis);
		var constraintDistance = joints[i].distance;
		var relDist = currentDistance - constraintDistance;
		var remove = relVel+relDist/dt;
		var impulse = remove / (objects[o1].inverseMass + objects[o2].inverseMass);
		// generate impulse vector
		var I = scalarVector(unitAxis,impulse);
		objects[o1].v = sumVectors(objects[o1].v,scalarVector(I,objects[o1].inverseMass));
		objects[o2].v = subtractVectors(objects[o2].v,scalarVector(I,objects[o2].inverseMass));
	};
	
	// update positions
	for (i = 0; i < objects.length; i++) {
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
		ctx.arc(springs[0].point1.x * mul, springs[0].point1.y * mul, .1 * mul, 0, 2*Math.PI);
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
	
	// draw springs
	for (i = 0; i < springs.length; i++) {
		ctx.beginPath();
		ctx.moveTo(springs[i].point1.x * mul, springs[i].point1.y * mul);
		ctx.lineTo(springs[i].point2.x * mul, springs[i].point2.y * mul);
		ctx.strokeStyle = 'red';
		ctx.stroke();
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
				objects[0].p.x = -10;
			};
			break;
		case 38: // Up
			if (up == false) {
				up = true;
				objects[0].p.y = 10;
			};
			break;
		case 39: // Right
			if (right == false) {
				right = true;
				objects[0].p.x = 10;
			};
			break;
		case 40: // Down
			if (down == false) {
				down = true;
				objects[0].p.y = -10;
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