import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#c');
const loader = new GLTFLoader();
const scene = new THREE.Scene();
const cubeTextureLoader = new THREE.CubeTextureLoader()
let environmentPicker = 0;
const cityMap = cubeTextureLoader.load([
    'px.png',
    'nx.png',
    'py.png',
    'ny.png',
    'pz.png',
    'nz.png'
])
const mountainMap = cubeTextureLoader.load([
    'px1.png',
    'nx1.png',
    'py1.png',
    'ny1.png',
    'pz1.png',
    'nz1.png'
    ])
const SFMap = cubeTextureLoader.load([
    'px2.png',
    'nx2.png',
    'py2.png',
    'ny2.png',
    'pz2.png',
    'nz2.png'
    ])
const plainEnvironment = new THREE.Color(0xAAAAAA)

// const environmentArray = [plainEnvironment,cityMap,mountainMap,SFMap,PatrickMap]
const environmentArray = [plainEnvironment,cityMap,mountainMap,SFMap];
scene.background = environmentArray[environmentPicker];
//scene.background = new THREE.Color(0xAAAAAA);

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

// // YELLOW X CUBE
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const xMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
// const xCube = new THREE.Mesh(geometry, xMaterial);
// xCube.position.set(5,0,0)
// scene.add(xCube);

// // BLUE Y CUBE
// const yMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
// const yCube = new THREE.Mesh(geometry, yMaterial);
// yCube.position.set(0,5,0)
// scene.add(yCube);

// // RED Z CUBE
// const zMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// const zCube = new THREE.Mesh(geometry, zMaterial);
// zCube.position.set(0,0,5)
// scene.add(zCube);

const grassTexture = new THREE.TextureLoader().load('grass.jpg', t => {
    t.colorSpace = THREE.SRGBColorSpace;
});
const creatureTexture = new THREE.TextureLoader().load('creature.png', t => {
    t.colorSpace = THREE.SRGBColorSpace;
});

// PLANE
const width = 9
const height = 9
const planeGeometry = new THREE.PlaneGeometry(width, height)
// const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const planeMaterial = new THREE.MeshBasicMaterial({ 
    map: grassTexture, 
    side: THREE.DoubleSide 
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.set(0,-.8,0)
plane.rotation.x = Math.PI / 2
scene.add(plane)

// SCREEN PLANE
const sWidth = .69;
const sHeight = .55;
const screenGeometry = new THREE.PlaneGeometry(sWidth, sHeight);
const screenMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000, 
    side: THREE.DoubleSide 
});
const sPlane = new THREE.Mesh(screenGeometry, screenMaterial);
sPlane.position.set(.29,.19,0);
// sPlane.rotation.x = Math.PI / 2;
sPlane.rotation.y = Math.PI / 2;
scene.add(sPlane);

// Planar Projection Camera
// const planarCamera = new THREE.PerspectiveCamera(45,1,0.01,10);
// planarCamera.position.set(0,0,2);
// planarCamera.lookAt(0,0,0);
// const planarMatrix = new THREE.Matrix4().multiplyMatrices(planarCamera.projectionMatrix, planarCamera.matrixWorldInverse); // Projector Matrix

// Pearto texture
const tLoader = new THREE.TextureLoader();
const defaultTexture = tLoader.load('PeartoSkin.png');
defaultTexture.colorSpace = THREE.SRGBColorSpace;
let uploadTexture = defaultTexture;
let drawnTexture;

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

function tamaGeoSphere(tamaGeometry) {
    tamaGeometry.computeBoundingSphere();
    const center = tamaGeometry.boundingSphere.center;
    const radius = tamaGeometry.boundingSphere.radius;
    const pos = tamaGeometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);

    for ( let i = 0; i < pos.count; i++ ) {
      const x = pos.getX(i) - center.x;
      const y = pos.getY(i) - center.y;
      const z = pos.getZ(i) - center.z;

      const theta = Math.atan2( z, x ); // longitude around y axis
      const phi = Math.acos( y / radius ); // latitude down y axis

      const u = ( theta + Math.PI ) / ( 2 * Math.PI ); // turning theta [-pi,pi] to [0,1]
      const v = phi / Math.PI; // turning phi [0, pi] to [0,1]

      uv[i * 2] = u;
      uv[(i * 2) + 1] = 1 - v;
    }
    tamaGeometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
}

function tamaGeoCylinder(tamaGeometry) {
    tamaGeometry.computeBoundingBox();
    const center = tamaGeometry.boundingBox.getCenter(new THREE.Vector3);
    const top = tamaGeometry.boundingBox.min.y;
    const bot = tamaGeometry.boundingBox.max.y;
    const h = top - bot;
    const pos = tamaGeometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);

    for ( let i = 0; i < pos.count; i++ ) {
        const x = pos.getX(i) - center.x;
        const y = pos.getY(i) - center.y;
        const z = pos.getZ(i) - center.z;

        const theta = Math.atan2( z, x );
        const height = y;

        const u = (theta + Math.PI) / (2 * Math.PI);
        const v = (height +  (h / 2)) / h;

        uv[i * 2] = u;
        uv[(i * 2) + 1] = 1 - v;
    }
    tamaGeometry.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ));
}

