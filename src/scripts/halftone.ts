// "Prensa" em WebGL: desenha fotos como retícula CMYK (a mesma técnica de pontos
// da impressão offset), imprime a próxima foto com um cabeçote que desce pela
// folha e tem uma lupa de conta-fios que revela a foto original.
import { clamp, lerp } from './lib';

export interface PressTexture { texture: WebGLTexture; width: number; height: number; focus: [number, number]; zoom: number }

const VERTEX = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec4 uCA;
uniform vec4 uCB;
uniform float uHasA;
uniform float uHasB;
uniform float uFront;
uniform float uCell;
uniform vec2 uMouse;
uniform float uLens;
uniform float uZoom;
uniform vec3 uPaper;

const vec3 INK_C = vec3(0.0, 0.63, 0.89);
const vec3 INK_M = vec3(0.89, 0.02, 0.50);
const vec3 INK_Y = vec3(1.0, 0.84, 0.02);
const vec3 INK_K = vec3(0.11, 0.09, 0.07);

vec3 photo(sampler2D t, vec4 c, vec2 uv) {
  return texture2D(t, clamp(uv, 0.0, 1.0) * c.xy + c.zw).rgb;
}

// Curva de tom da "chapa": abre os meios-tons e aviva a cor, deixando o papel respirar.
vec3 tone(vec3 c) {
  c = clamp((c - 0.03) / 0.95, 0.0, 1.0);
  c = pow(c, vec3(0.74));
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  c = clamp(mix(vec3(luma), c, 1.22), 0.0, 1.0);
  return mix(c, vec3(1.0), 0.05);
}

vec4 toCmyk(vec3 source) {
  vec3 rgb = tone(source);
  float k = (1.0 - max(max(rgb.r, rgb.g), rgb.b)) * 0.82;
  vec3 cmy = clamp((1.0 - rgb - vec3(k)) / max(1.0 - k, 0.0001), 0.0, 1.0);
  return vec4(cmy, k);
}

float screenCoverage(sampler2D t, vec4 c, vec2 px, float angle, vec4 channel, float amount) {
  float s = sin(angle);
  float co = cos(angle);
  vec2 p = vec2(co * px.x - s * px.y, s * px.x + co * px.y);
  vec2 base = floor(p / uCell - 0.5);
  float coverage = 0.0;
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2; j++) {
      vec2 center = (base + vec2(float(i), float(j)) + 0.5) * uCell;
      vec2 back = vec2(co * center.x + s * center.y, -s * center.x + co * center.y);
      float value = dot(toCmyk(photo(t, c, back / uRes)), channel);
      float radius = sqrt(value) * uCell * 0.74 * amount;
      float d = length(p - center);
      coverage = max(coverage, 1.0 - smoothstep(radius - 0.8 * uDpr, radius + 0.8 * uDpr, d));
    }
  }
  return coverage;
}

