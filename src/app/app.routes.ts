import { Routes } from '@angular/router';
import { CategoriesComponent } from './modules/pages/categories/categories.component';
import { LimitsComponent } from './modules/pages/limits/limits.component';
import { SummariesComponent } from './modules/pages/summaries/summaries.component';
import { HomeComponent } from './modules/pages/home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'categories',
        component: CategoriesComponent
    },
    {
        path: 'limits',
        component: LimitsComponent
    }
    // {
    //     path: 'summaries',
    //     component: SummariesComponent
    // },
    // {
    //     path: '**',
    //     component: NotFoundComponent
    // }
];
