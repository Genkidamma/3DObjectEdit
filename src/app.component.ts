import { Component, ChangeDetectionStrategy, signal, viewChild, ElementRef, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * PRODUCTION APP COMPONENT:
 * Main application component with mobile navigation support
 * Includes accessibility features and responsive design
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: {
    class: 'flex flex-col h-screen w-screen bg-gray-900',
  },
})
export class AppComponent {
  // Mobile menu state
  mobileMenuOpen = signal(false);
  mobileMenuButton = viewChild<ElementRef<HTMLButtonElement>>('mobileMenuButton');

  constructor() {
    // Close mobile menu when route changes
    effect(() => {
      // This will run when route changes (you can enhance this with Router events if needed)
    });
  }

  /**
   * Toggle mobile navigation menu
   * Updates ARIA attributes for accessibility
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
    const button = this.mobileMenuButton()?.nativeElement;
    if (button) {
      button.setAttribute('aria-expanded', this.mobileMenuOpen().toString());
    }
  }

  /**
   * Close mobile menu
   * Called when a navigation link is clicked
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    const button = this.mobileMenuButton()?.nativeElement;
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.focus(); // Return focus to menu button for accessibility
    }
  }
}