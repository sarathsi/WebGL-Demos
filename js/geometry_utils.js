

function render() {
	renderer.render(scene, camera);
}

function triangleGeometry() {
	console.log("triangleGeometry()");
	// vertices
	var triangle = new THREE.Geometry();
	triangle.vertices.push(new THREE.Vector3(0, 0, 0));
	triangle.vertices.push(new THREE.Vector3(3, 0, 0));
	triangle.vertices.push(new THREE.Vector3(3, 3, 0));
	// face
	triangle.faces.push(new THREE.Face3(0, 1, 2));
	return triangle;
}

function squareGeometry(x1, y1, x2, y2) {
	console.log("squareGeometry()");
	var square = new THREE.Geometry();
	square.vertices.push(new THREE.Vector3(x1, y1, 0));
	square.vertices.push(new THREE.Vector3(x2, y1, +3)); // -ve z: far
	square.vertices.push(new THREE.Vector3(x2, y2, -3)); // +ve z: near
	square.vertices.push(new THREE.Vector3(x1, y2, 0));

	square.faces.push(new THREE.Face3(0, 1, 2));
	square.faces.push(new THREE.Face3(0, 3, 2));

	// Since the 60th revision of THREE.js, Face4 function has been removed.
	//square.faces.push(new THREE.Face4(0, 1, 2, 3));
	return square;
}

function PolygonGeometry(sides) {
	console.log("PolygonGeometry() sides: ", sides);
	var geo = new THREE.Geometry();

	// generate vertices
	for (var pt = 0; pt < sides; pt++) {
		// Add 90 degrees so we start at +Y axis, rotate counterclockwise around
		var angle = (Math.PI / 2) + (pt / sides) * 2 * Math.PI;
		var x = Math.cos(angle);
		var y = Math.sin(angle);
		// YOUR CODE HERE
		//Save the vertex location
		geo.vertices.push(new THREE.Vector3(x, y, 0.0));
	}

	// Write the code to generate minimum number of faces for the polygon.
	for (var face = 0; face < sides - 2; face++) {
		// this makes a triangle fan, from the first +Y point on around
		geo.faces.push(new THREE.Face3(0, face + 1, face + 2));
	}
	// Return the geometry object
	return geo;
}

function PolygonGeometry(sides, location) {
	console.log("PolygonGeometry() sides: ", sides, ", location: ", location);
	var geo = new THREE.Geometry();

	// generate vertices
	for (var pt = 0; pt < sides; pt++) {
		// Add 90 degrees so we start at +Y axis, rotate counterclockwise around
		var angle = (Math.PI / 2) + (pt / sides) * 2 * Math.PI;

		var x = Math.cos(angle) + location.x;
		var y = Math.sin(angle) + location.y;

		// Save the vertex location
		geo.vertices.push(new THREE.Vector3(x, y, 0.0));
	}

	// generate faces
	for (var face = 0; face < sides - 2; face++) {
		// this makes a triangle fan, from the first +Y point around
		geo.faces.push(new THREE.Face3(0, face + 1, face + 2));
	}
	// done: return it.
	return geo;
}

function PolygonGeometry(sides, location, radius) {
	//console.log("PolygonGeometry() sides: ", sides, ", location: ", location);
	var geo = new THREE.Geometry();

	// generate vertices
	for (var pt = 0; pt < sides; pt++) {
		// Add 90 degrees so we start at +Y axis, rotate counterclockwise around
		var angle = (Math.PI / 2) + (pt / sides) * 2 * Math.PI;

		var x = (radius * Math.cos(angle)) + location.x;
		var y = (radius * Math.sin(angle)) + location.y;

		// Save the vertex location
		geo.vertices.push(new THREE.Vector3(x, y, 0.0));
	}

	// generate faces
	for (var face = 0; face < sides - 2; face++) {
		// this makes a triangle fan, from the first +Y point around
		geo.faces.push(new THREE.Face3(0, face + 1, face + 2));
	}
	// done: return it.
	return geo;
}

