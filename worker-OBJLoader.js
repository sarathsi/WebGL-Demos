
importScripts('./third_party/three.js/three.js', './third_party/three.js/OBJLoader.js');

// instantiate a loader
var loader = new THREE.OBJLoader();

// load a resource
loader.load(
	// resource URL
	'models/obj/walt/WaltHead.obj',
	// called when resource is loaded
	function (object) {
		console.log('worker - An error happened when loading!');
		// object = obj;
		// object.scale.multiplyScalar(0.3);
		// object.position.y = - 30;
		// scene.add(object);

		// object2 = object.clone();
		// object2.position.multiplyScalar(1);
		// object2.position.y = 10;
		// scene.add(object2);

	},
	// called when loading is in progresses
	function (xhr) {

		console.log((xhr.loaded / xhr.total * 100) + '% loaded');

	},
	// called when loading has errors
	function (error) {

		console.log('worker - An error happened when loading!');

	}
);


