import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getRealtimeSocket } from '../services/realtime';

const rtcConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VoiceChannel({ channelId, channelName }) {
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const videoSendersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const pendingConnectErrorRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [participants, setParticipants] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [status, setStatus] = useState('Not connected');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const participantsRef = useRef(participants);
  const joinedRef = useRef(joined);
  participantsRef.current = participants;
  joinedRef.current = joined;

  const sendSignal = useCallback((to, signal) => {
    socketRef.current?.emit('voice:signal', { channelId, to, signal });
  }, [channelId]);

  const createPeerConnection = useCallback((peer) => {
    const existing = peerConnectionsRef.current.get(peer.id);
    if (existing) return existing;

    const connection = new RTCPeerConnection(rtcConfiguration);
    peerConnectionsRef.current.set(peer.id, connection);
    pendingCandidatesRef.current.set(peer.id, []);

    const localStream = localStreamRef.current;
    localStream?.getAudioTracks().forEach((track) => connection.addTrack(track, localStream));
    const videoTransceiver = connection.addTransceiver('video', { direction: 'sendrecv' });
    videoSendersRef.current.set(peer.id, videoTransceiver.sender);
    if (screenTrackRef.current) {
      videoTransceiver.sender.replaceTrack(screenTrackRef.current).catch((replaceError) => {
        console.error('Could not attach the screen share:', replaceError);
      });
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) sendSignal(peer.id, { candidate: event.candidate.toJSON() });
    };
    connection.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((current) => ({ ...current, [peer.id]: stream }));
    };
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
        connection.close();
        peerConnectionsRef.current.delete(peer.id);
        videoSendersRef.current.delete(peer.id);
        pendingCandidatesRef.current.delete(peer.id);
        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[peer.id];
          return next;
        });
        setParticipants((current) => {
          const next = { ...current };
          delete next[peer.id];
          return next;
        });
      }
    };

    return connection;
  }, [sendSignal]);

  const createOffer = useCallback(async (peer) => {
    const connection = createPeerConnection(peer);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    sendSignal(peer.id, { description: connection.localDescription.toJSON() });
  }, [createPeerConnection, sendSignal]);

  const handleSignal = useCallback(async ({ from, signal }) => {
    if (!from || !signal) return;
    const peer = participantsRef.current[from] || { id: from, name: 'Community member', avatar: null };
    const connection = createPeerConnection(peer);

    try {
      if (signal.description) {
        await connection.setRemoteDescription(signal.description);
        if (signal.description.type === 'offer') {
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          sendSignal(from, { description: connection.localDescription.toJSON() });
        }
        const candidates = pendingCandidatesRef.current.get(from) || [];
        for (const candidate of candidates) await connection.addIceCandidate(candidate);
        pendingCandidatesRef.current.set(from, []);
      }

      if (signal.candidate) {
        if (connection.remoteDescription) {
          await connection.addIceCandidate(signal.candidate);
        } else {
          pendingCandidatesRef.current.get(from)?.push(signal.candidate);
        }
      }
    } catch (signalError) {
      console.error('Voice signaling error:', signalError);
      setError('A voice connection could not be negotiated. Try leaving and joining again.');
    }
  }, [createPeerConnection, sendSignal]);

  const closePeer = useCallback((peerId) => {
    peerConnectionsRef.current.get(peerId)?.close();
    peerConnectionsRef.current.delete(peerId);
    videoSendersRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    setRemoteStreams((current) => {
      const next = { ...current };
      delete next[peerId];
      return next;
    });
    setParticipants((current) => {
      const next = { ...current };
      delete next[peerId];
      return next;
    });
  }, []);

  const stopLocalMedia = useCallback(() => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setSharingScreen(false);
    setMuted(false);
  }, []);

  const joinRoom = useCallback(() => {
    if (pendingConnectErrorRef.current) {
      socketRef.current?.off('connect_error', pendingConnectErrorRef.current);
      pendingConnectErrorRef.current = null;
    }
    socketRef.current?.emit('voice:join', channelId, async (result) => {
      if (!result?.ok) {
        joinedRef.current = false;
        stopLocalMedia();
        setJoined(false);
        setIsJoining(false);
        setStatus('Not connected');
        setError(result?.error || 'Could not join this voice channel.');
        return;
      }

      const initialParticipants = Object.fromEntries((result.participants || []).map((peer) => [peer.id, peer]));
      setParticipants(initialParticipants);
      joinedRef.current = true;
      setJoined(true);
      setIsJoining(false);
      setStatus('Connected');
      await Promise.all((result.participants || []).map((peer) => createOffer(peer).catch((offerError) => {
        console.error('Could not start voice connection:', offerError);
        setError(`Could not connect to ${peer.name || 'a participant'}.`);
      })));
    });
  }, [channelId, createOffer, stopLocalMedia]);

  const leaveVoice = useCallback(() => {
    socketRef.current?.emit('voice:leave', channelId);
    peerConnectionsRef.current.forEach((connection) => connection.close());
    peerConnectionsRef.current.clear();
    videoSendersRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams({});
    setParticipants({});
    stopLocalMedia();
    setJoined(false);
    joinedRef.current = false;
    setStatus('Not connected');
    setIsJoining(false);
  }, [channelId, stopLocalMedia]);

  const joinVoice = async () => {
    if (isJoining || joined) return;
    setIsJoining(true);
    setError('');
    setStatus('Requesting microphone…');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access requires a supported browser and a secure connection.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const socket = getRealtimeSocket();
      socketRef.current = socket;

      const handleConnectError = () => {
        socket.off('connect', joinRoom);
        pendingConnectErrorRef.current = null;
        setStatus('Not connected');
        setIsJoining(false);
        stopLocalMedia();
        setError('Could not connect to the voice service. Try again.');
      };
      if (socket.connected) joinRoom();
      else {
        setStatus('Connecting…');
        socket.once('connect', joinRoom);
        pendingConnectErrorRef.current = handleConnectError;
        socket.once('connect_error', handleConnectError);
        socket.connect();
      }
    } catch (joinError) {
      stopLocalMedia();
      setStatus('Not connected');
      setIsJoining(false);
      setError(joinError.message || 'Microphone access was unavailable.');
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  const stopScreenShare = useCallback(async () => {
    const track = screenTrackRef.current;
    if (!track) return;
    screenTrackRef.current = null;
    await Promise.allSettled([...videoSendersRef.current.values()].map((sender) => sender.replaceTrack(null)));
    track.stop();
    setSharingScreen(false);
  }, []);

  const startScreenShare = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by this browser.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('No screen was selected.');
      screenTrackRef.current = track;
      track.onended = () => { stopScreenShare(); };
      await Promise.all([...videoSendersRef.current.values()].map((sender) => sender.replaceTrack(track)));
      setSharingScreen(true);
    } catch (shareError) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      if (shareError.name !== 'NotAllowedError') setError(shareError.message || 'Could not share your screen.');
    }
  };

  useEffect(() => {
    const socket = getRealtimeSocket();
    socketRef.current = socket;
    const handleParticipantJoined = (peer) => setParticipants((current) => ({ ...current, [peer.id]: peer }));
    const handleParticipantLeft = (peerId) => closePeer(peerId);
    const handleDisconnect = () => {
      if (!joinedRef.current) return;
      setStatus('Reconnecting…');
      peerConnectionsRef.current.forEach((connection) => connection.close());
      peerConnectionsRef.current.clear();
      videoSendersRef.current.clear();
      pendingCandidatesRef.current.clear();
      setRemoteStreams({});
      setParticipants({});
    };
    const handleConnect = () => {
      if (joinedRef.current) {
        setStatus('Rejoining voice…');
        joinRoom();
      }
    };
    socket.on('voice:signal', handleSignal);
    socket.on('voice:participant-joined', handleParticipantJoined);
    socket.on('voice:participant-left', handleParticipantLeft);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);

    return () => {
      socket.emit('voice:leave', channelId);
      socket.off('connect', joinRoom);
      if (pendingConnectErrorRef.current) socket.off('connect_error', pendingConnectErrorRef.current);
      pendingConnectErrorRef.current = null;
      socket.off('voice:signal', handleSignal);
      socket.off('voice:participant-joined', handleParticipantJoined);
      socket.off('voice:participant-left', handleParticipantLeft);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
      peerConnectionsRef.current.forEach((connection) => connection.close());
      peerConnectionsRef.current.clear();
      videoSendersRef.current.clear();
      pendingCandidatesRef.current.clear();
      stopLocalMedia();
    };
  }, [channelId, closePeer, handleSignal, joinRoom, stopLocalMedia]);

  return (
    <section className="flex-1 overflow-y-auto p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-mono-sm text-xs uppercase tracking-wider text-on-surface-variant">Voice channel</p>
            <h2 className="text-2xl font-semibold text-on-surface mt-1">{channelName}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{status}{joined ? ` · ${Object.keys(participants).length + 1} connected` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!joined ? (
              <button type="button" onClick={joinVoice} disabled={isJoining} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">{isJoining ? 'hourglass_top' : 'call'}</span> {isJoining ? 'Joining…' : 'Join voice'}
              </button>
            ) : (
              <>
                <button type="button" onClick={toggleMute} className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm flex items-center gap-2" aria-pressed={muted}>
                  <span className="material-symbols-outlined text-[18px]">{muted ? 'mic_off' : 'mic'}</span>{muted ? 'Unmute' : 'Mute'}
                </button>
                <button type="button" onClick={sharingScreen ? stopScreenShare : startScreenShare} className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm flex items-center gap-2" aria-pressed={sharingScreen}>
                  <span className="material-symbols-outlined text-[18px]">{sharingScreen ? 'stop_screen_share' : 'present_to_all'}</span>{sharingScreen ? 'Stop sharing' : 'Share screen'}
                </button>
                <button type="button" onClick={leaveVoice} className="px-3 py-2 rounded-lg bg-error-container/30 text-error text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">call_end</span> Leave
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg bg-error-container/20 text-error p-3 text-sm">{error}</div>}

        {joined && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sharingScreen && screenTrackRef.current && (
              <div className="rounded-xl overflow-hidden bg-black border border-primary/40">
                <video autoPlay muted playsInline className="w-full aspect-video object-contain" ref={(element) => {
                  if (element && screenTrackRef.current) element.srcObject = new MediaStream([screenTrackRef.current]);
                }} />
                <div className="p-3 text-sm text-on-surface">Your screen</div>
              </div>
            )}
            {Object.entries(participants).map(([peerId, participant]) => (
              <div key={peerId} className="rounded-xl overflow-hidden bg-surface-container border border-white/[0.08]">
                {remoteStreams[peerId] ? (
                  <video autoPlay playsInline className="w-full aspect-video object-contain bg-black" ref={(element) => {
                    if (element && element.srcObject !== remoteStreams[peerId]) element.srcObject = remoteStreams[peerId];
                  }} />
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-surface-container-low">
                    {participant.avatar ? <img src={participant.avatar} alt="" className="w-20 h-20 rounded-full object-cover" /> : <span className="w-20 h-20 rounded-full bg-primary/20 text-primary text-3xl flex items-center justify-center">{participant.name?.[0] || '?'}</span>}
                  </div>
                )}
                <div className="p-3 flex items-center gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">volume_up</span>{participant.name || 'Community member'}
                </div>
              </div>
            ))}
            {Object.keys(participants).length === 0 && !sharingScreen && (
              <div className="sm:col-span-2 rounded-xl border border-dashed border-white/[0.12] p-10 text-center text-on-surface-variant">
                You’re connected. Other members can join this voice channel at any time.
              </div>
            )}
          </div>
        )}

        {!joined && !error && (
          <div className="rounded-xl border border-white/[0.08] bg-surface-container p-8 text-center text-on-surface-variant">
            Join to talk with members and share your screen.
          </div>
        )}
      </div>
    </section>
  );
}
