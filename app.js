/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */
class App {
  constructor() {
    console.log('--> App constructor()');
    this.onXRFrame = this.onXRFrame.bind(this);
    this.onEnterAR = this.onEnterAR.bind(this);
    this.onSelect = this.onSelect.bind(this);

    this.onAddPage = this.onAddPage.bind(this);
    this.onDeletePage = this.onDeletePage.bind(this);

    this.doAddPage = this.doAddPage.bind(this);
    this.doDeletePage = this.doDeletePage.bind(this);

    this.onDblClick = this.onDblClick.bind(this);

    // Setup Yjs for data synchronization.
    this.setupYjs = this.setupYjs.bind(this);

    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    // For Demo!
    this.maxTabs = 3;
    this.tabCount = 0;
    this.urls = [
      "https://rawgit.com/sarathsi/WebGL-Demos/master/webgl_cube1.html",
      //"https://xw.qq.com",
      "https://threejs.org/examples/#webgl_lights_hemisphere",
      //"https://threejs.org/examples/#webgl_lights_physical",
      "https://threejs.org/examples/#webgl_lights_pointlights",
      //"https://xw.qq.com",
      //"https://m.baidu.com",
      //"https://h5.m.taobao.com",
      //"https://m.csdn.net/",
      //"https://www.tmall.com/",
    ];

    this.clock = new THREE.Clock();
    this.startTime = Date.now();
    this.sceneObjects = [];

    this.pages = [];
    this.lastActiveIframe = undefined;
    this.tempFrustum = new THREE.Frustum();
    this.tempMatrix = new THREE.Matrix4();
    this.tempDir = new THREE.Vector3();
    this.tempPos = new THREE.Vector3();
    this.upVector = new THREE.Vector3(0, 1, 0);
    this.pointerLeft = document.getElementById("turn-left");
    this.pointerRight = document.getElementById("turn-right");
    this.addingPage = false;

    this.init();
    console.log('<-- App constructor()');

    // Periodically steal focus back from iframe. This however prevents any focus on input elements within the iframe!
    // On the other hand, focus on iframe freezes the 3d rendering
    // window.setInterval(this.checkFocus.bind(this), 100);
  }

  changeClickFocus() {
    console.log('changeClickFocus()');
    var checkBox = document.getElementById("change-click-focus");
    if (checkBox.checked == true) {
      this.cssRenderer.domElement.style['pointer-events'] = 'auto';

    } else {
      this.cssRenderer.domElement.style['pointer-events'] = 'none';
    }
  }

  checkFocus() {
    if (document.activeElement.tagName == "IFRAME") {
      console.log("last active iframe", document.activeElement);
      if (!this.lastActiveIframe) {
        this.lastActiveIframe = document.activeElement;
        setTimeout(() => {
          this.lastActiveIframe = undefined;
          console.log("Timeout expired");
        }, 200);
      }
      else {
        this.onDblClick(this.lastActiveIframe);
      }
      window.focus();
    }
  }

  /**
   * Fetches the XRDevice, if available.
   */
  async init() {
    console.log('--> init()');
    // The entry point of the WebXR Device API is on `navigator.xr`.
    // We also want to ensure that `XRSession` has `requestHitTest`,
    // indicating that the #webxr-hit-test flag is enabled.
    if (navigator.xr && XRSession.prototype.requestHitTest) {
      try {
        this.device = await navigator.xr.requestDevice();
      } catch (e) {
        // If there are no valid XRDevice's on the system,
        // `requestDevice()` rejects the promise. Catch our
        // awaited promise and display message indicating there
        // are no valid devices.
        this.onNoXRDevice();
        return;
      }
    } else {
      // If `navigator.xr` or `XRSession.prototype.requestHitTest`
      // does not exist, we must display a message indicating there
      // are no valid devices.
      this.onNoXRDevice();
      return;
    }

    // We found an XRDevice! Bind a click listener on our "Enter AR" button
    // since the spec requires calling `device.requestSession()` within a
    // user gesture.

    document.querySelector('#enter-ar').addEventListener('click', this.onEnterAR);
    document.querySelector('#add-tab').addEventListener('click', this.onAddPage);
    document.querySelector('#delete-tab').addEventListener('click', this.onDeletePage);

    console.log('<-- init()');
  }

