let gpr = null;

const wasmHolder = {};

const actionExternal = (wasm, ctx, xSize, ySize) => {
	console.time('Fractal generate');
	gpr = wasm.simple_fractal_generate(xSize, ySize);
	console.timeEnd('Fractal generate');

	console.time('To-Array');
	const len = wasm.simple_fractal_vec_len(gpr);
	const commands = new Uint16Array (wasm.memory.buffer, gpr, len);
	console.timeEnd('To-Array');

	let i = 0;
	const length = commands.length;

	console.time('Draw');
	while (i < length) {
		if(commands[i] === 0) {
			ctx.fillRect(commands[i + 2], commands[i + 3], commands[i + 4], commands[i + 5]);
			i = i  + 6;
		} 
		if (commands[i] === 1) {
			ctx.fillStyle = 'rgba(' + [ commands[i + 2] , commands[i + 3], commands[i + 4], commands[i + 5] / 100 ].join() + ')';
			i = i  + 6;
				
		}
	}
	console.timeEnd('Draw');
	wasm.simple_fractal_free_vec(gpr);
};

class FractalPaintWASMExternal {
    paint(ctx, geom, properties) {
		if (wasmHolder.exports === undefined) return;
		console.log('Start #WASM without Draw', geom);
		const wasm = wasmHolder.exports;
		console.time('WASM');
		actionExternal(wasm, ctx, geom.width, geom.height);
		console.timeEnd('WASM');
		console.log('Finish');
    }
};

const actionInternal = (wasm, ctx, xSize, ySize) => {
	instanceImport.helper.setCanvas(ctx);
	wasm.drawfractal(xSize, ySize);
};

class FractalPaintWASMInternal {
    paint(ctx, geom) {
		if (wasmHolder.exports === undefined) return;
		console.log('Start #WASM with Draw', geom);
		const wasm = wasmHolder.exports;
		console.time('WASM', geom);
		actionInternal(wasm, ctx, geom.width, geom.height);
		console.timeEnd('WASM');
		console.log('Finish');
    }
};

const Base64Binary = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	
	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input) {
		var bytes = (input.length/4) * 3;
		var ab = new ArrayBuffer(bytes);
		this.decode(input, ab);
		
		return ab;
	},

	removePaddingChars: function(input){
		var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
		if(lkey == 64){
			return input.substring(0,input.length - 1);
		}
		return input;
	},

	decode: function (input, arrayBuffer) {
		//get last chars to see if are valid
		input = this.removePaddingChars(input);
		input = this.removePaddingChars(input);

		var bytes = parseInt((input.length / 4) * 3, 10);
		
		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;
		
		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);
		
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		
		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));
	
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
	
			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}
	
		return uarray;	
	}
}

console.log('Before Base64');


const ba = Base64Binary.decode(wasmBase64);
console.log('after Base64');

const context = { canvas: null };

const fill_rect = (a,b,c,d) => {
	context.canvas.fillRect( a,b,c,d);
};

const fill_style_color = (r,g,b,a) => { 
	context.canvas.fillStyle = 'rgba(' + [r,g,b,a].join() + ')';;
};

const instanceImport = {
    "global": {},
    "env": {
      memory: new WebAssembly.Memory({initial: 10, limit: 100}),
      table: new WebAssembly.Table({initial: 0, element: 'anyfunc'}),
      "Math_hypot": Math.hypot,
      "exp2f": Math.exp,
      "expf": Math.exp,
      "powf": Math.pow,
      "sinf": Math.sin,
      "round": Math.round,
      "roundf": Math.round,
      "canvas_set_fill_style_color": fill_style_color,
      "canvas_fill_rect": fill_rect
    },
    helper: {
      "setCanvas": value => context.canvas = value,
      "getCanvas": () => context.canvas
    }
};

WebAssembly.instantiate(ba, instanceImport).then(result => {

  wasmHolder.exports = result.instance.exports;
  wasmHolder.exports.simple_fractal_init();

  console.log('Instane', wasmHolder, instanceImport);
}, error => console.error('error', error));

registerPaint('fractal-paint-wasm-external', FractalPaintWASMExternal);
registerPaint('fractal-paint-wasm-internal', FractalPaintWASMInternal);