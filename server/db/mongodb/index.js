const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DatabaseManager = require('../DatabaseManager')
dotenv.config();


const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const PlaylistSchema = new Schema({
    name: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    song: [{
        title: String,
        artist: String,
        year: Number,
        youTubeId: String
    }]
}, { timestamps: true });

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    playlists: [{ type: ObjectId, ref: 'Playlist' }]
}, { timestamps: true });

const PlaylistModel = mongoose.model('Playlist', PlaylistSchema);
const UserModel = mongoose.model('User', UserSchema);

class MongoDatabaseManager extends DatabaseManager {
    async connect() {
        await mongoose
            .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
            .catch(e => {
                console.error('Mongo connection error', e.message);
            })
    }
    
    async disconnect() {
        await mongoose.connection.close();
    }

    async getUserEmail(email) {
        return await UserModel.findOne({ email: email });
    }

    async getUserId(userId) {
        return await UserModel.findOne({ _id: userId});
    }

    async createUser({ firstName, lastName, email, passwordHash}) {
        const newUser = new UserModel({
            firstName, 
            lastName,
            email,
            passwordHash,
            playlists: []
        });
        const saved = await newUser.save();
        return saved;
    }

    async createUserPlaylist(userId, playlistData) {
        const playlist = new PlaylistModel(playlistData);

        const user = await UserModel.findOne({ _id: userId });
        user.playlists.push(playlist._id);

        await user.save();
        await playlist.save();

        return playlist;
    }

    async deletePlaylist(userId, playlistId) {
        const playlist = await PlaylistModel.findById({ _id: playlistId });
        if(!playlist) return { ok: false, reason: "not found" };

        const owner = await UserModel.findOne({ email: playlist.ownerEmail });
        if(!owner || owner._id.toString() !== userId.toString()) {
            return { ok: false, reason: "unauthorized" };
        }

        await PlaylistModel.findOneAndDelete({ _id: playlistId });

        owner.playlists = owner.playlists.filter(
            pid => pid.toString() !== playlistId.toString()
        );
        await owner.save();

        return { ok: true };
    }

    async getPlaylistId(userId, playlistId) {
        const list = await PlaylistModel.findById({ _id: playlistId });
        if(!list) return null;

        const owner = await UserModel.findOne({ email: list.ownerEmail });
        if(!owner || owner._id.toString() !== userId.toString()) {
            return null;
        }

        return list;
    }

    async getUserPlaylistPairs(userId) {
        const user = await UserModel.findOne({ _id: userId });
        if(!user) return [];

        const playlists = await PlaylistModel.find({ ownerEmail: user.email });

        const pairs = playlists.map(list => ({
            _id: list._id,
            name: list.name
        }));

        return pairs;
    }

    async getAllPlaylists() {
        const playlists = await PlaylistModel.find({});
        return playlists;
    }

    async updatePlaylist(userId, playlistId, updateData) {
        const list = await PlaylistModel.findOne({ _id: playlistId });
        if(!list) return { ok: false, reason: "not found" };

        const owner = await UserModel.findOne({ email: list.ownerEmail });
        if(!owner || owner._id.toString() !== userId.toString()) {
            return { ok: false, reason: "unauthorized" };
        }

        list.name = updateData.name;
        list.songs = updateData.songs;

        await list.save();
        return { ok: true, playlist: list };
    }
}

module.exports = MongoDatabaseManager;