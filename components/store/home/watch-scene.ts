import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

/**
 * A procedural smart watch (no model file): metal case, black glass screen,
 * crown and a curved sport strap, lit by a generated studio environment.
 */

export type WatchScene = {
  setHover: (hover: boolean) => void
  dispose: () => void
}

type Options = {
  /** Touch devices: no mouse tracking, smaller motion. */
  coarsePointer: boolean
  reducedMotion: boolean
  onReady: () => void
}

function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  const s = new Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/**
 * A band with a rounded cross-section swept along a curve in the YZ plane.
 * `flip` points the outer face toward the viewer for the lower strap.
 */
function strapGeometry(
  curve: CatmullRomCurve3,
  width: number,
  thick: number,
  flip: boolean,
) {
  const segments = 40
  const r = thick * 0.45
  const hw = width / 2 - r
  const ht = thick / 2 - r
  // Rounded-rectangle profile in (across, outward) coordinates.
  const profile: [number, number][] = []
  const corners: [number, number, number][] = [
    [hw, ht, 0],
    [-hw, ht, Math.PI / 2],
    [-hw, -ht, Math.PI],
    [hw, -ht, (3 * Math.PI) / 2],
  ]
  for (const [cx, cy, start] of corners) {
    for (let k = 0; k <= 4; k++) {
      const a = start + (k / 4) * (Math.PI / 2)
      profile.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }

  const positions: number[] = []
  const indices: number[] = []
  const ring = profile.length
  const across = new Vector3(1, 0, 0)
  const normal = new Vector3()
  const point = new Vector3()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    curve.getPointAt(t, point)
    const tangent = curve.getTangentAt(t)
    normal.set(0, -tangent.z, tangent.y).normalize()
    if (flip) normal.negate()
    for (const [px, py] of profile) {
      positions.push(
        point.x + across.x * px + normal.x * py,
        point.y + normal.y * py,
        point.z + normal.z * py,
      )
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j
      const b = i * ring + ((j + 1) % ring)
      const c = (i + 1) * ring + j
      const d = (i + 1) * ring + ((j + 1) % ring)
      indices.push(a, c, b, b, c, d)
    }
  }
  // Cap the far end of the strap.
  const centre = positions.length / 3
  const last = segments * ring
  curve.getPointAt(1, point)
  positions.push(point.x, point.y, point.z)
  for (let j = 0; j < ring; j++) indices.push(centre, last + ((j + 1) % ring), last + j)

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Flat rounded panel whose UVs span 0–1, so a texture fills it exactly. */
function screenGeometry(w: number, h: number, r: number) {
  const geometry = new ShapeGeometry(roundedRect(w, h, r), 24)
  const position = geometry.getAttribute("position")
  const uv = geometry.getAttribute("uv")
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, position.getX(i) / w + 0.5, position.getY(i) / h + 0.5)
  }
  return geometry
}

