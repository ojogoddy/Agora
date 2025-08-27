import React, { useState } from 'react'
import VoiceCall from './component/VoiceCall'
// import VoiceCall2 from './component/VoiceCall2'

const App = () => {
  const [inCall, setInCall] = useState(false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Voice Call Demo
        </h1>

        {inCall ? (
          <VoiceCall
            appId="af0549ede2a54f89a764ae7f18c8b9cf"
            channel="test-channel"
            token={null} // For testing, use proper tokens in production
            uid={null}
            onCallEnd={() => setInCall(false)}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Start a voice call
            </h2>
            <p className="text-gray-600 mb-6">
              Click the button below to join the voice channel
            </p>
            <button
              onClick={() => setInCall(true)}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Start Call
            </button>
          </div>
        )}
      </div>
      {/* <VoiceCall2/> */}
    </div>
  )
}

export default App
// import { Route, Routes, useNavigate } from 'react-router-dom'


// import AgoraRTC, {
//   AgoraRTCProvider,
//   useRTCClient,
// } from "agora-rtc-react";

// import './App.css'
// import { ConnectForm } from './component/video/connectForm';
// import { LiveVideo } from './component/video/LiveVideo';

// function App() {
//   const navigate = useNavigate()
//   const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })); // Initialize Agora Client

//   const handleConnect = (channelName: string) => {
//     navigate(`/via/${channelName}`) // on form submit, navigate to new route
//   }

//   return (
//     <Routes>
//       <Route path='/' element={<ConnectForm connectToVideo={handleConnect} />} />
//       <Route path='/via/:channelName' element={
//         <AgoraRTCProvider client={agoraClient}>
//           <LiveVideo />
//         </AgoraRTCProvider>
//       } />
//     </Routes>
//   )
// }

// export default App