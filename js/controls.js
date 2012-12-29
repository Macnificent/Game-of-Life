function initControls(){
	$("#controlBtn").click(function(){
		showHideControls();
	});	

	$("#startStop").click(setPlayBackState);
	
	$("#tickDelay").change(function(){
		_tickDelay = $(this).val();
		$(this).trigger('focusout');
	});	
	
	$("#reset").click(resetLife);
	
	$("#seedSelect").change(function(){
		setSeed($(this).val());
	});
}

function resetLife(){
	if(_PLAYBACKSTATE){
		setPlayBackState();
	}
	clearGenerationCounter();
	resetCellStates();	
}

function clearGenerationCounter(){
	$("#genCount").empty().text(0);	
}

function changePlayBackIcon(){
	if($("#startStop").hasClass("start")){
		$("#startStop").removeClass("start").addClass("stop");
	}else{
		$("#startStop").removeClass("stop").addClass("start");
	}
	changePlayBackStateText();
}

function changePlayBackStateText(){
	var currentText = $("#stateText").text();
	console.log(currentText);
	if(currentText == "Paused"){
		currentText = "Running";	
	}else{
		currentText = "Paused"	
	}
	
	$("#stateText").empty().text(currentText);
}

function showHideControls(){
	if($(".controlSelected").length){
		hideControls();
	}else{
		showControls();	
	}	
}

function showControls(){
	$("#controlBtn").addClass("controlSelected");
	
	$("#controlContainer").show(500);
	$("#controlTipsContainer").show(500);
}

function hideControls(){
	$("#controlBtn").removeClass("controlSelected");
	
	$("#controlContainer").hide(500);
	$("#controlTipsContainer").hide(500);
	
}

function updateGenerationCount(){
	var currentCount = +$("#genCount").text();
	$("#genCount").empty().text(currentCount+1);	
}