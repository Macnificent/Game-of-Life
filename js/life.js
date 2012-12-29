/*
* John Horton Conway´s Game of Life using Three.js and jQuery
* Marcus Folkeryd 2012
*/


var scene, camera;
var renderer, projector;

var _PLAYBACKSTATE;
var _zoomValue = 200;
var _cellGrid;
var _cellPosGrid = [];
var cellAliveColor = 0x000000;
var cellDeadColor = 0xCCCCCC;//0xDADADA;
var _latestUpdate;
var cellUpdateArray = [];
var _shiftKeyState = false;
var _tickDelay = 100; //Default

var screenW = window.innerWidth;
var screenH = window.innerHeight; 
var spdx = 0, spdy = 0; mouseX = 0, mouseY = 0, mouseDown = false;

var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;

var keyDownMappings = {	
	 32: setPlayBackState, //Space
	 16: function(){ //Shift
	 	setShiftKeyState(true);
	 },
	 70: doFullScreen, //F key
	 82: function(){
	 	resetLife();	
	 },
	 67: function(){
	 	showHideControls();	
	 } //R key
};

var keyUpMappings = { 
	 16: function(){ //Shift
	 	setShiftKeyState(false);
	 }	
};

function setShiftKeyState(boolState){
	if(_shiftKeyState != boolState){
		_shiftKeyState = boolState;
	}
	console.log("shift " + boolState);
}

function initEventHandlers(){
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
	
	$('canvas').click(function(event){
		findIntersectingCell(event.clientX, event.clientY, "click");
	});
	
	
	$('canvas').mousemove(function(event){
		mouseX = event.clientX;
    	mouseY = event.clientY;
    	
    	findIntersectingCell(event.clientX, event.clientY, "mouseOver");
	});
	
	$(window).resize(function(){
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth -20, window.innerHeight -20 );
			
	});
}

