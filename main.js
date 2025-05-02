import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#c');
const loader = new GLTFLoader();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xAAAAAA);
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
// document.body.appendChild(renderer.domElement); no longer necessary bc created our own canvas

// LIGHT
const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 3, 2);
light.castShadow = true;
scene.add(light);

const skyColor = 0x96eaff
const groundColor = 0xB97A20
const skyIntensity = 3;
const skyLight = new THREE.HemisphereLight(skyColor, groundColor, skyIntensity);
scene.add(skyLight);

// YELLOW X CUBE
const geometry = new THREE.BoxGeometry(1, 1, 1);
const xMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const xCube = new THREE.Mesh(geometry, xMaterial);
xCube.position.set(5,0,0)
scene.add(xCube);

// BLUE Y CUBE
const yMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const yCube = new THREE.Mesh(geometry, yMaterial);
yCube.position.set(0,5,0)
scene.add(yCube);

// RED Z CUBE
const zMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const zCube = new THREE.Mesh(geometry, zMaterial);
zCube.position.set(0,0,5)
scene.add(zCube);

// PLANE
const width = 9
const height = 9
const planeGeometry = new THREE.PlaneGeometry(width, height)
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.set(0,-5,0)
plane.rotation.x = Math.PI / 2
scene.add(plane)

// TAMAGOTCHI MODEL
let tamagotchi = null;

loader.load('public/tamagotchi.gltf', function (gltf) {
    tamagotchi = gltf.scene
    scene.add(tamagotchi);

}, undefined, function (error) { // Loads fast enough right now to ignore onProgress

    console.error(error);

});

// Buffer Geometry PLANE (with Pearto)
const vertices = [
    // front
    { pos: [-1, -1, 10], norm: [0, 0, 1], uv: [0, 0], },
    { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0], },
    { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1], },

    { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1], },
    { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0], },
    { pos: [1, 1, 1], norm: [0, 0, 1], uv: [1, 1], },
]

const positions = [];
const normals = [];
const uvs = [];
for (const vertex of vertices) {
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
}

const tGeometry = new THREE.BufferGeometry();
const positionNumComponents = 3;
const normalNumComponents = 3;
const uvNumComponents = 2;
tGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
tGeometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
tGeometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));

const tLoader = new THREE.TextureLoader();
const tTexture = tLoader.load('pearto.png');
tTexture.colorSpace = THREE.SRGBColorSpace;
const tColor = 0xffffff
function makeInstance(tGeometry, tColor, x) {

    const tMaterial = new THREE.MeshPhongMaterial({ color: tColor, map: tTexture, side: THREE.FrontSide });

    const tPlane = new THREE.Mesh(tGeometry, tMaterial);
    tPlane.castShadow = true;
    tPlane.receiveShadow = true;
    scene.add(tPlane);

    tPlane.position.x = x;
    return tPlane;

}

const tPlane = makeInstance(tGeometry, tColor, -4)

// CAMERA
const fov = 45;
const aspect = window.innerWidth / window.innerHeight // 2;  // the canvas default
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 10);

// CAM CONTROLS (ORBIT)
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.update();

function animate() {

    xCube.rotation.x += 0.00;
    xCube.rotation.y += 0.00;

    yCube.rotation.x += 0.00;
    yCube.rotation.y += 0.00;

    zCube.rotation.x += 0.00;
    zCube.rotation.y += 0.00;

    if (tamagotchi) {
        tamagotchi.rotation.x -= 0.00;  
        tamagotchi.rotation.y -= 0.00;
    }

    renderer.render(scene, camera);

}