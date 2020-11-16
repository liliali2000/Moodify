import React, { Component } from 'react';
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import { Field, Form, Formik, withFormik } from 'formik';
import Button from 'react-bootstrap/Button';
import { Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import MultiSelect from '@khanacademy/react-multi-select';
import selectPanel from '@khanacademy/react-multi-select/dist/select-panel';
const spotifyApi = new SpotifyWebApi();

/* 
To-do:
 - Style with bootstrap
 - clean up code (start with putting doc page in own js)

library documentation: 
https://doxdox.org/jmperez/spotify-web-api-js#src-spotify-web-api.js-constr.prototype.getme

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
            documentation: false,
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

    // async getTrackIds() {
    //     let arr = [];
    //     for (var idIndex in this.state.selected) {
    //         try {
    //             for (var i = 0; i < 5; i++) {
    //                 let prom = spotifyApi.getPlaylistTracks(
    //                     this.state.selected[idIndex],
    //                     {
    //                         offset: 100 * i,
    //                     }
    //                 );
    //                 let data = await prom;
    //                 for (var index in data.items) {
    //                     arr.push(data.items[index].track.id);
    //                 }
    //             }
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    //     return arr;
    // }

    async createEmpty() {
        let newId = 'hello';
        let prom = spotifyApi.createPlaylist(this.state.userId, {
            name: this.state.name,
            description: this.state.description,
        });
        let data = await prom;
        newId = data.id;

        return newId;
    }

    async addToPlaylist(playlistId, trackIds) {
        var len = trackIds.length;
        for (var i = 0; i < len; i += 100) {
            try {
                var tempTracks = trackIds.slice(i, i + 100);
            } catch {
                tempTracks = trackIds.slice(i);
            }
            let prom = spotifyApi.addTracksToPlaylist(playlistId, tempTracks);
            await prom;
        }
    }

    moodSorting(audioFeatures, mood) {
        if (mood === 'happy') {
            audioFeatures.sort((a, b) => b.valence - a.valence);
        } else if (mood === 'sad') {
            audioFeatures.sort((a, b) => a.valence - b.valence);
        } else if (mood === 'dance') {
            audioFeatures.sort((a, b) => b.danceability - a.danceability);
        } else if (mood === 'fast') {
            audioFeatures.sort((a, b) => b.tempo - a.tempo);
        } else if (mood === 'slow') {
            audioFeatures.sort((a, b) => a.tempo - b.tempo);
        }

        return audioFeatures;
    }

    async getSortedTracks(mood, maxSongs) {
        console.log(mood);
        console.log(maxSongs);

        let arr = [];
        for (var idIndex in this.state.selected) {
            try {
                for (var i = 0; i < 5; i++) {
                    let prom = spotifyApi.getPlaylistTracks(
                        this.state.selected[idIndex],
                        {
                            offset: 100 * i,
                        }
                    );
                    let data = await prom;
                    for (var index in data.items) {
                        arr.push(data.items[index].track.id);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        let len = arr.length;
        let audioFeatures = [];
        for (var i = 0; i < len; i += 100) {
            try {
                var tempIds = arr.slice(i, i + 100);
            } catch {
                tempIds = arr.slice(i);
            }

            let data2 = await spotifyApi.getAudioFeaturesForTracks(tempIds);
            audioFeatures = audioFeatures.concat(data2.audio_features);
        }

        audioFeatures = this.moodSorting(audioFeatures, mood);
        audioFeatures = audioFeatures.slice(0, maxSongs);
        let finalArr = [];
        for (var object of audioFeatures) {
            finalArr.push(object.id);
        }
        return finalArr;
    }

    async createPlaylist() {
        let newPlaylistId = await this.createEmpty();
        let trackIds = await this.getSortedTracks(
            this.state.mood,
            this.state.maxS
        );
        let realTrackIds = [];
        for (var id of trackIds) {
            realTrackIds.push('spotify:track:' + id);
        }
        await this.addToPlaylist(newPlaylistId, realTrackIds);
        console.log('done!');
    }

    async printAudioFeatures() {
        let x = this.getAudioFeatures(this.state.mood, this.state.maxS);
        let y = await x;
        console.log(y);
    }

    // Below are initial functions for mounting playlist names and userId to the state
    async getPlaylistNames() {
        let data = await spotifyApi.getUserPlaylists();
        var arr = [];
        for (var index in data.items) {
            arr.push({
                label: data.items[index].name,
                value: data.items[index].id,
            });
        }
        return arr;
    }

    async getUserId() {
        let data = await spotifyApi.getMe();
        return data.id;
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

    render() {
        if (this.state.documentation === true) {
            return (
                <div>
                    <h1>Moodify Documentation</h1>
                    <p>
                        All mood playlists are created by sorting the songs you
                        provide by a certain combination of Spotify's "audio
                        features" that are available through their web API. You
                        can read more about them{' '}
                        <a href="https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/">
                            here
                        </a>
                        .
                    </p>
                    <h3>Moodify Mood Algorithms</h3>
                    <p>
                        <b>Happy:</b> ordered descending by valence<br></br>
                        <b>Sad:</b> ordered ascending by valence<br></br>
                        <b>Dance:</b> ordered descending by danceability
                        <br></br>
                        <b>Fast:</b> ordered descending by tempo<br></br>
                        <b>Slow:</b> ordered ascending by tempo<br></br>
                    </p>

                    <Button
                        variant="success"
                        onClick={() =>
                            this.setState((state) => {
                                return { documentation: false };
                            })
                        }
                    >
                        back to main
                    </Button>
                </div>
            );
        } else if (
            this.state.loggedIn &&
            this.state.playlistCreated === false
        ) {
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
                                        test: 'test',
                                    };
                                });
                                this.createPlaylist();
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
                            <br></br>
                            <Field
                                name="test"
                                render={({ field, formProps }) => (
                                    <FormGroup controlId="test">
                                        <FormLabel>Test Input</FormLabel>
                                        <FormControl
                                            type={'text'}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Playlist description"
                                        />
                                    </FormGroup>
                                )}
                            />
                            <br></br>Mood
                            <Field as="select" name="mood">
                                <option value="happy">Happy</option>
                                <option value="sad">Sad</option>
                                <option value="dance">Dance</option>
                                <option value="fast">Fast</option>
                                <option value="slow">Slow</option>
                            </Field>
                            <br></br>Max Songs
                            <Field type="number" name="maxS" placeholder={0} />
                            <br></br>
                            <br></br>
                            <Button variant="primary" type="submit">
                                Create Playlist
                            </Button>
                        </Form>
                    </Formik>
                    <br></br>
                    <Button
                        variant="primary"
                        onClick={() => this.printAudioFeatures()}
                    >
                        button for testing functions
                    </Button>
                    <br></br>
                    <br></br>
                    <Button
                        variant="success"
                        onClick={() =>
                            this.setState((state) => {
                                return { documentation: true };
                            })
                        }
                    >
                        see documentation
                    </Button>
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
                    <Button
                        variant="primary"
                        onClick={() =>
                            this.setState((state) => {
                                return { playlistCreated: false };
                            })
                        }
                    >
                        create another playlist
                    </Button>
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

{
    /* <div className="App">
    <Formik
        initialValues={{
            name: '',
        }}
        onSubmit={}
    >
        <Form>
            <br></br>Playlist Name
            <Field name="name" placeholder="Playlist name" />
            <Field
                name="test"
                render={({ field, formProps }) => (
                    <FormGroup controlId="test">
                        <FormLabel>Test Input</FormLabel>
                        <FormControl
                            type={'text'}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Playlist description"
                        />
                    </FormGroup>
                )}
            />
        </Form>
    </Formik>
</div>; */
}
