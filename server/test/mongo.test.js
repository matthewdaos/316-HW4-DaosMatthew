import { beforeAll, beforeEach, afterEach, afterAll, expect, test } from 'vitest';
const dotenv = require('dotenv').config({ path: __dirname + '/.env' });

/**
 * Vitest test script for the Playlister app's Mongo Database Manager. Testing should verify that the Mongo Database Manager 
 * will perform all necessarily operations properly.
 *  
 * Scenarios we will test:
 *  1) Reading a User from the database
 *  2) Creating a User in the database
 *  3) ...
 * 
 * You should add at least one test for each database interaction. In the real world of course we would do many varied
 * tests for each interaction.
 */

const dbManager = require('../db');

let testUserId;
let testPlaylistId;
const testUserData = {
    firstName: "Alice",
    lastName: "Bob",
    email: "alice@bob.com",
    passwordHash: "$2a$10$dPEwsAVi1ojv2RfxxTpZjuKSAbep7zEKb5myegm.ATbQ4sJk4agGu"
};

const testPlaylistData = {
    name: "Some playlist",
    ownerEmail: "alice@bob.com",
    songs: [
        {
            title: "Doot Doot",
            artist: "Skrilla",
            year: 2024,
            youTubeId: "07xpV4ix2K8"
        },
        {
            title: "41 Song",
            artist: "Blizzi Boi",
            year: 2022,
            youTubeId: "EAcRC9dmZoA"
        }
    ]
};

/**
 * Executed once before all tests are performed.
 */
beforeAll(async () => {
    // SETUP THE CONNECTION VIA MONGOOSE JUST ONCE - IT IS IMPORTANT TO NOTE THAT INSTEAD
    // OF DOING THIS HERE, IT SHOULD BE DONE INSIDE YOUR Database Manager (WHICHEVER)
    console.log(`Testing with ${process.env.DB_TYPE} database\n`);

    await dbManager.connect();
    const existingUser = await dbManager.getUserEmail(testUserData.email);
    if(existingUser) {
        const playlists = await dbManager.getUserPlaylistPairs(existingUser._id);
        for (const playlist of playlists) {
            await dbManager.deletePlaylist(existingUser._id, playlist._id);
        }
    }
});

/**
 * Executed before each test is performed.
 */
beforeEach(async () => {
    console.log('Running tests... ');
});

/**
 * Executed after each test is performed.
 */
afterEach(() => {
    console.log('Test complete')
});

/**
 * Executed once after all tests are performed.
 */
afterAll(async () => {
    if(testUserId) {
        const playlists = await dbManager.getUserPlaylistPairs(testUserId);
        for (const playlist of playlists) {
            await dbManager.deletePlaylist(testUserId, playlist._id)
        }
    }
    await dbManager.disconnect();
    console.log('Database disconnected');
});

/**
 * Vitest test to see if the Database Manager can get a User.
 */
test('Test #1) Reading a User from the Database', async () => {
    const fetchedUser = await dbManager.getUserEmail("joe@shmo.com");

    expect(fetchedUser).toBeDefined();
    expect(fetchedUser._id).toBeDefined();
    expect(fetchedUser.firstName).toBe("Joe");
    expect(fetchedUser.lastName).toBe("Shmo");
    expect(fetchedUser.email).toBe("joe@shmo.com");
});

/**
 * Vitest test to see if the Database Manager can create a User
 */
test('Test #2) Creating a User in the Database', async () => {
    const expectedUser = await dbManager.createUser(testUserData);

    testUserId = expectedUser._id;

    expect(expectedUser).toBeDefined();
    expect(expectedUser._id).toBeDefined();
    expect(expectedUser.firstName).toBe(testUserData.firstName);
    expect(expectedUser.lastName).toBe(testUserData.lastName);
    expect(expectedUser.email).toBe(testUserData.email);
    expect(expectedUser.passwordHash).toBe(testUserData.passwordHash);

});

// THE REST OF YOUR TEST SHOULD BE PUT BELOW

/**
 * Vitest to see if the Database Manager returns a user by their id
 */
