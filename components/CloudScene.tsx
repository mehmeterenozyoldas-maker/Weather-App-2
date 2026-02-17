import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Clouds, Cloud, Sky, OrbitControls, Environment, Float, CameraShake, Text3D, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { WeatherConfig, TextTransform } from '../types';

interface CloudSceneProps {
  text: string;
  weather: WeatherConfig;
  textTransform: TextTransform;
}

const PhysicalGlassText: React.FC<{ text: string; color: string; transform: TextTransform }> = ({ text, color, transform }) => {
  // Advanced material for a "Frozen Air" or "Glass" look
  const materialConfig = useMemo(() => ({
    transmission: 1.0,
    thickness: 3.0,
    roughness: 0.15,
    ior: 1.2, // Index of refraction close to ice/aerogel
    chromaticAberration: 0.06,
    color: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.3), // Whiten slightly for glassiness
    attenuationColor: new THREE.Color(color),
    attenuationDistance: 0.8,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  }), [color]);

  // Using a standard bold font for strong geometry
  const fontUrl = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

  return (
    <group 
        rotation={[transform.rotationX, transform.rotationY, transform.rotationZ]} 
        scale={transform.scale}
    >
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
        <Center>
            <Text3D
                font={fontUrl}
                size={3}
                height={transform.depth} // This is the depth/extrusion
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.1}
                bevelSize={0.05}
                bevelOffset={0}
                bevelSegments={5}
                letterSpacing={0.05}
            >
                {text}
                <meshPhysicalMaterial 
                    {...materialConfig} 
                    side={THREE.DoubleSide}
                />
            </Text3D>
        </Center>
      </Float>
    </group>
  );
};

const AtmosphericSystem: React.FC<{ weather: WeatherConfig }> = ({ weather }) => {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={new THREE.Vector3(...weather.sunPosition)}
        inclination={0}
        azimuth={0.25}
        turbidity={weather.turbidity}
        rayleigh={weather.rayleigh}
        mieCoefficient={weather.mieCoefficient}
        mieDirectionalG={weather.mieDirectionalG}
      />
      <fog attach="fog" args={[weather.fogColor, 10, 80]} />
      
      <ambientLight intensity={weather.ambientIntensity} color={weather.skyColor} />
      <directionalLight
        position={weather.sunPosition}
        intensity={2.5}
        castShadow
        shadow-bias={-0.0005}
        color="#fff"
      />
      
      {/* Foreground Clouds - High detail */}
      <Clouds material={THREE.MeshStandardMaterial} limit={400}>
        <Cloud
          seed={weather.cloudSeed}
          bounds={[15, 4, 4]}
          volume={6}
          color={weather.cloudColor}
          position={[0, -3, -5]} 
          opacity={0.7}
          scale={1.5}
          speed={0.1}
          segments={20}
        />
         <Cloud
          seed={weather.cloudSeed + 10}
          bounds={[20, 4, 4]}
          volume={8}
          color={weather.cloudColor}
          position={[0, 4, -8]} 
          opacity={0.5}
          scale={1.8}
          speed={0.15}
        />
      </Clouds>

      {/* Massive Background Clouds */}
      <Clouds material={THREE.MeshStandardMaterial} limit={200} range={200}>
        <Cloud
            seed={weather.cloudSeed + 1}
            bounds={[60, 20, 60]}
            position={[0, -15, -40]}
            volume={40}
            color={weather.cloudColor}
            opacity={0.85}
            scale={6}
            speed={0.05}
        />
         <Cloud
            seed={weather.cloudSeed + 2}
            bounds={[80, 20, 80]}
            position={[50, 5, -50]}
            volume={30}
            color={weather.cloudColor}
            opacity={0.6}
            scale={5}
            speed={0.08}
        />
      </Clouds>
    </>
  );
};

const CinematicCamera: React.FC = () => {
    return (
        <CameraShake 
            maxYaw={0.01} 
            maxPitch={0.01} 
            maxRoll={0.01} 
            yawFrequency={0.2} 
            pitchFrequency={0.2} 
            rollFrequency={0.2} 
            intensity={1} 
        />
    )
}

export const CloudScene: React.FC<CloudSceneProps> = ({ text, weather, textTransform }) => {
  return (
    <Canvas 
        shadows 
        camera={{ position: [0, 0, 16], fov: 45 }}
        gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: weather.exposure }}
        dpr={[1, 1.5]} // Optimize for performance
    >
      <AtmosphericSystem weather={weather} />
      
      <PhysicalGlassText 
        text={text} 
        color={weather.cloudColor} 
        transform={textTransform}
      />
      
      <Environment preset="city" blur={1} background={false} />
      
      <CinematicCamera />
      
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minPolarAngle={Math.PI / 2.5} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={8}
        maxDistance={40}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={weather.bloomThreshold} 
            mipmapBlur 
            intensity={weather.bloomStrength} 
            radius={0.6}
        />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
};
