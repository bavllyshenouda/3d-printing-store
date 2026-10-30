"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Loader2, RotateCcw, Box, AlertCircle, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface STLViewerProps {
  file?: File | Blob | null;
  url?: string | null;
  height?: number | string;
  color?: string; // Hex color e.g. "#FF6B35"
  className?: string;
  interactive?: boolean;
}

export function STLViewer({
  file,
  url,
  height = 360,
  color = "#FF6B35",
  className,
  interactive = true,
}: STLViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triangleCount, setTriangleCount] = useState<number | null>(null);

  // Rotation angles (radians) & zoom scale
  const rotRef = useRef<{ x: number; y: number; zoom: number; isDragging: boolean; lastX: number; lastY: number }>({
    x: 0.5,
    y: 0.6,
    zoom: 1.0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const parsedDataRef = useRef<{
    vertices: Float32Array;
    normals: Float32Array;
    count: number;
  } | null>(null);

  const animFrameRef = useRef<number | null>(null);

  // 1. Parse STL ArrayBuffer
  const parseSTL = useCallback((buffer: ArrayBuffer) => {
    const dataView = new DataView(buffer);

    // Check if Binary STL:
    // Header is 80 bytes, then 4 bytes triangle count.
    // File size for binary must equal 84 + (count * 50).
    const isBinaryCheck = () => {
      if (buffer.byteLength < 84) return false;
      const count = dataView.getUint32(80, true);
      const expectedSize = 84 + count * 50;
      return expectedSize === buffer.byteLength;
    };

    if (isBinaryCheck()) {
      const triangleTotal = dataView.getUint32(80, true);
      const vertexCount = triangleTotal * 3;
      const vertices = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);

      let offset = 84;
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      for (let i = 0; i < triangleTotal; i++) {
        // Normal vector
        let nx = dataView.getFloat32(offset, true);
        let ny = dataView.getFloat32(offset + 4, true);
        let nz = dataView.getFloat32(offset + 8, true);
        offset += 12;

        // 3 Vertices
        const vIdx = i * 9;
        for (let v = 0; v < 3; v++) {
          const vx = dataView.getFloat32(offset, true);
          const vy = dataView.getFloat32(offset + 4, true);
          const vz = dataView.getFloat32(offset + 8, true);
          offset += 12;

          vertices[vIdx + v * 3] = vx;
          vertices[vIdx + v * 3 + 1] = vy;
          vertices[vIdx + v * 3 + 2] = vz;

          if (vx < minX) minX = vx;
          if (vx > maxX) maxX = vx;
          if (vy < minY) minY = vy;
          if (vy > maxY) maxY = vy;
          if (vz < minZ) minZ = vz;
          if (vz > maxZ) maxZ = vz;
        }

        // If normal is zero, compute from vertices
        if (nx === 0 && ny === 0 && nz === 0) {
          const ax = vertices[vIdx + 3] - vertices[vIdx];
          const ay = vertices[vIdx + 4] - vertices[vIdx + 1];
          const az = vertices[vIdx + 5] - vertices[vIdx + 2];
          const bx = vertices[vIdx + 6] - vertices[vIdx];
          const by = vertices[vIdx + 7] - vertices[vIdx + 1];
          const bz = vertices[vIdx + 8] - vertices[vIdx + 2];

          nx = ay * bz - az * by;
          ny = az * bx - ax * bz;
          nz = ax * by - ay * bx;

          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len;
          ny /= len;
          nz /= len;
        }

        for (let v = 0; v < 3; v++) {
          normals[vIdx + v * 3] = nx;
          normals[vIdx + v * 3 + 1] = ny;
          normals[vIdx + v * 3 + 2] = nz;
        }

        offset += 2; // Skip 2-byte attribute byte count
      }

      // Center and normalize geometry into [-1, 1]
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
      const scale = 1.8 / maxDim;

      for (let i = 0; i < vertexCount; i++) {
        vertices[i * 3] = (vertices[i * 3] - centerX) * scale;
        vertices[i * 3 + 1] = (vertices[i * 3 + 1] - centerY) * scale;
        vertices[i * 3 + 2] = (vertices[i * 3 + 2] - centerZ) * scale;
      }

      return { vertices, normals, count: vertexCount, triangles: triangleTotal };
    }

    // Fallback: ASCII STL parser
    const text = new TextDecoder().decode(buffer);
    const vertexMatches = text.match(/vertex\s+([^\r\n]+)/g);
    if (!vertexMatches) {
      throw new Error("Invalid or unreadable STL format.");
    }

    const vertexCount = vertexMatches.length;
    const triangleTotal = Math.floor(vertexCount / 3);
    const vertices = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < vertexCount; i++) {
      const parts = vertexMatches[i].trim().split(/\s+/).slice(1).map(Number);
      const vx = parts[0] || 0;
      const vy = parts[1] || 0;
      const vz = parts[2] || 0;

      vertices[i * 3] = vx;
      vertices[i * 3 + 1] = vy;
      vertices[i * 3 + 2] = vz;

      if (vx < minX) minX = vx;
      if (vx > maxX) maxX = vx;
      if (vy < minY) minY = vy;
      if (vy > maxY) maxY = vy;
      if (vz < minZ) minZ = vz;
      if (vz > maxZ) maxZ = vz;
    }

    // Compute normals per face
    for (let t = 0; t < triangleTotal; t++) {
      const idx = t * 9;
      const ax = vertices[idx + 3] - vertices[idx];
      const ay = vertices[idx + 4] - vertices[idx + 1];
      const az = vertices[idx + 5] - vertices[idx + 2];
      const bx = vertices[idx + 6] - vertices[idx];
      const by = vertices[idx + 7] - vertices[idx + 1];
      const bz = vertices[idx + 8] - vertices[idx + 2];

      let nx = ay * bz - az * by;
      let ny = az * bx - ax * bz;
      let nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      for (let v = 0; v < 3; v++) {
        normals[idx + v * 3] = nx;
        normals[idx + v * 3 + 1] = ny;
        normals[idx + v * 3 + 2] = nz;
      }
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const scale = 1.8 / maxDim;

    for (let i = 0; i < vertexCount; i++) {
      vertices[i * 3] = (vertices[i * 3] - centerX) * scale;
      vertices[i * 3 + 1] = (vertices[i * 3 + 1] - centerY) * scale;
      vertices[i * 3 + 2] = (vertices[i * 3 + 2] - centerZ) * scale;
    }

    return { vertices, normals, count: vertexCount, triangles: triangleTotal };
  }, []);

  // 2. Load ArrayBuffer from File or URL
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        let buffer: ArrayBuffer;
        if (file) {
          buffer = await file.arrayBuffer();
        } else if (url) {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to load 3D model from storage");
          buffer = await res.arrayBuffer();
        } else {
          setIsLoading(false);
          return;
        }

        if (isCancelled) return;

        const parsed = parseSTL(buffer);
        parsedDataRef.current = {
          vertices: parsed.vertices,
          normals: parsed.normals,
          count: parsed.count,
        };
        setTriangleCount(parsed.triangles);
        setIsLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Error parsing STL file");
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [file, url, parseSTL]);

  // 3. WebGL Rendering Engine
  useEffect(() => {
    if (isLoading || error || !parsedDataRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: true }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      setError("WebGL is not supported on this device/browser.");
      return;
    }

    // Shaders
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uMatrix;
      uniform mat3 uNormalMatrix;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = uNormalMatrix * aNormal;
        vec4 pos = uMatrix * vec4(aPosition, 1.0);
        vPosition = pos.xyz;
        gl_Position = pos;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uColor;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 light1 = normalize(vec3(0.5, 1.0, 1.0));
        vec3 light2 = normalize(vec3(-0.5, -0.5, 0.8));
        
        float diff1 = max(dot(normal, light1), 0.0);
        float diff2 = max(dot(normal, light2), 0.0) * 0.4;
        float ambient = 0.25;

        // Specular highlight
        vec3 viewDir = normalize(-vPosition);
        vec3 reflectDir = reflect(-light1, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.4;

        vec3 color = uColor * (ambient + diff1 + diff2) + vec3(spec);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Parse base color from prop (default orange #FF6B35)
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255 || 1.0;
    const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.42;
    const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.21;

    const uColorLoc = gl.getUniformLocation(program, "uColor");
    const uMatrixLoc = gl.getUniformLocation(program, "uMatrix");
    const uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    gl.uniform3f(uColorLoc, r, g, b);

    // Buffers
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, parsedDataRef.current.vertices, gl.STATIC_DRAW);
    const aPosLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, parsedDataRef.current.normals, gl.STATIC_DRAW);
    const aNormLoc = gl.getAttribLocation(program, "aNormal");
    gl.enableVertexAttribArray(aNormLoc);
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    // Render loop
    const render = () => {
      if (!canvas) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Simple auto-rotation when not dragging
      if (!rotRef.current.isDragging) {
        rotRef.current.y += 0.006;
      }

      const aspect = width / (height || 1);
      const zoom = rotRef.current.zoom;
      const rotX = rotRef.current.x;
      const rotY = rotRef.current.y;

      // Compute Matrix
      // Perspective * View * Rotation
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // Model rotation
      const m11 = cosY, m12 = sinX * sinY, m13 = -cosX * sinY;
      const m21 = 0, m22 = cosX, m23 = sinX;
      const m31 = sinY, m32 = -sinX * cosY, m33 = cosX * cosY;

      // Simple Ortho/Perspective hybrid view
      const fov = 2.4 / zoom;
      const p11 = 1 / (aspect * fov);
      const p22 = 1 / fov;
      const p33 = -1 / 10;
      const p43 = -0.5;

      const mvp = new Float32Array([
        p11 * m11, p11 * m12, p11 * m13, 0,
        p22 * m21, p22 * m22, p22 * m23, 0,
        p33 * m31, p33 * m32, p33 * m33 + p43, -1,
        0, 0, -2.5, 0,
      ]);

      const normalMat = new Float32Array([
        m11, m12, m13,
        m21, m22, m23,
        m31, m32, m33,
      ]);

      gl.uniformMatrix4fv(uMatrixLoc, false, mvp);
      gl.uniformMatrix3fv(uNormalMatrixLoc, false, normalMat);

      gl.drawArrays(gl.TRIANGLES, 0, parsedDataRef.current!.count);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLoading, error, color]);

  // Pointer controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    rotRef.current.isDragging = true;
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!rotRef.current.isDragging || !interactive) return;
    const dx = e.clientX - rotRef.current.lastX;
    const dy = e.clientY - rotRef.current.lastY;
    rotRef.current.y += dx * 0.01;
    rotRef.current.x += dy * 0.01;
    rotRef.current.lastX = e.clientX;
    rotRef.current.lastY = e.clientY;
  };

  const handleMouseUp = () => {
    rotRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    rotRef.current.zoom = Math.min(3.0, Math.max(0.5, rotRef.current.zoom - e.deltaY * 0.001));
  };

  const handleReset = () => {
    rotRef.current.x = 0.5;
    rotRef.current.y = 0.6;
    rotRef.current.zoom = 1.0;
  };

  if (error) {
    return (
      <div
        style={{ height }}
        className={cn(
          "rounded-2xl border border-border/80 bg-muted/20 flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground",
          className
        )}
      >
        <Box className="size-8 text-[#FF6B35] opacity-60" />
        <p className="text-xs font-semibold text-foreground">3D STL Preview</p>
        <p className="text-[11px] max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className={cn(
        "relative rounded-2xl overflow-hidden border border-border/80 bg-[#111318]/90 select-none group",
        className
      )}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#111318]/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 text-white">
          <Loader2 className="size-6 text-[#FF6B35] animate-spin" />
          <span className="text-xs font-mono">Parsing STL Geometry...</span>
        </div>
      )}

      {/* Top Bar info */}
      {!isLoading && triangleCount !== null && (
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/60 text-white/80 border border-white/10">
            {triangleCount.toLocaleString()} Triangles
          </span>
          <span className="text-[10px] font-mono text-[#FF6B35] px-2 py-0.5 rounded-lg bg-[#FF6B35]/15 border border-[#FF6B35]/30">
            WebGL 3D
          </span>
        </div>
      )}

      {/* Reset Camera Button */}
      {!isLoading && interactive && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="absolute bottom-3 right-3 h-7 px-2 text-[11px] bg-black/60 hover:bg-black/80 text-white border-white/20"
          iconLeft={<RotateCcw className="size-3" />}
        >
          Reset View
        </Button>
      )}

      {/* Interaction Hint */}
      {!isLoading && interactive && (
        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-white/50 pointer-events-none hidden sm:block">
          Drag to rotate · Scroll to zoom
        </div>
      )}
    </div>
  );
}

