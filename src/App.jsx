import React, { useState, Suspense, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Float,
  Grid,
  useTexture,
} from "@react-three/drei";
import {
  EffectComposer, Bloom, Noise, Vignette
} from '@react-three/postprocessing';
import {
  Upload,
  Box,
  Layers,
  Settings,
  Download,
  Zap,
  Cpu,
  FileImage,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Optimized Mesh with Dynamic Quality
function TextureMesh({ textureUrl, mode, wireframe, segments, scale }) {
  const meshRef = useRef();
  
  // Use Drei's useTexture for robust async loading
  // We use a fallback transparent pixel if no URL is provided to prevent crashes
  const texture = useTexture(textureUrl || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t / 8) / 4;
    }
  });

  if (mode === "demo") {
    return (
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} scale={1.5}>
          <torusKnotGeometry args={[1, 0.3, segments, Math.floor(segments / 4)]} />
          <meshStandardMaterial
            color="#00F0FF"
            wireframe={wireframe}
            emissive="#00F0FF"
            emissiveIntensity={wireframe ? 1.5 : 0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
    );
  }

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh ref={meshRef} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[4, 4, segments, segments]} />
        <meshStandardMaterial
          map={texture}
          displacementMap={texture}
          displacementScale={scale * 1.5} // Exaggerated displacement for better visibility
          wireframe={wireframe}
          color="#ffffff"
          metalness={0.4}
          roughness={0.3}
          transparent={true}
          side={THREE.DoubleSide}
          alphaTest={0.05}
        />
      </mesh>
    </Float>
  );
}

function Scene({ textureUrl, isDemoMode, wireframe, quality, intensity }) {
  const segments = Math.floor(quality * 2.24) + 64; 

  return (
    <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ position: [0, 0, 8], fov: 45 }}>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={["#050505", 2, 20]} />
      
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, 5, -10]} color="#FF003C" intensity={3} />
      <pointLight position={[10, 5, 10]} color="#00F0FF" intensity={3} />

      <Suspense fallback={null}>
        <TextureMesh
          textureUrl={textureUrl}
          mode={isDemoMode ? "demo" : "displacement"}
          wireframe={wireframe}
          segments={segments}
          scale={intensity}
        />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.4} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>

      <Grid
        renderOrder={-1}
        position={[0, -2, 0]}
        infiniteGrid
        fadeDistance={40}
        sectionColor="#1a1a1a"
        cellColor="#080808"
      />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
    </Canvas>
  );
}

function DragOverlay({ active }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-40 bg-cyber-cyan/20 backdrop-blur-sm border-4 border-cyber-cyan border-dashed flex items-center justify-center animate-pulse pointer-events-none">
      <div className="text-center">
        <Upload className="w-24 h-24 text-cyber-cyan mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-bold text-white tracking-widest uppercase">Release to Upload</h2>
      </div>
    </div>
  );
}

function Sidebar({ wireframe, setWireframe, isProcessing, settings, setSettings, onExport, onFileSelect }) {
  return (
    <aside className="fixed left-4 top-4 bottom-4 w-80 glass-panel rounded-2xl p-6 z-10 flex flex-col justify-between border-l-4 border-l-cyber-cyan/50">
      <div className="overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-tr from-cyber-cyan to-blue-600 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Box className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Holo<span className="text-cyber-cyan">Gen</span>
          </h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <Upload className="w-3 h-3" /> Input Source
            </label>
            <div className="grid grid-cols-1 gap-2">
               <button 
                onClick={() => document.getElementById('fileInput').click()}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:bg-white/10 transition-colors group"
                disabled={isProcessing}
               >
                 <FileImage className="w-6 h-6 text-cyber-cyan group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-mono uppercase tracking-widest">Select Image File</span>
               </button>
               <input 
                id="fileInput" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <Settings className="w-3 h-3" /> Digital Sculpture
            </label>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4 shadow-inner">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>RES / POLY COUNT</span>
                  <span className="text-cyber-cyan">{Math.floor(settings.quality)}%</span>
                </div>
                <input
                  type="range" min="1" max="100" value={settings.quality}
                  onChange={(e) => setSettings({...settings, quality: e.target.value})}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>3D DEPTH SCALE</span>
                  <span className="text-cyber-magenta">{settings.intensity}x</span>
                </div>
                <input
                  type="range" min="0" max="3" step="0.1" value={settings.intensity}
                  onChange={(e) => setSettings({...settings, intensity: e.target.value})}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-magenta shadow-[0_0_5px_rgba(255,0,60,0.5)]"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <Layers className="w-3 h-3" /> View Mode
            </label>
            <button
              onClick={() => setWireframe(!wireframe)}
              className={cn(
                "w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border font-bold text-xs tracking-tighter",
                wireframe
                  ? "bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10",
              )}
            >
              <Cpu className="w-4 h-4 animate-pulse" />
              {wireframe ? "WIREFRAME ENABLED" : "SOLID RENDER"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button 
          onClick={onExport}
          className="w-full py-4 bg-gradient-to-r from-cyber-magenta to-purple-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-cyber-magenta/20"
        >
          <Download className="w-5 h-5" /> EXPORT_CAPTURE.PNG
        </button>
        <p className="text-[8px] font-mono text-center text-gray-600 tracking-widest uppercase">System Core // v1.0.4-LTS</p>
      </div>
    </aside>
  );
}

function ProcessingOverlay({ logs }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center font-mono">
      <div className="relative w-32 h-32 mb-12">
        <div className="absolute inset-0 border-4 border-cyber-cyan/10 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-cyber-cyan rounded-full animate-spin"></div>
        <div className="absolute inset-4 border border-cyber-magenta/20 rounded-full animate-pulse"></div>
        <Zap className="absolute inset-0 m-auto text-cyber-cyan animate-bounce w-8 h-8" />
      </div>
      
      <div className="w-[450px] bg-black/40 border border-white/5 rounded-2xl p-6 h-60 overflow-hidden relative shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent animate-scanline"></div>
        <div className="flex flex-col gap-3">
            {logs && logs.map((log, i) => (
                <p key={i} className="text-[10px] text-cyber-cyan/90 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                    <span className="bg-cyber-cyan/10 px-2 py-0.5 rounded text-[8px] text-cyber-cyan font-bold">{i+1}0%</span> 
                    {`> ${log}`}
                </p>
            ))}
            <p className="text-xs text-cyber-magenta animate-pulse mt-2 ml-1">_</p>
        </div>
      </div>
      
      <div className="text-center mt-12">
        <h2 className="text-4xl font-black text-white tracking-[0.2em] mb-2 uppercase italic">Synthesizing</h2>
        <p className="text-xs text-cyber-cyan/40 tracking-[0.5em] font-mono uppercase">Neural Grid Topology Expansion</p>
      </div>
    </div>
  );
}

