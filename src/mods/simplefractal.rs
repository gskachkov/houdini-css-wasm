use std::ops::{Add, Mul};
use std::collections::HashMap;

#[derive(Copy, Clone)]
struct Complex {
    re: f64,
    im: f64
}

//need to be able to add complex
impl Add<Complex> for Complex {
    type Output = Complex;

    #[inline]
    fn add(self, other: Complex) -> Complex {
        Complex::new(self.re + other.re, self.im + other.im)
    }
}

//need to be able to multiply complex
impl Mul<Complex> for Complex {
    type Output = Complex;

    #[inline]
    fn mul(self, other: Complex) -> Complex {
        let re = self.re * other.re - self.im * other.im;
        let im = self.re * other.im + self.im * other.re;
        Complex::new(re, im)
    }
}

impl Complex {
    #[inline]
    pub fn new(re: f64, im: f64) -> Complex {
        Complex { re: re, im: im }
    }

    #[inline]
    pub fn norm_sqr(&self) -> f64 {
        self.re * self.re + self.im * self.im
    }
}

// determine if squaring a complex number goes to infinity with a cut off limit
fn escape_time(c: Complex, limit: u32) -> Option<u32> {
        let mut z = Complex { re: 0.0, im: 0.0};
        for i in 0..limit {
            z = z*z + c;
            if z.norm_sqr() > 4.0 {
                return Some(i);
            }
        }
        None
}

//interpolate pixel to complex point
fn pixel_to_point(bounds:(usize,usize),pixel:(usize,usize),upper_left:Complex,lower_right:Complex) -> Complex {
    let (width,height) = (lower_right.re - upper_left.re, lower_right.im - upper_left.im);
    Complex {
        re: upper_left.re + pixel.0 as f64 * width / bounds.0 as f64,
        im: upper_left.im + pixel.1 as f64 * height / bounds.1 as f64,
    }
}

#[inline]
pub fn set_fill_style_color(r:u8, g:u8, b:u8, a:f32){
    unsafe {
        canvas_set_fill_style_color(r, g, b, a);
    }
}

#[inline]
pub fn fill_rect(x:f32, y:f32, width:f32, height:f32){
    unsafe {
        canvas_fill_rect(x, y, width, height);
    }
}

extern {
    fn canvas_set_fill_style_color(r: u8, g: u8, b: u8, a: f32);
    fn canvas_fill_rect(x:f32,y:f32,width:f32,height:f32);
}

#[no_mangle]
pub fn drawfractal(width: usize, height: usize) {
    let upper_left = Complex{re:-1.2,im:0.35};
    let lower_right = Complex{re:-1.0,im:0.2};
    let bounds = (width, height);
    for column in 0..bounds.0 {
        for row in 0..bounds.1 {
            let point = pixel_to_point(bounds,(column,row),upper_left,lower_right);
            let escape_limit = 255;
            let v = match escape_time(point, escape_limit) {
                //if it didn't escape to infinity within our limit make black
                None => 0,
                //if it went to infinity fast, lets make it whiter
                Some(count) => (255 - count) as u8
            };
            set_fill_style_color(v, v, v, 1.0);
            fill_rect(column as f32, row as f32, 1.0, 1.0);
        }
    }
}

static mut SHARED_VECS : Option<HashMap<u16, Vec<u16>>> = None;

#[no_mangle]
pub fn simple_fractal_init() {
    unsafe { SHARED_VECS = Some(HashMap::new()) }
}

#[no_mangle]
pub fn simple_fractal_vec_len(payload: *const u16) -> u16 {
    unsafe {
        SHARED_VECS
            .as_ref()
            .unwrap()
            .get(&(payload as u16))
            .unwrap()
            .len() as u16
    }
}

pub fn simple_vec2js<V: Into<Vec<u16>>>(v: V) -> *const u16 {
    let v = v.into();
    let payload = v.as_ptr();
    unsafe {
        SHARED_VECS.as_mut().unwrap().insert(payload as u16, v);
    }
    payload
}

#[no_mangle]
pub extern "C" fn simple_fractal_free_vec(payload: *const u16) {
    unsafe {
        SHARED_VECS.as_mut().unwrap().remove(&(payload as u16));
    }
}

#[inline] 
pub fn convert_to_u32(f:f32) -> u16 {
    let b = f as u16;
    b
}

#[inline] 
pub fn convert_to_u32_inc(f:f32) -> u16 {
    let b = f * 100.00;
    let b = b as u16;
    b
}

#[inline]
pub fn fill_rect_command(vec: &mut Vec<u16>, x:f32, y:f32, width:f32, height:f32){
    //command header
    vec.push(0); // command
    vec.push(4); // length

    // payload
    vec.push(convert_to_u32(x));
    vec.push(convert_to_u32(y));
    vec.push(convert_to_u32(width));
    vec.push(convert_to_u32(height));
}

#[inline]
pub fn set_fill_style_color_command(vec: &mut Vec<u16>, r:u16, g:u16, b:u16, a:f32){
    //command header
    vec.push(1); // command
    vec.push(4); // length

    // payload
    vec.push(r);
    vec.push(g);
    vec.push(b);
    vec.push(convert_to_u32_inc(a));
}

#[no_mangle]
pub fn simple_fractal_generate(width: usize, height: usize) -> *const u16 {
    let upper_left = Complex{re:-1.2,im:0.35};
    let lower_right = Complex{re:-1.0,im:0.2};
    let bounds = (width, height);
    let ref mut vec: Vec<u16> = Vec::new();

    for column in 0..bounds.0 {
        for row in 0..bounds.1 {
            let point = pixel_to_point(bounds,(column,row),upper_left,lower_right);
            let escape_limit = 255;
            let v = match escape_time(point, escape_limit) {
                //if it didn't escape to infinity within our limit make black
                None => 0,
                //if it went to infinity fast, lets make it whiter
                Some(count) => (255 - count) as u16
            };
            set_fill_style_color_command(vec, v, v, v, 1.0);
            fill_rect_command(vec, column as f32, row as f32, 1.0, 1.0);
        }
    }
    simple_vec2js(vec.as_mut())
}