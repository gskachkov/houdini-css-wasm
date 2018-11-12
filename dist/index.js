if (location.protocol === 'http:' && location.hostname !== 'localhost')
    location.protocol = 'https:';
if ('paintWorklet' in CSS) {
    CSS.registerProperty({
        name: '--image',
        syntax: '*',
        inherits:false
    });
    CSS.paintWorklet.addModule('conic-gradient-paint.js');
    CSS.paintWorklet.addModule('fractal-paint-wasm.js');
    CSS.paintWorklet.addModule('fractal-paint-js.js');
} else {
    document.body.innerHTML = 'You need support for <a href="https://drafts.css-houdini.org/css-paint-api/">CSS Paint API</a> to view this demo :(';
}
