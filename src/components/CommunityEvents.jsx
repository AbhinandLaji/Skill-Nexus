import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const localInputDate = (date) => {
  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 16);
};

export default function CommunityEvents({ channelId }) {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(() => localInputDate(new Date(Date.now() + 60 * 60 * 1000)));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.getCommunityEvents(channelId).then((items) => { if (active) setEvents(items); })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load events.'); });
    return () => { active = false; };
  }, [channelId]);

  const createEvent = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const created = await api.createCommunityEvent(channelId, { title, description, location, startsAt: new Date(startsAt).toISOString() });
      setEvents((current) => [...current, created].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)));
      setTitle(''); setDescription(''); setLocation('');
    } catch (createError) { setError(createError.message || 'Could not schedule event.'); }
    finally { setBusy(false); }
  };

  const toggleRsvp = async (eventId) => {
    setBusy(true); setError('');
    try {
      const updated = await api.rsvpCommunityEvent(channelId, eventId);
      setEvents((current) => current.map((item) => item.id === eventId ? updated : item));
    } catch (rsvpError) { setError(rsvpError.message || 'Could not update RSVP.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="mx-4 sm:mx-6 my-4 rounded-xl bg-surface-container border border-white/[0.08] p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-on-surface mb-4">Scheduled events</h2>
      {error && <p role="alert" className="mb-3 rounded-lg bg-error-container/20 p-3 text-sm text-error">{error}</p>}
      <form onSubmit={createEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <input maxLength={200} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location or meeting link" className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <input maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description (optional)" className="rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <div className="sm:col-span-2 flex justify-end"><button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">Schedule event</button></div>
      </form>
      {events.length === 0 ? <p className="text-sm text-on-surface-variant">No upcoming events. Schedule one for your community.</p> : <div className="space-y-3">{events.map((event) => <article key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3"><div className="min-w-0"><h3 className="font-medium text-on-surface">{event.title}</h3><p className="text-xs text-on-surface-variant">{new Date(event.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}{event.location ? ` · ${event.location}` : ''}</p>{event.description && <p className="mt-1 text-sm text-on-surface-variant">{event.description}</p>}<p className="mt-1 text-xs text-on-surface-variant">{event.attendeeCount} attending</p></div><button type="button" disabled={busy} onClick={() => toggleRsvp(event.id)} className="rounded-lg bg-primary/15 px-3 py-2 text-sm text-primary disabled:opacity-50">{event.attending ? 'Going · Cancel' : 'RSVP'}</button></article>)}</div>}
    </section>
  );
}
