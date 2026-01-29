import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import AppPage from '../views/AppPage.vue'
import FaqPage from '../views/FaqPage.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage,
    meta: { title: 'Kodini Color Extractor' }
  },
  {
    path: '/app',
    name: 'app',
    component: AppPage,
    meta: { title: 'App - Kodini Color Extractor' }
  },
  {
    path: '/faq',
    name: 'faq',
    component: FaqPage,
    meta: { title: 'FAQ - Kodini Color Extractor' }
  }
]

const router = createRouter({
  history: createWebHistory('/kodini-color-extractor/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Kodini Color Extractor'
  next()
})

export default router
