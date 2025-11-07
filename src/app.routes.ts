import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ConfiguratorComponent } from './configurator/configurator.component';
import { AboutComponent } from './about/about.component';
import { FaqComponent } from './faq/faq.component';
import { ContactComponent } from './contact/contact.component';

export const APP_ROUTES: Routes = [
  { path: '', component: HomeComponent, title: '3D Viewer - Home' },
  { path: 'configurator', component: ConfiguratorComponent, title: '3D Configurator' },
  { path: 'about', component: AboutComponent, title: 'About Us' },
  { path: 'faq', component: FaqComponent, title: 'FAQ' },
  { path: 'contact', component: ContactComponent, title: 'Contact Us' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];