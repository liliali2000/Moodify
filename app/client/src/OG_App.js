import React, { Component } from 'react';
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import { Field, Form, Formik, withFormik } from 'formik';
import Select from 'react-select';
import * as Yup from 'yup';

import MultiSelect from '@khanacademy/react-multi-select';
import selectPanel from '@khanacademy/react-multi-select/dist/select-panel';
const spotifyApi = new SpotifyWebApi();

/* 
Okay so right now if you create a second playlist, it'll have the source options
stay selected from whatever you had previously. Not a big deal, but ideally
it would reset fully and so deselect all. Could be done with an easy setState to this.state.selected.

getting and setting the userId works when you first login but on refresh
and stuff it doesn't work

^that may not be true, but more importantly, my arr variable in the 
long ass function createPlaylist() like isn't real? I can't loop
through it, and when I try to index it's undefined, but I can log the 
whole thing to the console? maybe something to due w async function idk

okay yeah so after using a setTimeout it worked so  it's because it immedaitely
goes to do the rest of the code involving the array and such without 
waiting for the API call to finish. There may be other spots in my 
code that do this. 

library documentation: https://doxdox.org/jmperez/spotify-web-api-js#src-spotify-web-api.js-constr.prototype.getme

I use a loop with IN instead of OF in the beginning of long function
That should be changed.
*/

class App extends Component {
    constructor() {
        super();
        const params = this.getHashParams();
        const token = params.access_token;
        if (token) {
            spotifyApi.setAccessToken(token);
        }
        this.state = {
            loggedIn: token ? true : false,
            playlistCreated: false,
            nowPlaying: { name: 'Not Checked', albumArt: '' },
            name: '',
            description: '',
            mood: 'happy',
            maxS: 0,
            userSources: [],
            selected: [],
            userId: '',
        };
    }