function tamaGeoEllipsoid(tamaGeometry) { 
    tamaGeometry.computeBoundingBox();
    const center = tamaGeometry.boundingBox.getCenter(new THREE.Vector3);
    const xMin = tamaGeometry.boundingBox.min.x;
    const xMax = tamaGeometry.boundingBox.max.x;
    const xWidth = xMax - xMin;
    const yMin = tamaGeometry.boundingBox.min.y;
    const yMax = tamaGeometry.boundingBox.max.y;
    const yHeight = yMax - yMin;
    const zMin = tamaGeometry.boundingBox.min.z;
    const zMax = tamaGeometry.boundingBox.max.z;
    const zLength = zMax - zMin;
    const xRadius = xWidth * 0.5; // a
    const yRadius = yHeight * 0.5; // b
    const zRadius = zLength * 0.5; // c
    const pos = tamaGeometry.attributes.position;
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

        uv[ 2 * i ] = u;
        uv[ 2 * i + 1 ] = 1 - v;
    }
    tamaGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

let tamaBox, tamaSphere;
let refObject;
let projectionType = tamaGeoSphere;  

function addReference(texture) {
    if (refObject) {
        scene.remove(refObject);
        refObject.geometry.dispose();
        refObject.material.dispose();
        refObject = null;
    }
    let refGeometry;
    const sideR = Math.max(tamaBox.max.x - tamaBox.min.x, tamaBox.max.y - tamaBox.min.y) / 2;
    const xHeight = (tamaBox.max.x - tamaBox.min.x) / 2;
    const yHeight = (tamaBox.max.y - tamaBox.min.y) / 2;
    const zHeight = (tamaBox.max.z - tamaBox.min.z) / 2;
    const Height = (tamaBox.max.y - tamaBox.min.y);

    if (projectionType == tamaGeoSphere) {
        refGeometry = new THREE.SphereGeometry(yHeight, 32, 16);
    } else if (projectionType == tamaGeoCylinder) {
        refGeometry = new THREE.CylinderGeometry(sideR, sideR, Height, 16);
    } else if (projectionType == tamaGeoEllipsoid) {
        refGeometry = new THREE.SphereGeometry(1, 32, 16);
        refGeometry.scale(xHeight, yHeight, zHeight);
        // tamaGeoEllipsoid(refGeometry);
    }
    let refMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.FrontSide
    });
    refObject = new THREE.Mesh(refGeometry, refMaterial);
    refObject.position.set(0, .075, 2);
    if (projectionType == tamaGeoCylinder) {
        refObject.rotation.y = Math.PI / 2;
    } else {
    refObject.rotation.y = Math.PI;
    }
    scene.add(refObject);
}

function projectionUpdate(Shell) {
    if (Shell.isMesh) {
        projectionType(Shell.geometry);
        if (!customDraw) {
            Shell.material = new THREE.MeshPhongMaterial({
                map: uploadTexture,
                side: THREE.FrontSide
            });
        } else {
            Shell.material = new THREE.MeshPhongMaterial({
                map: drawnTexture,
                side: THREE.FrontSide
            });
        }
    }
}

loader.load('public/tamagotchi_recalc_norms.gltf', function (gltf) {
    tamagotchi = gltf.scene
    // tamagotchi.rotation.y = Math.PI / 2;

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
    tamagotchi.position.set(0,-.85,0);
    scene.add(tamagotchi);
    tamaBox = new THREE.Box3().setFromObject(tamagotchi);
    // tamaSphere = tamaBox.getBoundingSphere(new THREE.Sphere);
    addReference(defaultTexture);

}, undefined, function (error) { // Loads fast enough right now to ignore onProgress

    console.error(error);

});


// // Buffer Geometry PLANE (with Pearto)
// const vertices = [
//     // front
//     { pos: [-1, -1, 10], norm: [0, 0, 1], uv: [0, 0], },
//     { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0], },
//     { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1], },

//     { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1], },
//     { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0], },
//     { pos: [1, 1, 1], norm: [0, 0, 1], uv: [1, 1], },
// ]

// const positions = [];
// const normals = [];
// const uvs = [];
// for (const vertex of vertices) {
//     positions.push(...vertex.pos);
//     normals.push(...vertex.norm);
//     uvs.push(...vertex.uv);
// }

// const tGeometry = new THREE.BufferGeometry();
// const positionNumComponents = 3;
// const normalNumComponents = 3;
// const uvNumComponents = 2;
// tGeometry.setAttribute(
//     'position',
//     new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
// tGeometry.setAttribute(
//     'normal',
//     new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
// tGeometry.setAttribute(
//     'uv',
//     new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));

