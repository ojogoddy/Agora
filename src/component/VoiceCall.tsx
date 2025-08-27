// AgoraVoiceCall.tsx
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IRemoteAudioTrack, IAgoraRTCClient, ILocalAudioTrack  } from 'agora-rtc-sdk-ng';

// TypeScript interfaces for better type safety
interface AgoraVoiceCallProps {
    appId: string;
    channel: string;
    token?: string | null;
    uid?: number | string | null;
    onCallEnd?: () => void;
}

interface Participant {
    uid: number | string;
    audioTrack?: IRemoteAudioTrack;
    speaking?: boolean;
}

const VoiceCall: React.FC<AgoraVoiceCallProps> = ({
    appId,
    channel,
    token = null,
    uid = null,
    onCallEnd
}) => {
    const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<Map<string | number, Participant>>(new Map());
    const [isJoined, setIsJoined] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [callStatus, setCallStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [callTimer, setCallTimer] = useState<number>(0);
    const [volumeLevel, setVolumeLevel] = useState<number>(0);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Agora client
    useEffect(() => {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        // Handle user published event
        const handleUserPublished = async (user: any, mediaType: string) => {
            if (mediaType === 'audio') {
                await clientRef.current?.subscribe(user, mediaType);
                user.audioTrack.play();

                setRemoteUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(user.uid, {
                        uid: user.uid,
                        audioTrack: user.audioTrack,
                        speaking: false
                    });
                    return newMap;
                });
            }
        };

        // Handle user unpublished event
        const handleUserUnpublished = (user: any) => {
            setRemoteUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(user.uid);
                return newMap;
            });
        };

        // Handle user joined event
        const handleUserJoined = (user: any) => {
            setRemoteUsers(prev => {
                const newMap = new Map(prev);
                newMap.set(user.uid, { uid: user.uid });
                return newMap;
            });
        };

        // Handle user left event
        const handleUserLeft = (user: any) => {
            setRemoteUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(user.uid);
                return newMap;
            });
        };

        // Subscribe to events
        clientRef.current.on('user-published', handleUserPublished);
        clientRef.current.on('user-unpublished', handleUserUnpublished);
        clientRef.current.on('user-joined', handleUserJoined);
        clientRef.current.on('user-left', handleUserLeft);

        return () => {
            // Cleanup event listeners
            if (clientRef.current) {
                clientRef.current.off('user-published', handleUserPublished);
                clientRef.current.off('user-unpublished', handleUserUnpublished);
                clientRef.current.off('user-joined', handleUserJoined);
                clientRef.current.off('user-left', handleUserLeft);
            }
        };
    }, []);

    // Monitor volume levels for visualization
    useEffect(() => {
        if (isJoined && localAudioTrack) {
            volumeIntervalRef.current = setInterval(() => {
                if (localAudioTrack && localAudioTrack.getVolumeLevel) {
                    const level = localAudioTrack.getVolumeLevel() * 100;
                    setVolumeLevel(level);
                }
            }, 100);
        } else {
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
                volumeIntervalRef.current = null;
            }
            setVolumeLevel(0);
        }

        return () => {
            if (volumeIntervalRef.current) {
                clearInterval(volumeIntervalRef.current);
            }
        };
    }, [isJoined, localAudioTrack]);

    // Join channel function
    const joinChannel = async () => {
        try {
            setIsLoading(true);
            setCallStatus('connecting');

            if (!clientRef.current) return;

            await clientRef.current.join(appId, channel, token || null, uid || null);

            // Create and publish local audio track
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            await clientRef.current.publish([audioTrack]);

            setLocalAudioTrack(audioTrack);
            setIsJoined(true);
            setCallStatus('connected');

            // Start call timer
            timerRef.current = setInterval(() => {
                setCallTimer(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to join channel:', error);
            setCallStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Leave channel function
    const leaveChannel = async () => {
        try {
            if (localAudioTrack) {
                localAudioTrack.close();
                setLocalAudioTrack(null);
            }

            if (clientRef.current) {
                await clientRef.current.leave();
            }

            setIsJoined(false);
            setCallStatus('disconnected');
            setRemoteUsers(new Map());

            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setCallTimer(0);

            if (onCallEnd) {
                onCallEnd();
            }

        } catch (error) {
            console.error('Failed to leave channel:', error);
        }
    };

    // Toggle microphone mute
    const toggleMute = async () => {
        if (localAudioTrack) {
            await localAudioTrack.setEnabled(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Format call timer
    const formatCallTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get status color based on call status
    const getStatusColor = () => {
        switch (callStatus) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Voice Call</h2>
                {isJoined && (
                    <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        <span className="text-lg">⏱</span>
                        <span className="font-medium">{formatCallTime(callTimer)}</span>
                    </div>
                )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-gray-600 capitalize">{callStatus}</span>
            </div>

            {/* Volume indicator */}
            {isJoined && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-100"
                        style={{ width: `${volumeLevel}%` }}
                    ></div>
                </div>
            )}

            {/* Participants list */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                    Participants ({remoteUsers.size + (isJoined ? 1 : 0)})
                </h3>

                <div className="space-y-3">
                    {/* Local participant */}
                    {isJoined && (
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                    You
                                </div>
                                {isMuted && (
                                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">You ({uid || 'Local User'})</p>
                                <p className="text-sm text-gray-500">Speaking: {volumeLevel > 10 ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}

                    {/* Remote participants */}
                    {Array.from(remoteUsers.values()).map(user => (
                        <div key={user.uid} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                                U{String(user.uid).slice(-2)}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-900">User {user.uid}</p>
                                <p className="text-sm text-gray-500">Status: {user.audioTrack ? 'Connected' : 'Connecting'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Call controls */}
            <div className="flex justify-center space-x-4">
                {!isJoined ? (
                    <button
                        onClick={joinChannel}
                        disabled={isLoading}
                        className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting...
                            </span>
                        ) : 'Join Call'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={toggleMute}
                            className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={leaveChannel}
                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Error message */}
            {callStatus === 'error' && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                    Failed to connect. Please check your connection and try again.
                </div>
            )}
        </div>
    );
};

export default VoiceCall;