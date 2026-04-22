import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { protectedLoader } from './services/protectedLoader'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import Test from "./pages/Test"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import './App.css'
import { AuthProvider } from "./context/AuthProvider"
import AuthCallback from "./pages/AuthCallback"

/**
 * Within the router, we specify what layout template to use for each group of children,
 * e.g. element: <TabsLayout /> will display each of that path's children wrapped in the TabsLayout template.
 * To protect a path (and subpaths), add loader: protectedLoader. This will verify that the user is logged in.
 * If so, take them to the path they've specified, if not, then take them to the login page.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <TabsLayout />,
    children: [
      { index: true, element: <Test /> },
      { path: "*", element: <Test /> },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "/auth/callback", element: <AuthCallback /> },
    ],
  },
  {
    path: "/profile",
    element: <ProfilePage />,
    loader: protectedLoader,
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
export default App