    getHashParams() {
        var hashParams = {};
        var e,
            r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        e = r.exec(q);
        while (e) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
            e = r.exec(q);
        }
        return hashParams;
    }

    getPlaylistNames() {
        return spotifyApi.getUserPlaylists().then(
            function (data) {
                var arr = [];
                for (var index in data.items) {
                    arr.push({
                        label: data.items[index].name,
                        value: data.items[index].id,
                    });
                }
                return arr;
            },
            function (err) {
                console.error(err);
            }
        );
    }

    createPlaylist() {
        let arr = [];
        for (var idIndex in this.state.selected) {
            try {
                for (var i = 0; i < 5; i++) {
                    spotifyApi
                        .getPlaylistTracks(this.state.selected[idIndex], {
                            offset: 100 * i,
                        })
                        .then(
                            function (data) {
                                for (var index in data.items) {
                                    arr.push(data.items[index].track.id);
                                }
                            },
                            function (err) {
                                console.error(err);
                            }
                        );
                }
            } catch (err) {
                console.error(err);
            }
        }
        var trackIds = [];

        setTimeout(() => {
            var len = arr.length;
            var audioFeatures = [];
            for (var i = 0; i < len; i += 100) {
                try {
                    var tempIds = arr.slice(i, i + 100);
                } catch {
                    tempIds = arr.slice(i);
                }
                spotifyApi
                    .getAudioFeaturesForTracks(tempIds)
                    .then(function (data) {
                        audioFeatures = audioFeatures.concat(
                            data.audio_features
                        );
                    });
            }
            setTimeout(function () {
                console.log(audioFeatures);
            }, 1000);

            for (var value of arr) {
                trackIds.push('spotify:track:' + value);
            }
            // this.createEmpty(trackIds);
        }, 1000);

        return arr;
    }

    addToPlaylist(playlistId, trackIds) {
        return spotifyApi.addTracksToPlaylist(playlistId, trackIds).then(
            function (data) {
                console.log(data);
            },
            function (err) {
                console.error(err);
            }
        );
    }

    getAudioFeatures(trackIds) {
        return spotifyApi.getAudioFeaturesForTracks(trackIds).then(
            function (data) {
                return data;
            },
            function (err) {
                console.error(err);
            }
        );
    }

    createEmpty(trackIds) {
        let newId = 'hello';
        spotifyApi.createPlaylist(this.state.userId, { name: 'cool' }).then(
            function (data) {
                newId = data.id;
            },
            function (err) {
                console.error(err);
            }
        );
        setTimeout(() => {
            var len = trackIds.length;
            for (var i = 0; i < len; i += 100) {
                try {
                    var tempTracks = trackIds.slice(i, i + 100);
                } catch {
                    tempTracks = trackIds.slice(i);
                }
                this.addToPlaylist(newId, tempTracks);
            }
        }, 1000);
    }

    componentDidMount() {
        if (this.state.loggedIn) {
            this.getPlaylistNames()
                .then((names) => names)
                .then((names) => this.setState({ userSources: names }));
            this.getUserId()
                .then((id) => id)
                .then((id) => this.setState({ userId: id }));
        }
        console.log('mounted and set state of sources!');
    }

    getUserId() {
        return spotifyApi.getMe().then(
            function (data) {
                return data.id;
            },
            function (err) {
                console.error(err);
            }
        );
    }

    render() {
        if (this.state.loggedIn && this.state.playlistCreated === false) {
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />
                    <Formik
                        initialValues={{
                            name: '',
                            description: '',
                            mood: 'happy',
                            maxS: 0,
                        }}
                        onSubmit={(values, { setSubmitting }) => {
                            setTimeout(() => {
                                console.log(values);
                                setSubmitting(false);
                                this.setState((state) => {
                                    return {
                                        name: values.name,
                                        description: values.description,
                                        mood: values.mood,
                                        maxS: values.maxS,
                                        playlistCreated: true,
                                    };
                                });
                            }, 400);
                        }}
                    >
                        <Form>
                            <br></br>Desired source playlists
                            <MultiSelect
                                options={this.state.userSources}
                                selected={this.state.selected}
                                onSelectedChanged={(selected) =>
                                    this.setState({ selected })
                                }
                            />
                            <br></br>Playlist Name
                            <Field name="name" placeholder="Playlist name" />
                            <br></br>Description
                            <Field
                                name="description"
                                placeholder="Playlist description"
                            />
                            <br></br>Mood
                            <Field as="select" name="mood">
                                <option value="happy">Happy</option>
                                <option value="sad">Sad</option>
                                <option value="dance">Dance</option>
                            </Field>
                            <br></br>Max Songs
                            <Field type="number" name="maxS" placeholder={0} />
                            <br></br>
                            <button type="submit">Create Playlist</button>
                        </Form>
                    </Formik>
                    <br></br>
                    <button onClick={() => this.createPlaylist()}>
                        check on state
                    </button>
                    {/* <h3>Now Playing (test app)</h3>
                    <div>Now Playing: {this.state.nowPlaying.name}</div>
                    <div>
                        <img
                            src={this.state.nowPlaying.albumArt}
                            style={{ height: 150 }}
                        />
                    </div>
                    {this.state.loggedIn && (
                        <button onClick={() => this.getNowPlaying()}>
                            Check Now Playing
                        </button>
                    )} */}
                </div>
            );
        } else if (this.state.loggedIn === false) {
            return (
                <div className="App">
                    <a href="http://localhost:8888"> Login to Spotify </a>;
                </div>
            );
        } else if (
            this.state.loggedIn === true &&
            this.state.playlistCreated === true
        ) {
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />
                    <h3>Playlist successfully created!</h3>
                    <button
                        onClick={() =>
                            this.setState((state) => {
                                return { playlistCreated: false };
                            })
                        }
                    >
                        create another playlist
                    </button>
                </div>
            );
        }
    }
    getNowPlaying() {
        spotifyApi.getMyCurrentPlaybackState().then((response) => {
            this.setState({
                nowPlaying: {
                    name: response.item.name,
                    albumArt: response.item.album.images[0].url,
                },
            });
        });
    }
}

export default App;