// // const tLoader = new THREE.TextureLoader();
// // const tTexture = tLoader.load('pearto.png');
// // tTexture.colorSpace = THREE.SRGBColorSpace;
// const tColor = 0xffffff
// function makeInstance(tGeometry, tColor, x) {

//     const tMaterial = new THREE.MeshPhongMaterial({ color: tColor, map: defaultTexture, side: THREE.FrontSide });

//     const tPlane = new THREE.Mesh(tGeometry, tMaterial);
//     tPlane.castShadow = true;
//     tPlane.receiveShadow = true;
//     scene.add(tPlane);

//     tPlane.position.x = x;
//     return tPlane;

// }

// const tPlane = makeInstance(tGeometry, tColor, -4)

// CAMERA
const fov = 45;
const aspect = window.innerWidth / window.innerHeight // 2;  // the canvas default
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-10, 0, 0);

// CAM CONTROLS (ORBIT)
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.update();

// BUTTONS (from index.html)
document.getElementById('buttonSphere').addEventListener('click', function () {
    projectionType = tamaGeoSphere;
    toolPanel.style.display = 'none';
    if (tamagotchi) {
        tamagotchi.traverse(projectionUpdate);
    }
    if (!customDraw) {
        addReference(uploadTexture);
    } else {
        addReference(drawnTexture);
    }
});
  
document.getElementById('buttonCylinder').addEventListener('click', function () {
    projectionType = tamaGeoCylinder;
    toolPanel.style.display = 'none';
    if (tamagotchi) {
        tamagotchi.traverse(projectionUpdate);
    }
    if (!customDraw) {
        addReference(uploadTexture);
    } else {
        addReference(drawnTexture);
    }
});
  
document.getElementById('buttonEllipsoid').addEventListener('click', function () {
    projectionType = tamaGeoEllipsoid;
    toolPanel.style.display = 'none';
    if (tamagotchi) {
        tamagotchi.traverse(projectionUpdate);
    }
    if (!customDraw) {
        addReference(uploadTexture);
    } else {
        addReference(drawnTexture);
    }
});
document.getElementById('buttonDrawCustomTexture').addEventListener('click', function () {
    customDraw = !customDraw;

    if (customDraw) { // If user wants to draw their texture
        document.getElementById('drawingTools').style.display = 'block'
        if (tamagotchi) {
            tamagotchi.traverse(function (mesh) {
                if (mesh.isMesh) {
                    mesh.material.map = customCanvasTexture;
                    // tTexture = customCanvasTexture;
                    mesh.material.needsUpdate = true;
                }
            });
            drawnTexture = customCanvasTexture; 
            addReference(drawnTexture);
        }
    } else { // If user wants to upload their texture
        document.getElementById('drawingTools').style.display = 'none'
        if (tamagotchi) {
            tamagotchi.traverse(projectionUpdate);
            addReference(uploadTexture);
        }
    }   
});

document.getElementById('clearButton').addEventListener('click', function () {
    drawCtx.fillStyle = 'white';
    drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    customCanvasTexture.needsUpdate = true;
});

document.getElementById('buttonCustomUpload').addEventListener('click', function () {
    customDraw = !customDraw;
    document.getElementById('uploadInput').click();
});
document.getElementById('uploadInput').addEventListener('change', function (event) {
    customDraw = false;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const newTexture = new THREE.Texture(img);
            newTexture.needsUpdate = true;
            newTexture.colorSpace = THREE.SRGBColorSpace;

            uploadTexture = newTexture; // Replace global texture

            if (tamagotchi) {
                tamagotchi.traverse(projectionUpdate);
            }
            addReference(uploadTexture);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('buttonReset').addEventListener('click', function () {
customDraw = false;
drawCtx.fillStyle = 'white';
drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
customCanvasTexture.needsUpdate = true;
uploadTexture = defaultTexture;
projectionType = tamaGeoSphere;
toolPanel.style.display = 'none';
if (tamagotchi) {
    tamagotchi.traverse(projectionUpdate);
}
addReference(uploadTexture);
});

document.getElementById('buttonScene').addEventListener('click', function () {
    environmentPicker += 1;
    if (environmentPicker == environmentArray.length) {
        environmentPicker = 0;
    }
    scene.background = environmentArray[environmentPicker];
    scene.background.needsUpdate = true;
})



function animate() {

    // xCube.rotation.x += 0.00;
    // xCube.rotation.y += 0.00;

    // yCube.rotation.x += 0.00;
    // yCube.rotation.y += 0.00;

    // zCube.rotation.x += 0.00;
    // zCube.rotation.y += 0.00;

    if (tamagotchi) {
        tamagotchi.rotation.x -= 0.00;  
        tamagotchi.rotation.y -= 0.00;
    }

    renderer.render(scene, camera);

}