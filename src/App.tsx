import { useState } from 'react';
import './App.css'
import Buttons from './Buttons'
import ScheduleArea from './ScheduleArea'
import SettingsPage from './SettingsPage'
import HelpPage from './HelpPage'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'settings' | 'help'>('home');

  return (
    <>
      <div className="header">日程表</div>
      <div className="body">
        <Buttons onPageChange={setCurrentPage} />
        {currentPage === 'home' && <ScheduleArea />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'help' && <HelpPage />}
      </div>
    </>
  )
}

export default App