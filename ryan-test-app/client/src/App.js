import React, { Component } from 'react';
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import { Field, Form, Formik } from 'formik';
const spotifyApi = new SpotifyWebApi();

/* 
Okay so basically I need to make it so when the form submits, 
it sets all the consts I made in the constructor to the input values
of the form. Or maybe it can do that periodically rather than on submit.
Anyways then after I should pass all those params to a function that I
define, and for now the function is just going to console.log all the 
values for testing/debug purposes but later I would have it do all the
things that I want it to do (e.g. I implement my python functions here
or actually link python as backend, not exactly sure how it would work
though since we're using a different library now but nonetheless)

Below is the code that I started, that's for non-classes though.

const [source, setSource] = useState('');
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [mood, setMood] = useState('');
const [maxS, setMaxS] = useState('');

Here's the link to an article that shows the class version:
https://reactjs.org/docs/hooks-state.html
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
            source: '',
            name: '',
            description: '',
            mood: 'happy',
            maxS: 0,
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
                            source: '',
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
                                        source: values.source,
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
                            <Field
                                name="source"
                                placeholder="Source playlists"
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
                    <h3>Now Playing (test app)</h3>
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
                    )}
                </div>
            );
        } else if (this.state.loggedIn === false) {
            return <a href="http://localhost:8888"> Login to Spotify </a>;
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
