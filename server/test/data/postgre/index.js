const dotenv = require('dotenv').config({ path: __dirname + '/../../../.env' });
const PostgresDatabaseManager = require('../../../db/postgresql');
const testData = require('../example-db-data.json');

async function resetTables(mgr) {
    console.log("Recreating all PostgreSQL tables...");
    await mgr.sequelize.sync({ force: true });
    console.log("Table recreated");
}

async function fillUsers(mgr) {
    console.log("Filling users...");

    const userIdEmail = {};

    for (const u of testData.users) {
        const created = await mgr.User.create({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            passwordHash: u.passwordHash
        });
        userIdEmail[u.email] = created.id;
    }

    console.log("Users filled");
    return userIdEmail;
}

async function fillPlaylistsAndSongs(mgr, userIdEmail) {
    console.log("Filling playlists and songs...");

    for(const p of testData.playlists) {
        const ownerId = userIdEmail[p.ownerEmail];
        if(!ownerId) {
            console.warn(`WARNING: No user with email ${p.ownerEmail}; skipping playlist ${p.name}`);
            continue;
        }
        
        const createdPlaylist = await mgr.Playlist.create({
            name: p.name,
            ownerEmail: p.ownerEmail,
            userId: ownerId
        });

        for (let i = 0; i < p.songs.length; i++) {
            const s = p.songs[i]
            await mgr.Song.create({
                playlistId: createdPlaylist.id,
                title: s.title,
                artist: s.artist,
                year: s.year,
                youTubeId: s.youTubeId,
                index: i
            });
        }
    }

    console.log("Playlists and songs filled");
}

async function resetPostgre() {
    console.log("Resetting PostgresSQL DB");

    const mgr = new PostgresDatabaseManager();
    await mgr.connect();

    await resetTables(mgr);

    const emailToId = await fillUsers(mgr);

    await fillPlaylistsAndSongs(mgr, emailToId);

    await mgr.disconnect();

    console.log("PostgreSQL reset complete");
}

resetPostgre().catch(err => {
    console.error("Error resetting PostgreSQL:", err);
})