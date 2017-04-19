/*
* John Horton Conway´s Game of Life using Three.js and jQuery
* Marcus Folkeryd 2012
*/


var scene, camera, controls;
var renderer, projector;
var clock = new THREE.Clock();

var _PLAYBACKSTATE;
//var _zoomValue = 400;
var _cellGrid;
var _cellPosGrid = [];
var cellAliveColor = 0x000000;//0xCF7902;//
var cellDeadColor = 0xCCCCCC;//0x696969; //
var _latestUpdate;
var cellUpdateArray = [];
var _cameraLock = false;
var _tickDelay = 100; //Default
var requestedSizeAnimations = [];

var screenW = window.innerWidth;
var screenH = window.innerHeight; 
var spdx = 0, spdy = 0; mouseX = 0, mouseY = 0, mouseDown = false;

var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;

var keyDownMappings = {	
	 80: setPlayBackState, //P
	 81: function(){ //Q
	 	setCameraLock();
	 },
	 70: doFullScreen, //F key
	 82: function(){
	 	resetLife();	
	 }, //R key
	 67: function(){
	 	showHideControls();	
	 } //C key
};

var keyUpMappings = { 
};

function setCameraLock(){
	_cameraLock = !_cameraLock;
}

function initEventHandlers(){
	$("#toolTip").qtip({
	    content:{
	      prerender : true,
	      text:  "Test"//tmpl("seedSelectorTmpl", {})
	    },
	    style: {
	      width: 400,
	      background: 'none',
	      border: 'none'
	    },
	//Position should ideally be at mouse xy
	position: {
		my: 'top left',
		viewport: $(document),
		adjust: {
			x: $(document).width()/2,
			y: $(document).height()/2
		}
	}
	});
	
	$(document)[0].oncontextmenu = function() {return false;}  

	$(document).keydown(function(e) {
		if(keyDownMappings[e.which]){
			keyDownMappings[e.which]();	
		}
	});
	
	$(document).keyup(function(e) {
		if(keyUpMappings[e.which]){
			keyUpMappings[e.which]();	
		}		
	});
	
	var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
	$(document).bind(mousewheelevt, function(e){
	
	    var evt = window.event || e //equalize event object     
	    evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible               
	    var delta = evt.detail ? evt.detail*(-40) : evt.wheelDelta //check for detail first, because it is used by Opera and FF
	
	    if(delta > 0) {
	        console.log("scroll up");
	        _zoomValue -= 40;
	    }
	    else{
			console.log("scroll down");
			_zoomValue += 40;
	    }   
	});	
	
	$('canvas').mousedown(function(event){
		switch(event.which){
			case 1:
				findIntersectingCell(event.clientX, event.clientY, "click");		
			break;
			case 3:
				//findIntersectingCell(event.clientX, event.clientY, "rightClick");
				var qtip = $("#toolTip").qtip('api');
				//qtip.updatePosition(event, false);
				qtip.show();
				console.log(qtip);
			break;
		}

	});
	
	
	$('canvas').mousemove(function(event){
		/*mouseX = event.clientX;
    	mouseY = event.clientY;
    	
    	findIntersectingCell(event.clientX, event.clientY, "mouseOver");*/
	});
	
	$(window).resize(function(){
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth -20, window.innerHeight -20 );
			
	});
}

function findIntersectingCell(mouseX, mouseY, eventAction){
	console.log(mouseX + " " + mouseY);
	var vector = new THREE.Vector3( ( mouseX / window.innerWidth ) * 2 - 1, - ( mouseY / window.innerHeight ) * 2 + 1, 0.5 );
	
	//var vector = controls.target.clone().subSelf( controls.object.position ).normalize();
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.subSelf( camera.position ).normalize() );
	
	//var raycaster = new THREE.Ray( controls.position, vector.subSelf( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects(_cellGrid.children);

	if ( intersects.length > 0 ) {
		switch(eventAction){
			case "click":
				setCellState(intersects[0].object);
			break;
			case "mouseOver":
				/*for(var i = 0, len=_cellGrid.children.length; i<len;++i){
					if(!_cellGrid.children[i]._cellState){
						_cellGrid.children[i].material.opacity = 0.3;
					}
				}*/
				
				/*if(!intersects[0].object._cellState){
					intersects[0].object.material.opacity = 0.7;
				}*/
	
			break;
			case "rightClick":
				
			break;
		}
	}		
}

function doFullScreen(){
	if(THREEx.FullScreen.available()){
		if(THREEx.FullScreen.activated()){
			THREEx.FullScreen.cancel();
		}else{
			THREEx.FullScreen.request();
		}
	}else{
		alert("Your browser does not want to cooperate.");
	}
}

function setPlayBackState(){
	if(_PLAYBACKSTATE){
		_PLAYBACKSTATE = false;
	}else if(!_PLAYBACKSTATE){
		_PLAYBACKSTATE = true;		
	}
	
	changePlayBackIcon();
}

