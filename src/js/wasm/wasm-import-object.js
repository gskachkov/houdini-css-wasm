const ctx = { canvas: null };

const fill_rect = (a,b,c,d) => {
  ctx.canvas.fillRect( a,b,c,d);
};

const fill_style_color = (r,g,b,a) => { 
  ctx.canvas.fillStyle = 'rgba(' + [r,g,b,a].join() + ')';;
};

export default {
    "global": {},
    "env": {
      memory: new WebAssembly.Memory({initial: 10, limit: 100}),
      table: new WebAssembly.Table({initial: 0, element: 'anyfunc'}),
      "canvas_set_fill_style_color": fill_style_color,
      "canvas_fill_rect": fill_rect
    },
    helper: {
      "setCanvas": value => ctx.canvas = value,
      "getCanvas": () => ctx.canvas
    }
};