  showUi() {
    let demoUi = document.querySelectorAll('.demo-ui');
    if (demoUi) {
      for (let i = 0, len = demoUi.length; i < len; ++i) {
        demoUi[i].classList.remove('demo-ui');
      }
    }

    this.hidePointers();
  }

  // Install Y.js components beforehand in root directory /bower_components/
  // Refer: http://y-js.org/
  // Call this from onSessionStarted()
  async setupYjs() {
    console.log('--> setupYjs()');

    window.yObject = await Y({
      db: {
        name: 'memory'
      },
      connector: {
        name: 'websockets-client',
        room: 'smartobject-demo',
        //url: "localhost:1234"
      },
      sourceDir: '/bower_components',
      share: {
        //webpages: 'Array',
        webpageMap: 'Map',
      }
    }).then(function (y) {
      window.Y = y;

      /*
      y.share.webpages.observe(function(event) {
        console.log("y.share.webpages.observe() event: " + event.type);
        if (event.type === 'insert') {
          console.log(event.values[0].position);
          console.log(event.values[0].url);
          window.app.doAddPage(event.values[0].position, event.values[0].url);

        } else if (event.type === 'delete') {
          // Delete the tabs in reverse order.
          window.app.doDeleteLast();
          // window.app.doDeletePage(window.app.urls[window.app.tabCount-1]);
        }

      }); // observe()
      */


      y.share.webpageMap.observe(function (event) {
        console.log("y.share.webpageMap.observe() event: " + event.type, event.name, event.value);
        if (event.type === 'add' || event.type === 'update') {
          // (Key: position, Value: url)
          window.app.doAddPage(event.name, event.value);

        } else if (event.type === 'delete') {
          // url at position event.name.
          window.app.doDeletePage(window.app.urls[event.name]);
        }

      }); // observe()

      // Update the scene at startup with current state based on window.Y.share.webpageMap.
      var keys = window.Y.share.webpageMap.keys();
      console.log('y.share.webpageMap.keys: ', keys);
      for (var i = 0; i < keys.length; i++) {
        var url = window.Y.share.webpageMap.get(keys[i].toString());
        console.log(keys[i], url);
        window.app.doAddPage(keys[i], url);
      }

    }); // then()

    console.log('<-- setupYjs()');
  }

  /**
   * Handle a click event on the '#enter-ar' button and attempt to
   * start an XRSession.
   */
  async onEnterAR() {
    console.log('--> onEnterAR()');
    // Now that we have an XRDevice, and are responding to a user
    // gesture, we must create an XRPresentationContext on a
    // canvas element.
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('xrpresent');

    try {
      // Request a session for the XRDevice with the XRPresentationContext
      // we just created.
      // Note that `device.requestSession()` must be called in response to
      // a user gesture, hence this function being a click handler.
      const session = await this.device.requestSession({
        outputContext: ctx,
        environmentIntegration: true,
      });

      // If `requestSession` is successful, add the canvas to the
      // DOM since we know it will now be used.
      document.body.appendChild(outputCanvas);
      this.onSessionStarted(session)
    } catch (e) {
      // If `requestSession` fails, the canvas is not added, and we
      // call our function for unsupported browsers.
      this.onNoXRDevice();
    }
    console.log('<-- onEnterAR()');
  }

  /**
   * Toggle on a class on the page to disable the "Enter AR"
   * button and display the unsupported browser message.
   */
  onNoXRDevice() {
    document.body.classList.add('unsupported');
  }

  async onAddPage(e) {
    console.log('onAddPage() this.tabCount: ' + this.tabCount);

    if (this.tabCount >= this.maxTabs) {
      alert('Maximum tabs allowed: ' + this.maxTabs);
      return;
    }

    // TODO - Add a menu with url list and user selection of url.

    var data = {
      position: this.tabCount,
      url: this.urls[this.tabCount]
    }
    console.log('  data.position: ' + data.position);
    console.log('  data.url: ' + data.url);

    // Array
    //Y.share.webpages.push([data]); // Data synchronization.
    //Y.share.webpages.insert(data.position, [data]);

    // Map
    Y.share.webpageMap.set(data.position, data.url);

    e.stopPropagation();
  }

  async doAddPage(position, url) {

    console.log('doAddPage() position: ', position, ' url: ', url);

    // Center page!
    if (position == 0) {
      this.pages.push(DemoUtils.create3dPage(
        // assign IFRAME ID.
        400, 500,
        new THREE.Vector3(0, 0, -0.6),
        new THREE.Vector3(0, 0, 0),
        url,
        this.scene, this.cssScene));
    }

    // Right side page
    else if (position == 1) {
      this.pages.push(DemoUtils.create3dPage(
        500, 500,
        new THREE.Vector3(0.65, 0, -0.4),
        new THREE.Vector3(0, -45 * Math.PI / 180, 0),
        url,
        this.scene, this.cssScene));
    }

    // Left side pages.
    else if (position == 2) {
      this.pages.push(DemoUtils.create3dPage(
        500, 500,
        new THREE.Vector3(-0.65, 0, -0.4),
        new THREE.Vector3(0, 45 * Math.PI / 180, 0),
        url,
        this.scene, this.cssScene));
    }


    this.session.requestAnimationFrame(this.onXRFrame);
    // alert('Adding: ' + this.urls[this.tabCount]);
    this.addingPage = true;
    this.tabCount++;
  }

  async onDeletePage(e) {
    console.log('onDeletePage()');
    // TODO: Implement a Menu with url list and user selection of url.

    var keys = window.Y.share.webpageMap.keys();
    if (keys.length > 0) {
      // Delete in the reverse order of addition.
      //console.log('  delete: ', Y.share.webpageMap.get(keys[keys.length-1].toString()));
      Y.share.webpageMap.delete(keys[keys.length - 1]);
    }
    else {
      alert('No more pages to delete!');
    }

    e.stopPropagation();
  }

  async doDeletePage(url) {
    console.log('doDeletePage() url: ' + url);
    let idx = -1;
    for (let i = 0, len = this.pages.length; i < len; ++i) {
      if (this.pages[i].url === url) {
        idx = i;
        break;
      }
    }

    if (idx !== -1) {
      let page = this.pages.splice(idx, 1);
      page[0].cleanup();
      this.tabCount--;
    }
  }


  /**
   * Called when the XRSession has begun. Here we set up our three.js
   * renderer, scene, and camera and attach our XRWebGLLayer to the
   * XRSession and kick off the render loop.
   */
  async onSessionStarted(session) {
    console.log('--> onSessionStarted()');
    this.session = session;

    this.session.addEventListener('select', this.onSelect);

    // Add the `ar` class to our body, which will hide our 2D components
    document.body.classList.add('ar');

    this.cssRenderer = DemoUtils.createCssRenderer();
    document.body.appendChild(this.cssRenderer.domElement);

    // TODO(): May provide a flag to use between WebGLRenderer and canvasElement.
    /*
    this.canvasElement = document.createElement("canvas");
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.zIndex = 1;
    this.canvasElement.style.top = 0;
    this.canvasElement.style['pointer-events'] = 'none';
    this.gl = this.canvasElement.getContext("webgl");
    this.cssRenderer.domElement.appendChild(this.canvasElement);
    */

    // Setup the WebGLRenderer, which handles rendering to our session's base layer.
    this.renderer = DemoUtils.createGlRenderer();
    this.gl = this.renderer.getContext();
    this.cssRenderer.domElement.appendChild(this.renderer.domElement);

    // Ensure that the context we want to write to is compatible
    // with our XRDevice
    await this.gl.setCompatibleXRDevice(this.session.device);

    // Set our session's baseLayer to an XRWebGLLayer
    // using our new renderer's context
    this.session.baseLayer = new XRWebGLLayer(this.session, this.gl);

    // We'll update the camera matrices directly from API, so
    // disable matrix auto updates so three.js doesn't attempt
    // to handle the matrices independently.

    /* // TEST
    this.camera = new THREE.PerspectiveCamera(
      50,					// vertical field of view
      window.innerWidth / window.innerHeight,	// frustum aspect ratio
      1,					// near plane
      1000);					// far plane
    //this.camera.position.set(0, 0, 0);
    */
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;

    // A THREE.Scene contains the scene graph for all objects in the
    // render scene.
    // Call our utility which gives us a THREE.Scene populated with
    // cubes everywhere.
    // this.scene =  DemoUtils.createCubeScene(); // createTabScene

    this.scene = DemoUtils.createCubeScene(this.sceneObjects);
    //this.scene = new THaddSpotLightREE.Scene();

    //var light = new THREE.AmbientLight( 0x404040 ); // soft white light
    //this.ambientLight = new THREE.AmbientLight(new THREE.Color(0, 0, 1), 0.9);
    //this.scene.add(this.ambientLight);
    //this.scene.add(this.spotLight());
    this.addPointLights();

    this.cssScene = new THREE.Scene();

    this.frameOfRef = await this.session.requestFrameOfReference('eye-level');
    this.session.requestAnimationFrame(this.onXRFrame);

    this.setupYjs();
    this.showUi();
    console.log('<-- onSessionStarted()');
  }

  /**
   * Called on the XRSession's requestAnimationFrame.
   * Called with the time and XRPresentationFrame.
   */
  onXRFrame(time, frame) {
    //console.log('--> onXRFrame()');
    this.stats.begin();
    let session = frame.session;
    let pose = frame.getDevicePose(this.frameOfRef);

    // Queue up the next frame
    session.requestAnimationFrame(this.onXRFrame);

    // Bind the framebuffer to our baseLayer's framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.session.baseLayer.framebuffer);

    if (pose) {
      //console.log('  onXRFrame() pose');
      // Our XRFrame has an array of views. In the VR case, we'll have
      // two views, one for each eye. In mobile AR, however, we only
      // have one view.
      for (let view of frame.views) {
        const viewport = session.baseLayer.getViewport(view);
        this.renderer.setSize(viewport.width, viewport.height);

        this.cssRenderer.setSize(500, 500);

        // this.renderer.setPixelRatio(viewport.devicePixelRatio);

        // Set the view matrix and projection matrix from XRDevicePose
        // and XRView onto our THREE.Camera.
        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        const viewMatrix = new THREE.Matrix4().fromArray(pose.getViewMatrix(view));
        this.camera.matrix.getInverse(viewMatrix);
        this.camera.updateMatrixWorld(true);

        // Needed to fix gray bg and camera feed problem on Huawei P20.
        // this.renderer.clearDepth();

        this.rotateObjects();

        // Render our scene with our THREE.WebGLRenderer
        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.cssScene, this.camera);
        this.checkIfPagesInView();
      }
    }
    this.stats.end();
    //console.log('<-- onXRFrame()');
  }

  addPointLights() {
    console.log('addPointLights()');

    var sphere = new THREE.SphereBufferGeometry(0.5, 16, 8);

    //lights
    var light = new THREE.AmbientLight(0x224466);
    light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x224466 })));
    this.scene.add(light);

    this.light1 = new THREE.PointLight(0xff0040, 2, 50);
    this.light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 })));
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0x0040ff, 2, 50);
    this.light2.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x0040ff })));
    this.scene.add(this.light2);

    this.light3 = new THREE.PointLight(0x80ff80, 2, 50);
    this.light3.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x80ff80 })));
    this.scene.add(this.light3);

    this.light4 = new THREE.PointLight(0xffaa00, 2, 50);
    this.light4.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffaa00 })));
    this.scene.add(this.light4);
  }

  rotateObjects() {
    for (let i = 0, len = this.sceneObjects.length; i < len; ++i) {
      var cube = this.sceneObjects[i];
      // animate the cube
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.0225;
      cube.rotation.z += 0.0175;
      // make the cube bounce
      var dtime = Date.now() - this.startTime;
      cube.scale.x = 1.0 + 0.3 * Math.sin(dtime / 300);
      cube.scale.y = 1.0 + 0.3 * Math.sin(dtime / 300);
      cube.scale.z = 1.0 + 0.3 * Math.sin(dtime / 300);
    }

    var time = Date.now() * 0.0005;
    var delta = this.clock.getDelta();

    this.light1.position.x = Math.sin(time * 0.7) * 30;
    this.light1.position.y = Math.cos(time * 0.5) * 40;
    this.light1.position.z = Math.cos(time * 0.3) * 30;

    this.light2.position.x = Math.cos(time * 0.3) * 30;
    this.light2.position.y = Math.sin(time * 0.5) * 40;
    this.light2.position.z = Math.sin(time * 0.7) * 30;

    this.light3.position.x = Math.sin(time * 0.7) * 30;
    this.light3.position.y = Math.cos(time * 0.3) * 40;
    this.light3.position.z = Math.sin(time * 0.5) * 30;

    this.light4.position.x = Math.sin(time * 0.3) * 30;
    this.light4.position.y = Math.cos(time * 0.7) * 40;
    this.light4.position.z = Math.sin(time * 0.5) * 30;

  }


  onSelect(event) {
    let inputPose = event.frame.getInputPose(event.inputSource, this.frameOfRef);
    if (!inputPose) {
      return;
    }

    if (inputPose.targetRay) {
      console.log('onSelect() inputPose.targetRay: %o', inputPose.targetRay);

      // Currently not using the requestHitTest().
      var origin = new Float32Array([
        inputPose.targetRay.origin.x,
        inputPose.targetRay.origin.y,
        inputPose.targetRay.origin.z]);
      var direction = new Float32Array([
        inputPose.targetRay.direction.x,
        inputPose.targetRay.direction.y,
        inputPose.targetRay.direction.z]);

      event.frame.session.requestHitTest(origin, direction, this.frameOfRef).then((results) => {
        console.log('onSelect() results: %o', results);
        // DO something with results[i].hitMatrix.
      });


      var x = inputPose.targetRay.direction.x;
      var y = inputPose.targetRay.direction.y;

      // Now open the page or do some transfermations with the 3D objects.
      if (this.pages[0] && x > -0.2 && x < 0.25) {
        //window.open(this.pages[0].url);
        var iframeWin = document.getElementById("iframe1").contentWindow;
        iframeWin.postMessage("animate", "https://rawgit.com");
        console.log('iframeWin.postMessage()');
      }
      else if (this.pages[1] && x > 0.55 && x < 0.85) {
        window.open(this.pages[1].url);
      }
      else if (this.pages[2] && x > -0.85 && x < -0.45) {
        window.open(this.pages[2].url);
      }
    }


  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  hidePointers() {
    this.pointerLeft.style.display = "none";
    this.pointerRight.style.display = "none";
  }

  showLeft() {
    this.pointerLeft.style.display = "block";
    this.pointerRight.style.display = "none";
  }

  showRight() {
    this.pointerLeft.style.display = "none";
    this.pointerRight.style.display = "block";
  }

  checkIfPagesInView() {
    if (!this.addingPage) {
      return;
    }
    if (this.pages.length < 1)
      return;

    const page = this.pages[this.pages.length - 1];
    if (!page)
      return;

    this.tempMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.tempFrustum.setFromMatrix(this.tempMatrix);
    if (this.tempFrustum.containsPoint(page.position)) {
      this.addingPage = false;
      this.hidePointers();
    } else {
      this.camera.getWorldDirection(this.tempDir);
      page.getWorldPosition(this.tempPos);
      const dir = DemoUtils.direction(this.tempDir, this.tempPos.normalize(), this.upVector);
      if (dir > 0) {
        this.showLeft();
      } else if (dir < 0) {
        this.showRight();
      } else {
        this.hidePointers();
      }
    }
  }

  async onDblClick(iframe) {
    window.open(iframe.src, "_blank");
  }
};

window.app = new App();
