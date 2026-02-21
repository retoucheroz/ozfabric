import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2 } from 'lucide-react';

export interface SAM3DMetadata {
    num_people: number;
    people: Array<{
        person_id: number;
        bbox: [number, number, number, number];
        focal_length: number;
        pred_cam_t: [number, number, number];
        keypoints_2d: number[][];
        keypoints_3d?: number[][];
    }>;
}

interface Props {
    glbUrl: string;
    metadata: SAM3DMetadata;
    width?: number;
    height?: number;
}

export interface MannequinRendererRef {
    exportDataUrl: () => string | null;
}

const MannequinRenderer = forwardRef<MannequinRendererRef, Props>(
    ({ glbUrl, metadata, width = 768, height = 1024 }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
        const [loading, setLoading] = useState(true);

        useImperativeHandle(ref, () => ({
            exportDataUrl: () => {
                if (rendererRef.current) {
                    // Render one more frame right before export to guarantee it's fresh
                    return rendererRef.current.domElement.toDataURL('image/png');
                }
                return null;
            }
        }));

        useEffect(() => {
            if (!containerRef.current) return;
            setLoading(true);

            const person = metadata?.people?.[0];
            if (!person) {
                setLoading(false);
                return;
            }

            // 1. Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xe0e0e0); // Light grey background

            // 2. Camera setup
            const focalLength = person.focal_length || 50;
            const sensorHeight = 36;
            const fov = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);
            const aspect = width / height;
            const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

            const camT = person.pred_cam_t || [0, 1, 5];
            // Note: user specifically asked to invert Y axis for SAM3D camera translation
            camera.position.set(camT[0], -camT[1], camT[2]);
            camera.lookAt(0, 0, 0);

            // 3. Renderer
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: true,
                alpha: false
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            rendererRef.current = renderer;

            // Clear container and append canvas
            while (containerRef.current.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild);
            }
            containerRef.current.appendChild(renderer.domElement);

            // 4. Lights
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
            keyLight.position.set(3, 4, 3);
            keyLight.castShadow = true;
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
            fillLight.position.set(-3, 2, 2);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
            rimLight.position.set(0, 3, -4);
            scene.add(rimLight);

            const bottomFill = new THREE.DirectionalLight(0xffffff, 0.15);
            bottomFill.position.set(0, -2, 2);
            scene.add(bottomFill);

            const ambient = new THREE.AmbientLight(0xffffff, 0.35);
            scene.add(ambient);

            // 5. Controls
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // 6. Loader
            const loader = new GLTFLoader();

            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x1c1c1c),
                roughness: 0.95,
                metalness: 0.0,
            });

            loader.load(
                glbUrl,
                (gltf: any) => {
                    gltf.scene.traverse((child: any) => {
                        if (child.isMesh) {
                            child.material = mat;
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Auto-center and scale
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // Center the mesh
                    gltf.scene.position.sub(center);

                    // Update controls target and camera if pred_cam_t failed
                    if (!person.pred_cam_t || person.pred_cam_t.every((v: number) => v === 0)) {
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const cameraDistance = maxDim * 1.8;
                        camera.position.set(0, 0, cameraDistance);
                    }

                    controls.target.set(0, 0, 0);
                    controls.update();

                    scene.add(gltf.scene);
                    setLoading(false);
                },
                undefined,
                (error: any) => {
                    console.error("Error loading GLB:", error);
                    setLoading(false);
                }
            );

            // Animation loop
            let animFrame: number;
            const animate = () => {
                animFrame = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            return () => {
                cancelAnimationFrame(animFrame);
                if (rendererRef.current && rendererRef.current.domElement) {
                    if (containerRef.current) containerRef.current.innerHTML = '';
                    rendererRef.current.dispose();
                }
            };
        }, [glbUrl, metadata, width, height]);

        return (
            <div className="relative overflow-hidden rounded-xl border border-muted bg-stone-50 dark:bg-stone-900 w-full flex flex-col items-center">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Rendering 3D Mesh...</p>
                    </div>
                )}
                <div
                    ref={containerRef}
                    style={{ width: '100%', maxWidth: width, aspectRatio: `${width}/${height}`, overflow: 'hidden' }}
                    className="flex items-center justify-center"
                />
            </div>
        );
    }
);

MannequinRenderer.displayName = 'MannequinRenderer';

export default MannequinRenderer;
