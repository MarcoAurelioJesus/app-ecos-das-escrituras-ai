import { Routes } from '@angular/router';
import { QuestionsComponent } from './questions/questions.component';

export const routes: Routes = [
    { path: '', redirectTo: '/perguntas', pathMatch: 'full' },
    { path: 'perguntas', component: QuestionsComponent },
];
