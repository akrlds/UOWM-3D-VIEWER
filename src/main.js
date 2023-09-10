import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', init);

function init() {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  var dampingFactor = 0.1;
  var cameraVelocity = new THREE.Vector3();
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xeeeeee, 1);
  document.getElementById('canvas').appendChild(renderer.domElement);

  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  var ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  const captureButton = document.getElementById('captureButton');
  const closeButton = document.getElementById('closeButton');
  function loadModel(data) {
    var loader = new GLTFLoader();
    loader.parse(data, '', function (gltf) {
      var model = gltf.scene;
      scene.add(model);

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);

      var distance = maxDim / Math.tan(camera.fov * (Math.PI / 180) / 2);

      camera.position.copy(center);
      camera.position.z += distance;
      camera.lookAt(center);

      var near = maxDim / 100;
      var far = maxDim * 100;
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();

      controls.target.copy(center);
      controls.update();
      hideInfoScreen();
      captureButton.style.display = 'block';
      closeButton.style.display = 'block';
    });
  }

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const fileInput = document.getElementById('file-upload');
  fileInput.addEventListener('change', handleFileUpload);

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const data = event.target.result;
        clearScene();
        loadModel(data);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  const loader = document.getElementById('loader');
  const demoContainer = document.getElementById('demo-container');
  const demoButton = document.getElementById('demoButton');
  demoButton.addEventListener('click', loadDemoModel);

  function hideInfoScreen() {
    const infoScreen = document.getElementById('infoScreen');
    infoScreen.style.display = 'none';
  }
  function animate() {
    requestAnimationFrame(animate);

    cameraVelocity.x *= 1 - dampingFactor;
    cameraVelocity.y *= 1 - dampingFactor;
    cameraVelocity.z *= 1 - dampingFactor;

    camera.position.add(cameraVelocity);

    controls.update();

    renderer.render(scene, camera);
  }

  animate();

  function clearScene() {
    scene.children.forEach(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        scene.remove(child);
      }
    });
  }

  function loadDemoModel() {
    demoButton.disabled = true;
    demoButton.style.backgroundColor = '#6D6F71';
    loader.style.display = 'inline-block';
    demoContainer.style.display = 'none';
    const url = 'models/model.glb';
    const loader = new GLTFLoader();
    loader.load(
      url,
      function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        var box = new THREE.Box3().setFromObject(model);
        var center = box.getCenter(new THREE.Vector3());
        var size = box.getSize(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);

        var distance = maxDim / Math.tan(camera.fov * (Math.PI / 180) / 2);
        var target = center.clone();

        camera.position.copy(center);
        camera.position.z += distance;
        camera.lookAt(center);

        var near = maxDim / 100;
        var far = maxDim * 100;
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();

        controls.target.copy(center);
        controls.update();
        captureButton.style.display = 'block';
        closeButton.style.display = 'block';
        hideInfoScreen();
        demoButton.disabled = false;
        demoButton.style.backgroundColor = '#303030';
        loader.style.display = 'none';
        demoContainer.style.display = 'inline-block';
      },
      undefined,
      function (error) {
        console.error('Error loading model:', error);
        demoButton.disabled = false;
        demoButton.style.backgroundColor = '#303030';
        loader.style.display = 'none';
        demoContainer.style.display = 'inline-block';
      }
    );
  }

  captureButton.addEventListener('click', captureScene);

  function captureScene() {
    const pixelRatio = 3;
    const originalPixelRatio = renderer.getPixelRatio();
    renderer.setPixelRatio(pixelRatio);
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    renderer.setPixelRatio(originalPixelRatio);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');
    const formattedTime = currentDate.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/:/g, '');
    const filename = `render_${formattedDate}_${formattedTime}.png`;

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    link.click();
  }

  closeButton.addEventListener('click', closeScene);

  function closeScene() {
    clearScene();
    infoScreen.style.display = 'block';
    captureButton.style.display = 'none';
    closeButton.style.display = 'none';
    onWindowResize();
  }

  window.addEventListener('resize', onWindowResize);
  onWindowResize();

  function onWindowResize() {
    const navbarHeight = 60;
    const canvasContainer = document.getElementById('canvasContainer');
    const newHeight = window.innerHeight - navbarHeight;
    canvasContainer.style.height = `${newHeight}px`;

    camera.aspect = window.innerWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, newHeight);
  }
}