class FractalModule {
    constructor (wasm) {
        this.memory = wasm.memory;

        this.drawfractal = wasm.drawfractal;

        this.simple_init = wasm.simple_fractal_init;
        this.simple_vec_len = wasm.simple_fractal_vec_len;
        this.simple_generate = wasm.simple_fractal_generate;
        this.simple_free_vec = wasm.simple_fractal_free_vec;
    
        this.simple_init();
    }
}

export default FractalModule;
