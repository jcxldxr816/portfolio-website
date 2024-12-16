import './style.css'
import * as THREE from 'three'; //convert to actual files eventually to reduce unnecessary dependencies
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshStandardMaterial, temp, Vector3 } from 'three/webgpu'; //not sure where this came from

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

/*
PivotPoint
  Sun                             865370miles
  
  Planet    Distance  OrbitTime   Diameter
  Mercury   0.4AU     88days      3032miles
  Venus     0.72AU    224days     7520miles
  Earth     1AU       365days     7917miles
  Mars      1.5AU     687days     4212miles
  Jupiter   5.06AU    4333days    86881miles
  Saturn    9.5AU     10756days   74897miles
  Uranus    19AU      30660days   31518miles
  Neptune   30AU      60225days   30599miles

Credits:
  https://tools.wwwtyro.net/space-3d/index.html
  THREE.js Docs
  https://codepen.io/codypearce/pen/oNXQyOb
  Planet textures from google images... idk
*/

var planetList = [];

class Planet
{
  constructor(pivot, filename, dist, orbit, diameter, rings)
  { 
    this.cubeList = [];
    this.cubesShownYet = false;
    
    this.localPivot = new THREE.Group();
    
    this.distance = (dist * 30) + 60;
    this.increment = (2 * Math.PI) / orbit;
    this.size = diameter / (3032 *10) + 3;

    this.model = new THREE.Mesh(
      new THREE.SphereGeometry(this.size),
      new THREE.MeshStandardMaterial({map: txLoader.load('./res/planetTextures/' + filename)})
    );
    if (rings == true)
    {
      this.ring = new THREE.Mesh(
        new THREE.TorusGeometry(this.size * 1.35, this.size * 0.25),
        // new THREE.MeshStandardMaterial({color: 0xffe4b8})
        new THREE.MeshStandardMaterial({map: txLoader.load('./res/planetTextures/saturnTexture.jpeg')}, {color: 0xffe4b8})
      )
      // this.ring.position.set(this.model.position);
      this.model.add(this.ring);
      this.ring.rotateX(Math.PI / 2);
      this.ring.scale.z = 0.05;
      this.ring.position.y += .5;
      this.ring.rotateX(Math.PI / 24);
      // scene.add(this.ring);
    }
    this.trajectory = new THREE.Mesh(
      new THREE.TorusGeometry(this.distance, 0.1, 12, 480),
      new THREE.MeshBasicMaterial()
    )
    this.trajectory.rotateX(Math.PI / 2);
    // scene.add(this.trajectory);

    this.localPivot.add(this.model);
    this.model.position.x = this.distance;

    this.localPivot.rotateY(THREE.MathUtils.randFloat(0, 2*Math.PI-.01))
    scene.add(this.localPivot);

    planetList.push(this);
  };
  rotateAroundPivot()
  {
    this.localPivot.rotateY(this.increment);
    this.model.rotateY(Math.PI / 240);
  };
  parentCam()
  {
      this.oldCamPosition = new Vector3();
      cam.getWorldPosition(this.oldCamPosition);

      cam.position.set(this.distance + 5,3,5);
      this.localPivot.add(cam);
      controls.update();
  }
  unparentCam()
  {
    this.localPivot.remove(cam);
    cam.position.set(this.oldCamPosition);
  }

  //create a pause() and unpause() to stop all movement and allow for a smooth transition between planets using changeOverTime()
  
  createChildCube(filepath)
  {
    const size = 1.5;
    let cube = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({map: txLoader.load(filepath)}),
      // console.log('created mesh')
    );
    this.cubeList.push(cube);
    this.localPivot.add(cube);
    // cube.position.set(this.distance - 10, 6 - (3*this.cubeList.length), 0 + (3*this.cubeList.length));
    cube.position.set(this.distance, 5.5, 0.25 + (3*this.cubeList.length));
    cube.rotateZ(Math.PI / -6);
    // console.log('created and parented cube: ' + cube);
  }
  showChildCubes()
  {
    if (this.cubeList.length > 0)
    {
      let x = 0;
      while (x < this.cubeList.length)
      {
        this.cubeList[x].visible = true;
        const rotationAmount = Math.PI / 120;
        // this.cubeList[x].rotateX(rotationAmount);
        this.cubeList[x].rotateY(rotationAmount);
        // this.cubeList[x].rotateZ(rotationAmount);
        x++;
      }
    }
  }
  hideChildCubes()
  {
    if (this.cubeList.length > 0)
    {
      // console.log('hiding cubes');
      let x = 0;
      while (x < this.cubeList.length)
      {
        this.cubeList[x].visible = false;
        x++;
      }
    }
  }
}

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(90, ((2 *window.innerWidth) / 3) / innerHeight, 0.1, 2500); //fov, aspectratio, near, far clipping planes
// const cam = new THREE.PerspectiveCamera(90, window.innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#bg'), antialias: true, });
// renderer.shadowMap.enabled = true;
// scene.fog = new THREE.Fog(0x000000, 50, 1500);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( ((2 *window.innerWidth) / 3), window.innerHeight);
// renderer.setSize( window.innerWidth, window.innerHeight);
cam.position.setZ(120);
cam.position.y = 50;

