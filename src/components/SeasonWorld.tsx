import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Check, MousePointer2, RotateCw, Sparkles, ZoomIn } from 'lucide-react';
import { SEASONS } from '../data';
import type { MissionId } from '../types';

interface SeasonWorldProps {
  onSelect?: (id: MissionId) => void;
  completed?: MissionId[];
  compact?: boolean;
}

interface ZoneConfig {
  id: MissionId;
  position: [number, number, number];
  color: string;
  top: string;
  title: string;
  subtitle: string;
}

const ZONES: ZoneConfig[] = [
  { id: 'spring', position: [-4.25, 0.25, -2.4], color: '#df7896', top: '#a8d88f', title: '春 · 词句花园', subtitle: 'SPRING' },
  { id: 'summer', position: [4.25, 0.25, -2.4], color: '#eaa13e', top: '#f4d687', title: '夏 · 清凉衣橱', subtitle: 'SUMMER' },
  { id: 'autumn', position: [-4.25, 0.25, 3.05], color: '#bd6845', top: '#d9a566', title: '秋 · 落叶分类站', subtitle: 'AUTUMN' },
  { id: 'winter', position: [4.25, 0.25, 3.05], color: '#69a8ca', top: '#eaf7fb', title: '冬 · 冰雪发音站', subtitle: 'WINTER' },
  { id: 'final', position: [0, 0.65, 0.25], color: '#7569bd', top: '#f4f0ff', title: 'AI 四季发布会', subtitle: 'FINAL MISSION' },
];

