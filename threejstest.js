import * as THREE from 'three';

let stepNum = 0, animationProgress = 20, animationUp = true;
const maxStep = 44;

export function beginSlideshow() {
    for (let init of document.getElementsByClassName("initScreen")) {
        init.style.visibility = "hidden";
    }
    for (let button of document.getElementsByClassName("arrowButton")) {
        button.style.visibility = "visible";
    }
    document.getElementById("c").style.visibility = "visible";
    document.getElementById("music").play();
}

function animationSkip() {
    if (animationProgress != 20) {
        animationProgress = 20;
        animationUp = true;
        return true;
    }
    return false;
}
export function rightButton() {
    if (animationSkip()) {
        return;
    }

    if (stepNum == maxStep) {
        return;

    } else if (stepNum == maxStep - 1) {
        document.getElementById("rightArrow").style.opacity = 0.1;
    }
    document.getElementById("leftArrow").style.opacity = 0.5;
    stepNum++;
    animationProgress = 0;
    animationUp = true;
}
export function leftButton() {
    if (animationSkip()) {
        return;
    }

    if (stepNum == 0) {
        return;

    } else if (stepNum == 1) {
        document.getElementById("leftArrow").style.opacity = 0.1;
    }
    document.getElementById("rightArrow").style.opacity = 0.5;
    stepNum--;
    animationProgress = 0;
    animationUp = false;
}

async function main() {
    const loader = new THREE.TextureLoader();
    const textures = new Array(43);

    async function loadTextures() {
        for (let i = 1; i <= 43; i++) {
            await new Promise((resolve) => {
                const newTex = loader.load("resources/" + i + ".jpg", function (tex) {
                    resolve();
                });
                newTex.colorSpace = THREE.SRGBColorSpace;
                textures[i - 1] = newTex;
            })
        }
    }
    async function loadVideos() {
        for (let i = 1; i <= 2; i++) {
            const newVid = document.getElementById("vid" + i);
            await new Promise((resolve) => {
                newVid.addEventListener('loadedmetadata', () => {
                    resolve();
                });
                newVid.load();
                newVid.play();
            });
            const texture = new THREE.VideoTexture(newVid);
            textures.push(texture);
        }
    }
    await loadTextures();
    await loadVideos();

    let mouseX = 0, mouseY = 0;

    const canvas = document.querySelector('#c');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.addEventListener("mousemove", function (evt) {
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    });

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas });
    renderer.setClearColor(0x000000, 1);

    //fov aspect near far
    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000.0);
    camera.position.z = 5;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    //Setting up all of the box objects for the slideshow
    const numCubes = Math.ceil((maxStep + 1) / 4);
    const imageCubes = new Array(numCubes);
    const remainingTextures = [...textures].reverse();
    const boxTextureOrder = [4, 0, 5, 1, 2, 3];
    let heightTotal = 0;
    for (let i = 0; i < numCubes; i++) {
        const newGeometry = new THREE.BoxGeometry(3, 4, 3);
        const newMaterials = new Array(6);
        for (let j = 0; j < 6 && remainingTextures.length > 0; j++) {
            if (j < 4) {
                newMaterials[boxTextureOrder[j]] = new THREE.MeshBasicMaterial({ map: remainingTextures.pop() });
            } else {
                newMaterials[boxTextureOrder[j]] = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
            }
        }
        const cube = new THREE.Mesh(newGeometry, newMaterials);
        cube.position.y += heightTotal + (i * 0.1);
        scene.add(cube);
        imageCubes[i] = cube;

        heightTotal += 5;
    }

    const rotationMat = new THREE.Matrix4();

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function positionCubes(time) {
        const animating = animationProgress != 20;
        const shifting = ((!animationUp && ((stepNum + 1) % 4 == 0)) || (animationUp && ((stepNum) % 4 == 0)));
        const rotating = animating && !shifting;
        const fullyRotated = Math.floor((stepNum) / 4);
        for (let i = 0; i < fullyRotated; i++) {
            imageCubes[i].rotation.y = Math.PI * 270 / 180;
        }

        const useCube = imageCubes[fullyRotated];
        useCube.rotation.y = (stepNum % 4) / 4 * Math.PI * 2;
        if (rotating) {
            if (animationUp) {
                useCube.rotation.y -= (20-animationProgress) / 80 * Math.PI * 2;
            } else {
                useCube.rotation.y += (20-animationProgress) / 80 * Math.PI * 2;
            }
        }

        let heightOffset = 0;
        if (shifting && animating) {
            if (animationUp) {
                heightOffset = 5.1 * animationProgress/20 - 5.1;
            } else {
                heightOffset = 5.1 * (20-animationProgress)/20;
            }
        }
        heightOffset += Math.sin(time*2)/10;

        for (let i = 0; i < imageCubes.length; i++) {
            imageCubes[i].position.y = (i - fullyRotated) * 5.1 - heightOffset;
        }

        if (animating) {
            animationProgress += 1;
        }
        if (animationProgress == 20) {
            animationUp = true;
        }
    }

    //RENDERING HAPPENS HERE
    function render(time) {
        time *= 0.001;
        resizeRendererToDisplaySize(renderer);

        positionCubes(time);
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();