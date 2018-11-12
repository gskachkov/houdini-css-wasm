const complex = function (value) {
    const operation = function (self) {
        return {
            add: function (other) {
                let re = self.re + other.re;
                let im = self.im + other.im;
                return operation({re, im});
            },
            mul: function (other) {
                let re = self.re * other.re - self.im * other.im;
                let im = self.re * other.im + self.im * other.re;
                return operation({re, im});
            },
            norm_sqr: function () {
                return self.re * self.re + self.im * self.im
            },
            value: function () {
                return self;
            }
        };
    };
    return operation(value);
};

const pixel_to_point = (bounds, pixel, upper_left, lower_right) => {
    let size = {
        width: lower_right.re - upper_left.re,
        height: lower_right.im - upper_left.im};
    return {
        re: upper_left.re + pixel.column  * size.width / bounds.width,
        im: upper_left.im + pixel.row  * size.height / bounds.height
    }
};

const match_escape_time = (c, limit) => {
    let z = { re: 0.0, im: 0.0};
    for(let i = 0; i < limit; i++) {
        z = complex(z)
            .mul(z)
            .add(c)
            .value();
        if (complex(z).norm_sqr() > 4.0) {
            return i;
        }
    }
    return undefined;
};

const action = (ctx, width, height) => {
    let upper_left = { re:-1.2, im:0.35 };
    let lower_right = { re:-1.0, im:0.2 };
    const bounds = { width, height};
    for (let column = 0; column < bounds.width; column++) {
        for (let row = 0; row < bounds.height; row++) {
            let point = pixel_to_point(bounds,{column,row}, upper_left, lower_right);
            let escape_limit = 255;
            let result = match_escape_time(point, escape_limit);
            const v = (result === undefined) ? 0 : 255 - result;
            ctx.fillStyle = 'rgba(' + [ v, v, v, 1.0].join() + ')';
            ctx.fillRect(column, row, 1.0, 1.0);
        }
    }
}

class FractalPaintJS {
    paint(ctx, geom) {
		console.log('Start JS');
		console.time('JS');
		action(ctx, geom.width, geom.height);
		console.timeEnd('JS');
		console.log('Finish');
    }
};

registerPaint('fractal-paint-js', FractalPaintJS);