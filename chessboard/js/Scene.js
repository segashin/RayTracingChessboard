"use strict";
/* exported Scene */
class Scene extends UniformProvider {
  constructor(gl) {
    super("scene");
    this.programs = [];

    this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad-vs.glsl");    
    this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace-fs.glsl");
    this.programs.push( 
    	this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace));

    this.texturedQuadGeometry = new TexturedQuadGeometry(gl);

    this.timeAtFirstFrame = new Date().getTime();
    this.timeAtLastFrame = this.timeAtFirstFrame;

    this.traceMaterial = new Material(this.traceProgram);
    this.envTexture = new TextureCube(gl, [
      "media/posx512.jpg",
      "media/negx512.jpg",
      "media/posy512.jpg",
      "media/negy512.jpg",
      "media/posz512.jpg",
      "media/negz512.jpg",]
      );
    this.traceMaterial.envTexture.set(this.envTexture);
    this.traceMesh = new Mesh(this.traceMaterial, this.texturedQuadGeometry);

    this.traceQuad = new GameObject(this.traceMesh);

    //---------------------
    this.gameObjects = [];
    this.gameObjects.push(this.traceQuad);

    //quadrics objects
    this.clippedQuadrics = [];
    for(let i = 0; i < 20; i++){
      this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    }
    //create chessboard
    //this.clippedQuadrics[0].makeBoard();
    this.clippedQuadrics[0].makeUnitSquare();
    this.clippedQuadrics[0].scaleQuadric(16, 1, 16, 2);
    this.clippedQuadrics[0].translateQuadric(0, -1, 0, 0);
    this.clippedQuadrics[0].solidColor = new Vec3(0.2,0.1,0.1);
    this.clippedQuadrics[0].materialType = 0;


    //a pawn
    this.clippedQuadrics[1].makeUnitSphere();
    this.clippedQuadrics[1].translateQuadric(0, 4.9, 0, 0);
    this.clippedQuadrics[1].reflectance = 0;
    this.clippedQuadrics[1].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[1].materialType = 2;

    this.clippedQuadrics[2].makeUnitCone();
    this.clippedQuadrics[2].translateQuadric(0, 1, 0, 0);
    this.clippedQuadrics[2].translateQuadric(0, 0.4, 0, 1);
    this.clippedQuadrics[2].scaleQuadric(1, 4, 1, 0);
    this.clippedQuadrics[2].reflectance = 0;
    this.clippedQuadrics[2].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[2].materialType = 2;

    this.clippedQuadrics[1].translateQuadric(6, 0, 6, 0);
    this.clippedQuadrics[2].translateQuadric(6, 0, 6, 0);

    //king
    this.clippedQuadrics[3].makeUnitSphere();
    this.clippedQuadrics[3].translateQuadric(0, 4.9, 0, 0);
    this.clippedQuadrics[3].reflectance = 0.2;
    this.clippedQuadrics[3].eta = 0.98;
    this.clippedQuadrics[3].solidColor = new Vec3(0.7, 0.2, 0.2);
    this.clippedQuadrics[3].materialType = 1;

    this.clippedQuadrics[4].makeUnitCone();
    this.clippedQuadrics[4].translateQuadric(0, 1, 0, 0);
    this.clippedQuadrics[4].translateQuadric(0, 0.4, 0, 1);
    this.clippedQuadrics[4].scaleQuadric(1, 4, 1, 0);
    this.clippedQuadrics[4].reflectance = 0.2;
    this.clippedQuadrics[4].eta = 0.98;
    this.clippedQuadrics[4].solidColor = new Vec3(0.7, 0.2, 0.2);
    this.clippedQuadrics[4].materialType = 1;

    this.clippedQuadrics[5].makeUnitParaboloid();
    this.clippedQuadrics[5].translateQuadric(0, 5.6, 0, 0);
    this.clippedQuadrics[5].translateQuadric(0, -0.3, 0, 1);
    this.clippedQuadrics[5].solidColor = new Vec3(1.0, 0.0, 1.0);
    this.clippedQuadrics[5].reflectance = 0.2;
    this.clippedQuadrics[5].eta = 0.90;
    this.clippedQuadrics[5].materialType = 1;

    this.clippedQuadrics[3].translateQuadric(14, 0, 2, 0);
    this.clippedQuadrics[4].translateQuadric(14, 0, 2, 0);
    this.clippedQuadrics[5].translateQuadric(14, 0, 2, 0);



    //rook
    this.clippedQuadrics[6].makeUnitSphere();
    this.clippedQuadrics[6].translateQuadric(0, 4.9, 0, 0);
    this.clippedQuadrics[6].reflectance = 1.0;
    this.clippedQuadrics[6].solidColor = new Vec3(0.7, 0.2, 0.2);
    this.clippedQuadrics[6].materialType = 4;

    this.clippedQuadrics[7].makeUnitCone();
    this.clippedQuadrics[7].translateQuadric(0, 1, 0, 0);
    this.clippedQuadrics[7].translateQuadric(0, 0.4, 0, 1);
    this.clippedQuadrics[7].scaleQuadric(1, 4, 1, 0);
    this.clippedQuadrics[7].reflectance = 1.0;
    this.clippedQuadrics[7].solidColor = new Vec3(0.7, 0.2, 0.2);
    this.clippedQuadrics[7].materialType = 4;

    //rook head
    this.clippedQuadrics[8].makeUnitRookHead();
    this.clippedQuadrics[8].solidColor = new Vec3(0.0, 1.0, 1.0);
    this.clippedQuadrics[8].reflectance = 0.7;
    this.clippedQuadrics[8].materialType = 2;
    this.clippedQuadrics[8].scaleQuadric(0.8, 0.4, 0.8, 0);
    this.clippedQuadrics[8].translateQuadric(0, 6.0, 0, 0);

