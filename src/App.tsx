import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { RouteGuard } from './components/layout/RouteGuard';
import { adminNav, userNav } from './components/layout/navItems';
import { LoadingState } from './components/ui/Primitives';
import { LoginPage, RegisterPage } from './pages/public/AuthPages';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const RatingPage = lazy(() => import('./pages/user/RatingPage'));
const CompetitionsPage = lazy(() => import('./pages/user/CompetitionsPage'));
const CompetitionDetailPage = lazy(() => import('./pages/user/CompetitionDetailPage'));
const ResultsPage = lazy(() => import('./pages/user/ResultsPage'));
const AchievementsPage = lazy(() => import('./pages/user/AchievementsPage'));
const LevelsPage = lazy(() => import('./pages/user/LevelsPage'));
const MapPage = lazy(() => import('./pages/user/MapPages').then((module) => ({ default: module.MapPage })));
const CitiesPage = lazy(() => import('./pages/user/MapPages').then((module) => ({ default: module.CitiesPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminCompetitionsPage = lazy(() => import('./pages/admin/AdminCompetitionsPage'));
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'));
const AdminResultsPage = lazy(() => import('./pages/admin/AdminResultsPage'));
const AdminRatingPage = lazy(() => import('./pages/admin/AdminRatingPage'));
const AdminLevelsPage = lazy(() => import('./pages/admin/AdminLevelsPage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingState/>}>
      <Routes>
        <Route element={<PublicLayout/>}><Route index element={<HomePage/>}/></Route>
        <Route path="login" element={<LoginPage/>}/><Route path="register" element={<RegisterPage/>}/>
        <Route path="app" element={<RouteGuard role="athlete"><DashboardLayout nav={userNav}/></RouteGuard>}>
          <Route index element={<Navigate to="profile" replace/>}/><Route path="profile" element={<ProfilePage/>}/><Route path="rating" element={<RatingPage/>}/><Route path="competitions" element={<CompetitionsPage/>}/><Route path="competitions/:id" element={<CompetitionDetailPage/>}/><Route path="results" element={<ResultsPage/>}/><Route path="achievements" element={<AchievementsPage/>}/><Route path="map" element={<MapPage/>}/><Route path="cities" element={<CitiesPage/>}/><Route path="levels" element={<LevelsPage/>}/>
        </Route>
        <Route path="admin" element={<RouteGuard role="admin"><DashboardLayout admin nav={adminNav}/></RouteGuard>}>
          <Route index element={<AdminDashboardPage/>}/><Route path="users" element={<AdminUsersPage/>}/><Route path="competitions" element={<AdminCompetitionsPage/>}/><Route path="applications" element={<AdminApplicationsPage/>}/><Route path="results" element={<AdminResultsPage/>}/><Route path="rating" element={<AdminRatingPage/>}/><Route path="levels" element={<AdminLevelsPage/>}/>
        </Route>
        <Route path="*" element={<main className="fatal-error"><p className="eyebrow">404 // ROUTE</p><h1>Страница не найдена</h1><a className="button button-primary" href="/">На главную</a></main>}/>
      </Routes>
    </Suspense>
  );
}
