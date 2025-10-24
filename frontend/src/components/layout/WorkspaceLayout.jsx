import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const WorkspaceLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On mobile, start with sidebar closed
      if (mobile) {
        setIsSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-dark-primary">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        isMobile 
          ? 'ml-0' 
          : (isSidebarOpen ? 'ml-64' : 'ml-16')
      }`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden bg-light-dark-secondary border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-white-secondary hover:text-white-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <img 
                src="/toe_ai_logo.png" 
                alt="TOE AI" 
                className="w-6 h-6"
              />
              <span className="ml-2 text-lg font-bold text-white-primary">TOE AI</span>
            </div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        )}
        
        {/* Page Content */}
        <main className="h-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default WorkspaceLayout