/** Watch face: activity rings, time and small stats, drawn once. */
function faceTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 632
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const rings: [number, string, number][] = [
    [118, "#1f6bff", 0.78],
    [92, "#3bb4ff", 0.62],
    [66, "#9fd8ff", 0.88],
  ]
  for (const [radius, color, progress] of rings) {
    ctx.lineWidth = 20
    ctx.lineCap = "round"
    ctx.strokeStyle = `${color}33`
    ctx.beginPath()
    ctx.arc(256, 200, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.arc(256, 200, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
    ctx.stroke()
  }

  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.font = "600 128px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
  ctx.fillText("10:09", 256, 452)
  ctx.font = "500 34px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
  ctx.fillStyle = "#8ea3c8"
  ctx.fillText("SAT 04", 256, 506)
  ctx.fillStyle = "#3bb4ff"
  ctx.font = "600 34px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
  ctx.fillText("♥ 72    ⚡ 86%", 256, 566)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Returns null when WebGL is unavailable (the static image stays). */
export function createWatchScene(
  container: HTMLElement,
  options: Options,
): WatchScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    })
  } catch {
    return null
  }
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, options.coarsePointer ? 1.5 : 2),
  )
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = SRGBColorSpace
  const canvas = renderer.domElement
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.display = "block"
  canvas.setAttribute("aria-hidden", "true")
  container.appendChild(canvas)

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envMap = pmrem.fromScene(room, 0.04).texture
  scene.environment = envMap
  room.dispose()
  pmrem.dispose()

  const camera = new PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0, 9.2)

  // Lights: soft key, cool brand-blue rim, and a highlight that grows on hover.
  const key = new DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 4, 6)
  const rim = new DirectionalLight(0x3bb4ff, 1.2)
  rim.position.set(-5, 2, -4)
  const highlight = new DirectionalLight(0xffffff, 0)
  highlight.position.set(-2, 3, 5)
  scene.add(key, rim, highlight)

  // ------------------------------------------------------------ materials
  const metal = new MeshPhysicalMaterial({
    color: 0xb9c0cc,
    metalness: 1,
    roughness: 0.24,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.1,
  })
  const glass = new MeshPhysicalMaterial({
    color: 0x03050a,
    metalness: 0,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1,
  })
  const face = faceTexture()
  const display = new MeshBasicMaterial({ map: face, toneMapped: false })
  // Black + additive blending = only the reflections show over the screen.
  const sheen = new MeshStandardMaterial({
    color: 0x000000,
    metalness: 0,
    roughness: 0.06,
    envMapIntensity: 0.55,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const strapMaterial = new MeshPhysicalMaterial({
    color: 0x18213a,
    roughness: 0.55,
    metalness: 0,
    sheen: 0.6,
    sheenColor: 0x5b7bd6,
    sheenRoughness: 0.5,
    side: DoubleSide,
    envMapIntensity: 0.6,
  })
  const holeMaterial = new MeshBasicMaterial({ color: 0x070b16 })

  // ------------------------------------------------------------ geometry
  const watch = new Group()
  const geometries: BufferGeometry[] = []
  const add = (geometry: BufferGeometry, material: Material) => {
    geometries.push(geometry)
    const mesh = new Mesh(geometry, material)
    watch.add(mesh)
    return mesh
  }

  // Case: front cap at z = 0.33, back cap at z = -0.33.
  const caseGeometry = new ExtrudeGeometry(roundedRect(1.62, 1.95, 0.46), {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 8,
    curveSegments: 24,
  })
  caseGeometry.translate(0, 0, -0.21)
  add(caseGeometry, metal)

  add(new ShapeGeometry(roundedRect(1.58, 1.91, 0.44), 24), glass).position.z = 0.332
  add(screenGeometry(1.34, 1.66, 0.3), display).position.z = 0.334
  add(new ShapeGeometry(roundedRect(1.58, 1.91, 0.44), 24), sheen).position.z = 0.338

  // Digital crown and side button on the right edge.
  const crown = add(new CylinderGeometry(0.13, 0.13, 0.16, 36), metal)
  crown.rotation.z = Math.PI / 2
  crown.position.set(0.98, 0.36, 0)
  const crownRing = add(new CylinderGeometry(0.1, 0.1, 0.17, 24), strapMaterial)
  crownRing.rotation.z = Math.PI / 2
  crownRing.position.set(0.99, 0.36, 0)
  const button = add(
    new ExtrudeGeometry(roundedRect(0.4, 0.12, 0.05), {
      depth: 0.06,
      bevelEnabled: false,
    }),
    metal,
  )
  button.rotation.set(0, Math.PI / 2, Math.PI / 2)
  button.position.set(0.93, -0.28, 0)

  // Straps: tucked into the case and curving back like on a wrist.
  const top = new CatmullRomCurve3([
    new Vector3(0, 0.9, -0.04),
    new Vector3(0, 1.3, -0.1),
    new Vector3(0, 1.75, -0.36),
    new Vector3(0, 2.08, -0.84),
    new Vector3(0, 2.24, -1.42),
  ])
  const bottom = new CatmullRomCurve3(top.points.map((p) => new Vector3(p.x, -p.y, p.z)))
  add(strapGeometry(top, 1.18, 0.15, false), strapMaterial)
  add(strapGeometry(bottom, 1.18, 0.15, true), strapMaterial)

  // Buckle holes on the lower strap's outer face.
  const holeGeometry = new CircleGeometry(0.05, 20)
  geometries.push(holeGeometry)
  for (const t of [0.42, 0.55, 0.68, 0.81]) {
    const p = bottom.getPointAt(t)
    const tangent = bottom.getTangentAt(t)
    const n = new Vector3(0, -tangent.z, tangent.y).normalize().negate()
    const hole = new Mesh(holeGeometry, holeMaterial)
    hole.position.copy(p).addScaledVector(n, 0.077)
    hole.lookAt(hole.position.clone().add(n))
    watch.add(hole)
  }

  watch.rotation.set(-0.08, -0.35, 0.06)
  scene.add(watch)

  // ------------------------------------------------------------ sizing
  const resize = () => {
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (!running) renderer.render(scene, camera)
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  // ------------------------------------------------------------ motion
  const pointer = { x: 0, y: 0 }
  let hoverTarget = 0
  let hover = 0
  let running = false
  let frame = 0
  let last = performance.now()
  let elapsed = 0

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1
  }
  if (!options.coarsePointer && !options.reducedMotion) {
    window.addEventListener("pointermove", onPointerMove, { passive: true })
  }

  // Touch: a horizontal swipe on the watch turns it; vertical swipes still
  // scroll the page (touch-action: pan-y), and the browser cancels the
  // pointer as soon as a scroll starts. Released, it eases back.
  const drag = {
    active: false,
    id: -1,
    startX: 0,
    startY: 0,
    from: 0,
    from2: 0,
    x: 0,
    y: 0,
  }
  const onTouchDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    Object.assign(drag, {
      active: true,
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      from: drag.x,
      from2: drag.y,
    })
    hoverTarget = 1
  }
  const onTouchMove = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.id) return
    const { width, height } = container.getBoundingClientRect()
    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))
    drag.x = clamp(drag.from + ((event.clientX - drag.startX) / width) * 2.4, 1.3)
    drag.y = clamp(drag.from2 + ((event.clientY - drag.startY) / height) * 0.8, 0.4)
  }
  const onTouchEnd = (event: PointerEvent) => {
    if (event.pointerId !== drag.id) return
    drag.active = false
    hoverTarget = 0
  }
  if (!options.reducedMotion) {
    container.addEventListener("pointerdown", onTouchDown, { passive: true })
    container.addEventListener("pointermove", onTouchMove, { passive: true })
    container.addEventListener("pointerup", onTouchEnd, { passive: true })
    container.addEventListener("pointercancel", onTouchEnd, { passive: true })
  }

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    elapsed += dt
    const ease = 1 - Math.exp(-dt * 2.6)

    hover += (hoverTarget - hover) * (1 - Math.exp(-dt * 4))
    if (!drag.active) {
      // Released: drift back to the automatic motion.
      const back = Math.exp(-dt * 1.6)
      drag.x *= back
      drag.y *= back
    }
    const amplitude = 1 + hover * 0.45
    const autoSpin = Math.sin(elapsed * 0.32) * (options.coarsePointer ? 0.3 : 0.36)
    const targetY = -0.2 + autoSpin + pointer.x * 0.32 * amplitude + drag.x
    const targetX =
      -0.08 + pointer.y * 0.16 * amplitude + drag.y + Math.sin(elapsed * 0.5) * 0.03
    // Follow the finger more tightly than the mouse.
    const follow = drag.active ? 1 - Math.exp(-dt * 9) : ease
    watch.rotation.y += (targetY - watch.rotation.y) * follow
    watch.rotation.x += (targetX - watch.rotation.x) * follow
    watch.position.y = Math.sin(elapsed * 0.8) * 0.05

    highlight.intensity = hover * 1.6
    metal.envMapIntensity = 1.1 + hover * 0.5
    sheen.envMapIntensity = 0.55 + hover * 0.6

    renderer.render(scene, camera)
    frame = requestAnimationFrame(tick)
  }

  let onScreen = false
  const update = () => {
    const shouldRun =
      onScreen && document.visibilityState === "visible" && !options.reducedMotion
    if (shouldRun && !running) {
      running = true
      last = performance.now()
      frame = requestAnimationFrame(tick)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(frame)
    }
  }
  // Pause when the hero scrolls out of view or the tab is hidden.
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    update()
  })
  intersection.observe(container)
  document.addEventListener("visibilitychange", update)

  resize()
  renderer.render(scene, camera)
  options.onReady()

  return {
    setHover(value) {
      hoverTarget = value ? 1 : 0
      if (options.reducedMotion) {
        highlight.intensity = hoverTarget * 1.2
        renderer.render(scene, camera)
      }
    },
    dispose() {
      running = false
      cancelAnimationFrame(frame)
      intersection.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", update)
      window.removeEventListener("pointermove", onPointerMove)
      container.removeEventListener("pointerdown", onTouchDown)
      container.removeEventListener("pointermove", onTouchMove)
      container.removeEventListener("pointerup", onTouchEnd)
      container.removeEventListener("pointercancel", onTouchEnd)
      for (const g of geometries) g.dispose()
      for (const m of [metal, glass, display, sheen, strapMaterial, holeMaterial])
        m.dispose()
      face.dispose()
      envMap.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
