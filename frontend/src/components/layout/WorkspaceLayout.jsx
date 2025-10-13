import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const WorkspaceLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-dark-primary">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-16'
      }`}>
        {/* Header */}
        <header className="bg-light-dark-secondary border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <img 
                src={isSidebarOpen ? "/src/assets/images/closing_icon.png" : "/src/assets/images/opening_icon.png"}
                alt={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                className="w-5 h-5"
              />
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default WorkspaceLayout