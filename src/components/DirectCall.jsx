import React, { useEffect, useRef, useState } from 'react';
import { getRealtimeSocket } from '../services/realtime';

const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

export default function DirectCall({ conversationId, mode, onLeave }) {
  const [participants, setParticipants] = useState({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const joinedRef = useRef(false);
  const peersRef = useRef(new Map());
  const candidatesRef = useRef(new Map());
  const participantsRef = useRef({});

  useEffect(() => {
    let active = true;
    const socket = getRealtimeSocket();
    socketRef.current = socket;
    const localPeers = peersRef.current;
    const pendingCandidates = candidatesRef.current;

    const sendSignal = (to, signal) => socket.emit('dmcall:signal', { conversationId, to, signal });

    const createPeer = (peer) => {
      if (localPeers.has(peer.id)) return localPeers.get(peer.id);
      const connection = new RTCPeerConnection(rtcConfiguration);
      localPeers.set(peer.id, connection);
      pendingCandidates.set(peer.id, []);
      streamRef.current?.getTracks().forEach((track) => connection.addTrack(track, streamRef.current));
      connection.onicecandidate = (event) => {
        if (event.candidate) sendSignal(peer.id, { candidate: event.candidate.toJSON() });
      };
      connection.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        if (active) setRemoteStreams((current) => ({ ...current, [peer.id]: stream }));
      };
      connection.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(connection.connectionState)) {
          connection.close();
          localPeers.delete(peer.id);
          pendingCandidates.delete(peer.id);
          if (active) {
            setRemoteStreams((current) => {
              const next = { ...current };
              delete next[peer.id];
              return next;
            });
            setParticipants((current) => {
              const next = { ...current };
              delete next[peer.id];
              participantsRef.current = next;
              return next;
            });
          }
        }
      };
      return connection;
    };

    const createOffer = async (peer) => {
      const connection = createPeer(peer);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      sendSignal(peer.id, { description: connection.localDescription.toJSON() });
    };

    const handleSignal = async ({ from, signal }) => {
      if (!from || !signal || !active) return;
      const peer = participantsRef.current[from] || { id: from, name: 'Community member' };
      const connection = createPeer(peer);
      try {
        if (signal.description) {
          await connection.setRemoteDescription(signal.description);
          if (signal.description.type === 'offer') {
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            sendSignal(from, { description: connection.localDescription.toJSON() });
          }
          for (const candidate of pendingCandidates.get(from) || []) await connection.addIceCandidate(candidate);
          pendingCandidates.set(from, []);
        }
        if (signal.candidate) {
          if (connection.remoteDescription) await connection.addIceCandidate(signal.candidate);
          else pendingCandidates.get(from)?.push(signal.candidate);
        }
      } catch (signalError) {
        console.error('Direct call signaling error:', signalError);
        if (active) setError('A participant connection failed. Try leaving and rejoining the call.');
      }
    };

    const handleParticipantJoined = (peer) => {
      participantsRef.current = { ...participantsRef.current, [peer.id]: peer };
      if (active) setParticipants(participantsRef.current);
    };
    const handleParticipantLeft = (peerId) => {
      localPeers.get(peerId)?.close();
      localPeers.delete(peerId);
      pendingCandidates.delete(peerId);
      participantsRef.current = { ...participantsRef.current };
      delete participantsRef.current[peerId];
      if (active) {
        setParticipants(participantsRef.current);
        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[peerId];
          return next;
        });
      }
    };

    const handleConnectionError = () => {
      if (!active) return;
      socket.off('connect', requestCallJoin);
      setStatus('Not connected');
      setError('Could not connect to the call service. Try starting the call again.');
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLocalStream(null);
    };

    const requestCallJoin = () => {
      socket.off('connect_error', handleConnectionError);
      socket.emit('dmcall:join', { conversationId, mode }, (result) => {
        if (!active) return;
        if (!result?.ok) {
          setError(result?.error || 'Could not join the call.');
          setStatus('Not connected');
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setLocalStream(null);
          return;
        }
        const initialParticipants = Object.fromEntries((result.participants || []).map((peer) => [peer.id, peer]));
        participantsRef.current = initialParticipants;
        setParticipants(initialParticipants);
        joinedRef.current = true;
        setStatus(mode === 'video' ? 'Video call connected' : 'Audio call connected');
        Promise.all((result.participants || []).map((peer) => createOffer(peer).catch((offerError) => {
          console.error('Could not start direct call connection:', offerError);
          if (active) setError(`Could not connect to ${peer.name || 'a participant'}.`);
        })));
      });
    };

    const handleSocketDisconnect = () => {
      if (!joinedRef.current) return;
      setStatus('Reconnecting…');
      localPeers.forEach((connection) => connection.close());
      localPeers.clear();
      pendingCandidates.clear();
      participantsRef.current = {};
      setParticipants({});
      setRemoteStreams({});
    };
    const handleSocketConnect = () => {
      if (!joinedRef.current) return;
      setStatus('Rejoining call…');
      requestCallJoin();
    };

    socket.on('dmcall:signal', handleSignal);
    socket.on('dmcall:participant-joined', handleParticipantJoined);
    socket.on('dmcall:participant-left', handleParticipantLeft);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('connect', handleSocketConnect);

    const startCall = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Calls require a supported browser and a secure connection.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        if (socket.connected) requestCallJoin();
        else {
          setStatus('Waiting for the call service…');
          socket.once('connect', requestCallJoin);
          socket.once('connect_error', handleConnectionError);
          socket.connect();
        }
      } catch (callError) {
        if (active) {
          setStatus('Not connected');
          setError(callError.message || 'Microphone or camera access was unavailable.');
        }
      }
    };
    startCall();

    return () => {
      active = false;
      socket.off('connect', requestCallJoin);
      socket.off('connect_error', handleConnectionError);
      socket.off('dmcall:signal', handleSignal);
      socket.off('dmcall:participant-joined', handleParticipantJoined);
      socket.off('dmcall:participant-left', handleParticipantLeft);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('connect', handleSocketConnect);
      if (joinedRef.current) socket.emit('dmcall:leave', conversationId);
      joinedRef.current = false;
      localPeers.forEach((connection) => connection.close());
      localPeers.clear();
      pendingCandidates.clear();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [conversationId, mode]);

  const toggleMute = () => {
    const nextMuted = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextOff = !cameraOff;
    streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !nextOff; });
    setCameraOff(nextOff);
  };

  const leaveCall = () => {
    if (joinedRef.current) socketRef.current?.emit('dmcall:leave', conversationId);
    joinedRef.current = false;
    onLeave();
  };

  return (
    <section className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-surface-container p-5 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-mono-sm text-xs uppercase tracking-wider text-on-surface-variant">{mode} call</p>
            <h2 className="text-2xl font-semibold text-on-surface mt-1">{status}</h2>
          </div>
          <button type="button" onClick={leaveCall} className="px-4 py-2 rounded-lg bg-error-container/30 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">call_end</span> Leave call
          </button>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg bg-error-container/20 text-error p-3 text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          {mode === 'video' && localStream && (
            <div className="rounded-xl overflow-hidden bg-black border border-primary/40">
              <video autoPlay muted playsInline className="w-full aspect-video object-cover" ref={(element) => {
                if (element && element.srcObject !== localStream) element.srcObject = localStream;
              }} />
              <div className="p-3 text-sm text-on-surface">You{cameraOff ? ' · camera off' : ''}</div>
            </div>
          )}
          {Object.entries(participants).map(([peerId, peer]) => (
            <div key={peerId} className="rounded-xl overflow-hidden bg-surface-container-low border border-white/[0.08]">
              {mode === 'video' && remoteStreams[peerId] ? (
                <video autoPlay playsInline className="w-full aspect-video object-cover bg-black" ref={(element) => {
                  if (element && element.srcObject !== remoteStreams[peerId]) element.srcObject = remoteStreams[peerId];
                }} />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-surface-container-low">
                  {peer.avatar ? <img src={peer.avatar} alt="" className="w-20 h-20 rounded-full object-cover" /> : <span className="w-20 h-20 rounded-full bg-primary/20 text-primary text-3xl flex items-center justify-center">{peer.name?.[0] || '?'}</span>}
                  {mode === 'audio' && remoteStreams[peerId] && <audio autoPlay ref={(element) => {
                    if (element && element.srcObject !== remoteStreams[peerId]) element.srcObject = remoteStreams[peerId];
                  }} />}
                </div>
              )}
              <div className="p-3 flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary">{mode === 'video' ? 'videocam' : 'volume_up'}</span>{peer.name || 'Community member'}
              </div>
            </div>
          ))}
          {Object.keys(participants).length === 0 && (
            <div className="sm:col-span-2 rounded-xl border border-dashed border-white/[0.12] p-8 text-center text-on-surface-variant">
              Waiting for others to join…
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button type="button" onClick={toggleMute} className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm flex items-center gap-2" aria-pressed={muted}>
            <span className="material-symbols-outlined text-[18px]">{muted ? 'mic_off' : 'mic'}</span>{muted ? 'Unmute' : 'Mute'}
          </button>
          {mode === 'video' && (
            <button type="button" onClick={toggleCamera} className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm flex items-center gap-2" aria-pressed={cameraOff}>
              <span className="material-symbols-outlined text-[18px]">{cameraOff ? 'videocam_off' : 'videocam'}</span>{cameraOff ? 'Turn camera on' : 'Turn camera off'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
