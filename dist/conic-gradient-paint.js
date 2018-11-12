var π = Math.PI;
var τ = 2 * π;
var ε = .00001;
var deg = π/180;

function hslaToRgba(h, s, l, a){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a];
}

class ConicGradient {
    paint(ctx, geom, properties) { 

        const o = {
            repeating: true,
            stops: "hsla(0,0%,100%,.4) 0, hsla(0,0%,100%,.4) 15deg, hsla(0,0%,100%,0) 0, hsla(0,0%,100%,0) 30deg"
        };
        var repeating = !!o.repeating;

        const size = o.size || Math.max(geom.width, geom.height);
        let stops = (o.stops || "").split(/\s*,(?![^(]*\))\s*/); // commas that are not followed by a ) without a ( first
    
        let from = 0;
            
        console.time('conic-gradient');
        
        for (var i=0; i< stops.length; i++) {
            if (stops[i]) {
                var stop = stops[i] = new ColorStop(this, stops[i]);
    
                if (stop.next) {
                    stops.splice(i+1, 0, stop.next);
                    i++;
                }
            }
            else {
                stops.splice(i, 1);
                i--;
            }
        }

        if (stops[0].color.indexOf('from') == 0) {
            from = stops[0].pos*360;
            stops.shift();
        }
        // Normalize stops
    
        // Add dummy first stop or set first stop’s position to 0 if it doesn’t have one
        if (stops[0].pos === undefined) {
            stops[0].pos = 0;
        } else if (stops[0].pos > 0) {
            var first = stops[0].clone();
            first.pos = 0;
            stops.unshift(first);
        }
    
        // Add dummy last stop or set last stop’s position to 100% if it doesn’t have one
        if (stops[stops.length - 1].pos === undefined) {
            stops[stops.length - 1].pos = 1;
        }
        else if (!repeating && stops[stops.length - 1].pos < 1) {
            var last = stops[this.stops.length - 1].clone();
            last.pos = 1;
            this.stops.push(last);
        }
    
        stops.forEach(function(stop, i) {
            if (stop.pos === undefined) {
                // Evenly space color stops with no position
                for (var j=i+1; this[j]; j++) {
                    if (this[j].pos !== undefined) {
                        stop.pos = this[i-1].pos + (this[j].pos - this[i-1].pos)/(j-i+1);
                        break;
                    }
                }
            }
            else if (i > 0) {
                // Normalize color stops whose position is smaller than the position of the stop before them
                stop.pos = Math.max(stop.pos, this[i-1].pos);
            }
        }, stops);
    
        if (repeating) {
            // Repeat color stops until >= 1
            var rStops = stops.slice();
            var lastStop = rStops[stops.length-1];
            var difference = lastStop.pos - rStops[0].pos;
    
            for (var i=0; stops[stops.length-1].pos < 1 && i<10000; i++) {
                for (var j=0; j<rStops.length; j++) {
                    var s = rStops[j].clone();
                    s.pos += (i+1)*difference;
    
                    stops.push(s);
                }
            }
        }
        
        console.timeEnd('conic-gradient');
        console.log(stops);
        this.draw(ctx, this.r(size), size, stops, from);
    }

    draw (ctx, r, size, stops, from) {
        var c = ctx;

        var radius = r;
        var x = size / 2;

        var stopIndex = 0; // The index of the current color
        var stop = stops[stopIndex], prevStop;

        var diff, t;

        // Transform coordinate system so that angles start from the top left, like in CSS
        c.translate(size/2, size/2);
        c.rotate(-90*deg);
        c.rotate(from*deg);
        c.translate(-size/2, -size/2);

        for (var i = 0; i < 360;) {
            if (i/360 + ε >= stop.pos) {
                // Switch color stop
                do {
                    prevStop = stop;

                    stopIndex++;
                    stop = stops[stopIndex];
                // Continue while point is behind current position (i)
                } while(stop && stop != prevStop && i/360 + ε >= stop.pos);

                if (!stop) {
                    break;
                }

                var sameColor = prevStop.color + "" === stop.color + "" && prevStop != stop;

                diff = prevStop.color.map(function(c, i){
                    return stop.color[i] - c;
                });
            }

            t = (i/360 - prevStop.pos) / (stop.pos - prevStop.pos);		
            var interpolated = sameColor? stop.color : diff.map(function(d,i){  
                var ret = d * t + prevStop.color[i];

                return i < 3? ret & 255 : ret;
            });

            // Draw a series of arcs, 1deg each
            c.fillStyle = 'rgba(' + interpolated.join(",") + ')';
            c.beginPath();
            c.moveTo(x, x);

            if (sameColor) {
                var θ = 360 * (stop.pos - prevStop.pos);
            }
            else {
                var θ = .5;
            }

            var beginArg = i*deg;
            beginArg = Math.min(360*deg, beginArg);

            // .02: To prevent empty blank line and corresponding moire
            // only non-alpha colors are cared now
            var endArg = beginArg + θ*deg;
            endArg = Math.min(360*deg, endArg + .02);
            c.arc(x, x, radius, beginArg, endArg);

            c.closePath();
            c.fill();

            i += θ;
        }
    }
    r(size) {
	return Math.sqrt(2) * size / 2;
    }
};

class ColorStop {
    constructor(gradient, stop) {
        this.gradient = gradient;

        if (stop) {
            const parts = stop.match(/^(.+?)(?:\s+([\d.]+)(%|deg|turn|grad|rad)?)?(?:\s+([\d.]+)(%|deg|turn|grad|rad)?)?\s*$/);

            this.color = this.colorToRGBA(parts[1]);

            if (parts[2]) {
                const unit = parts[3];

                if (unit == "%" || parts[2] === "0" && !unit) {
                    this.pos = parts[2]/100;
                }
                else if (unit == "turn") {
                    this.pos  = +parts[2];
                }
                else if (unit == "deg") {
                    this.pos  = parts[2] / 360;
                }
                else if (unit == "grad") {
                    this.pos  = parts[2] / 400;
                }
                else if (unit == "rad") {
                    this.pos  = parts[2] / τ;
                }
            }

            if (parts[4]) {
                this.next = new ColorStop(gradient, parts[1] + " " + parts[4] + parts[5]);
            }
        }
    }
    colorToRGBA(color) {
        if (!Array.isArray(color) && color.indexOf("from") == -1) {
            if (color.indexOf("rgba") > -1) {
                var rgba = color.match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/);
                if (rgba) {
                    rgba.shift();
                    rgba = rgba.map(function(a) { return +a });
                    rgba[3] = isNaN(rgba[3])? 1 : rgba[3];
                }
                return rgba || [0,0,0,0];
            } else if (color.indexOf("hsla") > -1) {
               var hsla = color.match(/hsla?\(([\d.]+),([\d.]+)%,([\d.]+)%,([\d.]+)/);
               if (hsla) {
                    hsla.shift();
                    hsla = hsla.map(function(a) { return +a });
                    hsla[3] = isNaN(hsla[3])? 1 : hsla[3];
                }
	        return hslaToRgba(hsla[0], hsla[1]/100, hsla[2]/100, hsla[3]);
            }
        }
        return color;
    }
    toString() {
	return "rgba(" + this.color.join(", ") + ") " + this.pos * 100 + "%";
    }
    clone() {
	var ret = new ColorStop(this.gradient);
	ret.color = this.color;
	ret.pos = this.pos;

	return ret;
    }
}

registerPaint('conic-gradient', ConicGradient);
