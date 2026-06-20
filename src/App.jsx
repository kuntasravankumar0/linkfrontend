import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './all/layout/MainLayout';
import { isAdminLoggedIn } from './all/hooks/useAdminAuth';

// Lazy-loaded pages — only loaded when navigated to (code splitting)
const Home = lazy(() => import('./all/pages/Home'));
const SearchExplore = lazy(() => import('./all/pages/SearchExplore'));
const AddProject = lazy(() => import('./all/pages/AddProject'));
const ProjectDetails = lazy(() => import('./all/pages/ProjectDetails'));
const AdminProjects = lazy(() => import('./all/pages/AdminProjects'));
const AdminLogin = lazy(() => import('./all/pages/AdminLogin'));
const AiChat = lazy(() => import('./all/pages/AiChat'));
const Categories = lazy(() => import('./all/pages/Categories'));
const Help = lazy(() => import('./all/pages/Help'));
const Terms = lazy(() => import('./all/pages/Terms'));
const Contact = lazy(() => import('./all/pages/Contact'));
const NotFound = lazy(() => import('./all/pages/NotFound'));

// Lightweight loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
      </div>
    </div>
  );
}

function AdminRoute() {
  return isAdminLoggedIn() ? <AdminProjects /> : <Navigate to="/admin-login" replace />;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Standalone pages — no header/footer */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />

          {/* Main app with layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<SearchExplore />} />
            <Route path="add" element={<AddProject />} />
            <Route path="categories" element={<Categories />} />
            <Route path="ai" element={<AiChat />} />
            <Route path="help" element={<Help />} />
            <Route path="terms" element={<Terms />} />
            <Route path="contact" element={<Contact />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="admin" element={<AdminRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
