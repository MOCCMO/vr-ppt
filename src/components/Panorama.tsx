import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Check, Compass, Glasses, LoaderCircle, Minus, Move, Plus, RotateCcw } from 'lucide-react';
import { asset } from '../lib';
import type { Season } from '../types';

const YAW = { winter: 18, spring: 62, summer: 110, autumn: 160 };
const radians = THREE.MathUtils.degToRad;
const direction = (yaw: number, pitch: number, distance = 1) => new THREE.Vector3(Math.cos(radians(pitch)) * Math.cos(radians(yaw)), Math.sin(radians(pitch)), Math.cos(radians(pitch)) * Math.sin(radians(yaw))).multiplyScalar(distance);

export default function Panorama({ season, onClue, found, expanded }: { season: Season; onClue: (index: number) => void; found: Record<string, boolean>; expanded: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const settings = useRef({ yaw: YAW[season.id], pitch: -3, fov: 68 });
  const latest = useRef({ season, onClue }); latest.current = { season, onClue };
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [xrAvailable, setXrAvailable] = useState(false);
  const [xrError, setXrError] = useState('');
  const [xrActive, setXrActive] = useState(false);
  const [hint, setHint] = useState(true);
  const xrSession = useRef<XRSession | null>(null);

  useEffect(() => { settings.current = { yaw: YAW[season.id], pitch: -3, fov: 68 }; setHint(true); }, [season.id]);

  useEffect(() => {
    let disposed = false;
    navigator.xr?.isSessionSupported('immersive-vr').then(value => { if (!disposed) setXrAvailable(value); }).catch(() => {});
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const root = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch { setFallback(true); setReady(true); return; }
    let disposed = false;
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    root.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#a8c6d4');
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 150);
    const geometry = new THREE.SphereGeometry(100, 72, 48); geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    const sphere = new THREE.Mesh(geometry, material); scene.add(sphere);
    const texture = new THREE.TextureLoader().load(asset('assets/seasons-panorama.webp'), loaded => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = THREE.SRGBColorSpace;
      // Mirror the illustration at its ends so a full turn never shows a hard cut.
      loaded.wrapS = THREE.MirroredRepeatWrapping;
      loaded.repeat.x = 2;
      loaded.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      material.map = loaded; material.needsUpdate = true; setReady(true);
    }, undefined, () => { if (!disposed) { setFallback(true); setReady(true); } });

    // Subtle real 3D snow; the environment itself is the generated artwork.
    const count = 160; const snowPoints = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { snowPoints[i * 3] = (Math.random() - .5) * 18; snowPoints[i * 3 + 1] = Math.random() * 10 - 5; snowPoints[i * 3 + 2] = (Math.random() - .5) * 18; }
    const snowGeometry = new THREE.BufferGeometry(); snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPoints, 3));
    const snowMaterial = new THREE.PointsMaterial({ color: '#fffef8', size: .025, transparent: true, opacity: .7, depthWrite: false });
    const snow = new THREE.Points(snowGeometry, snowMaterial); scene.add(snow);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    const xrLabels = new THREE.Group(); scene.add(xrLabels);
    let xrSeason = '';
    const disposeLabels = () => {
      xrLabels.children.forEach(object => { const m = object as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; m.geometry.dispose(); m.material.map?.dispose(); m.material.dispose(); });
      xrLabels.clear();
    };
    const buildXRLabels = () => {
      disposeLabels(); const current = latest.current.season;
      current.hotspots.forEach((hotspot, index) => {
        const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f5f2e9'; ctx.fillRect(0, 0, 768, 160);
        ctx.fillStyle = '#17283b'; ctx.font = '44px Georgia'; ctx.textAlign = 'center'; ctx.fillText(hotspot.word, 384, 92);
        const labelTexture = new THREE.CanvasTexture(canvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .23), new THREE.MeshBasicMaterial({ map: labelTexture, side: THREE.DoubleSide }));
        mesh.position.copy(direction(YAW[current.id] + hotspot.angle, hotspot.elevation, 3.2)); mesh.lookAt(0, 0, 0); mesh.userData.clue = index; xrLabels.add(mesh);
      });
      xrSeason = current.id;
    };
    const controllers: THREE.XRTargetRaySpace[] = [];
    const raycaster = new THREE.Raycaster(); const rotation = new THREE.Matrix4();
    const handleSelect = (controller: THREE.XRTargetRaySpace) => {
      rotation.extractRotation(controller.matrixWorld); raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld); raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotation);
      const hit = raycaster.intersectObjects(xrLabels.children)[0]; if (hit) latest.current.onClue(hit.object.userData.clue as number);
    };
    const controllerHandlers: (() => void)[] = [];
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i); controllers.push(controller);
      const select = () => handleSelect(controller); controllerHandlers.push(select); controller.addEventListener('select', select);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -4)]);
      const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#f3d6a4' })); controller.add(line); scene.add(controller);
    }
    const onSessionStart = () => setXrActive(true);
    const onSessionEnd = () => { setXrActive(false); xrSession.current = null; camera.position.set(0, 0, 0); };
    renderer.xr.addEventListener('sessionstart', onSessionStart); renderer.xr.addEventListener('sessionend', onSessionEnd);

    let width = 1, height = 1;
    const resize = () => { width = root.clientWidth; height = root.clientHeight; if (width && height && !renderer.xr.isPresenting) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } };
    const observer = new ResizeObserver(resize); observer.observe(root); resize();
    let dragging = false, lastX = 0, lastY = 0;
    const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); setHint(false); };
    const move = (event: PointerEvent) => { if (!dragging) return; settings.current.yaw += (event.clientX - lastX) * .12; settings.current.pitch = THREE.MathUtils.clamp(settings.current.pitch + (event.clientY - lastY) * .1, -42, 42); lastX = event.clientX; lastY = event.clientY; };
    const up = () => { dragging = false; };
    const wheel = (event: WheelEvent) => { if (!event.ctrlKey) return; event.preventDefault(); settings.current.fov = THREE.MathUtils.clamp(settings.current.fov + event.deltaY * .04, 40, 88); };
    renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointermove', move); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointercancel', up); renderer.domElement.addEventListener('wheel', wheel, { passive: false });
    const contextLost = (event: Event) => { event.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);

    let previousTime = 0;
    renderer.setAnimationLoop((time) => {
      if (disposed || document.hidden) return;
      const dt = Math.min((time - previousTime) / 1000, .04); previousTime = time;
      const current = latest.current.season;
      if (!renderer.xr.isPresenting) {
        camera.position.set(0, 0, 0); camera.lookAt(direction(settings.current.yaw, settings.current.pitch));
        if (camera.fov !== settings.current.fov) { camera.fov = settings.current.fov; camera.updateProjectionMatrix(); }
        camera.updateMatrixWorld();
        current.hotspots.forEach((hotspot, i) => {
          const element = labels.current[i]; if (!element) return;
          const point = direction(YAW[current.id] + hotspot.angle, hotspot.elevation, 5);
          const inFront = point.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3())) > 0;
          point.project(camera); const visible = inFront && Math.abs(point.x) < .82 && Math.abs(point.y) < .78;
          element.style.visibility = visible ? 'visible' : 'hidden';
          element.style.transform = `translate(-50%, -50%) translate(${(point.x * .5 + .5) * width}px, ${(-point.y * .5 + .5) * height}px)`;
        });
      }
      xrLabels.visible = renderer.xr.isPresenting;
      if (renderer.xr.isPresenting && xrSeason !== current.id) buildXRLabels();
      snow.visible = current.id === 'winter' && !reducedMotion.matches;
      if (snow.visible) { for (let i = 0; i < count; i++) { snowPoints[i * 3 + 1] -= dt * .25; if (snowPoints[i * 3 + 1] < -5) snowPoints[i * 3 + 1] = 5; } snowGeometry.attributes.position.needsUpdate = true; }
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true; observer.disconnect(); renderer.setAnimationLoop(null); xrSession.current?.end().catch(() => {});
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointermove', move); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointercancel', up); renderer.domElement.removeEventListener('wheel', wheel); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.xr.removeEventListener('sessionstart', onSessionStart); renderer.xr.removeEventListener('sessionend', onSessionEnd);
      controllers.forEach((controller, i) => { controller.removeEventListener('select', controllerHandlers[i]); controller.children.forEach(object => { const line = object as THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>; line.geometry.dispose(); line.material.dispose(); }); });
      disposeLabels(); texture.dispose(); material.dispose(); geometry.dispose(); snowGeometry.dispose(); snowMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); rendererRef.current = null;
    };
  }, []);

  const startVR = async () => {
    setXrError('');
    try {
      if (!navigator.xr || !rendererRef.current) return;
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
      xrSession.current = session;
      await rendererRef.current.xr.setSession(session);
    } catch { await xrSession.current?.end().catch(() => {}); xrSession.current = null; setXrError('头显模式未启动，仍可拖动查看全景。'); }
  };
  return <div className={`panorama panorama--${season.id} ${expanded ? 'panorama--expanded' : ''}`} data-panorama tabIndex={0} aria-label={`${season.name} 360度场景。拖动环顾，方向键调整视角。`} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); settings.current.yaw += event.key === 'ArrowLeft' ? -6 : event.key === 'ArrowRight' ? 6 : 0; settings.current.pitch = THREE.MathUtils.clamp(settings.current.pitch + (event.key === 'ArrowUp' ? 4 : event.key === 'ArrowDown' ? -4 : 0), -42, 42); setHint(false); }
  }}>
    <div ref={mount} className={`panorama-canvas ${fallback ? 'is-fallback' : ''}`} />
    {fallback && <div className={`panorama-fallback fallback-${season.id}`} style={{ backgroundImage: `url(${asset('assets/seasons-panorama.webp')})` }}><span>当前设备显示静态场景，诗歌与互动仍可使用。</span></div>}
    {!ready && <div className="scene-loading"><LoaderCircle className="spin" /><span>正在走进{season.chinese}天…</span></div>}
    <div className="scene-vignette" />
    <div className={`hotspots ${fallback ? 'hotspots--fallback' : ''}`} aria-label="场景中的诗歌线索">
      {season.hotspots.map((hotspot, i) => <button ref={element => { labels.current[i] = element; }} key={`${season.id}-${i}`} className={`hotspot ${found[`${season.id}-spot-${i}`] ? 'is-found' : ''}`} onClick={() => { onClue(i); setHint(false); }} aria-label={`发现线索 ${hotspot.word}`} style={fallback ? { left: `${20 + i * 27}%`, top: `${35 + (i % 2) * 18}%` } : undefined}>
        <span className="hotspot-dot">{found[`${season.id}-spot-${i}`] ? <Check size={12} /> : <Plus size={12} />}</span><span>{hotspot.word}</span>
      </button>)}
    </div>
    <div className="scene-top"><span className="scene-number">0{['winter', 'spring', 'summer', 'autumn'].indexOf(season.id) + 1} / 04</span><div className="scene-tools">
      <button className="scene-icon" onClick={() => { settings.current = { yaw: YAW[season.id], pitch: -3, fov: 68 }; }} aria-label="重置场景视角" title="重置视角"><RotateCcw size={17} /></button>
      <button className="scene-icon" onClick={() => { settings.current.fov = Math.min(settings.current.fov + 8, 88); }} aria-label="缩小场景" title="缩小"><Minus size={17} /></button>
      <button className="scene-icon" onClick={() => { settings.current.fov = Math.max(settings.current.fov - 8, 40); }} aria-label="放大场景" title="放大"><Plus size={17} /></button>
      {xrAvailable && <button className="scene-icon" onClick={startVR} aria-label="进入头显模式" title="进入头显模式"><Glasses size={18} /></button>}
    </div></div>
    <div className="scene-bottom"><div><span className="scene-season-cn">{season.chinese}日诗境</span><h2>{season.name}</h2><p>{season.subtitle}</p></div><span className="scene-compass"><Compass size={28} /><b>360°</b></span></div>
    {hint && !fallback && <div className="scene-hint"><Move size={16} /><span>拖动环顾 · 点击光点找线索</span></div>}
    {xrError && <p className="xr-error" role="status">{xrError}</p>}
    {xrActive && <div className="xr-message">头显模式中。可用控制器点击线索。<button onClick={() => xrSession.current?.end()}>返回网页</button></div>}
  </div>;
}