function findIntersectingCell(mouseX, mouseY, eventAction){
	var vector = new THREE.Vector3( ( mouseX / window.innerWidth ) * 2 - 1, - ( mouseY / window.innerHeight ) * 2 + 1, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.subSelf( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects(_cellGrid.children);

	if ( intersects.length > 0 ) {
		switch(eventAction){
			case "click":
				setCellState(intersects[0].object);
			break;
			case "mouseOver":
				/*for(var i = 0; i < _cellGrid.children.length; i++){
					if(!_cellGrid.children[i]._cellState){
						_cellGrid.children[i].material.opacity = 0.3;
					}
				}
				
				if(!intersects[0].object._cellState){
					intersects[0].object.material.opacity = 0.7;
				}*/
	
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
	console.log(_PLAYBACKSTATE);
}

function initCanvas(){
	
	renderer = new THREE.WebGLRenderer();
	camera = new THREE.PerspectiveCamera( 400, window.innerWidth / window.innerHeight, 1, 10000 );

	scene = new THREE.Scene();
	
	renderer.setSize(window.innerWidth-20, window.innerHeight-20);
	console.log(renderer.autoUpdateObjects);
	$('#container').append(renderer.domElement);
	
	projector = new THREE.Projector();
	
	addCells();
	_latestUpdate = +new Date();
	tick();
	
	console.log("initCanvas");
}

function addCells(){
	var cellWidth = 0.2;
	var cellHeight = 0.2;
    var rowArray;
    	  
    _cellGrid = new THREE.Object3D();

     var gridDimensions = getGridDimensions();
     
     for (var j=0; j<gridDimensions.height; j++) {
       rowArray = [];
       for (var i=0; i<gridDimensions.width; i++) {
         var mat = new THREE.MeshBasicMaterial({color: cellDeadColor, opacity: 0.3, transparent: true});	

         var geo = new THREE.CubeGeometry(5, 5, 5);
         var mesh = new THREE.Mesh(geo, mat);
         mesh.autoUpdateMatrix = false;
         
         mesh.position.x = (i-gridDimensions.width/2) * 5.1;
         mesh.position.y = 1;
         mesh.position.z = -(j-gridDimensions.height/2) * 5.1;
         mesh.castShadow = mesh.receiveShadow = true;
		
		//Cells are dead by default
		mesh._cellState = false;
		
		if(typeof(_cellPosGrid[j]) != []){
			_cellPosGrid[j] = [];
		}
		
		rowArray.push(mesh.id);
        _cellGrid.add(mesh);
       
       }
       
       _cellPosGrid[j].push(rowArray);
     }
	
	scene.add(_cellGrid);
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
	
	spdy =  (screenH / 2 - mouseY) / 100;
    spdx =  (screenW / 2 - mouseX) / 100;
    if (_shiftKeyState){
        _cellGrid.rotation.x = spdy;
        _cellGrid.rotation.y = spdx;
    }
	
	camera.position.set( 100, _zoomValue, 50 );
	camera.lookAt( scene.position );
	renderer.render(scene, camera);
	
	var thisFrameTime = (thisLoop=new Date) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
}

function evaluateLife(){
	var gridIndex;
	
	for(var i = 0; i < _cellGrid.children.length; i++){
		current = _cellGrid.children[i];
		
		gridIndex = findCellIndex(current.id);
		applyLifeRules(current, gridIndex);
		
	}

	applyLifeChanges();
}

function getGridDimensions(){
	return {
		height: 40,
		width: 40	
	};
}

function findCellIndex(cellID){
	var columnIndex;
	
	for(var j = 0; j < _cellPosGrid.length; j++){
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
		cell.material.opacity = 0.3;
		cell.scale.y = 1;
		cell._cellState = false;
	}else if(!cell._cellState){
		cell.material.color.setHex(cellAliveColor);
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
	for(var i = 0; i < cellUpdateArray.length; i++){
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
				var cell = getCellByID(_cellPosGrid[startPosRow][0][currentPosCol]);
				setCellState(cell);
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

		var cellState = getCellStateByID(_cellPosGrid[rowIndex-1][0][colIndex]);
		if(cellState){
			
			neighbourCount++;
		}
		
		if(!isFirstColumn(colIndex)){
			var cellState = getCellStateByID(_cellPosGrid[rowIndex-1][0][colIndex-1]);
			
			if(cellState){
				neighbourCount++;
			}		
		}
		
		if(!isLastColumn(colIndex)){
			var cellState = getCellStateByID(_cellPosGrid[rowIndex-1][0][colIndex+1]);
			
			if(cellState){
				neighbourCount++;
			}		
		}
	}
	
	if(!isLastRow(rowIndex)){
		var cellState = getCellStateByID(_cellPosGrid[rowIndex+1][0][colIndex]);
		if(cellState){
			neighbourCount++;
		}		
		
		if(!isFirstColumn(colIndex)){
			var cellState = getCellStateByID(_cellPosGrid[rowIndex+1][0][colIndex-1]);
			
			if(cellState){
				neighbourCount++;
			}				
		}
		
		if(!isLastColumn(colIndex)){
			var cellState = getCellStateByID(_cellPosGrid[rowIndex+1][0][colIndex+1]);
			
			if(cellState){
				neighbourCount++;
			}				
		}		
	}
	
	
	if(!isFirstColumn(colIndex)){
		var cellState = getCellStateByID(_cellPosGrid[rowIndex][0][colIndex-1]);
		
		if(cellState){
			neighbourCount++;
		}
	}
	
	if(!isLastColumn(colIndex)){
		var cellState = getCellStateByID(_cellPosGrid[rowIndex][0][colIndex+1]);
		
		if(cellState){
			neighbourCount++;
		}
	}
	
	return neighbourCount;
}

function getCellStateByID(cellID){
	for(var i = 0; i< _cellGrid.children.length; i++){
		if(_cellGrid.children[i].id == cellID){
			return 	_cellGrid.children[i]._cellState;
		}	
	}
	
	return false;
}


function getCellByID(cellID){
	for(var i = 0; i< _cellGrid.children.length; i++){
		if(_cellGrid.children[i].id == cellID){
			return 	_cellGrid.children[i];
		}	
	}
	
	return false;
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
	for(var i = 0; i < _cellGrid.children.length; i++){
		forceKillCell(_cellGrid.children[i]);
	}	
}

setInterval(function(){
  $("#fps").empty().text((1000/frameTime).toFixed(1) + " fps");
},1000);