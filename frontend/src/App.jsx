import { Routes, Route } from 'react-router-dom'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import TaskBoard from './pages/TaskBoard'
import TaskDetail from './pages/TaskDetail'
import TaskForm from './pages/TaskForm'
import Profile from './pages/Profile'

// Components
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="projects/:projectId/board" element={<TaskBoard />} />
        <Route path="projects/:projectId/tasks/new" element={<TaskForm />} />
        <Route path="projects/:projectId/tasks/:taskId/edit" element={<TaskForm />} />
        <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
