/*
    This is our http api, which we use to send requests to
    our back-end API. Note we`re using the Axios library
    for doing this, which is an easy to use AJAX-based
    library. We could (and maybe should) use Fetch, which
    is a native (to browsers) standard, but Axios is easier
    to use when sending JSON back and forth and it`s a Promise-
    based API which helps a lot with asynchronous communication.
    
    @author McKilla Gorilla
*/

const BASE_URL = 'http://localhost:4000/store';

async function handleResponse(response) {
    const type = response.headers.get('content-type');
    const hasJson = type && type.includes('application/json');
    const data = hasJson ? await response.json() : null;

    if(!response.ok) {
        const error = (data && data.errorMessage) || response.statusText;
        return Promise.reject({ response: { status: response.status, data: { errorMessage: error } } });
    }

    return {
        status: response.status,
        data: data
    };
}

function createFetchOptions(method, body=null) {
    const options = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    return options;
}

// THESE ARE ALL THE REQUESTS WE`LL BE MAKING, ALL REQUESTS HAVE A
// REQUEST METHOD (like get) AND PATH (like /top5list). SOME ALSO
// REQUIRE AN id SO THAT THE SERVER KNOWS ON WHICH LIST TO DO ITS
// WORK, AND SOME REQUIRE DATA, WHICH WE WE WILL FORMAT HERE, FOR WHEN
// WE NEED TO PUT THINGS INTO THE DATABASE OR IF WE HAVE SOME
// CUSTOM FILTERS FOR QUERIES
export const createPlaylist = async (newListName, newSongs, userEmail) => {
    const response = await fetch(`${BASE_URL}/playlist/`, createFetchOptions('POST', {
        // SPECIFY THE PAYLOAD
        name: newListName,
        songs: newSongs,
        ownerEmail: userEmail
    }));
    return handleResponse(response)
}

export const deletePlaylistById = async (id) => {
    const response = await fetch(`${BASE_URL}/playlist/${id}`, createFetchOptions('DELETE'));
    return handleResponse(response);
}

export const getPlaylistById = async (id) => {
    const response = await fetch(`${BASE_URL}/playlist/${id}`, createFetchOptions('GET'));
    return handleResponse(response);
}

export const getPlaylistPairs = async () => {
    const response = await fetch(`${BASE_URL}/playlistpairs/`, createFetchOptions('GET'));
    return handleResponse(response);
}

export const updatePlaylistById = async (id, playlist) => {
    const response = await fetch(`${BASE_URL}/playlist/${id}`, createFetchOptions('PUT', {
        // SPECIFY THE PAYLOAD
        playlist : playlist
    }));
    return handleResponse(response);
}

const apis = {
    createPlaylist,
    deletePlaylistById,
    getPlaylistById,
    getPlaylistPairs,
    updatePlaylistById
}

export default apis
