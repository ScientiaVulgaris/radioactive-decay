
;(function(window, Math) {
 	
	 /*
	  * Octree Constructor
	  * @param Object bounds		bounds of the node, object with x, y, z, width, height, depth
	  * @param Integer max_objects		(optional) max objects a node can hold before splitting into 4 subnodes (default: 10)
	  * @param Integer max_levels		(optional) total max levels inside root Octree (default: 4) 
	  * @param Integer level		(optional) deepth level, required for subnodes  
	  */
	function Octree( x1, x2, y1, y2, z1, z2, max_objects, max_levels, level ) {
		
		this.max_objects	= max_objects || 10;
		this.max_levels		= max_levels || 4;
		
		this.level 		= level || 0;
		this.x1		= x1;
		this.x2		= x2;
		this.y1		= y1;
		this.y2		= y2;
		this.z1		= z1;
		this.z2		= z2;
		
		this.objects 		= [];
		this.nodes 		= [];
	};
	
	
	/*
	 * Split the node into 8 subnodes
	 */
	Octree.prototype.split = function() {
		
		var 	nextLevel	= this.level + 1,
			subWidth	= Math.round( (this.x2 +this.x1) / 2 ),
			subHeight 	= Math.round( (this.y2 +this.y1) / 2 ),
			subDepth 	= Math.round( (this.z2 +this.z1) / 2 ),
			x1		= x1,
			x2		= x2,
			y1		= y1,
			y2		= y2,
			z1		= z1,
			z2		= z2;	
	 
	 	//top front right node
		this.nodes[0] = new Octree({
			x1		= subWidth,
			x2		= x2,
			y1		= subHeight,
			y2		= y2,
			z1		= subDepth,
			z2		= z2;	
		}, this.max_objects, this.max_levels, nextLevel);
		
		//top back right node
		this.nodes[1] = new Octree({
			x1		= subWidth,
			x2		= x2,
			y1		= subHeight,
			y2		= y2,
			z1		= z1,
			z2		= subDepth;
		}, this.max_objects, this.max_levels, nextLevel);
		
		//top back left node
		this.nodes[2] = new Octree({
			x1		= x1,
			x2		= subWidth,
			y1		= subHeight,
			y2		= y2,
			z1		= z1,
			z2		= subDepth;
		}, this.max_objects, this.max_levels, nextLevel);
		
		//top front left node
		this.nodes[3] = new Octree({
			x1		= x1,
			x2		= subWidth,
			y1		= subHeight,
			y2		= y2,
			z1		= subDepth,
			z2		= z2;	
		}, this.max_objects, this.max_levels, nextLevel);

		//bottom front right node
		this.nodes[4] = new Octree({
			x1		= subWidth,
			x2		= x2,
			y1		= y1,
			y2		= subHeight
			z1		= subDepth,
			z2		= z2;	
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom back right
		this.nodes[5] = new Octree({
			x1		= subWidth,
			x2		= x2,
			y1		= y1,
			y2		= subHeight
			z1		= z1,
			z2		= subDepth;
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom back left node
		this.nodes[6] = new Octree({
			x1		= x1,
			x2		= subDepth,
			y1		= y1,
			y2		= subWidth
			z1		= z1,
			z2		= subDepth;
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom front left node
		this.nodes[7] = new Octree({
			x1		= x1,
			x2		= subWidth,
			y1		= y1,
			y2		= subHeight
			z1		= subDepth,
			z2		= z2;	
		}, this.max_objects, this.max_levels, nextLevel);
	};
	
	
	/*
	 * Determine which node the object belongs to
	 * @param Object pRect		bounds of the area to be checked, with x, y, width, height
	 * @return Integer		index of the subnode (0-3), or -1 if pRect cannot completely fit within a subnode and is part of the parent node
	 */
	Octree.prototype.getIndex = function( pRect ) {
		
		var 	index 			= -1,
			Xmidpoint 	= Math.round( (this.x2 +this.x1) / 2 ),
			Ymidpoint 	= Math.round( (this.y2 +this.y1) / 2 ),
			Zmidpoint	= Math.round( (this.z2 +this.z1) / 2 ),
	 
			//pRect can completely fit within the top octants
			topOctant = (pRect.y < Ymidpoint && pRect.y + pRect.height < Ymidpoint),
			
			//pRect can completely fit within the bottom octants
			bottomOctant = (pRect.y > Ymidpoint),

			//complete fit in front octants
			frontOctant = (pRect.z > Zmidpoint), 

			//completely fit in back quadrants
			backOctant = (pRect.z < Zmidpoint);
		 
		//pRect can completely fit within the left quadrants
		if( pRect.x < Xmidpoint && pRect.x + pRect.width < Xmidpoint ) {
			if( topOctant ) {
				if (frontOctant){
				index = 3;
				}else if (backOctant){
				index = 2;
				}
				
			} else if( bottomOctant ) {
				if (frontOctant){
					index = 7;
				else if (backOctant){
				index = 6;
				}
			}
			
		//pRect can completely fit within the right quadrants	
		} else if( pRect.x > Xmidpoint ) {
			if( topOctant ) {
				if(frontOctant){
				index = 0;
				} else if (backOctant){
					index = 1;
				}
			} else if( bottomOctant ) {
				if(frontOctant){
				index = 4;
				} else if (backOctant){
				
				index = 5;
			}
		}
	 
		return index;
	};
	
	
	/*
	 * Insert the object into the node. If the node
	 * exceeds the capacity, it will split and add all
	 * objects to their corresponding subnodes.
	 * @param Object pRect		bounds of the object to be added, with x, y, width, height
	 */
	Octree.prototype.insert = function( pRect ) {
		
		var 	i = 0,
	 		index;
	 	
	 	//if we have subnodes ...
		if( typeof this.nodes[0] !== 'undefined' ) {
			index = this.getIndex( pRect );
	 
		  	if( index !== -1 ) {
				this.nodes[index].insert( pRect );	 
			 	return;
			}
		}
	 
	 	this.objects.push( pRect );
		
		if( this.objects.length > this.max_objects && this.level < this.max_levels ) {
			
			//split if we don't already have subnodes
			if( typeof this.nodes[0] === 'undefined' ) {
				this.split();
			}
			
			//add all objects to there corresponding subnodes
			while( i < this.objects.length ) {
				
				index = this.getIndex( this.objects[ i ] );
				
				if( index !== -1 ) {					
					this.nodes[index].insert( this.objects.splice(i, 1)[0] );
				} else {
					i = i + 1;
			 	}
		 	}
		}
	 };
	 
	 
	/*
	 * Return all objects that could collide with the given object
	 * @param Object pRect		bounds of the object to be checked, with x, y, width, height
	 * @Return Array		array with all detected objects
	 */
		Octree.prototype.retrieve = function( pRect ) {
	 	
		var 	index = this.getIndex( pRect ),
			returnObjects = this.objects;
			
		//if we have subnodes ...
		if( typeof this.nodes[0] !== 'undefined' ) {
			
			//if pRect fits into a subnode ..
			if( index !== -1 ) {
				returnObjects = returnObjects.concat( this.nodes[index].retrieve( pRect ) );
				
			//if pRect does not fit into a subnode, check it against all subnodes
			} else {
				for( var i=0; i < this.nodes.length; i=i+1 ) {
					returnObjects = returnObjects.concat( this.nodes[i].retrieve( pRect ) );
				}
			}
		}
	 
		return returnObjects;
	};
	
	
	/*
	 * Clear the quadtree
	 */
	Octree.prototype.clear = function() {
		
		this.objects = [];
	 
		for( var i=0; i < this.nodes.length; i=i+1 ) {
			if( typeof this.nodes[i] !== 'undefined' ) {
				this.nodes[i].clear();
		  	}
		}

		this.nodes = [];
	};

	//make Quadtree available in the global namespace
	window.Octree = Octree;	

})(window, Math);
