// import { FormEvent, useEffect, useState } from "react";
// import AgoraRTC, {
//     IAgoraRTCClient,
//     IAgoraRTCRemoteUser,
//     IMicrophoneAudioTrack,
// } from "agora-rtc-sdk-ng";
// import appId from "./appId";

// const token = null;
// const roomId = "main";

// interface AudioTracks {
//     localAudioTrack: IMicrophoneAudioTrack | null;
//     remoteAudioTracks: { [uid: string]: IMicrophoneAudioTrack[] };
// }

// const VoiceCall2 = () => {
//     const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
//     const [audioTracks, setAudioTracks] = useState<AudioTracks>({
//         localAudioTrack: null,
//         remoteAudioTracks: {},
//     });
//     const [isInRoom, setIsInRoom] = useState(false);
//     const [members, setMembers] = useState<string[]>([]);
//     const rtcUid = Math.floor(Math.random() * 2032).toString();

//     // Initialize Agora RTC Client
//     const initRtc = async () => {
//         const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
//         setRtcClient(client);

//         client.on("user-joined", handleUserJoined);
//         client.on("user-published", handleUserPublished);
//         client.on("user-left", handleUserLeft);

//         try {
//             await client.join(appId, roomId, token, rtcUid);
//             const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//             setAudioTracks((prev) => ({ ...prev, localAudioTrack }));
//             await client.publish(localAudioTrack);
//             setMembers((prev) => [...prev, rtcUid]);
//             setIsInRoom(true);
//         } catch (error) {
//             console.error("Failed to join room:", error);
//         }
//     };

//     const handleUserJoined = async (user: IAgoraRTCRemoteUser) => {
//         console.log("USER:", user);
//         setMembers((prev) => [...prev, user.uid.toString()]);
//     };

//     const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: string) => {
//         await rtcClient?.subscribe(user, mediaType);
//         if (mediaType === "audio") {
//             setAudioTracks((prev) => ({
//                 ...prev,
//                 remoteAudioTracks: { ...prev.remoteAudioTracks, [user.uid]: [user.audioTrack] },
//             }));
//             user.audioTrack?.play();
//         }
//     };

//     const handleUserLeft = async (user: IAgoraRTCRemoteUser) => {
//         setAudioTracks((prev) => {
//             const newRemoteTracks = { ...prev.remoteAudioTracks };
//             delete newRemoteTracks[user.uid];
//             return { ...prev, remoteAudioTracks: newRemoteTracks };
//         });
//         setMembers((prev) => prev.filter((uid) => uid !== user.uid.toString()));
//     };

//     const enterRoom = async (e: FormEvent) => {
//         e.preventDefault();
//         await initRtc();
//     };

//     const leaveRoom = async () => {
//         try {
//             if (audioTracks.localAudioTrack) {
//                 audioTracks.localAudioTrack.stop();
//                 audioTracks.localAudioTrack.close();
//             }
//             if (rtcClient) {
//                 await rtcClient.unpublish();
//                 await rtcClient.leave();
//             }
//             setIsInRoom(false);
//             setMembers([]);
//             setRtcClient(null);
//             setAudioTracks({ localAudioTrack: null, remoteAudioTracks: {} });
//         } catch (error) {
//             console.error("Failed to leave room:", error);
//         }
//     };

//     return (
//         <div className="max-w-2xl mx-auto p-4">
//             <div
//                 className={`flex justify-between items-center p-4 ${isInRoom ? "flex" : "hidden"}`}
//                 id="room-header"
//             >
//                 <h1 className="text-xl font-bold">Room: {roomId}</h1>
//                 <div className="flex gap-1" id="room-header-controls">
//                     <img
//                         src="/icons/mic-off.svg"
//                         alt="Mute"
//                         className="bg-indianred p-2 h-8 cursor-pointer rounded"
//                     />
//                     <img
//                         src="/icons/leave.svg"
//                         alt="Leave"
//                         className="bg-indianred p-2 h-8 cursor-pointer rounded"
//                         onClick={leaveRoom}
//                     />
//                 </div>
//             </div>

//             <form
//                 onSubmit={enterRoom}
//                 className={`${isInRoom ? "hidden" : "block"} mb-8`}
//                 id="form"
//             >
//                 <input
//                     type="submit"
//                     value="Enter Room"
//                     className="w-full p-4 bg-blue-600 rounded cursor-pointer hover:bg-blue-500"
//                 />
//             </form>

//             <div className="flex flex-wrap" id="members">
//                 {members.map((uid) => (
//                     <div
//                         key={uid}
//                         className={`border-2 border-white flex flex-col items-center w-32 text-center m-2 rounded speaker user-rtc-${uid}`}
//                         id={uid}
//                     >
//                         <p>{uid}</p>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default VoiceCall2;