vec3 halftone(sampler2D t, vec4 c, vec2 px, float amount) {
  float cy = screenCoverage(t, c, px, 0.0, vec4(0.0, 0.0, 1.0, 0.0), amount);
  float cm = screenCoverage(t, c, px, 1.309, vec4(0.0, 1.0, 0.0, 0.0), amount);
  float cc = screenCoverage(t, c, px, 0.2618, vec4(1.0, 0.0, 0.0, 0.0), amount);
  float ck = screenCoverage(t, c, px, 0.7854, vec4(0.0, 0.0, 0.0, 1.0), amount);
  vec3 color = uPaper;
  color *= mix(vec3(1.0), INK_Y, cy);
  color *= mix(vec3(1.0), INK_M, cm);
  color *= mix(vec3(1.0), INK_C, cc);
  color *= mix(vec3(1.0), INK_K, ck);
  return color;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = px / uRes;
  bool useB = uHasB > 0.5 && uv.y < uFront;
  bool inked = useB || uHasA > 0.5;
  vec3 color = uPaper;
  if (useB) {
    float amount = smoothstep(0.0, 0.07, uFront - uv.y);
    color = halftone(uB, uCB, px, amount);
  } else if (uHasA > 0.5) {
    color = halftone(uA, uCA, px, 1.0);
  }
  if (uLens > 0.5) {
    float d = distance(px, uMouse);
    float inside = 1.0 - smoothstep(uLens - 1.5 * uDpr, uLens + 0.5 * uDpr, d);
    if (inside > 0.0 && inked) {
      vec2 zoomed = (uMouse + (px - uMouse) / uZoom) / uRes;
      vec3 original = useB ? photo(uB, uCB, zoomed) : photo(uA, uCA, zoomed);
      color = mix(color, original, inside);
    }
    float shade = (1.0 - smoothstep(uLens, uLens + 22.0 * uDpr, d)) * (1.0 - inside);
    color *= 1.0 - shade * 0.16;
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

type Uniforms = Record<string, WebGLUniformLocation | null>;

export class Press {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private uniforms: Uniforms = {};
  private current: PressTexture | null = null;
  private next: PressTexture | null = null;
  private front = 0;
  private dpr = 1;
  private cellCss: number;
  private baseCell: number;
  private paper: [number, number, number];
  private frame = 0;
  private lens = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, zoom: 1.35, tzoom: 1.35 };
  lost = false;
  onFrame?: (state: { lensX: number; lensY: number; lensR: number; front: number; printing: boolean }) => void;

  static create(canvas: HTMLCanvasElement, options: { cell: number; paper: [number, number, number] }) {
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    } catch { gl = null; }
    if (!gl) return null;
    const press = new Press(canvas, gl, options);
    return press.program ? press : null;
  }

  private program: WebGLProgram | null = null;

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, options: { cell: number; paper: [number, number, number] }) {
    this.canvas = canvas;
    this.gl = gl;
    this.cellCss = options.cell;
    this.baseCell = options.cell;
    this.paper = options.paper;
    this.program = this.build();
    if (!this.program) return;
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.lost = true; cancelAnimationFrame(this.frame); });
    this.resize();
  }

  private build() {
    const gl = this.gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Halftone shader:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    for (const name of ['uRes', 'uDpr', 'uA', 'uB', 'uCA', 'uCB', 'uHasA', 'uHasB', 'uFront', 'uCell', 'uMouse', 'uLens', 'uZoom', 'uPaper']) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    gl.uniform1i(this.uniforms.uA, 0);
    gl.uniform1i(this.uniforms.uB, 1);
    return program;
  }

  /** Carrega uma foto como textura. */
  async load(src: string, focus: [number, number] = [0.5, 0.5], zoom = 1): Promise<PressTexture> {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    await image.decode();
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { texture, width: image.naturalWidth, height: image.naturalHeight, focus, zoom };
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const narrow = rect.width < 560;
    this.dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.75 : 2);
    const width = Math.max(1, Math.round(rect.width * this.dpr));
    const height = Math.max(1, Math.round(rect.height * this.dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.cellCss = narrow ? Math.min(6, this.baseCell) : this.baseCell;
    this.render();
  }

  private cover(texture: PressTexture) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageAspect = texture.width / texture.height;
    const canvasAspect = width / height;
    let sx = 1;
    let sy = 1;
    if (imageAspect > canvasAspect) sx = canvasAspect / imageAspect;
    else sy = imageAspect / canvasAspect;
    sx /= texture.zoom;
    sy /= texture.zoom;
    return [sx, sy, (1 - sx) * texture.focus[0], (1 - sy) * texture.focus[1]] as const;
  }

  /** Imprime `texture` com o cabeçote descendo pela folha. */
  print(texture: PressTexture, duration: number, onProgress?: (front: number) => void) {
    return new Promise<void>(resolve => {
      if (duration <= 0) {
        this.current = texture;
        this.next = null;
        this.front = 0;
        this.render();
        resolve();
        return;
      }
      this.next = texture;
      const start = performance.now();
      const step = (now: number) => {
        if (this.lost) return resolve();
        const t = clamp((now - start) / duration);
        // Aceleração suave como um carro de impressão.
        this.front = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        this.front = this.front * 1.08;
        onProgress?.(clamp(this.front));
        this.render();
        if (t < 1) requestAnimationFrame(step);
        else {
          this.current = texture;
          this.next = null;
          this.front = 0;
          this.render();
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /** Move a lupa (coordenadas em px CSS relativas ao canvas). */
  pointer(x: number, y: number, radius: number, zoom = 1.35, snap = false) {
    this.lens.tx = x * this.dpr;
    this.lens.ty = y * this.dpr;
    this.lens.tr = radius * this.dpr;
    this.lens.tzoom = zoom;
    if (snap) { this.lens.x = this.lens.tx; this.lens.y = this.lens.ty; }
    this.render();
  }

  get printing() { return this.next !== null; }

  render() {
    if (!this.frame && !this.lost) this.frame = requestAnimationFrame(() => this.tick());
  }

  private tick() {
    this.frame = 0;
    const lens = this.lens;
    const ease = 0.22;
    lens.x = lerp(lens.x, lens.tx, ease);
    lens.y = lerp(lens.y, lens.ty, ease);
    lens.r = lerp(lens.r, lens.tr, 0.16);
    lens.zoom = lerp(lens.zoom, lens.tzoom, 0.16);
    if (lens.tr === 0 && lens.r < 0.6) lens.r = 0;
    this.draw();
    const moving = Math.abs(lens.x - lens.tx) + Math.abs(lens.y - lens.ty) + Math.abs(lens.r - lens.tr) + Math.abs(lens.zoom - lens.tzoom) * 100 > 0.3;
    if (moving) this.render();
  }

  private draw() {
    if (this.lost) return;
    const gl = this.gl;
    const u = this.uniforms;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uCell, this.cellCss * this.dpr);
    gl.uniform3f(u.uPaper, ...this.paper);
    gl.uniform1f(u.uHasA, this.current ? 1 : 0);
    gl.uniform1f(u.uHasB, this.next ? 1 : 0);
    gl.uniform1f(u.uFront, this.front);
    gl.uniform2f(u.uMouse, this.lens.x, this.lens.y);
    gl.uniform1f(u.uLens, this.lens.r);
    gl.uniform1f(u.uZoom, this.lens.zoom);
    if (this.current) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.current.texture);
      gl.uniform4f(u.uCA, ...this.cover(this.current));
    }
    if (this.next) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.next.texture);
      gl.uniform4f(u.uCB, ...this.cover(this.next));
    } else if (this.current) {
      // Mantém uma textura válida ligada à unidade 1.
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.current.texture);
      gl.uniform4f(u.uCB, ...this.cover(this.current));
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.onFrame?.({ lensX: this.lens.x / this.dpr, lensY: this.lens.y / this.dpr, lensR: this.lens.r / this.dpr, front: this.front, printing: this.printing });
  }
}
