
;(function(window, Math) {
 	
	 /*
	  * Octree Constructor
	  * @param Object bounds		bounds of the node, object with x, y, z, width, height, depth
	  * @param Integer max_objects		(optional) max objects a node can hold before splitting into 4 subnodes (default: 10)
	  * @param Integer max_levels		(optional) total max levels inside root Octree (default: 4) 
	  * @param Integer level		(optional) deepth level, required for subnodes  
	  */
	function Octree( bounds, max_objects, max_levels, level ) {
		
		this.max_objects	= max_objects || 10;
		this.max_levels		= max_levels || 4;
		
		this.level 		= level || 0;
		this.bounds 		= bounds;
		
		this.objects 		= [];
		this.nodes 		= [];
	};
	
	
	/*
	 * Split the node into 8 subnodes
	 */
	Octree.prototype.split = function() {
		
		var 	nextLevel	= this.level + 1,
			subWidth	= Math.round( this.bounds.width / 2 ),
			subHeight 	= Math.round( this.bounds.height / 2 ),
			x 		= Math.round( this.bounds.x ),
			y 		= Math.round( this.bounds.y );		
	 
	 	//top right node
		this.nodes[0] = new Octree({
			x	: x + subWidth, 
			y	: y, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//top left node
		this.nodes[1] = new Octree({
			x	: x, 
			y	: y, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom left node
		this.nodes[2] = new Octree({
			x	: x, 
			y	: y + subHeight, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom right node
		this.nodes[3] = new Octree({
			x	: x + subWidth, 
			y	: y + subHeight, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);

		this.nodes[4] = new Octree({
			x	: x + subWidth, 
			y	: y, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//top left node
		this.nodes[5] = new Octree({
			x	: x, 
			y	: y, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom left node
		this.nodes[6] = new Octree({
			x	: x, 
			y	: y + subHeight, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
		
		//bottom right node
		this.nodes[7] = new Octree({
			x	: x + subWidth, 
			y	: y + subHeight, 
			width	: subWidth, 
			height	: subHeight
		}, this.max_objects, this.max_levels, nextLevel);
	};
	
	
	/*
	 * Determine which node the object belongs to
	 * @param Object pRect		bounds of the area to be checked, with x, y, width, height
	 * @return Integer		index of the subnode (0-3), or -1 if pRect cannot completely fit within a subnode and is part of the parent node
	 */
	Octree.prototype.getIndex = function( pRect ) {
		
		var 	index 			= -1,
			verticalMidpoint 	= this.bounds.x + (this.bounds.width / 2),
			horizontalMidpoint 	= this.bounds.y + (this.bounds.height / 2),
	 
			//pRect can completely fit within the top quadrants
			topQuadrant = (pRect.y < horizontalMidpoint && pRect.y + pRect.height < horizontalMidpoint),
			
			//pRect can completely fit within the bottom quadrants
			bottomQuadrant = (pRect.y > horizontalMidpoint);
		 
		//pRect can completely fit within the left quadrants
		if( pRect.x < verticalMidpoint && pRect.x + pRect.width < verticalMidpoint ) {
			if( topQuadrant ) {
				index = 1;
			} else if( bottomQuadrant ) {
				index = 2;
			}
			
		//pRect can completely fit within the right quadrants	
		} else if( pRect.x > verticalMidpoint ) {
			if( topQuadrant ) {
				index = 0;
			} else if( bottomQuadrant ) {
				index = 3;
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
