class DatabaseManager {

    async connect(connectString) {
        throw new Error("connect() not implemented");
    }

    async disconnect() {
        throw new Error("disconnect() not implemented");
    }

    async getUserEmail(email) {
        throw new Error("disconnect() not implemented");
    }

    async getUserId(id) {
        throw new Error("disconnect() not implemented");
    }

    async createUser({firstName, lastName, email, passwordHash}) {
        throw new Error("createUser not implemented");
    }

    async createUserPlaylist(userId, playlistData) {
        throw new Error("createUserPlaylist not implemented");
    }

    async deletePlaylist(userId, playlistId) {
        throw new Error("deletePlaylist not implemented");
    }

    async getPlaylistId(userId, playlistId) {
        throw new Error("getPlaylistById not implemented");
    }

    async getUserPlaylistPairs(userId) {
        throw new Error("getPlaylistPairs not implemeneted");
    }

    async getAllPlaylists() {
        throw new Error("getAllPlaylists not implemented");
    }

    async updateUserPlaylist(userId, playlistId, updateData) {
        throw new Error("updatedPlaylist not implemented");
    }
}

module.exports = DatabaseManager;