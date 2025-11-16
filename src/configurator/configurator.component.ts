import { Component, ChangeDetectionStrategy, viewChild, ElementRef, signal, AfterViewInit, OnDestroy, effect } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GoogleGenAI, Type } from '@google/genai';

interface PartState {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  vertexCount: number;
  faceCount: number;
}

@Component({
  selector: 'app-configurator',
  templateUrl: './configurator.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorComponent implements AfterViewInit, OnDestroy {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  canvasContainer = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');

  // UI State
  isLoading = signal(false);
  isGeneratingTexture = signal(false);
  errorMessage = signal<string | null>(null);
  modelLoaded = signal(false);
  meshParts = signal<PartState[]>([]);
  activePanel = signal('model');
  
  // 3D Model & Scene State
  currentModel = signal<THREE.Object3D | null>(null);
  transform = signal({ scale: { x: 1, y: 1, z: 1 } });
  material = signal({ color: '#cccccc', roughness: 0.5, metalness: 0.1 });
  sceneLighting = signal({
    ambientColor: '#ffffff',
    ambientIntensity: 1.0,
    directionalColor: '#ffffff',
    directionalIntensity: 2.5,
  });
  aiTexturePrompt = signal('');
  generatedTextures = signal<{ albedo: string | null; normal: string | null }>({ albedo: null, normal: null });
  textureTiling = signal({ u: 1, v: 1 });
  openAiApiKey = signal<string>('');
  showApiKeyInput = signal(false);
  apiKeySaved = signal(false);
  isTestingApiKey = signal(false);
  apiKeyStatus = signal<'untested' | 'valid' | 'invalid'>('untested');
  showApiKeyGuide = signal(false);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private frameId: number | null = null;
  private resizeObserver!: ResizeObserver;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.setupEffects();
    // Load saved OpenAI API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      this.openAiApiKey.set(savedApiKey);
      this.apiKeySaved.set(true);
    }
    
    // Keep Gemini as fallback (optional)
    try {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    } catch (e) {
      // Silently fail - user will use OpenAI instead
      console.log("Gemini API not configured. Using OpenAI API instead.");
    }
  }

  private setupEffects(): void {
    // Effect for Transform
    effect(() => {
      const model = this.currentModel();
      const { scale } = this.transform();
      if (model) {
        model.scale.set(scale.x, scale.y, scale.z);
      }
    });

    // Effect for Material
    effect(() => {
      const model = this.currentModel();
      const { color, roughness, metalness } = this.material();
      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.set(color);
            child.material.roughness = roughness;
            child.material.metalness = metalness;
          }
        });
      }
    });

    // Effect for Lighting
    effect(() => {
      const { ambientColor, ambientIntensity, directionalColor, directionalIntensity } = this.sceneLighting();
      if (this.ambientLight) {
        this.ambientLight.color.set(ambientColor);
        this.ambientLight.intensity = ambientIntensity;
      }
      if (this.directionalLight) {
        this.directionalLight.color.set(directionalColor);
        this.directionalLight.intensity = directionalIntensity;
      }
    });

    // Effect for Texture Tiling
    effect(() => {
      const model = this.currentModel();
      const { u, v } = this.textureTiling();
      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            if (child.material.map) {
              child.material.map.repeat.set(u, v);
            }
            if (child.material.normalMap) {
              child.material.normalMap.repeat.set(u, v);
            }
          }
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.animate();
    
    this.resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
            const { width, height } = entry.contentRect;
            // Use setTimeout to avoid "ResizeObserver loop completed with undelivered notifications" error.
            // This decouples the resize logic from the observer's callback execution.
            setTimeout(() => this.onResize(width, height), 0);
        }
    });
    this.resizeObserver.observe(this.canvasContainer().nativeElement);
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    this.renderer?.dispose();
    this.resizeObserver?.disconnect();
  }

  togglePanel(panel: string): void {
    this.activePanel.update(current => (current === panel ? '' : panel));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isLoading.set(true);
    this.modelLoaded.set(false);
    this.meshParts.set([]);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (typeof e.target?.result === 'string') {
        this.loadObjModel(e.target.result);
      } else {
        this.errorMessage.set('Failed to read file content.');
        this.isLoading.set(false);
      }
    };
    reader.onerror = () => {
      this.errorMessage.set('Error reading file.');
      this.isLoading.set(false);
    }
    
    reader.readAsText(file);
    input.value = '';
  }

  private initThree(): void {
    const canvasEl = this.canvas().nativeElement;
    const { width, height } = this.canvasContainer().nativeElement.getBoundingClientRect();
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111827);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 15);

    this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(width, height);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.ambientLight = new THREE.AmbientLight(this.sceneLighting().ambientColor, this.sceneLighting().ambientIntensity);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(this.sceneLighting().directionalColor, this.sceneLighting().directionalIntensity);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);
    
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x222837, roughness: 0.8 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.name = "ground_plane";
    this.scene.add(plane);
  }

  private onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    const currentSize = this.renderer.getSize(new THREE.Vector2());
    
    // contentRect can have fractional values, so we round to the nearest integer pixel.
    const newWidth = Math.round(width);
    const newHeight = Math.round(height);

    // Only resize if the dimensions have actually changed to prevent an infinite loop.
    if (currentSize.x !== newWidth || currentSize.y !== newHeight) {
      if (newWidth > 0 && newHeight > 0) {
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(newWidth, newHeight);
      }
    }
  }

  private loadObjModel(objContent: string): void {
    try {
      this.currentModel.update(current => {
        if (current) this.scene.remove(current);
        return null;
      });
      this.transform.set({ scale: { x: 1, y: 1, z: 1 } });
      this.resetMaterial();

      const loadedObject = new OBJLoader().parse(objContent);

      const pivot = new THREE.Group();
      this.scene.add(pivot);
      
      const box = new THREE.Box3().setFromObject(loadedObject);
      
      if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          loadedObject.position.sub(center); 
          
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 0 ? 10 / maxDim : 1;
          loadedObject.scale.setScalar(scale);
      }
      
      pivot.add(loadedObject);
      
      const pivotBox = new THREE.Box3().setFromObject(pivot);
      if (!pivotBox.isEmpty()) {
          const groundOffset = pivotBox.min.y;
          pivot.position.y = -groundOffset;
      }
      
      this.currentModel.set(pivot);

      const parts: PartState[] = [];
      loadedObject.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(this.material().color),
              roughness: this.material().roughness,
              metalness: this.material().metalness,
          });
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }

          parts.push({
            id: child.uuid,
            name: child.name || `Part ${parts.length + 1}`,
            mesh: child,
            vertexCount: child.geometry.attributes.position.count,
            faceCount: Math.round((child.geometry.index ? child.geometry.index.count : child.geometry.attributes.position.count) / 3),
          });
        }
      });
      
      this.meshParts.set(parts);
      this.modelLoaded.set(true);

    } catch (error) {
      console.error(error);
      this.errorMessage.set('Could not parse the .obj file. Ensure it is a valid format.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private animate(): void {
    this.frameId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // --- Control Handlers ---
  onScaleChange(axis: 'x' | 'y' | 'z', event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.transform.update(current => ({...current, scale: { ...current.scale, [axis]: value }}));
  }

  onMaterialPropChange(prop: 'color' | 'roughness' | 'metalness', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.material.update(current => ({...current, [prop]: prop === 'color' ? value : parseFloat(value) }));
  }

  onLightPropChange(prop: 'ambientColor' | 'ambientIntensity' | 'directionalColor' | 'directionalIntensity', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.sceneLighting.update(current => ({...current, [prop]: prop.includes('Color') ? value : parseFloat(value) }));
  }

  onTilingChange(axis: 'u' | 'v', event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.textureTiling.update(current => ({...current, [axis]: value }));
  }

  // --- API Key Management ---
  async testApiKey(): Promise<void> {
    const apiKey = this.openAiApiKey().trim();
    if (!apiKey) {
      this.errorMessage.set('Please enter an API key to test.');
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      this.errorMessage.set('Invalid API key format. Keys should start with "sk-".');
      this.apiKeyStatus.set('invalid');
      return;
    }

    this.isTestingApiKey.set(true);
    this.errorMessage.set(null);
    this.apiKeyStatus.set('untested');

    try {
      // Test the API key with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        this.apiKeyStatus.set('valid');
        this.errorMessage.set(null);
        // Auto-save if valid
        localStorage.setItem('openai_api_key', apiKey);
        this.apiKeySaved.set(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || 'Invalid API key or insufficient permissions.';
        this.errorMessage.set(`API key test failed: ${errorMsg}`);
        this.apiKeyStatus.set('invalid');
      }
    } catch (error) {
      this.errorMessage.set('Failed to test API key. Please check your internet connection.');
      this.apiKeyStatus.set('invalid');
      console.error('API key test error:', error);
    } finally {
      this.isTestingApiKey.set(false);
    }
  }

  saveApiKey(): void {
    const apiKey = this.openAiApiKey().trim();
    if (!apiKey) {
      this.errorMessage.set('Please enter a valid OpenAI API key.');
      return;
    }
    
    // Basic validation - OpenAI keys start with sk-
    if (!apiKey.startsWith('sk-')) {
      this.errorMessage.set('Invalid OpenAI API key format. Keys should start with "sk-".');
      return;
    }
    
    localStorage.setItem('openai_api_key', apiKey);
    this.apiKeySaved.set(true);
    this.showApiKeyInput.set(false);
    this.errorMessage.set(null);
    // Reset status when saving manually (user can test later)
    this.apiKeyStatus.set('untested');
  }

  removeApiKey(): void {
    localStorage.removeItem('openai_api_key');
    this.openAiApiKey.set('');
    this.apiKeySaved.set(false);
    this.apiKeyStatus.set('untested');
  }

  toggleApiKeyInput(): void {
    this.showApiKeyInput.update(v => !v);
    this.errorMessage.set(null);
  }

  toggleApiKeyGuide(): void {
    this.showApiKeyGuide.update(v => !v);
  }

  // --- AI Texture Generation with OpenAI ---
  async generateAiTexture(): Promise<void> {
    if (this.isGeneratingTexture() || !this.aiTexturePrompt()) return;
    
    const apiKey = this.openAiApiKey();
    if (!apiKey) {
      this.errorMessage.set('Please enter your OpenAI API key to generate textures.');
      this.showApiKeyInput.set(true);
      return;
    }

    this.isGeneratingTexture.set(true);
    this.errorMessage.set(null);

    try {
      const texturePrompt = this.aiTexturePrompt();
      
      // Use OpenAI API for image generation
      const albedoPromise = this.generateOpenAIImage(
        apiKey,
        `A high-resolution, photorealistic, seamless, tileable PBR albedo (base color) texture map of ${texturePrompt}. The texture should be detailed and realistic.`
      );

      const normalPromise = this.generateOpenAIImage(
        apiKey,
        `A seamless, tileable, tangent-space normal map for a PBR material of: ${texturePrompt}. OpenGL format. The image should be predominantly purple-blue, representing surface detail and depth.`
      );

      // Get material properties using OpenAI's chat completion
      const materialPropertiesPromise = this.getMaterialProperties(apiKey, texturePrompt);

      const [albedoUrl, normalUrl, materialProps] = await Promise.all([
        albedoPromise,
        normalPromise,
        materialPropertiesPromise
      ]);

      // --- Validate AI responses ---
      if (!albedoUrl) {
        throw new Error("Failed to generate the Base Color texture. Please check your API key and try again.");
      }
      if (!normalUrl) {
        throw new Error("Failed to generate the Normal Map texture. Please check your API key and try again.");
      }

      // Convert image URLs to base64 data URLs
      const albedoDataUrl = await this.imageUrlToDataUrl(albedoUrl);
      const normalDataUrl = await this.imageUrlToDataUrl(normalUrl);
      
      this.generatedTextures.set({ albedo: albedoDataUrl, normal: normalDataUrl });

      const textureLoader = new THREE.TextureLoader();
      const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
      
      const albedoTexture = await textureLoader.loadAsync(albedoDataUrl);
      albedoTexture.wrapS = THREE.RepeatWrapping;
      albedoTexture.wrapT = THREE.RepeatWrapping;
      albedoTexture.colorSpace = THREE.SRGBColorSpace;
      albedoTexture.minFilter = THREE.LinearMipmapLinearFilter;
      albedoTexture.magFilter = THREE.LinearFilter;
      albedoTexture.anisotropy = maxAnisotropy;
      albedoTexture.repeat.set(this.textureTiling().u, this.textureTiling().v);
      albedoTexture.needsUpdate = true;

      const normalTexture = await textureLoader.loadAsync(normalDataUrl);
      normalTexture.wrapS = THREE.RepeatWrapping;
      normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.minFilter = THREE.LinearMipmapLinearFilter;
      normalTexture.magFilter = THREE.LinearFilter;
      normalTexture.anisotropy = maxAnisotropy;
      normalTexture.repeat.set(this.textureTiling().u, this.textureTiling().v);
      normalTexture.needsUpdate = true;

      this.currentModel()?.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.map = albedoTexture;
          child.material.normalMap = normalTexture;
          child.material.needsUpdate = true;
        }
      });
      
      // --- Process and apply material properties ---
      if (materialProps) {
        this.material.update(current => ({
          ...current,
          color: '#ffffff', // Reset color to white to show texture fully
          roughness: Math.max(0, Math.min(1, materialProps.roughness)),
          metalness: Math.max(0, Math.min(1, materialProps.metalness)),
        }));
      } else {
        // Default values if material properties couldn't be determined
        this.material.update(current => ({
          ...current,
          color: '#ffffff',
        }));
      }

    } catch (error) {
      console.error('Error generating texture:', error);
      if (error instanceof Error) {
        this.errorMessage.set(error.message);
      } else {
        this.errorMessage.set('An unknown error occurred while generating textures. Please try again.');
      }
    } finally {
       this.isGeneratingTexture.set(false);
    }
  }

  // --- OpenAI API Helper Methods ---
  private async generateOpenAIImage(apiKey: string, prompt: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.[0]?.url || null;
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw error;
    }
  }

  private async getMaterialProperties(apiKey: string, materialDescription: string): Promise<{ roughness: number; metalness: number } | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a material properties expert. Analyze material descriptions and return JSON with roughness (0.0-1.0) and metalness (0.0-1.0) values.'
            },
            {
              role: 'user',
              content: `Analyze the material description "${materialDescription}" and return a JSON object with "roughness" and "metalness" values. Roughness: 0.0 is smooth/glossy, 1.0 is rough/matte. Metalness: 0.0 is non-metal, 1.0 is metal. Return only valid JSON.`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });

      if (!response.ok) {
        console.warn('Failed to get material properties from OpenAI, using defaults');
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const props = JSON.parse(content);
      return {
        roughness: Math.max(0, Math.min(1, parseFloat(props.roughness) || 0.5)),
        metalness: Math.max(0, Math.min(1, parseFloat(props.metalness) || 0.1))
      };
    } catch (error) {
      console.warn('Error getting material properties:', error);
      return null;
    }
  }

  private async imageUrlToDataUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image URL to data URL:', error);
      throw new Error('Failed to process generated image');
    }
  }
  
  resetMaterial(): void {
    this.material.set({ color: '#cccccc', roughness: 0.5, metalness: 0.1 });
    this.generatedTextures.set({ albedo: null, normal: null });
    this.textureTiling.set({ u: 1, v: 1 });

    this.currentModel()?.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.map = null;
        child.material.normalMap = null;
        child.material.needsUpdate = true;
      }
    });
  }

  // --- Export ---
  exportGLB(): void {
    const model = this.currentModel();
    if (!model) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      model,
      (gltf) => this.downloadFile(new Blob([gltf as ArrayBuffer]), 'model.glb'),
      (error) => this.errorMessage.set('An error occurred during GLB export.'),
      { binary: true }
    );
  }

  exportSTL(): void {
    const model = this.currentModel();
    if (!model) return;
    const exporter = new STLExporter();
    const result = exporter.parse(model, { binary: true });
    this.downloadFile(new Blob([result]), 'model.stl');
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }
}