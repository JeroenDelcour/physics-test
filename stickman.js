var canvas,				// Canvas DOM element
	ctx,				// Canvas rendering context
	mul = 100,			// screen multiplier
	pointMasses = [],	// list of all point masses
	links = [],			// list of all links between point masses
	angularConstraints=[], // list of all angular constraints
	constraintSolve = 10,// number of constraint solves per timestep
	lastTime,			// time of last gameLoop() iteration
	leftOverTime = 0,	// store time we couldn't use for the next frame
	accX = 0,
	accY = 9.81,		// gravity acceleration
	mouseX = 3 * mul,	// mouse co-ordinates in canvas
	mouseY = 1 * mul;
	
function init() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("mainCanvas");
	ctx = canvas.getContext("2d");
	
	// Define the canvas
	canvas.width = 800;
	canvas.height = 500;
//	canvas.style.margin="0px auto";

	canvas.addEventListener('mousemove', function(evt) {getMousePos(canvas, evt);}, false);
	
	// Create point masses and links
	pointMasses[0] = new pointMass(3,1,4);			// neck
	pointMasses[1] = new pointMass(2.75,1,2);		// right elbow
	pointMasses[2] = new pointMass(2.5,1,2);		// right hand
	pointMasses[3] = new pointMass(3.25,1,2);		// left elbow
	pointMasses[4] = new pointMass(3.5,1,2);		// left hand
	pointMasses[5] = new pointMass(3,1.25,15);		// spine
	pointMasses[6] = new pointMass(3,1.5,15);		// pelvis
	pointMasses[7] = new pointMass(2.75,1.5,10);	// right knee
	pointMasses[8] = new pointMass(2.5,1.5,5);		// right foot
	pointMasses[9] = new pointMass(3.25,1.5,10);	// left knee
	pointMasses[10] = new pointMass(3.5,1.5,5);		// left foot
	links[0] = new link(0.25,0,1,1);
	links[1] = new link(0.25,1,2,1);
	links[2] = new link(0.25,0,3,1);
	links[3] = new link(0.25,3,4,1);
	links[4] = new link(0.25,0,5,1);
	links[5] = new link(0.25,5,6,1);
	links[6] = new link(0.25,6,7,1);
	links[7] = new link(0.25,7,8,1);
	links[8] = new link(0.25,6,9,1);
	links[9] = new link(0.25,9,10,1);
	angularConstraints[0] = new angularConstraint(6,7,0,90);
	angularConstraints[1] = new angularConstraint(8,9,0,90);
	
	// Start game loop
	lastTime = Date.now();
	gameLoop();
//	setTimeout(gameLoop, 16);
//	setTimeout(gameLoop, 16*2);
//	setTimeout(gameLoop, 16*3);
//	setTimeout(gameLoop, 16*4);
//	setTimeout(gameLoop, 16*5);
//	setTimeout(gameLoop, 16*6);
};