    this.clippedQuadrics[9].makeUnitRookHead();
    this.clippedQuadrics[9].solidColor = new Vec3(0.0, 0.6, 0.6);
    this.clippedQuadrics[9].reflectance = 0.7;
    this.clippedQuadrics[9].materialType = 2;
    this.clippedQuadrics[9].scaleQuadric(0.8, 0.4, 0.8, 0);
    this.clippedQuadrics[9].rotateQuadric(0, Math.PI/2, 0, 0);
    this.clippedQuadrics[9].translateQuadric(0, 6.0, 0, 0);

    this.clippedQuadrics[6].translateQuadric(14, 0, -10, 0);
    this.clippedQuadrics[7].translateQuadric(14, 0, -10, 0);
    this.clippedQuadrics[8].translateQuadric(14, 0, -10, 0);
    this.clippedQuadrics[9].translateQuadric(14, 0, -10, 0);

    //this.clippedQuadrics[2].makeUnitCylinder();
    //this.clippedQuadrics[2].translateQuadric(-8, 1, 0, 0);
    //this.clippedQuadrics[2].reflectance = 0.4;
    //this.clippedQuadrics[2].solidColor = new Vec3(0, 1, 0);

    //king
    this.clippedQuadrics[10].makeUnitSphere();
    this.clippedQuadrics[10].translateQuadric(0, 4.9, 0, 0);
    this.clippedQuadrics[10].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[10].reflectance = 1;
    this.clippedQuadrics[10].materialType = 2;

    this.clippedQuadrics[11].makeUnitCone();
    this.clippedQuadrics[11].translateQuadric(0, 1, 0, 0);
    this.clippedQuadrics[11].translateQuadric(0, 0.4, 0, 1);
    this.clippedQuadrics[11].scaleQuadric(1, 4, 1, 0);
    this.clippedQuadrics[11].reflectance = 1;
    this.clippedQuadrics[11].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[11].materialType = 2;

    this.clippedQuadrics[12].makeUnitParaboloid();
    this.clippedQuadrics[12].translateQuadric(0, 5.6, 0, 0);
    this.clippedQuadrics[12].translateQuadric(0, -0.3, 0, 1);
    this.clippedQuadrics[12].solidColor = new Vec3(1.0, 0.0, 1.0);
    this.clippedQuadrics[12].reflectance = 0.7;
    this.clippedQuadrics[12].materialType = 2;

    this.clippedQuadrics[10].translateQuadric(-14, 0, -6, 0);
    this.clippedQuadrics[11].translateQuadric(-14, 0, -6, 0);
    this.clippedQuadrics[12].translateQuadric(-14, 0, -6, 0);

    //a pawn
    this.clippedQuadrics[13].makeUnitSphere();
    this.clippedQuadrics[13].translateQuadric(0, 4.9, 0, 0);
    this.clippedQuadrics[13].reflectance = 0;
    this.clippedQuadrics[13].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[13].materialType = 3;

    this.clippedQuadrics[14].makeUnitCone();
    this.clippedQuadrics[14].translateQuadric(0, 1, 0, 0);
    this.clippedQuadrics[14].translateQuadric(0, 0.4, 0, 1);
    this.clippedQuadrics[14].scaleQuadric(1, 4, 1, 0);
    this.clippedQuadrics[14].reflectance = 0;
    this.clippedQuadrics[14].solidColor = new Vec3(0.2, 0.6, 0.4);
    this.clippedQuadrics[14].materialType = 3;

    this.clippedQuadrics[13].translateQuadric(-6, 0, 6, 0);
    this.clippedQuadrics[14].translateQuadric(-6, 0, 6, 0);

    //this.clippedQuadrics[10].translateQuadric(14, 0, 2, 0);
    //this.clippedQuadrics[11].translateQuadric(14, 0, 2, 0);
    //this.clippedQuadrics[12].translateQuadric(14, 0, 2, 0);

    //lights
    this.lights = [];
    this.lights.push(new Light(this.lights.length, ...this.programs));
    this.lights[this.lights.length-1].position.set(0.4,0.6,0.4,0);
    this.lights[this.lights.length-1].powerDensity.set(0.9, 0.9, 0.9);
    //---------------------

    this.camera = new PerspectiveCamera(...this.programs); 
    this.camera.position.set(0, 5, 25);
    this.camera.update();
    this.addComponentsAndGatherUniforms(...this.programs);

    gl.enable(gl.DEPTH_TEST);
  }

  resize(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.camera.setAspectRatio(canvas.width / canvas.height);
  }

  update(gl, keysPressed) {
    //jshint bitwise:false
    //jshint unused:false
    const timeAtThisFrame = new Date().getTime();
    const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
    const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0; 
    this.timeAtLastFrame = timeAtThisFrame;
    //this.time.set(t);
    this.time = t;

    if(t%28 < 14){
      this.clippedQuadrics[1].translateQuadric(0.3*dt, 0, 0, 0);
      this.clippedQuadrics[2].translateQuadric(0.3*dt, 0, 0, 0);
    }else{
      this.clippedQuadrics[1].translateQuadric(-0.3*dt, 0, 0, 0);
      this.clippedQuadrics[2].translateQuadric(-0.3*dt, 0, 0, 0);
    }
    // clear the screen
    gl.clearColor(0.3, 0.0, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.camera.move(dt, keysPressed);
    this.traceQuad.draw(this, this.camera);

    for(const gameObject of this.gameObjects) {
        gameObject.update();
    }
    for(const gameObject of this.gameObjects) {
        gameObject.draw(this, this.camera, ...this.lights, ...this.clippedQuadrics);
    }
  }
}
