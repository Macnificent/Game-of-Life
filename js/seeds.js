

function getSeedObject(selectedSeed){
	var seed;
	

	
	switch(selectedSeed){
		/*
		 * Still lifes
		 */
		 
		case "block":
			seed = {
				rows: 2,
				cols: 2,
				pattern: [[1,1],[1,1]]
			};		
		break;
		case "beehive":
			seed = {
				rows: 3,
				cols: 4,
				pattern:[[0,1,1,0],[1,0,0,1],[0,1,1,0]]	
			}
		break;
		case "loaf":
			seed = {
				rows: 4,
				cols: 4,
				pattern:[[0,1,1,0],[1,0,0,1],[0,1,0,1],[0,0,1,0]]	
			}
		break;
		case "boat":
			seed = {
				rows: 3,
				cols: 3,
				pattern:[[1,1,0],[1,0,1],[0,1,0]]	
			}
		break;
		
		/*
		 * Oscillators
		 */
		 
		case "blinker":
			seed = {
				rows: 3,
				cols: 1,
				pattern:[[1],[1],[1]]	
			}
		break;
		case "beacon":
			seed = {
				rows: 4,
				cols: 4,
				pattern:[[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]]	
			}
		break;
		case "toad":
			seed = {
				rows: 3,
				cols: 4,
				pattern:[[0,0,0,0],[0,1,1,1],[1,1,1,0]]	
			}
		break;
		case "pulsar":
			seed = {
				rows: 5,
				cols: 3,
				pattern:[[0,1,0],[1,1,1],[1,0,1],[1,1,1],[0,1,0]]	
			}
		break;
		case "pentadecathlon":
			seed = {
				rows: 10,
				cols: 1,
				pattern:[[1],[1],[1],[1],[1],[1],[1],[1],[1],[1]]	
			}		
		break;
		
		/*
		 * Spaceships
		 */
		case "glider":
			seed = {
				rows: 3,
				cols: 3,
				pattern:[[0,1,0],[0,1,1],[1,0,1]]	
			}
		break;
		case "lwss":
			seed = {
				rows: 4,
				cols: 5,
				pattern:[[1,0,0,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1]]	
			}
		break;

	}
		
		
	return seed;
}
 