function makeLabel(title: string, subtitle: string, accent: string, central = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const x = 22;
  const y = 22;
  const width = 724;
  const height = 194;
  const radius = 72;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = 'rgba(255,255,255,0.96)';
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = accent;
  context.stroke();
  context.fillStyle = '#173f35';
  context.textAlign = 'center';
  context.font = `700 ${central ? 60 : 56}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  context.fillText(title, 384, 112);
  context.fillStyle = accent;
  context.font = '700 28px Arial, sans-serif';
  context.letterSpacing = '5px';
  context.fillText(subtitle, 384, 166);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(central ? 3.5 : 3.25, central ? 1.17 : 1.08, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function mesh(geometry: THREE.BufferGeometry, color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const result = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...options }));
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function createTree(color: string, snowy = false) {
  const group = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.25, 8), '#82573d');
  trunk.position.y = 0.62;
  group.add(trunk);
  if (snowy) {
    [0, 1, 2].forEach((level) => {
      const crown = mesh(new THREE.ConeGeometry(0.72 - level * 0.13, 1.05, 10), level === 1 ? '#f8fdff' : '#77a99b');
      crown.position.y = 1.2 + level * 0.45;
      group.add(crown);
    });
  } else {
    const crownPositions: [number, number, number][] = [[0, 1.55, 0], [-0.35, 1.38, 0.08], [0.34, 1.4, 0.06], [0.05, 1.45, -0.3]];
    crownPositions.forEach(([x, y, z], index) => {
      const crown = mesh(new THREE.IcosahedronGeometry(index === 0 ? 0.63 : 0.46, 1), color);
      crown.position.set(x, y, z);
      group.add(crown);
    });
  }
  return group;
}

function createSnowman() {
  const group = new THREE.Group();
  const bottom = mesh(new THREE.SphereGeometry(0.43, 20, 16), '#ffffff');
  bottom.position.y = 0.42;
  const head = mesh(new THREE.SphereGeometry(0.29, 20, 16), '#ffffff');
  head.position.y = 1.08;
  const hat = mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.27, 16), '#31556b');
  hat.position.y = 1.42;
  const brim = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 16), '#31556b');
  brim.position.y = 1.3;
  const nose = mesh(new THREE.ConeGeometry(0.07, 0.35, 10), '#ee9141');
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.08, 0.32);
  group.add(bottom, head, hat, brim, nose);
  [-0.1, 0.1].forEach((x) => {
    const eye = mesh(new THREE.SphereGeometry(0.025, 8, 8), '#243c44');
    eye.position.set(x, 1.17, 0.265);
    group.add(eye);
  });
  return group;
}

function createZone(config: ZoneConfig) {
  const group = new THREE.Group();
  group.position.set(...config.position);
  group.userData.mission = config.id;
  group.userData.baseY = config.position[1];
  const central = config.id === 'final';
  const radius = central ? 1.45 : 2.05;
  const base = mesh(new THREE.CylinderGeometry(radius, radius * 0.88, central ? 0.55 : 0.42, 40), config.color);
  base.position.y = -0.13;
  const top = mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.18, 40), config.top);
  top.position.y = 0.16;
  group.add(base, top);

  if (config.id === 'spring') {
    [[-0.85, 0.2, -0.35], [0.72, 0.2, -0.48]].forEach(([x, y, z]) => {
      const tree = createTree('#ef9fba');
      tree.position.set(x, y, z);
      group.add(tree);
    });
    const flowerColors = ['#fff3a8', '#ffffff', '#e96891', '#a68bd4'];
    for (let index = 0; index < 15; index += 1) {
      const angle = index * 2.4;
      const flower = mesh(new THREE.SphereGeometry(0.09, 8, 6), flowerColors[index % flowerColors.length]);
      flower.position.set(Math.cos(angle) * (0.6 + (index % 4) * 0.27), 0.36, Math.sin(angle) * (0.65 + (index % 3) * 0.3));
      group.add(flower);
    }
    const kite = mesh(new THREE.OctahedronGeometry(0.35, 0), '#f5be4f');
    kite.scale.z = 0.12;
    kite.position.set(0.25, 2.65, -0.3);
    kite.rotation.z = 0.3;
    group.add(kite);
  }

  if (config.id === 'summer') {
    const palm = createTree('#54a36f');
    palm.scale.set(1.05, 1.35, 1.05);
    palm.position.set(-0.85, 0.18, -0.4);
    group.add(palm);
    const pole = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 8), '#f7f1dd');
    pole.position.set(0.65, 0.95, 0.05);
    const umbrella = mesh(new THREE.ConeGeometry(0.85, 0.43, 16), '#ef7967');
    umbrella.position.set(0.65, 1.72, 0.05);
    group.add(pole, umbrella);
    const pool = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 28), '#5cc6dc', { roughness: 0.25 });
    pool.position.set(0.15, 0.32, 0.92);
    group.add(pool);
    const ball = mesh(new THREE.SphereGeometry(0.22, 16, 12), '#fff4df');
    ball.position.set(0.25, 0.62, 0.9);
    group.add(ball);
  }

  if (config.id === 'autumn') {
    [[-0.88, 0.2, -0.38], [0.66, 0.2, -0.55]].forEach(([x, y, z], index) => {
      const tree = createTree(index ? '#d98443' : '#bd5c3f');
      tree.position.set(x, y, z);
      group.add(tree);
    });
    for (let index = 0; index < 7; index += 1) {
      const pumpkin = mesh(new THREE.SphereGeometry(0.18 + (index % 2) * 0.05, 12, 8), '#e89132');
      pumpkin.scale.y = 0.78;
      pumpkin.position.set(-1.2 + index * 0.38, 0.38, 0.8 + Math.sin(index) * 0.3);
      group.add(pumpkin);
    }
    const leaf = mesh(new THREE.OctahedronGeometry(0.25, 0), '#f4c151');
    leaf.scale.set(1, 0.12, 0.65);
    leaf.position.set(0.1, 2.55, 0);
    group.add(leaf);
  }

  if (config.id === 'winter') {
    [[-0.9, 0.2, -0.45], [0.75, 0.2, -0.6]].forEach(([x, y, z]) => {
      const tree = createTree('#7ca79b', true);
      tree.position.set(x, y, z);
      group.add(tree);
    });
    const snowman = createSnowman();
    snowman.position.set(0.2, 0.23, 0.75);
    group.add(snowman);
    for (let index = 0; index < 10; index += 1) {
      const snow = mesh(new THREE.SphereGeometry(0.04, 6, 6), '#ffffff', { emissive: '#d9f4ff' });
      snow.position.set(Math.sin(index * 2.1) * 1.5, 0.7 + (index % 5) * 0.42, Math.cos(index * 1.7) * 1.3);
      group.add(snow);
    }
  }

  if (central) {
    const pedestal = mesh(new THREE.CylinderGeometry(0.65, 0.88, 0.8, 24), '#5f569e');
    pedestal.position.y = 0.63;
    const orb = mesh(new THREE.IcosahedronGeometry(0.6, 2), '#a89de8', { roughness: 0.15, metalness: 0.15, emissive: '#443a86', emissiveIntensity: 0.25 });
    orb.position.y = 1.6;
    orb.userData.spin = true;
    const ring = mesh(new THREE.TorusGeometry(0.9, 0.035, 10, 48), '#f3c862', { emissive: '#b17717', emissiveIntensity: 0.25 });
    ring.position.y = 1.6;
    ring.rotation.x = Math.PI / 2.6;
    ring.userData.spin = true;
    group.add(pedestal, orb, ring);
  }

  const label = makeLabel(config.title, config.subtitle, config.color, central);
  label.position.set(0, central ? 3.05 : 3.25, 0);
  group.add(label);
  group.traverse((child) => {
    child.userData.mission = config.id;
  });
  return group;
}

export default function SeasonWorld({ onSelect, completed = [], compact = false }: SeasonWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  selectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor('#e7f4ee', 0);
    container.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', '可拖动旋转和缩放的三维四季学习岛屿');
    renderer.domElement.setAttribute('role', 'img');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#e7f4ee', 22, 42);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(12.5, 12, 17.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.055;
    controls.minDistance = 13;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minPolarAngle = Math.PI / 5;
    controls.target.set(0, 0.5, 0.4);
    controls.autoRotate = !reducedMotion && !selectRef.current;
    controls.autoRotateSpeed = 0.38;
    controls.enablePan = false;

    scene.add(new THREE.HemisphereLight('#fffdf0', '#8bb6a0', 2.2));
    const sun = new THREE.DirectionalLight('#fff5db', 3.2);
    sun.position.set(-7, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 13;
    sun.shadow.camera.bottom = -13;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#b9d8ff', 1.1);
    fill.position.set(10, 5, -8);
    scene.add(fill);

    const water = mesh(new THREE.CircleGeometry(32, 80), '#9ed9dc', { roughness: 0.28, metalness: 0.05 });
    water.rotation.x = -Math.PI / 2;
    water.position.y = -3.25;
    water.receiveShadow = true;
    scene.add(water);
    const island = mesh(new THREE.CylinderGeometry(8.4, 6.3, 1.15, 64), '#7fa578');
    island.position.y = -0.75;
    const islandTop = mesh(new THREE.CylinderGeometry(8.25, 8.25, 0.24, 64), '#b9d9a5');
    islandTop.position.y = -0.1;
    const rock = mesh(new THREE.CylinderGeometry(6.25, 2.8, 2.3, 18), '#8c8c72');
    rock.position.y = -2.25;
    scene.add(island, islandTop, rock);

    const paths = [
      { position: [-2.3, 0.08, -1.2] as [number, number, number], rotation: -0.45 },
      { position: [2.3, 0.08, -1.2] as [number, number, number], rotation: 0.45 },
      { position: [-2.3, 0.08, 1.7] as [number, number, number], rotation: 0.48 },
      { position: [2.3, 0.08, 1.7] as [number, number, number], rotation: -0.48 },
    ];
    paths.forEach(({ position, rotation }) => {
      const path = mesh(new THREE.BoxGeometry(0.72, 0.08, 4.1), '#efe1b9');
      path.position.set(...position);
      path.rotation.y = rotation;
      scene.add(path);
    });

    const groups = ZONES.map((config) => {
      const group = createZone(config);
      scene.add(group);
      return group;
    });

    const clouds: THREE.Group[] = [];
    [[-10, 5, -8], [9, 6.5, -10], [-11, 7, 7], [11, 5, 9]].forEach(([x, y, z], cloudIndex) => {
      const cloud = new THREE.Group();
      [[0, 0, 0, 0.65], [0.65, -0.05, 0, 0.48], [-0.6, -0.1, 0, 0.42], [0.1, 0.34, 0, 0.46]].forEach(([cx, cy, cz, size]) => {
        const puff = mesh(new THREE.SphereGeometry(size, 14, 10), '#ffffff', { transparent: true, opacity: 0.82 });
        puff.position.set(cx, cy, cz);
        puff.castShadow = false;
        cloud.add(puff);
      });
      cloud.position.set(x, y, z);
      cloud.userData.baseX = x;
      cloud.userData.offset = cloudIndex;
      clouds.push(cloud);
      scene.add(cloud);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Group | null = null;
    let pendingPointer: { x: number; y: number } | null = null;
    let pointerStart = { x: 0, y: 0 };
    const missionFromCoordinates = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(groups, true)[0];
      return hit?.object.userData.mission as MissionId | undefined;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!selectRef.current) return;
      pendingPointer = { x: event.clientX, y: event.clientY };
      requestRender();
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!selectRef.current || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) return;
      const mission = missionFromCoordinates(event.clientX, event.clientY);
      if (mission) selectRef.current(mission);
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = width < 700 ? 50 : 38;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animationId = 0;
    const clock = new THREE.Clock();
    const scaleVector = new THREE.Vector3();
    function requestRender() {
      if (!animationId) animationId = requestAnimationFrame(animate);
    }
    function animate() {
      animationId = 0;
      if (pendingPointer) {
        const { x, y } = pendingPointer;
        pendingPointer = null;
        const mission = missionFromCoordinates(x, y);
        hovered = groups.find((group) => group.userData.mission === mission) ?? null;
        renderer.domElement.style.cursor = mission ? 'pointer' : 'grab';
      }
      const time = reducedMotion ? 0 : clock.getElapsedTime();
      groups.forEach((group, index) => {
        const targetScale = group === hovered ? 1.055 : 1;
        if (reducedMotion) {
          group.scale.setScalar(targetScale);
          group.position.y = group.userData.baseY;
        } else {
          group.scale.lerp(scaleVector.setScalar(targetScale), 0.08);
          group.position.y = group.userData.baseY + Math.sin(time * 0.75 + index * 1.4) * 0.045;
          group.children.forEach((child) => {
            if (child.userData.spin) child.rotation.y += 0.008;
          });
        }
      });
      if (!reducedMotion) {
        clouds.forEach((cloud) => {
          cloud.position.x = cloud.userData.baseX + Math.sin(time * 0.08 + cloud.userData.offset) * 1.2;
        });
      }
      controls.update();
      renderer.render(scene, camera);
      if (!reducedMotion) requestRender();
    }
    controls.addEventListener('change', requestRender);
    requestRender();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          if ('geometry' in object && object.geometry) object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.SpriteMaterial) material.map?.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className={`season-world ${compact ? 'season-world--compact' : ''}`} ref={containerRef}>
      {failed && (
        <div className="world-fallback">
          <Sparkles size={34} />
          <strong>当前浏览器未开启 WebGL</strong>
          <span>仍可通过下方按钮完成全部学习任务。</span>
        </div>
      )}
      {onSelect && (
        <>
          <div className="world-instructions" aria-hidden="true">
            <span><RotateCw size={15} />拖动旋转</span>
            <span><ZoomIn size={15} />滚轮缩放</span>
            <span><MousePointer2 size={15} />点击入岛</span>
          </div>
          <div className="world-mission-dock" aria-label="四季任务导航">
            {SEASONS.map((season, index) => (
              <button
                className={`world-mission-button ${completed.includes(season.id) ? 'is-complete' : ''}`}
                style={{ '--season-color': season.color } as CSSProperties}
                key={season.id}
                onClick={() => onSelect(season.id)}
              >
                <span className="mission-index">0{index + 1}</span>
                <span><strong>{season.name} · {season.mission}</strong><small>{season.english}</small></span>
                {completed.includes(season.id) && <Check size={17} />}
              </button>
            ))}
            <button className={`world-mission-button world-mission-button--final ${completed.includes('final') ? 'is-complete' : ''}`} onClick={() => onSelect('final')}>
              <Sparkles size={20} />
              <span><strong>AI 四季发布会</strong><small>Final mission</small></span>
              {completed.includes('final') && <Check size={17} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
