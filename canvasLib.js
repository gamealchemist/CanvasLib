/*
 * 			CanvasLib
 * 
 *   Javascript html5 Canvas Helper functions
 *      and add-on to the context2d
 * 
 *   Features : 
 * 
 *   Helpers :
 *     insertCanvas on the web page.
 *     create canvas.
 *     insert canvas on top/below another one.
 *     create a canvas from an image.
 *     requestAnimationFrame polyfill
 * 
 *   Context2d :
 *     build the shadow of a canvas
 *     build a copy of a canvas
 *     adds width and height property to the context2d.
 *     rounded rectangle
 *     circle
 *     ellipse
 *     blur
 *     varLine line of variable width
 *     varLineRounded rounded line of variable width
 * 
 *   Author : Vincent Piel
 * 
 *   m@il   : vincentpiel • free.fr
 * 
 *   Blog   : http://gamealchemist.wordpress.com/ 
 * 
 *   License : Fair-ware.
 *             Play around as you like at home.
 * 			   You might tell me it's been usefull to you.
 *             Ask me, or at least warn me, and mention the original 
 *                     name/author if you redistribute a modified version.
 *             Share some profits if it helped you to build a payed game.
 */

(function() {
	
// Game Alchemist Workspace.
window.ga = window.ga || {};

ga.CanvasLib = { };

//  ------------------------------------
//        Helper functions
//  ------------------------------------


// insert a canvas on top of the current document.
// If width, height are not provided, use all document width / height
// width / height unit is Css pixel.
// returns the canvas.
ga.CanvasLib.insertMainCanvas = function insertMainCanvas (_w,_h) {
   if (_w==undefined) { _w = document.documentElement.clientWidth & (~3)  ; }
   if (_h==undefined) { _h = document.documentElement.clientHeight & (~3) ; }
   var mainCanvas = ga.CanvasLib.createCanvas(_w,_h);
   if ( !document.body ) { 
   	        var aNewBodyElement = document.createElement("body"); 
            document.body = aNewBodyElement; 
   };
   document.body.appendChild(mainCanvas);
   return mainCanvas;
}
		
// creates and returns a canvas having provided width, height
ga.CanvasLib.createCanvas  = function createCanvas ( w, h ) {
    var newCanvas = document.createElement('canvas');
	newCanvas.width  = w;     newCanvas.height = h;
	return newCanvas;
}

// Add a canvas below (default) or above the target canvas.
// returns this canvas.
// the inserted canvas has same width, height, and offset within the document.
ga.CanvasLib.insertCanvasLayer = function insertCanvasLayer (targetCanvas, _above) {
    if (_below === undefined) { _below=true; }
    var newCanvas= CanvasLib.createCanvas ( targetCanvas.width, targetCanvas.height );
    var parentDiv = targetCanvas.parentNode;
    if (!_above)   { parentDiv.insertBefore(newCanvas, targetCanvas); } 
    else           { var next = targetCanvas.nextSibling;   parentDiv.insertBefore(newCanvas, next); }
    newCanvas.offsetLeft = targetCanvas.offsetLeft; newCanvas.offsetTop = targetCanvas.offsetTop;
    return newCanvas;
};

// Returns a new canvas having the content as the provided image.
// It will be of same size, except if scale is provided.
// _smoothing defines wether the image should be smoothed when scaled up. defaults to true.
ga.CanvasLib.canvasFromImage = function canvasFromImage (sourceImage, _scale, _smoothing) {
	_scale = _scale || 1;
	var finalWidth  = sourceImage.width  * _scale ;
	var finalHeight = sourceImage.height * _scale ;
    var newCanvas   = ga.CanvasLib.createCanvas(finalWidth, finalHeight);
	var ctx = newCanvas.getContext('2d');
	if (_scale !=1 ) {
		if (_smoothing === undefined ) { _smoothing = true }
		_smoothing=!!_smoothing; 
		ctx.imageSmoothingEnabled  = ctx.mozImageSmoothingEnabled    = _smoothing;
		ctx.oImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = _smoothing;
	}
	ctx.drawImage(sourceImage, 0, 0, finalWidth, finalHeight);
	return newCanvas;
};


//  ------------------------------------
//        Add-on to Context2d
//  ------------------------------------

// width property for the context2d.  Does cache the this.canvas.width into a hidden property            
Object.defineProperty(CanvasRenderingContext2D.prototype, "width" ,
                      { get : function () { 
                      	                   if (this._width) return this._width;
  	                                       Object.defineProperty(this, '_width', { value : this.canvas.width}) ;
  	                                       return this._width ;        }} );
  	                                       
// height property for the context2d.  Does cache the this.canvas.height into a hidden property            
Object.defineProperty(CanvasRenderingContext2D.prototype, "height" ,
                      { get : function () { if (this._height) return this._height;
  	                                       Object.defineProperty(this, '_height', { value : this.canvas.height}) ;
  	                                       return this._height ;        }} );
 
// draw a rounded rectangle.
// use stroke()  or fill()    afterwise.
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x+r, y);
            this.arcTo(x+w, y,   x+w, y+h, r);
            this.arcTo(x+w, y+h, x,   y+h, r);
            this.arcTo(x,   y+h, x,   y,   r);
            this.arcTo(x,   y,   x+w, y,   r);
            this.closePath();
            return this; } ;
      
 
