import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { QuestionsComponent } from './questions/questions.component';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    AppComponent,
    QuestionsComponent,
  ],
  providers: [],
  bootstrap: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }