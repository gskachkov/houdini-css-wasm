let gpr = null;

const updateCanvas = (ctx, data) => {
    ctx.putImageData(data, 0, 0);
};

const drawFractalActionFactory = (module, ctx, xSize, ySize) => (step, maxStep) => {
    const action = value => {
        if (gpr !== null) {
            module.free_vec(gpr);
        }

        gpr = module.generate(xSize, ySize, value);
        const len = module.vec_len(gpr);
        const bitmap = new Uint8ClampedArray (module.memory.buffer, gpr, len);
        var data = new ImageData(bitmap, xSize, xSize);
        updateCanvas(ctx, data);
    };

    const performActions = value => {
        if (value > maxStep) return;
    
        action(value)
        setTimeout(() => performActions(value + 1), 150);
    };

    performActions(step);
};

const drawSimpleFractalActionFactory2 = (module, ctx, xSize, ySize) => (step, maxStep) => {
    const action = () => {
        if (gpr !== null) {
            module.simple_free_vec(gpr);
        }

        gpr = module.simple_generate(xSize, ySize);
        const len = module.simple_vec_len(gpr);
        const commands = new Uint16Array (module.memory.buffer, gpr, len);

        let i = 0;
        const length = commands.length;

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
    };

    module.simple_init();

    const performActions = () => action();

    performActions(step);
};

const drawSimpleFractalActionFactory = (module, ctx, xSize, ySize) => () => {
    const action = () => module.drawfractal(xSize, ySize);

    action();
};

const downloadImageActionFactory = (module, xSize, ySize) => value => {
    if (gpr !== null) {
        module.free_vec(gpr);
    }

    gpr = module.get_image(xSize, ySize, value);
    const len = module.vec_len(gpr);
    const bitmap = new Uint8Array (module.memory.buffer, gpr, len);

    var saveByteArray = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, name) {
            var blob = new Blob(data, {type: "octet/stream"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
    
    saveByteArray([bitmap], 'example.png');
}

export { drawFractalActionFactory, downloadImageActionFactory, drawSimpleFractalActionFactory, drawSimpleFractalActionFactory2 };