function initCanvas(){
	renderer = new THREE.WebGLRenderer();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1100000);
	scene = new THREE.Scene();
	
	// var urlPrefix = "C:/Dev/Game-of-Life/style/img/skybox/";
	// var urls = [
		// urlPrefix + "Galaxy_BK.bmp",
		// urlPrefix + "Galaxy_FT.bmp",
		// urlPrefix + "Galaxy_UP.bmp",
		// urlPrefix + "Galaxy_DN.bmp",
		// urlPrefix + "Galaxy_RT.bmp",
		// urlPrefix + "Galaxy_LT.bmp"
	// ];

	// var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	// //textureCube.format = THREE.RGBFormat;
	// var shader = THREE.ShaderLib[ "cube" ];
	// // shader.uniforms[ "tCube" ].value = textureCube;

	// cubematerial = new THREE.ShaderMaterial({
	    // fragmentShader: shader.fragmentShader,
	    // vertexShader: shader.vertexShader,
	    // uniforms: shader.uniforms,
	    // depthWrite: false,
	    // side: THREE.BackSide
	// });
	// skyBox = new THREE.Mesh(new THREE.CubeGeometry(10000,10000,10000), cubematerial);
	// scene.add(skyBox);

	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = 80;
	controls.lookSpeed = 0.150;
	controls.lookVertical = true;
	camera.position.set( -300, 150, 0 );
	
	renderer.setSize(window.innerWidth-15, window.innerHeight-18);
	$('#container').append(renderer.domElement);
	
	projector = new THREE.Projector();
	
	addCells();
	_latestUpdate = +new Date();
	tick();
}

function addCells(){
	var cellWidth = 0.2;
	var cellHeight = 0.2;
    var rowArray;
    var geo = new THREE.CubeGeometry(5, 5, 5);  
    
    _cellGrid = new THREE.Object3D();
    var gridDimensions = getGridDimensions();
     
    for (var j=0; j<gridDimensions.height; j++) {
        rowArray = [];
       
    	for (var i=0; i<gridDimensions.width; i++) {
    		
			var mat = new THREE.MeshBasicMaterial({color: cellDeadColor, wireframe: false, linewidth: 10, opacity: 0.8, transparent: true});
         	var mesh = new THREE.Mesh(geo, mat);
         	mesh.autoUpdateMatrix = false;
         	mesh.position.x = (i-gridDimensions.width/2) * 7.1;
         	mesh.position.y = 1;
         	mesh.position.z = -(j-gridDimensions.height/2) * 7.1;
		
			//Cells are dead by default
			mesh._cellState = false;
         		
			if(typeof(_cellPosGrid[j]) != []){
				_cellPosGrid[j] = [];
			}
			
			rowArray.push(mesh);
	        //scene.add(mesh);
	        
	        _cellGrid.add(mesh);

       }
       
       _cellPosGrid[j].push(rowArray);
     }
	//_cellGrid.autoUpdateMatrix = false;
	scene.add(_cellGrid);
}

function posGridToArray(){
	var cellArray = [];
	for(var i = 0, rlen = _cellPosGrid.length; i < rlen; ++i){
		for(var j = 0, clen = _cellPosGrid[i][0].length; j < clen; ++j){
			cellArray.push(_cellPosGrid[i][0][j]);
		}
	}	
	return cellArray;
}

function tick(){
	requestAnimationFrame(tick);
	
	if(_PLAYBACKSTATE){
		var currentTime = +new Date();
		var diff = currentTime - _latestUpdate;
		
		if(diff > _tickDelay){
			evaluateLife();
			_latestUpdate = +new Date();
			updateGenerationCount();
		}
	}
	
	/*spdy =  (screenH / 2 - mouseY) / 100;
    spdx =  (screenW / 2 - mouseX) / 100;
    if (_shiftKeyState){
        _cellGrid.rotation.x = spdy;
        _cellGrid.rotation.y = spdx;
    }*/
	
	//animateCubeSizes();
	
	/*camera.position.set( 100, _zoomValue, 50 );
	camera.lookAt( scene.position );*/
	controls.update( clock.getDelta() );
	renderer.render(scene, camera);
	
	var thisFrameTime = (thisLoop=new Date) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
}

function evaluateLife(){
	var gridIndex;
	
	for(var i = 0, rlen= _cellPosGrid.length;i<rlen; ++i){
		for(var j = 0, clen= _cellPosGrid[i][0].length;j<clen; ++j){
			applyLifeRules(_cellPosGrid[i][0][j], [i, j]);
		}
	}
	
	applyLifeChanges();
}

function animateCubeSizes(){
	var animationFinished = [];
	for(var i=0, len=requestedSizeAnimations.length; i<len; ++i){
		var currentCell = requestedSizeAnimations[i]._cellState;
		if(currentCell._cellState){
			if(current.scale.y <= 1.0){
				requestedSizeAnimations[i] = null;
			}else{
					
			}
		}else{
				
		}
	}
}

function getGridDimensions(){
	return {
		height: 80,
		width: 80	
	};
}

