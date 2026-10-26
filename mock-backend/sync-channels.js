require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('./models/Skill');
const Channel = require('./models/Channel');
const User = require('./models/User');

async function syncChannels() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Get an existing user for the admin field requirement
        const adminUser = await User.findOne();
        const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

        const skills = await Skill.find();
        console.log(`Found ${skills.length} skills in database.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const skill of skills) {
            const skillIdStr = skill._id.toString();
            // Format slug as #<skill-name>-help (lowercase, alphanumeric + hyphens)
            const cleanSlug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const channelName = `#${cleanSlug}-help`;

            // Check if channel already exists for this skillId or name
            const existingChannel = await Channel.findOne({
                $or: [
                    { skillId: skillIdStr },
                    { name: channelName }
                ]
            });

            if (existingChannel) {
                // Ensure skillId is set if it was missing
                if (!existingChannel.skillId || existingChannel.skillId === 'squad') {
                    existingChannel.skillId = skillIdStr;
                    await existingChannel.save({ validateBeforeSave: false });
                }
                console.log(`Channel for ${skill.name} already exists: ${existingChannel.name} (${existingChannel._id})`);
                skippedCount++;
            } else {
                const newChan = await Channel.create({
                    name: channelName,
                    skillId: skillIdStr,
                    channelType: 'text',
                    category: 'General',
                    description: `Official campus community channel for ${skill.name}. Share resources, ask questions, and collaborate.`,
                    admin: adminId,
                    members: [],
                    isPrivate: false,
                    memberCount: 0,
                    unreadCount: 0
                });
                console.log(`+ Created channel: ${newChan.name} (skillId: ${skillIdStr})`);
                createdCount++;
            }
        }

        console.log(`\nSync complete: ${createdCount} channels created, ${skippedCount} existing channels retained.`);
        
        const allChannels = await Channel.find({}, 'name skillId memberCount');
        console.log('Current Channels in DB:', allChannels.map(c => ({ name: c.name, skillId: c.skillId })));

        process.exit(0);
    } catch (err) {
        console.error('Error during channel sync:', err);
        process.exit(1);
    }
}

syncChannels();
