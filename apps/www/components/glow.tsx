"use client";

import { useEffect, useRef } from "react";

// Copied from assets/reelcn-07/mockup.html: two slow light blobs and faint grain, faded top and bottom.
const VERTEX = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FRAGMENT = `precision mediump float;uniform vec2 r;uniform float t;uniform vec3 c1;uniform vec3 c2;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;uv.x*=asp;
vec2 p1=vec2(.34*asp+.07*sin(t*.23),.56+.06*cos(t*.31));vec2 p2=vec2(.68*asp+.06*cos(t*.19),.5+.07*sin(t*.27));
float d1=exp(-6.5*dot(uv-p1,uv-p1));float d2=exp(-7.5*dot(uv-p2,uv-p2));
vec3 col=c1*d1*.55+c2*d2*.36;float y=gl_FragCoord.y/r.y;col*=smoothstep(0.,.35,y)*smoothstep(1.,.55,y);
col+=(h(gl_FragCoord.xy+t)-.5)*.018;gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));}`;

const rgb = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** WebGL glow behind the hero editor, tinted by the playing theme. Half resolution, paused off screen. */
export function Glow({ colors }: { colors: [string, string] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const goal = useRef([rgb(colors[0]), rgb(colors[1])]);
  goal.current = [rgb(colors[0]), rgb(colors[1])];

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    // ponytail: no WebGL means no glow; the editor reads the same without it.
    if (!canvas || !gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type) as WebGLShader;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = {
      r: gl.getUniformLocation(program, "r"),
      t: gl.getUniformLocation(program, "t"),
      c1: gl.getUniformLocation(program, "c1"),
      c2: gl.getUniformLocation(program, "c2"),
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const current = goal.current.map((c) => [...c]);
    const size = () => {
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, box.width / 2);
      canvas.height = Math.max(2, box.height / 2);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const start = performance.now();
    let running = false;
    let raf = 0;
    const draw = (now: number) => {
      for (let k = 0; k < 2; k++)
        for (let i = 0; i < 3; i++) current[k][i] += (goal.current[k][i] - current[k][i]) * 0.06;
      gl.uniform2f(u.r, canvas.width, canvas.height);
      gl.uniform1f(u.t, reduced ? 0 : (now - start) / 1000);
      gl.uniform3fv(u.c1, current[0]);
      gl.uniform3fv(u.c2, current[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running) raf = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      const was = running;
      running = Boolean(entry?.isIntersecting);
      if (running && !was) raf = requestAnimationFrame(draw);
    });
    size();
    observer.observe(canvas);
    window.addEventListener("resize", size);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: a decorative canvas that never takes focus
    <canvas ref={canvasRef} className="glow" aria-hidden="true" />
  );
}
