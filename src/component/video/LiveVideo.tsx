import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Camera, PhoneOff } from 'lucide-react';
import {
    LocalUser,
    RemoteUser,
    useJoin,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteAudioTracks,
    useRemoteUsers,
} from "agora-rtc-react";


export const LiveVideo = () => {

    const appId = '62e93c80e37d4f43947f60d0131cc3db'
    // const appId = 'af0549ede2a54f89a764ae7f18c8b9cf'
    // const agoraEngine = useRTCClient( AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })); // Initialize Agora Client
    const { channelName } = useParams() //pull the channel name from the param

    // set the connection state
    const [activeConnection, setActiveConnection] = useState(true);

    // track the mic/video state - Turn on Mic and Camera On
    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(true);

    // get local video and mic tracks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    // to leave the call
    const navigate = useNavigate()

    // Join the channel
    useJoin(
        {
            appid: appId,
            channel: channelName!,
            token: null,
        },
        activeConnection,
    );

    usePublish([localMicrophoneTrack, localCameraTrack]);

    //remote users
    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);

    // play the remote user audio tracks
    audioTracks.forEach((track) => track.play());


    return (
        <>
            <div id='remoteVideoGrid'>
                {
                    // Initialize each remote stream using RemoteUser component
                    remoteUsers.map((user) => (
                        <div key={user.uid} className="remote-video-container">
                            <RemoteUser user={user} />
                        </div>
                    ))
                }
            </div>
            <div id='localVideo'>
                <LocalUser
                    audioTrack={localMicrophoneTrack}
                    videoTrack={localCameraTrack}
                    cameraOn={cameraOn}
                    micOn={micOn}
                    playAudio={micOn}
                    playVideo={cameraOn}
                    className=''
                />
                <div>
                    {/* media-controls toolbar component - UI controling mic, camera, & connection state  */}
                    <div id="controlsToolbar">
                        <div id="mediaControls">
                            <button className="btn" onClick={() => setMic(a => !a)}>
                                <Mic size={24} />
                            </button>
                            <button className="btn" onClick={() => setCamera(a => !a)}>
                                <Camera size={24} />
                            </button>
                        </div>
                        <button id="endConnection"
                            onClick={() => {
                                setActiveConnection(false)
                                navigate('/')
                            }}> 
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}