test('Test #3) Reading a User by ID', async() => {
    const fetchedUser = await dbManager.getUserId(testUserId);

    expect(fetchedUser).toBeDefined();
    expect(fetchedUser._id.toString()).toBe(testUserId.toString());
    expect(fetchedUser.firstName).toBe(testUserData.firstName);
    expect(fetchedUser.lastName).toBe(testUserData.lastName);
    expect(fetchedUser.email).toBe(testUserData.email);
    expect(fetchedUser.passwordHash).toBe(testUserData.passwordHash);
});

/**
 * Vitest to see if the Database Manager can create a playlist for a user
 */
test('Test #4) Creating a Playlist for User', async() => {
    const createdPlaylist = await dbManager.createUserPlaylist(testUserId, testPlaylistData);
    testPlaylistId = createdPlaylist._id;

    expect(createdPlaylist).toBeDefined();
    expect(createdPlaylist._id).toBeDefined();
    expect(createdPlaylist.name).toBe(testPlaylistData.name);
    expect(createdPlaylist.ownerEmail).toBe(testPlaylistData.ownerEmail);
    expect(createdPlaylist.songs).toBeDefined();
    expect(createdPlaylist.songs.length).toBe(testPlaylistData.songs.length);
    expect(createdPlaylist.songs[0].title).toBe(testPlaylistData.songs[0].title);
});

/**
 * Vitest to see if the Database Manager returns a playlist by their ID
 */
test('Test #5) Reading a Playlist by ID', async() => {
    const fetchedPlaylist = await dbManager.getPlaylistId(testUserId, testPlaylistId);

    expect(fetchedPlaylist).toBeDefined();
    expect(fetchedPlaylist._id.toString()).toBe(testPlaylistId.toString());
    expect(fetchedPlaylist.name).toBe(testPlaylistData.name);
    expect(fetchedPlaylist.ownerEmail).toBe(testPlaylistData.ownerEmail);
    expect(fetchedPlaylist.songs.length).toBe(testPlaylistData.songs.length);
    expect(fetchedPlaylist.songs[0].title).toBe(testPlaylistData.songs[0].title);
    expect(fetchedPlaylist.songs[1].title).toBe(testPlaylistData.songs[1].title);
});

/**
 * Vitest to see if the Database Manager can update a playlist
 */
test('Test #6) Update a Playlist in the Database', async() => {
    const updateData = {
        name: "New Playlist",
        songs: [
            {
                title: "Like Him",
                artist: "Tyler, The Creator",
                year: 2024,
                youTubeId: "Z0CQf3JDKAY"
            }
        ]
    };

    const result = await dbManager.updateUserPlaylist(testUserId, testPlaylistId, updateData);
    
    expect(result.ok).toBe(true);
    expect(result.playlist).toBeDefined();

    const fetchedPlaylist = await dbManager.getPlaylistId(testUserId, testPlaylistId);
    expect(fetchedPlaylist.name).toBe(updateData.name);
    expect(fetchedPlaylist.songs.length).toBe(updateData.songs.length);
    expect(fetchedPlaylist.songs[0].title).toBe(updateData.songs[0].title);
});

/**
 * Vitest to see if the Database Manager can get user playlist pairs
 */
test('Test #7) Getting User Playlist Pairs', async() => {
    const pairs = await dbManager.getUserPlaylistPairs(testUserId);

    expect(pairs).toBeDefined();
    expect(Array.isArray(pairs)).toBe(true);
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0]._id).toBeDefined();
    expect(pairs[0].name).toBeDefined();
});

/**
 * Vitest to see if Database Manager can get all playlists
 */
test('Test #8) Getting all Playlists', async() => {
    const allPlaylists = await dbManager.getAllPlaylists();

    expect(allPlaylists).toBeDefined();
    expect(Array.isArray(allPlaylists)).toBe(true)
    expect(allPlaylists.length).toBeGreaterThan(0);
})

/**
 * Vitest to see if Database Manager can delete a playlist
 */
test('Test #9) Deleting a playlist from Database', async() => {
    const result = await dbManager.deletePlaylist(testUserId, testPlaylistId);

    expect(result.ok).toBe(true);

    const fetchedPlaylist = await dbManager.getPlaylistId(testUserId, testPlaylistId);
    expect(fetchedPlaylist).toBeNull();

    testPlaylistId = null;
})