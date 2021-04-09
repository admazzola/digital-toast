    import css from "./main.css";


    import * as THREE from 'three';

    


   import { GLTFLoader } from './vendor/GLTFLoader.js';
   import { OrbitControls } from './vendor/OrbitControls.js';

   import { TTFLoader } from './vendor/TTFLoader.js'; 

   import AnimatedTexture from './vendor/AnimatedTexture.js'


   const MAX_LOOP_TIME = 60*1000
    

   require('./vendor/lib/gif.js')

   import wordwrap from 'wordwrapjs/index.mjs'


   var imageConfigs = require('./assets/imageconfig.json').images

   var attachableImages = [] 
   var animatedTextures = [] 

   const toastyText = require('./assets/toastytext.json').text

    var  textGeometryLines = []

    
    var group = new THREE.Group();
    const fileLoader = new THREE.FileLoader;

    var deltaTime; 
    var startTime; 
     
    const height = 20,
        size = 70,
        hover = 30,
        curveSegments = 4,
        bevelThickness = 2,
        bevelSize = 1.5;



    let camera, scene, renderer;
 

    var textAnchor = new THREE.Group()


     init();

    startTime = Date.now()
    deltaTime = Date.now() 

    var finishedLoading = false

   var controls; 

async function init() {

    

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
    camera.position.set( 3.8, 0.6, -4.7 );

    scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    scene.add(ambientLight);

    


     
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
     
     dirLight.position.set( 0.2, 0.8, 0.2 ); //default; light shining from top
     dirLight.castShadow = true; // default false
    scene.add(dirLight);

    scene.add(group)

 
     await loadTheToast( group )    

     startTime = Date.now()
     finishedLoading = true 
     console.log('finished loading ')

     console.log('Hi there, friend! - InfernalToast')

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    renderer.setAnimationLoop(() => {
        animate();  
    });


    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    controls =  new OrbitControls( camera, renderer.domElement );
//	controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

async function loadTheToast( group ){


    var gifgeometry = new THREE.PlaneBufferGeometry( 1, 1 );
    var gifmesh = new THREE.Mesh( gifgeometry, new THREE.MeshBasicMaterial( ));
    
     

        //attachableImages 
    let textureLoader = new THREE.TextureLoader()

    let imagesAnchor = new THREE.Group();

    imagesAnchor.position.set(0,0,0.15)

     for(let config of imageConfigs){
        let type = config.filename.split('.')[1]

        let imgurl = `./assets/textures/${config.filename}`

        let posOffset = new THREE.Vector3( config.position.x,config.position.y,config.position.z )  

        let scaleFactor = Math.max(   parseFloat( config.scale ) , 0.1 ) 

        if(type == 'gif'){ 
                                
            let gifContainer = await AnimatedTexture.loadGif(fileLoader,imgurl )  
            console.log('load gif', config )
            let animatedTexture = new AnimatedTexture( gifContainer ) 

            animatedTextures.push(animatedTexture)

            let ratio = gifContainer.width / gifContainer.height;

            let clonedMesh = gifmesh.clone();
            clonedMesh.material = new THREE.MeshPhongMaterial({
                map: animatedTexture,
                transparent: true,
                alphaTest: 0.5,
                side: THREE.DoubleSide
            });
            clonedMesh.scale.set( 1 * ratio * scaleFactor, 1 * scaleFactor, 1  );
             clonedMesh.position.set(  posOffset.x, posOffset.y, posOffset.z );
             clonedMesh.visible= false; 
            imagesAnchor.add(clonedMesh)

            attachableImages.push( {mesh: clonedMesh, config: Object.assign({}, config)  }  )

        }else{
           
            let tex = await new Promise((resolve,reject) => {

                textureLoader.load(  imgurl,  function ( tex ) { 
                    resolve(tex)
                } )

            }  ) 

            console.log('load tex', tex.image)

            let clonedMesh = gifmesh.clone();
            clonedMesh.material = new THREE.MeshPhongMaterial({
                map: tex ,
                transparent: true,
                alphaTest: 0.5,
                side: THREE.DoubleSide
            })

            //let clonedMesh = gifmesh.clone();
           // let material = new THREE.SpriteMaterial( { map: map } );
           // const sprite = new THREE.Sprite( material );
             
            let ratio =  tex.image.naturalWidth / tex.image.naturalHeight ;

            clonedMesh.scale.set( 1 * ratio * scaleFactor, 1 * scaleFactor, 1 );
            clonedMesh.position.set(  posOffset.x, posOffset.y, posOffset.z );
            clonedMesh.visible= false; 
            imagesAnchor.add(clonedMesh)
            
            attachableImages.push( {mesh: clonedMesh, config: Object.assign({}, config)  }  )

        }



     }


     
    

         group.add( imagesAnchor );

         

   
    let textLines = generateTextLinesFromString( toastyText[0] )
   

     const textLoader = new TTFLoader();

     let font = textLoader.load( './assets/kenpixel.ttf', function ( json ) {

         let font = new THREE.Font( json );

         
         textAnchor.position.set(0.72,-0.8,-0.14)
  

        for(let index in textLines){
            let line = textLines[index]
            let heightOffset = index*-0.2;

             
            let textGeo = createTextGeometry( font , line , heightOffset);
            textGeo.visible = false
            textGeometryLines.push( textGeo )  
            textAnchor.add( textGeo );
        } 
        
        group.add( textAnchor );
         render();
     } );




     const modelLoader = new GLTFLoader().setPath( './assets/' );
     modelLoader.load( 'QmPzbE1TJ78QmKQJxL9xjBf2mQzxvFfnVgnJciS9R847Z7.gltf', function ( gltf ) {

         gltf.scene.traverse( function ( child ) {

             if ( child.isMesh ) {

              

             }

         } );

         var  axis = new THREE.Vector3(0,1,0);
         rotateAroundWorldAxis(gltf.scene , axis, Math.PI * 0.5  );
     
      
     

         group.add( gltf.scene );


         render();

     } );


}

function render() {

    renderer.render( scene, camera );

}


function generateTextLinesFromString(inputString){
    
    return wordwrap.wrap(inputString, {width: 30}).split('\n')
}


function createTextGeometry(font, textString , heightOffset) {

    let  material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

    let textGroup = new THREE.Group()
 
 

    let textGeo = new THREE.TextGeometry( textString, { 
        font: font, 
        size: 26,
        height: 2,
        curveSegments: curveSegments,

        bevelThickness: 5,
        bevelSize: bevelSize,
        bevelEnabled: false 
    } );

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    const centerOffset = 0   ;

    let textMesh1 = new THREE.Mesh( textGeo, material );

    textMesh1.position.x = 0;
    textMesh1.position.y = -0.0 + heightOffset;
    textMesh1.position.z = 0 ;

    let  axis = new THREE.Vector3(0,1,0);
    rotateAroundWorldAxis(textMesh1 , axis, Math.PI * 1  );


  
    textMesh1.scale.set(0.002,0.002,0.002)
 

   // anchor.add( textMesh1 );

    return textMesh1

    

}
 

function refreshText() {

    group.remove( textMesh1 );
    if ( mirror ) group.remove( textMesh2 );

    if ( ! text ) return;

    createText();

}


 


function animate() {

   let delta = Date.now() - deltaTime;

   if(finishedLoading){

    updateSceneCustom(delta)

    for( let animatedTexture of animatedTextures){
         animatedTexture.update(1)
     }
 
    
     
   }
 
    console.log(controls)
   let controlsState = controls.getState();
   console.log('meep', controlsState)
   let currentlyPanning = (controlsState >= 0)

   if(!currentlyPanning){
    group.rotation.y +=  0.005;
   }
    
 

    renderer.render( scene, camera );


    deltaTime = Date.now() 

}


function updateSceneCustom(delta){
    let timeSinceStart =  deltaTime - startTime; 


    updateAttachableImages(delta)


    updateScrollingText(delta)

     
    if(timeSinceStart > MAX_LOOP_TIME){ 
        resetStartTime()
    }
}

function resetStartTime(){
    startTime= Date.now() 

    for(let attachable of attachableImages ){
         
            attachable.mesh.visible = false 
        

    }
}

function updateScrollingText(){
    let timeSinceStart =  deltaTime - startTime; 
    let heightOffset = timeSinceStart * 0.0001 * 0.7;

    if( heightOffset > 3.7){
        heightOffset = 3.7
    }
     

    textAnchor.position.set(0.72,-0.8 + heightOffset ,-0.14)


    for(let textGeo of textGeometryLines){

        let worldPositionY = textGeo.getWorldPosition(new THREE.Vector3()).y

        if(worldPositionY > -0.8 && worldPositionY < 0.8){
            textGeo.visible = true 
        }else{
            textGeo.visible = false 
        } 

    }

}

function updateAttachableImages(delta){

    let timeSinceStart =  deltaTime - startTime; 

    for(let attachable of attachableImages ){
        

        if(timeSinceStart > attachable.config.spawnDelay ){
            attachable.mesh.visible = true 
        }

        if(timeSinceStart > attachable.config.spawnDelay + attachable.config.lifetime ){
            attachable.mesh.visible = false 
        } 

    }
}




var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply

    object.matrix = rotWorldMatrix;

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js pre r59:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // code for r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}