function gameLoop() {
	var currentTime = Date.now();
	var elapsedTime =  currentTime - lastTime;
	lastTime = currentTime // reset lastTime
	
	// add time that couldn't be used last frame
	elapsedTime += leftOverTime;
	// divide it up in chunks of 16 ms
	var timesteps = Math.floor(elapsedTime / 16);
	// store time we couldn't use for the next frame
	leftOverTime = elapsedTime - timesteps * 16;
	
	// physics update
	for (j = 0; j < timesteps; j++) { // however many we can fit in the elapsed time
		for (l = 0; l < pointMasses.length; l++) { // for each point mass
			
			// get some values
			var x = pointMasses[l].x;
			var y = pointMasses[l].y;
			var lastX = pointMasses[l].lastX;
			var lastY = pointMasses[l].lastY;
			
			if (l == 0) {
				x = mouseX / mul;
				y = mouseY / mul;
			};
			
			// verlet integration
			var velX = x - lastX;
			var velY = y - lastY;
			if (pointMasses[l].mass == "fixed") {
				accY = 0;
			} else {
				accY = 9.81;
			};
			var nextX = x + velX + accX * 16 / 10000; // acceleration is purely for gravity
			var nextY = y + velY + accY * 16 / 10000; //
			
			pointMasses[l].lastX = x;
			pointMasses[l].lastY = y;
			
			pointMasses[l].x = nextX;
			pointMasses[l].y = nextY;
			

		}; // end for each point mass
			for (k = 0; k < constraintSolve; k++) { // for each iteration of constraint solving
				for (i = 0; i < angularConstraints.length; i++) {
					
					// find angle
					var a = links[angularConstraints[i].linkA].restingDistance;
					var b = links[angularConstraints[i].linkB].restingDistance;
					var diffX = pointMasses[angularConstraints[i].pointMassA].x - pointMasses[angularConstraints[i].pointMassC].x;
					var diffY = pointMasses[angularConstraints[i].pointMassA].y - pointMasses[angularConstraints[i].pointMassC].y;
					var c = Math.sqrt(diffX * diffX + diffY * diffY);
					var temp = (a*a+b*b-c*c)/(2*a*b);
					if (temp < -1) {
						temp += 2;
					} else if (temp > 1) {
						temp -=2;
					};
					var angle = Math.acos(temp);
					
					var targetAngle = angularConstraints[i].angleB * (Math.PI / 180);
					
					if (angle >= targetAngle) {
						var length = Math.sqrt(a*a + b*b - 2*a*b*Math.cos(targetAngle));
						links[angularConstraints[i].link].restingDistance = length;
						links[angularConstraints[i].link].on = true;
					} else {
						links[angularConstraints[i].link].on = false;
					};
				}; // end for each angular constraint
				for (i = 0; i < links.length; i++) { // solve for each link
					if (links[i].on) {
						// get some values
						var restingDistance = links[i].restingDistance;
						var p1 = pointMasses[links[i].pointMassA];
						var p2 = pointMasses[links[i].pointMassB];
						var stiffness = links[i].stiffness;
						
						// calculate the distance
						var diffX = p1.x - p2.x;
						var diffY = p1.y - p2.y;
						var d = Math.sqrt(diffX * diffX + diffY * diffY);
						
						if (d !== 0) {
							// difference scalar
							var difference = (restingDistance - d) / d;
							
							// inverted mass
							var im1 = p1.invertedMass;
							var im2 = p2.invertedMass;
							var scalarP1 = (im1 / (im1 + im2)) * stiffness;
							var scalarP2 = stiffness - scalarP1;
							
							// push or pull based on mass
							pointMasses[links[i].pointMassA].x += diffX * scalarP1 * difference;
							pointMasses[links[i].pointMassA].y += diffY * scalarP1 * difference;
							
							pointMasses[links[i].pointMassB].x -= diffX * scalarP2 * difference;
							pointMasses[links[i].pointMassB].y -= diffY * scalarP2 * difference;
						};
					}; // end if link on
				}; // end solve for each link
			}; // end for each iteration of constraint solving
				
				
			
			// boundary constraint
			if (x < 0) {
				x = 0;
//				if (velX < 0) {
//					velX = velX * -1;
//				};
			};
			if (x > canvas.width / mul) {
				x = canvas.width / mul;
//				if (velX > 0) {
//					velX = velX * -1;
//				};
			};
			if (y < 0) {
				y = 0;
//				if (velY < 0) {
//					velY = velY * -1;
//				};
			};
			if (y > canvas.height / mul) {
				y = canvas.height / mul;
//				if (velY > 0) {
//					velY = velY * -1;
//				};
			};
	}; // end physics update
	
	// draw points
	ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe the canvas clean
	for (i = 0; i < pointMasses.length; i++) {
		ctx.beginPath();
		ctx.arc(pointMasses[i].x * mul, pointMasses[i].y * mul, 5, 0, 2*Math.PI);
		ctx.fillStyle = 'black';
		ctx.fill();
	};
	// draw links
	for (i = 0; i < links.length; i++) {
		if (links[i].draw) {
			ctx.beginPath()
			ctx.moveTo(pointMasses[links[i].pointMassA].x * mul, pointMasses[links[i].pointMassA].y * mul);
			ctx.lineTo(pointMasses[links[i].pointMassB].x * mul, pointMasses[links[i].pointMassB].y * mul);
			ctx.strokeStyle = 'black';
			ctx.stroke();
		};
	};
	
	setTimeout(gameLoop, 16);
};

function rotate(a,b,theta) {
	var p1 = pointMasses[a];
	var p2 = pointMasses[b];
	var x = p1.x - p2.x;
	var y = p1.y - p2.y;
	var newX = x * Math.cos(theta) - y * Math.sin(theta) + p2.x;
	var newY = y * Math.sin(theta) + y * Math.cos(theta) + p2.y;
	pointMasses[a].x = newX;
	pointMasses[a].y = newY;
};

function getMousePos(mainCanvas, evt) {
	var rect = mainCanvas.getBoundingClientRect();
	mouseY= evt.clientY - rect.top;
	mouseX= evt.clientX - rect.left;
};

// constructors
var pointMass = function(x,y,mass) {
	this.x = x;
	this.y = y;
	this.lastX = x;
	this.lastY = y;
	this.mass = mass;
	if (mass !== "fixed") {
		this.invertedMass = 1 / mass;
	} else {
		this.invertedMass = 0;
	};
};
var link = function(restingDistance,pointMassA,pointMassB,stiffness) {
	this.restingDistance = restingDistance;
	this.pointMassA = pointMassA;
	this.pointMassB = pointMassB;
	this.stiffness = stiffness;
	this.on = true;
	this.draw = true;
};
var angularConstraint = function(l1,l2,a1,a2) {
	this.linkA = l1;
	this.linkB = l2;
	this.pointMassA = links[l1].pointMassA;
	this.pointMassB = links[l1].pointMassB;
	this.pointMassC = links[l2].pointMassB;
	this.angleA = a1;
	this.angleB = a2;
	this.link = links.length;
	links[this.link] = new link(0,this.pointMassA,this.pointMassC,0.04);
	links[this.link].draw = false;
};