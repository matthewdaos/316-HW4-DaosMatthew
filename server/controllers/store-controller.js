const dbManager = require('../db')
const auth = require('../auth')
/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/
createPlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body;
    console.log("createPlaylist body: " + JSON.stringify(body));
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        const playlist = await dbManager.createUserPlaylist(req.userId, body);
        return res.status(201).json({ playlist });
    } catch(err) {
        console.error(err);
        return res.status(400).json({ errorMessage: 'Playlist Not Created' })
    }
}

deletePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("delete Playlist with id: " + JSON.stringify(req.params.id));
    console.log("delete " + req.params.id);
    
    const result = await dbManager.deletePlaylist(req.userId, req.params.id);
    if(!result.ok) {
        if(result.reason === 'unauthorized') {
            return res.status(400).json({ errorMessage: 'authentication error' });
        } else {
            return res.status(404).json({ errorMessage: 'Playlist not found!' });
        }
    }

    return res.status(200).json({});
}
getPlaylistById = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("Find Playlist with id: " + JSON.stringify(req.params.id));

    const list = await dbManager.getPlaylistId(req.userId, req.params.id);
    if(!list) {
        return res.status(400).json({ success: false, description: "authentication error or playlist not found "});
    }
    return res.status(200).json({ success: true, playlist: list })
}

getPlaylistPairs = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("getPlaylistPairs");
    const pairs = await dbManager.getUserPlaylistPairs(req.userId);
    return res.status(200).json({ success: true, idNamePairs: pairs });
}
getPlaylists = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    
    const playlists = await dbManager.getAllPlaylists();
    if(!playlists || playlists.length === 0) {
        return res.status(404).json({ success: false, error: 'Playlist not found' });
    }

    return res.status(200).json({ success: true, data: playlists });
}
updatePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("req.body.name: " + req.body.name);

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }

    const result = await dbManager.updateUserPlaylist(req.userId, req.params.id, body.playlist);
    if(!result.ok) {
        if(result.reason === 'unauthorized') {
            return res.status(400).json({ success: false, description: "authentication error"})
        } else {
            return res.status(404).json({ message: 'Playlist not found!'})
        }
    }

    return res.status(200).json({ success: true, id: result.playlist._id, message: 'Playlist updated!' })
}
module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    updatePlaylist
}