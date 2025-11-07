import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  open: () => boolean;
  toggle: () => void;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  private createFaqItem(question: string, answer: string): FaqItem {
    const openSignal = signal(false);
    return {
      question,
      answer,
      open: openSignal,
      toggle: () => openSignal.update(v => !v),
    };
  }
  
  faqs = signal<FaqItem[]>([
    this.createFaqItem(
      'What file formats are supported?',
      'Currently, we support .obj files for model import. Once you have customized your model, you can export the entire scene as a .glb file, which is a highly optimized format perfect for web and AR applications.'
    ),
    this.createFaqItem(
      'Is this tool free to use?',
      'Yes, the 3D Configurator is completely free for personal and commercial use. Our goal is to provide accessible tools for the entire creative community.'
    ),
    this.createFaqItem(
      'What is AI Material Generation?',
      'This feature uses the Gemini API to interpret your text descriptions (e.g., "old cracked leather") and procedurally generates a full set of PBR (Physically-Based Rendering) texture maps, including color, normal, roughness, and metalness, to create a realistic material.'
    ),
    this.createFaqItem(
      'Do I need to install any software?',
      'No. The entire application runs in your web browser. There is nothing to download or install. We recommend using an up-to-date version of a modern browser like Chrome, Firefox, or Edge for the best performance.'
    ),
    this.createFaqItem(
      'Can I use the exported models in my game or project?',
      'Absolutely! The exported .glb files are standard and can be used in most modern game engines (like Unity, Unreal Engine), 3D software (like Blender, 3ds Max), and web-based 3D frameworks.'
    )
  ]);
  
  toggleFaq(faqItem: FaqItem): void {
    // Optional: close other FAQs when one is opened
    // this.faqs().forEach(f => {
    //   if (f !== faqItem && f.open()) {
    //     f.toggle();
    //   }
    // });
    faqItem.toggle();
  }
}