export default function App() {
  const [textureUrl, setTextureUrl] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  
  const [settings, setSettings] = useState({
    quality: 80,
    intensity: 1.2
  });

  const dragCounter = useRef(0);

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.setAttribute('download', 'HoloGen_Capture.png');
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    }
  };

  const steps = [
    "Initializing Quantum Neural Fabric...",
    "Scanning Grayscale Luminance Map...",
    "Triangulating Dense Vertex Mesh...",
    "Reducing Surface Entropy...",
    "Injecting PBR Micro-Shaders...",
    "Stabilizing Displacement Buffer...",
    "Neural Mesh Online."
  ];

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter") {
      dragCounter.current += 1;
      setDragActive(true);
    } else if (e.type === "dragleave") {
      dragCounter.current -= 1;
      if (dragCounter.current === 0) setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false); dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageDrop(e.dataTransfer.files[0]);
    }
  };

  const handleImageDrop = (file) => {
    if (!file.type.startsWith('image/')) return;
    
    setIsProcessing(true);
    setProcessingLogs([]);
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target.result;
        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(interval);
                setTextureUrl(result);
                setIsDemoMode(false); 
                setIsProcessing(false);
            } else {
                setProcessingLogs(prev => [...prev, steps[stepIndex]]);
                stepIndex++;
            }
        }, 350);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className="w-full h-screen relative bg-cyber-dark text-white selection:bg-cyber-cyan/30 overflow-hidden font-sans"
      onDragEnter={handleDrag}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <Sidebar 
        wireframe={wireframe} 
        setWireframe={setWireframe} 
        isProcessing={isProcessing}
        settings={settings}
        setSettings={setSettings}
        onExport={handleExport}
        onFileSelect={handleImageDrop}
      />
      
      <main className="absolute inset-0 pl-80">
        <div className="w-full h-full relative">
          <Scene 
            textureUrl={textureUrl} 
            isDemoMode={isDemoMode} 
            wireframe={wireframe} 
            quality={settings.quality}
            intensity={settings.intensity}
          />
          
          <div className="absolute bottom-12 right-12 text-right pointer-events-none px-4">
             <div className="h-[2px] w-32 bg-gradient-to-l from-cyber-cyan to-transparent mb-4 ml-auto"></div>
             <h2 className="text-8xl font-black text-white/[0.02] select-none tracking-tighter leading-none">CORE_MESH</h2>
             <div className="flex items-center justify-end gap-3 text-cyber-cyan text-[10px] font-mono mt-2 tracking-widest opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse"></span>
                SYSTEM STATUS // NOMINAL
                <span className="mx-2 text-white/10">|</span>
                UPLINK // ACTIVE_STREAM
             </div>
          </div>
        </div>
      </main>

      <DragOverlay active={dragActive} />
      {isProcessing && <ProcessingOverlay logs={processingLogs} />}
    </div>
  );
}
