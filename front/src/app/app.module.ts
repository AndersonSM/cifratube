import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { YoutubePlayerModule } from 'ngx-youtube-player';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng5SliderModule } from 'ng5-slider';
import { ColorPickerModule } from 'ngx-color-picker';
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';
import { AutofocusModule } from 'angular-autofocus-fix';

import { AlertComponent, SongComponent } from './components';
import { ErrorInterceptor, JwtInterceptor } from './helpers';
import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { OnCreateDirective } from './directives';

@NgModule({
  declarations: [
    AppComponent,
    AlertComponent,
    SongComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    OnCreateDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    YoutubePlayerModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    Ng5SliderModule,
    ColorPickerModule,
    AutofocusModule,
    KeyboardShortcutsModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
