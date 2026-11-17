import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { asset } from '../lib';
import type { AudioController } from '../types';

type Cue = { start: number; end: number; value: string };
type MorphMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
const SHAPES: Record<string, Record<string, number>> = {
  X: { Smile: .24 }, A: { Smile: .06 }, B: { JawDown: .12, LipStretch: .15 },
  C: { JawDown: .33, LipStretch: .1 }, D: { JawDown: .58, LipStretch: .1 },
  E: { JawDown: .28, LipCircle: .32, BottomLipPucker: .2 },
  F: { JawDown: .13, LipCircle: .7, BottomLipPucker: .45, UpperLipPucker: .3 },
  G: { JawDown: .1, UpperLipUp: .06, BottomLipPucker: .12 }, H: { JawDown: .31 },
};
const LIP_NAMES = ['JawDown', 'LipStretch', 'LipCircle', 'BottomLipPucker', 'UpperLipPucker', 'UpperLipUp', 'Smile'];
export default function JudyAvatar3D({ page, audio, active, onSpeak }: { page: number; audio: AudioController; active: boolean; onSpeak: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ audio, active }); live.current = { audio, active };
  const cues = useRef<Cue[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const view = useRef({ yaw: .10, targetYaw: .10, pointerX: 0, pointerY: 0 });
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const clip = audio.playing || `judy-${String(page).padStart(2, '0')}`;
  useEffect(() => {
    const controller = new AbortController(); cues.current = [];
    fetch(asset(`audio/judy-en/${clip}.json`), { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('No cues'); return r.json(); })
      .then((data: { mouthCues: Cue[] }) => { cues.current = data.mouthCues; }).catch(() => {});
    return () => controller.abort();
  }, [clip]);
  useEffect(() => {
    const host = mount.current!; let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(35, 1, .01, 20);
    camera.position.set(0, 1.04, 3.7); camera.lookAt(0, 1.04, 0);
    scene.add(new THREE.HemisphereLight(0xf5f7ff, 0x657b8a, 2.2));
    const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(2, 4, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -1.4; key.shadow.camera.right = 1.4; key.shadow.camera.top = 2.8; key.shadow.camera.bottom = -1; key.shadow.normalBias = .025; key.shadow.bias = -.00015; scene.add(key);
    const fill = new THREE.DirectionalLight(0xbad5ff, 1.25); fill.position.set(-2, 2, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.8); rim.position.set(2, 3, -3); scene.add(rim);
    const avatar = new THREE.Group(); scene.add(avatar);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(.43, 64), new THREE.ShadowMaterial({ opacity: .18 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = .006; ground.receiveShadow = true; scene.add(ground);
    const morphs: { mesh: MorphMesh; names: Record<string, number> }[] = [];
    const bones: { bone: THREE.Bone; base: THREE.Quaternion; role: string }[] = [];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let model: THREE.Group | null = null;
    const freeModel = (root: THREE.Object3D) => root.traverse(object => {
      const mesh = object as MorphMesh; if (!mesh.isMesh) return; mesh.geometry.dispose();
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.dispose(); }); material.dispose();
      });
    });
    new GLTFLoader().load(asset('models/judy/judy-classroom.glb'), gltf => {
      if (disposed) { freeModel(gltf.scene); return; }
      model = gltf.scene; avatar.add(model); model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model, true), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      const scale = 2.02 / size.y; model.scale.multiplyScalar(scale);
      model.position.add(new THREE.Vector3(-center.x * scale, -box.min.y * scale, -center.z * scale));
      // The glTF skin binds to its rest pose. Set the standing pose on the live skeleton.
      const pose = (name: string, axis: THREE.Vector3, angle: number) => {
        const bone = model!.getObjectByName(name);
        if (!bone || !bone.parent) return;
        const parentRotation = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        const localAxis = axis.clone().applyQuaternion(parentRotation);
        bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis, THREE.MathUtils.degToRad(angle)));
        model!.updateMatrixWorld(true);
      };
      pose('bip_upperArm_L', new THREE.Vector3(0, 0, 1), -27);
      pose('bip_upperArm_R', new THREE.Vector3(0, 0, 1), 31);
      pose('bip_lowerArm_L', new THREE.Vector3(1, 0, 0), -27);
      pose('bip_lowerArm_R', new THREE.Vector3(1, 0, 0), -7);
      pose('bip_head', new THREE.Vector3(0, 0, 1), 2);
      pose('Ear_L001', new THREE.Vector3(0, 0, 1), -5);
      pose('Ear_R001', new THREE.Vector3(0, 0, 1), 7);
      model.traverse(object => {
        const mesh = object as MorphMesh;
        if (mesh.isMesh) {
          mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false;
          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            const names: Record<string, number> = {};
            for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) names[name.split('.').pop()!] = index;
            morphs.push({ mesh, names });
          }
        }
        if ((object as THREE.Bone).isBone) {
          const role = (object.userData.judyRole || ({ bip_head: 'head', bip_spine_2: 'chest', Ear_L001: 'earL', Ear_R001: 'earR', bip_lowerArm_L: 'forearmL' } as Record<string, string>)[object.name]) as string | undefined;
          if (role) bones.push({ bone: object as THREE.Bone, base: object.quaternion.clone(), role });
        }
      });
      host.dataset.modelLoaded = 'true'; host.dataset.morphMeshes = String(morphs.length); host.dataset.animatedBones = String(bones.length); setReady(true);
    }, undefined, () => { if (!disposed) setFailed(true); });
    const resize = () => { const { width, height } = host.getBoundingClientRect(); if (width && height) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const onLost = (e: Event) => { e.preventDefault(); if (!disposed) setFailed(true); };
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    const delta = new THREE.Quaternion(), euler = new THREE.Euler(); let previous = 0;
    renderer.setAnimationLoop(ms => {
      if (disposed || document.hidden) return;
      const t = ms / 1000, dt = Math.min((ms - previous) / 1000, .05); previous = ms;
      const { audio: a, active: speaking } = live.current;
      view.current.yaw = THREE.MathUtils.damp(view.current.yaw, view.current.targetYaw, 7, dt);
      avatar.rotation.y = view.current.yaw;
      const cue = speaking ? cues.current.find(c => a.currentTime >= c.start && a.currentTime < c.end)?.value : 'X';
      const shape = SHAPES[cue || (a.level > .38 ? 'D' : a.level > .12 ? 'C' : 'X')] || SHAPES.X;
      const phase = t % 4.8; const blink = reducedMotion.matches ? 0 : phase > 4.55 ? Math.sin((phase - 4.55) / .25 * Math.PI) : 0;
      for (const { mesh, names } of morphs) {
        const weights = mesh.morphTargetInfluences!;
        const set = (name: string, target: number) => { const i = names[name]; if (i !== undefined) weights[i] = THREE.MathUtils.damp(weights[i], target, 23, dt); };
        LIP_NAMES.forEach(name => set(name, shape[name] || 0));
        set('EyeCloseL', blink); set('EyeCloseR', blink); set('EyeSquintL', .06); set('EyeSquintR', .05);
        set('BrowInnerUpL', speaking ? .06 + a.level * .1 : .025); set('BrowInnerUpR', speaking ? .06 + a.level * .1 : .025);
      }
      if (!reducedMotion.matches) for (const { bone, base, role } of bones) {
        let x = 0, y = 0, z = 0;
        if (role === 'head') { x = Math.sin(t * 1.1) * .012 + view.current.pointerY * .025; y = view.current.pointerX * .075 + Math.sin(t * .65) * .025; z = speaking ? Math.sin(t * 1.6) * .018 : Math.sin(t * .7) * .012; }
        if (role === 'chest') { x = Math.sin(t * 1.6) * .009; y = Math.sin(t * .55) * .012; }
        if (role === 'earL' || role === 'earR') { z = Math.sin(t * .95 + (role === 'earL' ? 0 : 1.7)) * .018; }
        if (role === 'forearmL') { x = speaking ? Math.sin(t * 1.25) * .045 : 0; }
        euler.set(x, y, z); delta.setFromEuler(euler); bone.quaternion.copy(base).multiply(delta);
      }
      host.dataset.viseme = cue || 'level'; host.dataset.yaw = avatar.rotation.y.toFixed(3); host.dataset.mouth = (shape.JawDown || 0).toFixed(2); host.dataset.blink = blink.toFixed(2); renderer.render(scene, camera);
    });
    return () => {
      disposed = true; observer.disconnect(); renderer.setAnimationLoop(null); renderer.domElement.removeEventListener('webglcontextlost', onLost);
      if (model) freeModel(model); ground.geometry.dispose(); ground.material.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className={`judy-3d ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''}`} role="button" tabIndex={0} aria-label={active ? '停止朱迪讲解；拖动可查看全身模型' : '点击让朱迪讲解；拖动可查看全身模型'}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSpeak(); } }}
    onPointerDown={event => { gesture.current = { x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => {
      const bounds = event.currentTarget.getBoundingClientRect(); view.current.pointerX = ((event.clientX - bounds.left) / bounds.width - .5) * 2; view.current.pointerY = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
      if (!gesture.current) return; const dx = event.clientX - gesture.current.x;
      if (Math.abs(dx) > 4 || gesture.current.moved) { view.current.targetYaw += dx * .011; gesture.current.x = event.clientX; gesture.current.moved = true; setDragging(true); }
    }}
    onPointerUp={() => { if (gesture.current && !gesture.current.moved) onSpeak(); gesture.current = null; setDragging(false); }}
    onPointerCancel={() => { gesture.current = null; setDragging(false); }}
    onPointerLeave={() => { view.current.pointerX = 0; view.current.pointerY = 0; }}>
    <div className="judy-3d-canvas" ref={mount} />
    {!ready && !failed && <span className="judy-3d-loading">朱迪正在就位…</span>}
    {failed && <span className="judy-3d-unavailable">此设备暂未开启 3D 显示<br />仍可点击下方按钮听讲解</span>}
    <span className="judy-3d-hint">拖动查看 · 点击听讲</span>
  </div>;
}