function findCellIndex(cellID){
	var columnIndex;
	
	for(var j = 0,len=_cellPosGrid.length;j<len; ++j){
		columnIndex = $.inArray(cellID, _cellPosGrid[j][0]);
		
		if(columnIndex != -1){
			return [j, columnIndex]; 
		}
	}

	return false;
}

function setCellState(cell){
	if(cell._cellState){
		cell.material.color.setHex(cellDeadColor);
		cell.material.wireframe = true;
		cell.material.opacity = 0.3;
		cell.scale.y = 1;
		cell._cellState = false;
	}else if(!cell._cellState){
		cell.material.color.setHex(cellAliveColor);
		cell.material.wireframe = false;
		cell.material.opacity = 0.9;
		cell.scale.y = 1.7;
		cell._cellState = true;
	}
}

function forceKillCell(cell){
	cell.material.color.setHex(cellDeadColor);
	cell.material.opacity = 0.3;
	cell.scale.y = 1;
	cell._cellState = false;	
}

function applyLifeRules(cell, gridIndex){
	var neighbourCount = getLivingNeighbours(gridIndex);

	if(cell._cellState){
		if(neighbourCount != 2 && neighbourCount != 3){
			if(neighbourCount < 2){ //Death by underpopulation
				cellUpdateArray.push(cell);
			}else if(neighbourCount > 3){ //Death by overpopulation
				cellUpdateArray.push(cell);
			}
		}
	}else if(!cell._cellState){
		if(neighbourCount == 3){ //3 is the magic number
			cellUpdateArray.push(cell);
		}
	}
}

function applyLifeChanges(){
	for(var i = 0, len=cellUpdateArray.length; i < len;++i){
		setCellState(cellUpdateArray[i]);
	}
	cellUpdateArray.length = 0;
}

function setSeed(selectedSeed){
	var seedObject = getSeedObject(selectedSeed);
			
	//For now center seed pattern
	var startPosRow = Math.round(_cellPosGrid.length/2);
	var startPosCol = Math.round(_cellPosGrid[0][0].length/2);
	var currentPosCol = startPosCol;

	for(var j = 0; j < seedObject.rows; j++){
		for(var i = 0; i < seedObject.cols; i++){

			if(seedObject.pattern[j][i] == 1){
				setCellState(_cellPosGrid[startPosRow][0][currentPosCol]);
			}
			
			currentPosCol++;
		}	
		
		startPosRow++;
		currentPosCol = startPosCol;
	}
}

function getLivingNeighbours(gridIndex){
	var rowIndex = gridIndex[0];
	var colIndex = gridIndex[1];
	var neighbourCount = 0;
	
	if(!isFirstRow(rowIndex)){

		var cellState = _cellPosGrid[rowIndex-1][0][colIndex]._cellState; 
		if(cellState){
			
			neighbourCount++;
		}
		
		if(!isFirstColumn(colIndex)){
			var cellState = _cellPosGrid[rowIndex-1][0][colIndex-1]._cellState; 
			
			if(cellState){
				neighbourCount++;
			}		
		}
		
		if(!isLastColumn(colIndex)){
			var cellState = _cellPosGrid[rowIndex-1][0][colIndex+1]._cellState; 
			
			if(cellState){
				neighbourCount++;
			}		
		}
	}
	
	if(!isLastRow(rowIndex)){
		var cellState = _cellPosGrid[rowIndex+1][0][colIndex]._cellState; 
		if(cellState){
			neighbourCount++;
		}		
		
		if(!isFirstColumn(colIndex)){
			var cellState = _cellPosGrid[rowIndex+1][0][colIndex-1]._cellState;
			
			if(cellState){
				neighbourCount++;
			}				
		}
		
		if(!isLastColumn(colIndex)){
			var cellState = _cellPosGrid[rowIndex+1][0][colIndex+1]._cellState; 
			
			if(cellState){
				neighbourCount++;
			}				
		}		
	}
	
	
	if(!isFirstColumn(colIndex)){
		var cellState = _cellPosGrid[rowIndex][0][colIndex-1]._cellState; 
		
		if(cellState){
			neighbourCount++;
		}
	}
	
	if(!isLastColumn(colIndex)){
		var cellState = _cellPosGrid[rowIndex][0][colIndex+1]._cellState; 
		
		if(cellState){
			neighbourCount++;
		}
	}
	
	return neighbourCount;
}

function isFirstRow(rowIndex){
	if(!_cellPosGrid[rowIndex-1]){
		return true;
	}
	return false;
}

function isLastRow(rowIndex){
	if(!_cellPosGrid[rowIndex+1]){
		return true;
	}
	return false;	
}

function isFirstColumn(colIndex){
	if(!_cellPosGrid[0][0][colIndex-1]){
		return true;
	}
	return false;
}

function isLastColumn(colIndex){
	if(!_cellPosGrid[0][0][colIndex+1]){
		return true;
	}
	return false;
}

function resetCellStates(){
	for(var i = 0, len=_cellGrid.children.length; i<len;++i){
		forceKillCell(_cellGrid.children[i]);
	}	
}

setInterval(function(){
  $("#fps").empty().text((1000/frameTime).toFixed(1) + " fps");
},1000);