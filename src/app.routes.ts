import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ConfiguratorComponent } from './configurator/configurator.component';
import { AboutComponent } from './about/about.component';
import { FaqComponent } from './faq/faq.component';
import { ContactComponent } from './contact/contact.component';

export const APP_ROUTES: Routes = [
  { 
    path: '', 
    component: HomeComponent, 
    title: '3D Model Configurator - AI-Powered Material Editor & OBJ Viewer | Free Online Tool',
    data: { 
      metaDescription: 'Free online 3D model configurator with AI-powered material generation. Upload OBJ files, customize materials, lighting, and textures in real-time. Export to GLB/STL formats.',
      metaKeywords: '3D configurator, OBJ viewer, AI material generator, free 3D viewer, online 3D editor'
    }
  },
  { 
    path: 'configurator', 
    component: ConfiguratorComponent, 
    title: '3D Model Configurator - Upload & Customize OBJ Files | AI Material Generator',
    data: { 
      metaDescription: 'Upload and customize 3D OBJ models with AI-powered material generation. Real-time material editing, lighting controls, and export to GLB/STL formats. Free browser-based 3D configurator.',
      metaKeywords: '3D configurator, OBJ viewer, AI texture generator, material editor, GLB exporter, STL exporter'
    }
  },
  { 
    path: 'about', 
    component: AboutComponent, 
    title: 'About Our 3D Configurator - Free Online 3D Model Editor',
    data: { 
      metaDescription: 'Learn about our free 3D model configurator built with Angular, Three.js, and Gemini AI. Democratizing 3D content creation for artists, designers, and developers.',
      metaKeywords: 'about 3D configurator, Three.js, Angular, Gemini AI, 3D editor features'
    }
  },
  { 
    path: 'faq', 
    component: FaqComponent, 
    title: 'FAQ - 3D Model Configurator Questions & Answers',
    data: { 
      metaDescription: 'Frequently asked questions about our 3D model configurator. Learn about supported file formats, AI material generation, export options, and browser requirements.',
      metaKeywords: '3D configurator FAQ, OBJ viewer questions, AI material generator help, 3D editor support'
    }
  },
  { 
    path: 'contact', 
    component: ContactComponent, 
    title: 'Contact Us - 3D Model Configurator Support',
    data: { 
      metaDescription: 'Get in touch with the 3D Model Configurator team. Send us your questions, feedback, or support requests.',
      metaKeywords: 'contact 3D configurator, support, feedback, help'
    }
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];