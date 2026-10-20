// Model pages (placeholders): Lenis + the hero's glitch on the car cutout, without the skeleton x-ray (Alex, 20 Oct 2026)
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && window.Lenis) new Lenis({ autoRaf: true, anchors: true });
  // Build sheet: the inquire form slides up from the foot (Figma 889:422)
  const sheet = document.querySelector("[data-sheet]");
  if (sheet && sheet.showModal) {
    const form = sheet.querySelector("[data-sheet-form]");
    let opener = null, closing = 0;
    const open = (e) => {
      e.preventDefault();
      opener = e.currentTarget;
      clearTimeout(closing);
      if (!sheet.open) sheet.showModal();
      requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("is-open")));
      const first = form.querySelector("#s-name");
      setTimeout(() => first && first.focus({ preventScroll: true }), reduce ? 0 : 350);
    };
    const close = () => {
      sheet.classList.remove("is-open");
      closing = setTimeout(() => {
        sheet.close();
        if (opener) opener.focus();
      }, reduce ? 0 : 600);
    };
    document.querySelectorAll("[data-sheet-open]").forEach((a) => a.addEventListener("click", open));
    sheet.querySelector("[data-sheet-close]").addEventListener("click", close);
    sheet.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet) {
        const r = sheet.getBoundingClientRect();
        if (e.clientY < r.top || e.clientX < r.left || e.clientX > r.right) close();
      }
    });
    const check = (el) => {
      const ok = el.checkValidity() && (!el.required || el.value.trim() !== "");
      el.setAttribute("aria-invalid", String(!ok));
      const err = document.getElementById(el.getAttribute("aria-describedby") || "");
      if (err) err.hidden = ok;
      return ok;
    };
    const fields = [...form.querySelectorAll("input")];
    fields.forEach((el) => el.addEventListener("blur", () => { if (el.value || el.getAttribute("aria-invalid")) check(el); }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = fields.filter((el) => !check(el));
      if (bad.length) return bad[0].focus();
      form.querySelector("[data-sheet-ok]").hidden = false;
      form.querySelector(".bsheet__send").disabled = true;
    });
  }
  const img = document.querySelector("[data-glitch]");
  if (!img || reduce || new URLSearchParams(location.search).get("distort") === "0") return;
  const cv = document.createElement("canvas");
  cv.className = "model__glitch";
  cv.setAttribute("aria-hidden", "true");
  const gl = cv.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: true });
  if (!gl) return;
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;
    uniform sampler2D uImg;uniform vec2 uRes;uniform float uT,uAmp;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    void main(){
      vec2 uv=vec2(gl_FragCoord.x/uRes.x,1.-gl_FragCoord.y/uRes.y);
      float tq=floor(uT*12.);
      float rows=mix(14.,34.,h(vec2(tq,1.7)));
      float band=floor(uv.y*rows);
      float cols=mix(2.,7.,h(vec2(band,tq)));
      float col=floor(uv.x*cols);
      float on=step(1.-.42*uAmp,h3(vec3(band,col,tq)));
      float dx=(h3(vec3(band,col,tq+.37))-.5)*.16*uAmp*on;
      vec2 s=uv+vec2(dx,0.);
      float ca=.004*on*uAmp;
      vec4 g=texture2D(uImg,s);
      float r=texture2D(uImg,s+vec2(ca,0.)).r,b=texture2D(uImg,s-vec2(ca,0.)).b;
      float inb=step(0.,s.x)*step(s.x,1.);
      gl_FragColor=vec4(r,g.g,b,g.a*inb);
    }`;
  const sh = (t, s) => {
    const o = gl.createShader(t);
    gl.shaderSource(o, s);
    gl.compileShader(o);
    return o;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (k) => gl.getUniformLocation(pr, k);
  const start = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(U("uImg"), 0);
    img.after(cv);
    img.classList.add("is-glitched");
    const fit = () => {
      const d = Math.min(devicePixelRatio, 2), r = img.getBoundingClientRect();
      cv.width = Math.round(r.width * d);
      cv.height = Math.round(r.height * d);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U("uRes"), cv.width, cv.height);
    };
    fit();
    addEventListener("resize", fit);
    const CALM = 2.4, WAVE = 1.4, T0 = performance.now(), burst = new URLSearchParams(location.search).get("distort") === "burst";
    let on = true, raf = 0;
    const frame = (now) => {
      const t = (now - T0) / 1e3, ph = t % (CALM + WAVE);
      const a = burst ? 1 : ph < CALM ? 0 : Math.pow(Math.sin((Math.PI * (ph - CALM)) / WAVE), 2);
      gl.uniform1f(U("uT"), t);
      gl.uniform1f(U("uAmp"), a);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (on) raf = requestAnimationFrame(frame);
    };
    const resume = () => { if (!on) { on = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    raf = requestAnimationFrame(frame);
    new IntersectionObserver((e) => (e[0].isIntersecting && !document.hidden ? resume() : stop())).observe(cv);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : resume()));
  };
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener("load", start, { once: true });
})();
