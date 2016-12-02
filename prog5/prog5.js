//Herman N Robles
//nrobles@lsu.edu
//Project 5

//declare global variables
var gl;
var canvas;

var dragging = false;
var texShader;
var chestModel;

var xValue = 0;
var yValue = 0;
var zValue = 0;

var modelRotationX = 0;
var modelRotationY = 0;
var lastClientX;
var lastClientY;

var videoElement;
var modelTexture;

//refresh function used to request animation frame after moving slider in HTML
function refresh(){
    xValue = document.getElementById("x-light").value;
    yValue = document.getElementById("y-light").value;
    zValue = document.getElementById("z-light").value;
    requestAnimationFrame(draw);
}

//define 'flatten' function to flatten tables to single array
function flatten(a) {    
    return a.reduce(function (b, v) { b.push.apply(b, v); return b }, [])   
}

//create tumble interaction functions to click and drag cube
function onmousedown(event){
    dragging    = true;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
}

function onmouseup(event){ 
    dragging = false;
}

/*using clientX and clientY derived from click event, use to create modelX and Y 
rotation before passing to model matrices rotation transformations*/
function onmousemove(event){
    //console.log(event.clientX, event.clientY);
    if (dragging){  
        var dX = event.clientX - lastClientX;
        var dY = event.clientY - lastClientY;
        
        modelRotationY = modelRotationY + dX;
        modelRotationX = modelRotationX + dY;
        
        
        if (modelRotationX > 90.0){
            modelRotationX = 90.0;
        }
        
        if (modelRotationX < -90.0){
            modelRotationX = -90.0;
        }
        
    requestAnimationFrame(draw);
    }
     lastClientX = event.clientX;
     lastClientY = event.clientY;
     
}
function startVideo() {
  videoElement.play();
  intervalID = setInterval(draw, 15);
}

function videoDone() {
  clearInterval(intervalID);
}


//define Shader object constructor function
function Shader(vertexId, fragmentId){
    
    this.program = createProgram(gl, document.getElementById( vertexId).text,
                                     document.getElementById(fragmentId).text);
                                     
    this.modelMatrixLocation         = gl.getUniformLocation(this.program, 'modelMatrix');
    this.viewMatrixLocation          = gl.getUniformLocation(this.program, 'viewMatrix');
    this.projectionMatrixLocation    = gl.getUniformLocation(this.program, 'projectionMatrix');
    this.vertexPositionLocation      = gl.getAttribLocation(this.program, 'vertexPosition'); 
    this.lightPositionLocation       = gl.getUniformLocation(this.program, 'lightPosition');
    this.modelColorLocation          = gl.getUniformLocation(this.program, 'modelColor');
    this.lightColorLocation          = gl.getUniformLocation(this.program, 'lightColor');
    this.vertexNormalLocation        = gl.getAttribLocation(this.program, 'vertexNormal');
    this.vertexTexCoordLocation      = gl.getAttribLocation(this.program, 'vertexTexCoord');
    
    gl.enableVertexAttribArray(this.vertexPositionLocation);
    gl.enableVertexAttribArray(this.vertexNormalLocation);
    gl.enableVertexAttribArray(this.vertexTexCoordLocation);
}

//define use() method for Shader objects
Shader.prototype.use = function(projectionMatrix, modelMatrix, viewMatrix){
    
    gl.useProgram(this.program);
    
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);

    gl.uniform4f(this.lightPositionLocation, xValue, yValue, zValue, 0.0);
    gl.uniform3f(this.modelColorLocation, 0.6, 0.3, 0.2);
    gl.uniform3f(this.lightColorLocation, 1.0, 1.0, 1.0);
}

//define Model object constructor function
function Model(positions, triangles, normals, texCoords){
    //initialize buffer objects
    this.positionBuffer  = gl.createBuffer();
    this.triangleBuffer  = gl.createBuffer();
    this.normalsBuffer   = gl.createBuffer();
    this.texCoordBuffer  = gl.createBuffer();
    
    
    //copy vertex data from array in CPU onto GPU
    this.positionArray = new Float32Array(flatten(positions));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);    

    //copy triangle data from array in CPU onto GPU
    this.triangleArray = new Uint16Array(flatten(triangles));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
    
    this.normalsArray = new Float32Array(flatten(normals));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalsArray, gl.STATIC_DRAW);
    
    this.textCoordArray = new Float32Array(flatten(texCoords));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.textCoordArray, gl.STATIC_DRAW);
}

//define draw() method for Model objects to bind barray buffers
Model.prototype.draw = function(shader){
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
    gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);    
    gl.vertexAttribPointer(shader.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);
    
         
}

//initizlize texture object
function loadTexture(image, texture){
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    requestAnimationFrame(draw);                                                        
}


function init(){
    
    //initialize GL context
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas, false);
    
    canvas.onmousedown  = onmousedown;
    canvas.onmouseup    = onmouseup;
    canvas.onmousemove  = onmousemove;
    
    //instantiate shader objects for each defined shader
    texShader           = new Shader('vertexShader', 'lightingFragmentShader');
    
    //instantiate model objects for each model
    chestModel          = new Model(chest.positions, chest.triangles, chest.normals, chest.texCoords);
    
    videoElement = document.getElementById("video");
        
    modelTexture    = gl.createTexture();
   
    videoElement.addEventListener("canplaythrough", startVideo, true);
    videoElement.addEventListener("ended", videoDone, true);
    
   /* videoElement.onload   = function() {
       loadTexture(videoElement, modelTexture);
    }*/ 
    loadTexture(videoElement, modelTexture);
    
    videoElement.crossOrigin  = "anonymous";
    videoElement.src = "Firefox.ogv";
    
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);                               
    gl.enable(gl.DEPTH_TEST);
    
    //request animation frame
    requestAnimationFrame(draw);    
    
}


function draw(){
    updateTexture();
    //compose matrices for transformations
    var viewMatrix          = new Matrix4();
    var projectionMatrix    = new Matrix4();  
    
    viewMatrix.translate(0.0, 0.0, -1.8);
    projectionMatrix.perspective(90, 1, 1, 10);
        
    //set color and refresh rendering for canvas       
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   
    /*instantiate model matrices for each respective model 
      and draw models with applied shader*/
    var chestModelMatrix    = new Matrix4();
    chestModelMatrix.rotate(modelRotationX, 1, 0, 0 );
    chestModelMatrix.rotate(modelRotationY, 0, 1, 0 ); 
    chestModelMatrix.translate(0.0, 0.0, 0.0, 0.0 );
    
    //set uniform locations and apply shader to designated model
    texShader.use(projectionMatrix, chestModelMatrix, viewMatrix);    
    chestModel.draw(texShader);
            
}

function updateTexture() {
  gl.bindTexture(gl.TEXTURE_2D, modelTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
}