const txLoader = new THREE.TextureLoader();
// const background = txLoader.load('./res/stars4kTexture.jpeg');
// scene.background = background;
// scene.backgroundIntensity = 0.1;

function createMaterialArray()
{
  const skyboxImagepaths = ['./res/skybox/right.png', './res/skybox/left.png', './res/skybox/top.png', './res/skybox/bottom.png', './res/skybox/front.png', './res/skybox/back.png'];
  const materialArray = skyboxImagepaths.map(image => {
    let texture = new THREE.TextureLoader().load(image);

    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, /*color: 0x707070*/ color: 0x919191 });
  });
  return materialArray;
}

let skyboxGeo = new THREE.BoxGeometry(2000, 2000, 2000);
let skybox = new THREE.Mesh(skyboxGeo, createMaterialArray());
scene.add(skybox);

// const pfp = txLoader.load('./res/icons/pfp.jpg');
// const pythonLogo = txLoader.load('./res/icons/python.png');
// const threejsLogo = txLoader.load('./res/icons/threejs.png');
// const jsLogo = txLoader.load('./res/icons/jslogo.png');
// const unityLogo = txLoader.load('./res/icons/unitylogo.jpeg');
// const godotLogo = txLoader.load('./res/icons/godotlogo.png');

// const cubeTextList = [pythonLogo, threejsLogo, jsLogo, unityLogo, godotLogo];


const ambientLight = new THREE.AmbientLight(0xffffff);
// scene.add(ambientLight);

const light = new THREE.PointLight(0xffffff, 10, 10);
// light.position.set(-10,10,15);
cam.add(light);

const sunLight = new THREE.PointLight(0xffe999, 10, 1250, .1);
scene.add(sunLight);
const sunModel = new THREE.Mesh(
  new THREE.SphereGeometry(30),
  new THREE.MeshBasicMaterial({map: txLoader.load('./res/sunTexture.jpeg')})
);
scene.add(sunModel);
// sunModel.castShadow = true;

const mercury = new Planet(sunModel, 'mercuryTexture.jpeg', 0.4, 88, 3032, false);
const venus = new Planet(sunModel, 'venusTexture.jpeg', 0.72, 224, 7520, false);
const earth = new Planet(sunModel, 'earthTexture.jpeg', 1, 365, 7917, false);

earth.createChildCube('./res/icons/pfp.jpg');
earth.createChildCube('./res/icons/threejs.png');

const mars = new Planet(sunModel, 'marsTexture.jpeg', 1.5, 687, 4212, false);

mars.createChildCube('./res/icons/python.png');
mars.createChildCube('./res/icons/jslogo.png');

const jupiter = new Planet(sunModel, 'jupiterTexture.jpeg', 5.06, 4333, 86881, false);
const saturn = new Planet(sunModel, 'saturnTexture.jpeg', 9.5, 10756, 74897, true);

saturn.createChildCube('./res/icons/godotlogo.png');
saturn.createChildCube('./res/icons/unitylogo.jpeg');

const uranus = new Planet(sunModel, 'uranusTexture.jpeg', 19, 30660, 31518, false);
const neptune = new Planet(sunModel, 'neptuneTexture.jpeg', 30, 60225, 30599, false);

// console.log(planetList);

const spotLight1  = new THREE.SpotLight(0xffffff, 50, 125, Math.PI / 3, 0, .5);
spotLight1.position.set(0, 75, -10);
// scene.add(spotLight1);
// spotLight1.castShadow = true;

const diceLight = new THREE.PointLight(0xffffff, 250, 5);
diceLight.position.set(5.5,-2.75,30);
// scene.add(diceLight);

