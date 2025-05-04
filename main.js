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

// Planar Projection Camera
// const planarCamera = new THREE.PerspectiveCamera(45,1,0.01,10);
// planarCamera.position.set(0,0,2);
// planarCamera.lookAt(0,0,0);
// const planarMatrix = new THREE.Matrix4().multiplyMatrices(planarCamera.projectionMatrix, planarCamera.matrixWorldInverse); // Projector Matrix

// Pearto texture
const tLoader = new THREE.TextureLoader();
const tTexture = tLoader.load('pearto.png');
tTexture.colorSpace = THREE.SRGBColorSpace;

// TAMAGOTCHI MODEL
let tamagotchi = null;
let customDraw = false;
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
const toolPanel = document.getElementById('drawingTools');
drawCtx.fillStyle = 'white';
drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

const customCanvasTexture = new THREE.CanvasTexture(drawCanvas);
customCanvasTexture.colorSpace = THREE.SRGBColorSpace;

function planarVertexShader() {
    return `
    varying vec3 vProjector;
    void main() {
        vProjector = planarMatrix * modelMatrix * vec4(position, 1.0);
        gl_position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
    `
}

let isDrawing = false;

drawCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e);
});

drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', () => isDrawing = false);
drawCanvas.addEventListener('mouseout', () => isDrawing = false);
let drawColor = '#000000';  
document.getElementById('colorPicker').addEventListener('input', function (e) {
    drawColor = e.target.value;
});

function draw(e) {
    if (!isDrawing) return;

    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawCtx.fillStyle = drawColor;
    drawCtx.beginPath();
    drawCtx.arc(x, y, 5, 0, Math.PI * 2);
    drawCtx.fill();

    customCanvasTexture.needsUpdate = true;
}





function planarFragementShader() {
    return `
    uniform sampler2D tTexture;
    varying vec4 vProjector;
    void main() {
    }
    `
}

function tamaGeoSphere(geometry) {
    geometry.computeBoundingSphere();
    const center = geometry.boundingSphere.center;
    const radius = geometry.boundingSphere.radius;
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);

    for ( let i = 0; i < pos.count; i++ ) {
      const x = pos.getX(i) - center.x;
      const y = pos.getY(i) - center.y;
      const z = pos.getZ(i) - center.z;

      const theta = Math.atan2( z, x ); // longitude around y axis
      const phi = Math.acos( y / radius ); // latitude down y axis

      const u = ( theta + Math.PI ) / ( 2 * Math.PI ); // turning theta [-pi,pi] to [0,1]
      const v = phi / Math.PI; // turning phi [0, pi] to [0,1]

      uv[i * 2] = u -.1;
      uv[(i * 2) + 1] = 1 - v;
    }
    geometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
}

function tamaGeoCylinder(geometry) {
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3);
    const top = geometry.boundingBox.min.y;
    const bot = geometry.boundingBox.max.y;
    const h = top - bot;
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);

    for ( let i = 0; i < pos.count; i++ ) {
        const x = pos.getX(i) - center.x;
        const y = pos.getY(i) - center.y;
        const z = pos.getZ(i) - center.z;

        const theta = Math.atan2( z, x );
        const height = y;

        const u = (theta + Math.PI) / (2 * Math.PI);
        const v = (height +  (h / 2)) / h;

        uv[i * 2] = u -.1;
        uv[(i * 2) + 1] = 1 - v;
    }
    geometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ));
}

function tamaGeoEllipsoid(geometry) { 
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3);
    const xMin = geometry.boundingBox.min.x;
    const xMax = geometry.boundingBox.max.x;
    const xWidth = xMax - xMin;
    const yMin = geometry.boundingBox.min.y;
    const yMax = geometry.boundingBox.max.y;
    const yHeight = yMax - yMin;
    const zMin = geometry.boundingBox.min.z;
    const zMax = geometry.boundingBox.max.z;
    const zLength = zMax - zMin;
    const xRadius = xWidth * 0.5; // a
    const yRadius = yHeight * 0.5; // b
    const zRadius = zLength * 0.5; // c
    const pos = geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
        const px = (pos.getX(i) - center.x) / xRadius; 
        const py = (pos.getY(i) - center.y) / yRadius;
        const pz = (pos.getZ(i) - center.z) / zRadius;
        // estimate normalized points as though they were a unit sphere before calculating angles
        const theta = Math.atan2(pz, px);
        const phi = Math.acos(py); 
        const u = (theta + Math.PI) / (2 * Math.PI);
        const v = phi / Math.PI;

        uv[ 2 * i ] = u-.1;
        uv[ 2 * i + 1 ] = 1 - v;
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

