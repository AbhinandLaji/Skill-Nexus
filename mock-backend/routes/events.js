const express = require('express');
const Channel = require('../models/Channel');
const CommunityEvent = require('../models/CommunityEvent');
const { protect } = require('../middleware/auth');

const router = express.Router();
const member = (channel, userId) => String(channel.admin) === String(userId) || channel.members.some((id) => String(id) === String(userId));
const serialize = (event, userId) => ({
    id: event._id.toString(), channelId: event.channelId.toString(), title: event.title,
    description: event.description, startsAt: event.startsAt, location: event.location,
    createdBy: event.createdBy.toString(), attendeeCount: event.attendees.length,
    attending: event.attendees.some((id) => String(id) === String(userId))
});

router.get('/:channelId/events', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this community to view events.' });
        const events = await CommunityEvent.find({ channelId: channel._id, startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).limit(100);
        return res.json(events.map((event) => serialize(event, req.user._id)));
    } catch (error) { return res.status(400).json({ message: 'Unable to load events.' }); }
});

router.post('/:channelId/events', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this community to schedule events.' });
        const title = String(req.body.title || '').trim();
        const description = String(req.body.description || '').trim();
        const location = String(req.body.location || '').trim();
        const startsAt = new Date(req.body.startsAt);
        if (!title || title.length > 120 || !Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) return res.status(400).json({ message: 'Add an event title and a future date and time.' });
        if (description.length > 2000 || location.length > 200) return res.status(400).json({ message: 'Event details exceed the length limit.' });
        const event = await CommunityEvent.create({ channelId: channel._id, title, description, location, startsAt, createdBy: req.user._id, attendees: [req.user._id] });
        return res.status(201).json(serialize(event, req.user._id));
    } catch (error) { return res.status(500).json({ message: 'Unable to schedule event.' }); }
});

router.post('/:channelId/events/:eventId/rsvp', protect, async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found.' });
        if (!member(channel, req.user._id)) return res.status(403).json({ message: 'Join this community to RSVP.' });
        const event = await CommunityEvent.findOne({ _id: req.params.eventId, channelId: channel._id });
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        const attending = event.attendees.some((id) => String(id) === String(req.user._id));
        if (attending) event.attendees.pull(req.user._id);
        else event.attendees.addToSet(req.user._id);
        await event.save();
        return res.json(serialize(event, req.user._id));
    } catch (error) { return res.status(400).json({ message: 'Unable to update RSVP.' }); }
});

module.exports = router;
