import './App.css'
import Buttons from './Buttons'
import ScheduleArea from './ScheduleArea'

function App() {
  return (
    <>
      <div className="header">日程表</div>
      <div className="body">
        <Buttons />
        <ScheduleArea />
      </div>
    </>
  )
}

export default App