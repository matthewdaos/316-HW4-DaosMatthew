const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const DatabaseManager = require('../DatabaseManager');
dotenv.config();

class PostgresDatabaseManager extends DatabaseManager {

    constructor() {
        super();

        this.sequelize = new Sequelize(
            process.env.PG_DB, 
            process.env.PG_USER,
            process.env.PG_PASS,
            {
                host: process.env.PG_HOST,
                dialect: 'postgres',
                logging: false
            }
        );


        this.User = this.sequelize.define('User', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            firstName: { type: DataTypes.STRING, allowNull: false },
            lastName: { type: DataTypes.STRING, allowNull: false },
            email: { type: DataTypes.STRING, allowNull: false, unique: true },
            passwordHash: { type: DataTypes.STRING, allowNull: false }
        }, {
            tableName: 'users'
        });

        this.Playlist = this.sequelize.define('Playlist', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: DataTypes.STRING, allowNull: false },
            ownerEmail: { type: DataTypes.STRING, allowNull: false }
        }, {
            tableName: 'playlists'
        });

        this.Song = this.sequelize.define('Song', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            title: DataTypes.STRING,
            artist: DataTypes.STRING,
            year: DataTypes.INTEGER,
            youtubeId: DataTypes.STRING,
            index: DataTypes.INTEGER
        }, {
            tableName: 'songs'
        });

        this.User.hasMany(this.Playlist, { foreignKey: 'userId' });
        this.Playlist.belongsTo(this.User, { foreignKey: 'userId' });

        this.Playlist.hasMany(this.Song, { foreignKey: 'playlistId', as: 'songs' });
        this.Song.belongsTo(this.Playlist, { foreignKey: 'playlistId' });
    }

    async connect() {
        await this.sequelize.sync();
    }

    async disconnect() {
        await this.sequelize.close();
    }

    _wrapUser(u) {
        if(!u) return null;
        return {
            _id: u.id, 
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            passwordHash: u.passwordHash
        };
    } 

    async getUserId(userId) {
        const u = await this.User.findByPk(userId);
        return this._wrapUser(u);
    }

    async getUserEmail(email) {
        const u = await this.User.findOne({ where: { email } });
        return this._wrapUser(u);
    }

    async createUser({ firstName, lastName, email, passwordHash}) {
        const u = await this.User.create({
            firstName, lastName, email, passwordHash
        });
        return this._wrapUser(u);
    }

    async createUserPlaylist(userId, playlistData) {
        const owner = await this.User.findByPk(userId);
        if(!owner) throw new Error("No user found");

        const p = await this.Playlist.create({
            name: playlistData.name,
            ownerEmail: owner.email,
            userId: owner.id
        });

        for(let i = 0; i < playlistData.songs.length; i++) {
            const s = playlistData.songs[i];
            await this.Song.create({
                playlist: p.id,
                title: s.title,
                artist: s.artist,
                year: s.year,
                youTubeId: s.youTubeId,
                index: i
            });
        }

        return { _id: p.id, ...p.get() };
    }

    async deletePlaylist(userId, playlistId) {
        const p = await this.Playlist.findByPk(playlistId);
        if(!p) return { ok: false, reason: "not found" };

        if (p.userId !== Number(userId)) {
            return { ok: false, reason: "unauthorized" };
        }

        await this.Song.destroy({ where: { playlistId: playlistId } });

        await this.Playlist.destroy({ where: { id: playlistId } });
        return { ok: true };
    }

    async getPlaylistId(userId, playlistId) {
        const p = await this.Playlist.findByPk(playlistId, {
            include: [{ model: this.Song, as: 'songs' }],
            order: [[{ model: this.Song, as: 'songs' }, 'index', 'ASC']]
        });
        if(!p) return null;
        if(p.userId !== Number(userId)) return null;
        return {
            _id: p.id,
            name: p.name, 
            ownerEmail: p.ownerEmail,
            songs: p.songs.map(song => ({
                title: song.title,
                artist: song.artist,
                year: song.year,
                youTubeId: song.youTubeId
            }))
        };
    }

    async getUserPlaylistPairs(userId) {
        const lists = await this.Playlist.findAll({
            where: { userId: userId },
            attributes: ['id', 'name']
        });

        return lists.map(l => ({ _id: l.id, name: l.name } ));
    }

    async getAllPlaylists() {
        const lists = await this.Playlist.findAll({
            include: [{ model: this.Song, as: 'songs' }],
            order: [['id', 'ASC'], [{ model: this.Song, as: 'songs' }, 'index', 'ASC' ]]
        });

        return lists.map(p => ({
            _id: p.id,
            name: p.name,
            ownerEmail: p.ownerEmail,
            songs: p.songs.map(song => ({
                title: song.title,
                artist: song.artist,
                year: song.year,
                youTubeId: song.youTubeId
            }))
        }));
    }

    async updateUserPlaylist(userId, playlistId, updateData) {
        const p = await this.Playlist.findByPk(playlistId, {
            include: [{ model: this.Song, as: 'songs' }]
        });

        if(!p) return { ok: false, reason: "not found" };
        if (p.userId !== Number(userId)) return { ok: false, reason: "unauthorized" };

        p.name = updateData.name;
        await p.save();

        await this.Song.destroy({ where: { playlistId: p.id } });
        for (let i = 0; i < updateData.songs.length; i++) {
            const s = updateData.songs[i];
            await this.Song.create({
                playlistId: p.id,
                title: s.title,
                artist: s.artist,
                year: s.year,
                youtubeId: s.youtubeId,
                index: i
            });
        }

        return { ok: true, playlist: { _id: p.id, name: p.name }};
    }
}

module.exports = PostgresDatabaseManager;