// blur : will blur the current canvas with given
// radius and intensity.
// let radius be in [2,14], and intensity below 0.1
// still experimental 
CanvasRenderingContext2D.prototype.blur = function ( radius, intensity) { 
  if (radius ===0) return;
  if(!(radius & 1)) radius++;
  this.save();  
  this.setTransform(1,0,0,1,0,0);
  var cv2 = this.buildCopy();
  var ctx2= cv2.getContext('2d');
  
  var raddiv2 = 0 | (radius/2);
  
  for (var i=0; i<radius; i++) 
    for(var j=0; j<radius; j++)
    { 
      var distance = Math.sqrt(sq(i-raddiv2)+sq(j-raddiv2));
      if (!distance || distance>raddiv2) continue;
      this.globalAlpha = intensity * attenuate(i-raddiv2,j-raddiv2,0,0,raddiv2);
      if (!this.globalAlpha) continue;
      this.drawImage(cv2, i-raddiv2, j-raddiv2);
    }
    this.restore();
};


// buildShadow
// returns a new canvas that has all non-empty pixels
// sets to the provided color.
//  use it to build a shadow or a highlight for a character
CanvasRenderingContext2D.prototype.buildShadow = function(color) {
  var cv2 = ga.CanvasLib.createCanvas(this.width, this.height) ;
  var ctx2= cv2.getContext('2d');
  ctx2.save();
  ctx2.fillStyle = '#333' ;
  ctx2.fillRect(0,0,cv.width, cv.height);
  ctx2.globalCompositeOperation='destination-in';
  ctx2.drawImage(this.canvas,0,0);
  ctx2.restore();
  return cv2;
};

// buildCopy
// returns a new canvas which contains a copy of the current canvas.
CanvasRenderingContext2D.prototype.buildCopy = function(scale) {
	var canvasCopy = ga.CanvasLib.createCanvas(this.width, this.height) ;
	var ctxCopy = canvasCopy.getContext('2d');
	ctxCopy.drawImage(this.canvas, 0, 0 );
	return canvasCopy;
};

// circle
// draw a circle centerd in (x,y) and of radius r.
// you might then use stroke or fill to get it drawn
// OR use the optionnal parameters fillColor, width, strokeColor
// which will trigger fill and/or stroke.
CanvasRenderingContext2D.prototype.circle =  function circle( x, y, r, fillColor, strokeColor, width ) {
		this.beginPath();
		this.arc(x, y, r, 0 , 2*Math.PI );
		this.closePath();
		if (fillColor) {
			 this.fillStyle   = fillColor ; 
			 this.fill()  ;
		}
        if (strokeColor) {
            if (width)    this.lineWidth   = width    ;
        	this.strokeStyle = strokeColor ;
        	this.stroke() ;
        }
 }



// ellipse
// draw a ellipse centerd in (x,y) and of horizontal radius r1, vertical r2.
// you might then use stroke or fill to get it drawn
// OR use the optionnal parameters fillColor, width, strokeColor
// which will trigger fill and/or stroke.
CanvasRenderingContext2D.prototype.ellipse = function ( x, y, r1, r2, fillColor, strokeColor, width ) {
	  this.beginPath();
  	  r1 /= 2 ;
  	  r2 /= 2 ;
 	  this.moveTo(x, y - r2);
  
	  this.bezierCurveTo( x + r1, y - r2 ,
	  					  x + r1, y + r2, 
                		  x		, y + r2 ); 

	  this.bezierCurveTo( x - r1, y + r2, 
				    	  x - r1, y - r2, 
				    	  x		, y - r2); 
	  this.closePath();	
 
		if (fillColor) {
			 this.fillStyle   = fillColor ; 
			 this.fill()  ;
		}
        if (strokeColor) {
            if (width)    this.lineWidth   = width    ;
        	this.strokeStyle = strokeColor ;
        	this.stroke() ;
        }
 }