let projectionType = tamaGeoSphere;

function projectionUpdate(Shell) {
    if (Shell.isMesh) {
        projectionType(Shell.geometry);
        Shell.material = new THREE.MeshPhongMaterial({
            map: tTexture,
            side: THREE.FrontSide
        })
    }
}

loader.load('public/tamagotchi_shell_only.gltf', function (gltf) {
    tamagotchi = gltf.scene
    tamagotchi.rotation.y = Math.PI / 2;
    // function shellUpdate(Shell) {
    //     if (Shell.isMesh) {
    //         const planarGeometry = Shell.geometry;
    //         const planarMaterial = new THREE.ShaderMaterial({
    //             uniforms: {
    //                 planarMatrix: { value: planarMatrix },
    //                 tTexture: { value: tTexture },
    //             },
    //             vertexShader: planarVertexShader(),
    //             fragmentShader: planarFragementShader(), 
    //         })
    //         const planarTama = new THREE.Mesh(planarGeometry, planarMaterial);
    //         scene.add(planarTama);
    //     }
    // }
    // tamagotchi.traverse(shellUpdate);
    // tamaGeoSphere(tamagotchi.geometry);

    // function sphereUpdate(Shell) {
    //     if (Shell.isMesh) {
    //         // tamaGeoSphere(Shell.geometry);
    //         // tamaGeoCylinder(Shell.geometry);
    //         tamaGeoEllipsoid(Shell.geometry);
    //         Shell.material = new THREE.MeshPhongMaterial({
    //             map: tTexture,
    //             side: THREE.FrontSide
    //         })
    //     }
    // }

    // tamagotchi.traverse(sphereUpdate);
    // tamaGeoSphere(tamagotchi.geometry);
    // tamagotchi.material = new THREE.MeshPhongMaterial({
    //     map: tTexture,
    //     side: THREE.FrontSide
    // })
    tamagotchi.traverse(projectionUpdate);
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

// const tLoader = new THREE.TextureLoader();
// const tTexture = tLoader.load('pearto.png');
// tTexture.colorSpace = THREE.SRGBColorSpace;
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

// BUTTONS (from index.html)

    document.getElementById('buttonSphere').addEventListener('click', function () {
        customDraw = false
        projectionType = tamaGeoSphere;
        toolPanel.style.display = 'none';
        if (tamagotchi) {
            tamagotchi.traverse(projectionUpdate);
        } 
    });
  
  document.getElementById('buttonCylinder').addEventListener('click', function () {
    customDraw = false
    projectionType = tamaGeoCylinder;
    toolPanel.style.display = 'none';
    if (tamagotchi) {
        tamagotchi.traverse(projectionUpdate);
    }
  });
  
  document.getElementById('buttonEllipsoid').addEventListener('click', function () {
    customDraw = false
    projectionType = tamaGeoEllipsoid;
    toolPanel.style.display = 'none';
    if (tamagotchi) {
        tamagotchi.traverse(projectionUpdate);
    }
  });

  document.getElementById('buttonDrawCustomTexture').addEventListener('click', function () {
    customDraw = !customDraw;
    document.getElementById('drawingTools').style.display = customDraw ? 'block' : 'none';
    if (customDraw) {
        if (tamagotchi) {
            tamagotchi.traverse(function (mesh) {
                if (mesh.isMesh) {
                    mesh.material.map = customCanvasTexture;
                    mesh.material.needsUpdate = true;
                }
            });
        }
    } else {
        projectionType = tamaGeoSphere
        if (tamagotchi) {
            tamagotchi.traverse(projectionUpdate);
            }
        }
    });
    document.getElementById('clearButton').addEventListener('click', function () {
        drawCtx.fillStyle = 'white';
        drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        customCanvasTexture.needsUpdate = true;
    });

  

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