const gridHelper = new THREE.GridHelper(200, 50);
// const lightHelper = new THREE.PointLightHelper(light);

// const modelLoader = new GLTFLoader();
// var dice;
// modelLoader.load('./res/dice.glb', function ( gltf ) {
//   dice = gltf.scene;
// 	// scene.add( dice );
//   dice.position.x = 5.5;
//   dice.position.y = -2.75;
//   dice.position.z = 25;
// });

// scene.add(gridHelper);
// scene.add(lightHelper);

// const fontLoader = new FontLoader();

// const fontObj = fontLoader.load( 'fonts/helvetiker_regular.typeface.json');
// function createText( font ) {

// 	const textGeo = new TextGeometry( 'James Calder', {
// 		font: font,
// 		size: 80,
// 		depth: 5,
// 		curveSegments: 12,
// 		bevelEnabled: true,
// 		bevelThickness: 10,
// 		bevelSize: 8,
// 		bevelOffset: 0,
// 		bevelSegments: 5
// 	} );
//   const textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial(0xffffff));
//   scene.add(textMesh);
//   textMesh.position.set(0,30,100);
//   textMesh.rotateY(Math.PI / 2);
//   console.log('added text mesh');
// };
// createText(fontObj);

const controls = new OrbitControls(cam, renderer.domElement);

function animate() 
{
  requestAnimationFrame(animate);

  var oldScrollPercent = 0;
  function changeOverTime(oldValue, target)
  {
    const denominator = 21 * Math.PI;
    let incrementAmount;
    target == 0? incrementAmount = 1 / denominator : incrementAmount = target / denominator;

    if (oldValue != target)
    {
      let realDelta = target - oldValue;

      if (Math.abs(realDelta) >= incrementAmount)
      {
        if (realDelta > 0)
        {
          oldValue += incrementAmount;
        }
        else
        {
          oldValue -= incrementAmount;
        }
      }
      else
      {
        oldValue = target;
        // console.log("value not changed");
      }
    }
    return oldValue;
  }

  function getScrollPercent() {
    var h = document.documentElement, 
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
  }

  const scrollPercent = getScrollPercent();

  const numOfCards = 4;
  const cardNumber = scrollPercent * numOfCards;
  if (cardNumber < 1)
  {
    mercury.unparentCam();
    venus.unparentCam();
    earth.unparentCam();
    mars.unparentCam();
    jupiter.unparentCam();
    saturn.unparentCam();
    uranus.unparentCam();
    neptune.unparentCam();

    cam.position.x = 0;
    cam.position.y = 50;
    cam.position.z = 120;

    controls.update();

    earth.hideChildCubes();
    mars.hideChildCubes();
    saturn.hideChildCubes();
  }
  else if (cardNumber < 2)
  {
    mercury.unparentCam();
    venus.unparentCam();
    // earth.unparentCam();
    mars.unparentCam();
    jupiter.unparentCam();
    saturn.unparentCam();
    uranus.unparentCam();
    neptune.unparentCam();

    earth.parentCam();

    earth.showChildCubes();
    mars.hideChildCubes();
    saturn.hideChildCubes();
  }
  else if (cardNumber < 3)
  {
    mercury.unparentCam();
    venus.unparentCam();
    earth.unparentCam();
    // mars.unparentCam();
    jupiter.unparentCam();
    saturn.unparentCam();
    uranus.unparentCam();
    neptune.unparentCam();

    mars.parentCam();

    earth.hideChildCubes();
    mars.showChildCubes();
    saturn.hideChildCubes();
  }
  else //(3 < cardNumber && cardNumber  < 4)
  {
    mercury.unparentCam();
    venus.unparentCam();
    earth.unparentCam();
    mars.unparentCam();
    jupiter.unparentCam();
    // saturn.unparentCam();
    uranus.unparentCam();
    neptune.unparentCam();

    saturn.parentCam();

    earth.hideChildCubes();
    mars.hideChildCubes();
    saturn.showChildCubes();
  }
  
  mercury.rotateAroundPivot();
  venus.rotateAroundPivot();
  earth.rotateAroundPivot();
  mars.rotateAroundPivot();
  jupiter.rotateAroundPivot();
  saturn.rotateAroundPivot();
  uranus.rotateAroundPivot();
  neptune.rotateAroundPivot();

  // planetList.forEach(rotateAroundPivot); //not working for some reason


  // controls.update();
  renderer.render(scene, cam);
}

animate();