// varLine : draws a line from A(x1,y1) to B(x2,y2)
// that starts with a w1 width and ends with a w2 width.
// you might then use stroke or fill to get it drawn
// OR use the optionnal parameters fillColor, width, strokeColor
// which will trigger fill and/or stroke.
CanvasRenderingContext2D.prototype.varLine = function(x1, y1, x2, y2, w1, w2, fillColor, strokeColor, width ) {
    var dx = (x2 - x1);
    var dy = (y2 - y1);
    w1 /= 2;      w2 /= 2; // we only use w1/2 and w2/2 for computations.
    // length of the AB vector
    var length = Math.sqrt(sq(dx) + sq(dy));
    if (!length) return; // exit if zero length
    dx /= length ;    dy /= length ;
    var shiftx = - dy * w1 ;  // compute AA1 vector's x
    var shifty =   dx * w1 ;  // compute AA1 vector's y
    this.beginPath();
    this.moveTo(x1 + shiftx, y1 + shifty);
    this.lineTo(x1 - shiftx, y1 - shifty); // draw A1A2
    shiftx =  - dy * w2 ;   // compute BB1 vector's x
    shifty =    dx * w2 ;   // compute BB1 vector's y
    this.lineTo(x2 - shiftx, y2 - shifty); // draw A2B1
    this.lineTo(x2 + shiftx, y2 + shifty); // draw B1B2
    this.closePath(); // draw B2A1
	if (fillColor) {
		 this.fillStyle   = fillColor ; 
		 this.fill()  ;
	}
    if (strokeColor) {
        if (width)    this.lineWidth   = width    ;
    	this.strokeStyle = strokeColor ;
    	this.stroke() ;
    }  
}

// varLineRounded : draws a line from A(x1,y1) to B(x2,y2)
// that starts with a w1 width and ends with a w2 width,
//  and has rounded edges.
// you might then use stroke or fill to get it drawn
// OR use the optionnal parameters fillColor, width, strokeColor
// which will trigger fill and/or stroke.
CanvasRenderingContext2D.prototype.varLineRounded = function ( x1, y1, x2, y2, w1, w2, fillColor, strokeColor, width ) {
    var dx = (x2 - x1) ;
    var dy = (y2 - y1) ;
    w1 /= 2;  w2 /= 2; // we only use w1/2 and w2/2 for computations.
    // length of the AB vector
    var length = Math.sqrt(sq(dx) + sq(dy));
    if (!length) return; // exit if zero length
    dx /= length ;    dy /= length ;
    var shiftx = - dy * w1 ;  // compute AA1 vector's x
    var shifty =   dx * w1 ;  // compute AA1 vector's y
    var angle = Math.atan2(shifty, shiftx);
    this.beginPath();
    this.moveTo(x1 + shiftx, y1 + shifty);
    this.arc(x1,y1, w1, angle, angle+Math.PI); // draw A1A2
    shiftx =  - dy * w2 ;  // compute BB1 vector's x
    shifty =    dx * w2 ;  // compute BB1 vector's y
    this.lineTo(x2 - shiftx, y2 - shifty); // draw A2B1
    this.arc(x2,y2, w2, angle+Math.PI, angle); // draw A1A2    
    this.closePath(); // draw B2A1
	if (fillColor) {
		 this.fillStyle   = fillColor ; 
		 this.fill()  ;
	}
    if (strokeColor) {
        if (width)    this.lineWidth   = width    ;
    	this.strokeStyle = strokeColor ;
    	this.stroke() ;
    }   
}


// requestAnimationFrame polyfill
var  w=window,    foundRequestAnimationFrame  =    w.requestAnimationFrame ||
                               w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
                               w.mozRequestAnimationFrame    || w.oRequestAnimationFrame  ||
                                        function(cb) { setTimeout(cb,1000/60); } ;
window.requestAnimationFrame  = foundRequestAnimationFrame ;

   
// helper functions 

function AddHiddenProp (obj, name, value) { Object.defineProperty(obj, name, {value : value }) }
   
function sq(x) { return x*x; }

function attenuate(x,y,cx,cy,rad) {
      var distance = Math.sqrt(sq(x-cx)+sq(y-cy));
      if (!distance || distance>rad) return 0;
      return (1-distance/rad);  
}
}());
