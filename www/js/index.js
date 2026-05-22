import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js";

// CHANGE THIS
const socket = io("http://51.75.118.151:20054");

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// CAMERA
const camera = new THREE.PerspectiveCamera(
75,
window.innerWidth / window.innerHeight,
0.1,
1000
);

// RENDERER
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHT
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// FLOOR
const floor = new THREE.Mesh(
new THREE.PlaneGeometry(50, 50),
new THREE.MeshStandardMaterial({ color: 0x444444 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// PLAYER
const cube = new THREE.Mesh(
new THREE.BoxGeometry(1, 1, 1),
new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
cube.position.y = 0.5;
scene.add(cube);

// CAMERA POSITION
camera.position.set(0, 10, 10);
camera.lookAt(cube.position);

// OTHER PLAYERS
const otherPlayers = {};

// SOCKET EVENTS
socket.on("allPlayers", (players) => {
for (let id in players) {
if (id !== socket.id) {
createPlayer(id, players[id]);
}
}
});

socket.on("newPlayer", (data) => {
createPlayer(data.id, data);
});

socket.on("playerMoved", (data) => {
if (otherPlayers[data.id]) {
otherPlayers[data.id].position.x = data.x;
otherPlayers[data.id].position.z = data.z;
}
});

socket.on("removePlayer", (id) => {
if (otherPlayers[id]) {
scene.remove(otherPlayers[id]);
delete otherPlayers[id];
}
});

// CREATE PLAYER
function createPlayer(id, data) {

const mesh = new THREE.Mesh(
new THREE.BoxGeometry(1, 1, 1),
new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

mesh.position.set(data.x, 0.5, data.z);

scene.add(mesh);

otherPlayers[id] = mesh;
}

// JOYSTICK
let joyX = 0;
let joyY = 0;

const base = document.getElementById("joystickBase");
const stick = document.getElementById("joystick");

let dragging = false;

base.addEventListener("touchstart", () => dragging = true);

base.addEventListener("touchend", () => {
dragging = false;
joyX = 0;
joyY = 0;
stick.style.transform = "translate(0px,0px)";
});

base.addEventListener("touchmove", (e) => {

if (!dragging) return;

let t = e.touches[0];
let r = base.getBoundingClientRect();

let x = t.clientX - r.left - 60;
let y = t.clientY - r.top - 60;

let max = 40;

joyX = Math.max(-max, Math.min(max, x));
joyY = Math.max(-max, Math.min(max, y));

stick.style.transform = `translate(${joyX}px, ${joyY}px)`;
});

// GAME LOOP
function animate() {

requestAnimationFrame(animate);

// MOVE PLAYER
cube.position.x += joyX * 0.002;
cube.position.z += joyY * 0.002;

// CAMERA FOLLOW
camera.position.x = cube.position.x;
camera.position.z = cube.position.z + 10;
camera.lookAt(cube.position);

// SEND TO SERVER
socket.emit("move", {
x: cube.position.x,
z: cube.position.z
});

renderer.render(scene, camera);
}

animate();