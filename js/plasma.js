function simulation (canvas) {
  /* initial setup. */
  var ctx = canvas.getContext('2d');
  var steps = 0;
  
  /* precalc all the things! */
  var pwidth = 128, pheight = 9;
  var vpx = canvas.width/pwidth, vpy = canvas.height/pheight;
  var last_fps = 0;

  var colormap = [];
  var cells = [];
  var cells_base = [];
  
  for (var i = 0, r, g, b; i <= 255; i++) {
    r = ~~(128 + 128 * Math.sin(Math.PI * i / 64));
    g = ~~(128 + 128 * Math.sin(Math.PI * i / 64)) + 16;
    b = ~~(128 + 128 * Math.sin(Math.PI * i / 64)) + 24;
    colormap[i] = "rgb(" + ~~r + "," + ~~g + "," + ~~b + ")";
  }

  /* random seed */
  var time = Date.now() / 64;
    
  /* calculate the distribution weight between 4 points on our graph. */
  function dist (a, b, c, d) {
    return Math.sqrt((a - c) * (a - c) + (b - d) * (b - d));
  }
  
  function plasma (x, y) {
    return (128 + (128 * Math.sin(x * 0.0625)) +
            128 + (128 * Math.sin(y * 0.03125)) +
            128 + (128 * Math.sin(dist(x + time, y - time, canvas.width, canvas.height) * 0.125)) +
            128 + (128 * Math.sin(Math.sqrt(x * x + y * y) * 0.125)) ) * 0.25;
  }
  
  function precalc () {
    for (var y = 0, x; y < pheight; y++) {
      for (x = 0; x < pwidth; x++) {
        cells_base[x + (pwidth * y)] = ~~(plasma(x, y));
      }
    }
  }
  
  var fw = Math.ceil(vpx), fh = Math.ceil(vpy);
  function render () {          
    time = Date.now() / 64;
    precalc();

    for (var y = 0, x; y < pheight; y++) {
      for (x = 0; x < pwidth; x++) {
        cells[x + (pwidth * y)] = ~~(cells_base[x + (pwidth * y)] + steps) % 256;
        ctx.fillStyle = colormap[cells[x + (pwidth * y)]];
        ctx.fillRect(x * fw, y * fh, fw, fh);
      }
    }
    
    steps += 1;
    window.requestAnimationFrame(render);
  }
  
  precalc();
  
  window.requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', function (e) {
  var canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;

  simulation(canvas);
});
