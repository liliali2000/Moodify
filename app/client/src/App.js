import React, { Component } from 'react';
import './App.css';
import SpotifyWebApi from 'spotify-web-api-js';
import { Field, Form, Formik } from 'formik';
import Button from 'react-bootstrap/Button';
import { Row, Col, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import MultiSelect from '@khanacademy/react-multi-select';
import Documentation from './components/documentation';
const spotifyApi = new SpotifyWebApi();

/* 

To-do:
 - Style with bootstrap
 - clean up code (start with putting doc page in own js)

library documentation: 
https://doxdox.org/jmperez/spotify-web-api-js#src-spotify-web-api.js-constr.prototype.getme

palette:
https://www.color-hex.com/color-palette/53188
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
        } else if (mood === 'workout') {
            audioFeatures.sort(
                (a, b) =>
                    a.acousticness +
                    b.energy +
                    b.tempo / 250 -
                    (b.acousticness + a.energy + a.tempo / 250)
            );
        } else if (mood === 'chill') {
            audioFeatures.sort(
                (a, b) =>
                    Math.abs(a.energy - 0.5) +
                    Math.abs(a.acousticness - 0.5) -
                    (Math.abs(b.energy - 0.5) + Math.abs(b.acousticness - 0.5))
            );
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
        console.log(finalArr);
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

    handleSelectedChanged = (selected) => {
        this.setState({ selected });
    };

    render() {
        if (this.state.documentation === true) {
            // documentation page
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />
                    <br></br>
                    <div className="App2">
                        <Documentation />
                        <Container>
                            <Row>
                                <Col></Col>
                                <div className="App">
                                    <Col>
                                        <br></br>
                                        <Button
                                            variant="outline-success"
                                            onClick={() =>
                                                this.setState((state) => {
                                                    return {
                                                        documentation: false,
                                                    };
                                                })
                                            }
                                        >
                                            Back to main
                                        </Button>
                                    </Col>
                                </div>
                                <Col></Col>
                            </Row>
                        </Container>
                    </div>
                </div>
            );
        } else if (
            this.state.loggedIn &&
            this.state.playlistCreated === false
        ) {
            // main app page, user hasn't created a playlist yet
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />

                    <Container>
                        <Row>
                            <Col></Col>
                            <Col xs={8}>
                                <br></br>
                                <h3 style={{ color: 'white' }}>Instructions</h3>
                                <p style={{ color: 'white' }}>
                                    Fill out the following form with the music
                                    you would like to draw upon to create the
                                    playlist, a name and description for your
                                    new mood playlist, a mood, and maximum
                                    number of songs to include in the new
                                    playlist. Hit "create playlist" when you're
                                    done to create the new mood playlist in your
                                    Spotify account!
                                </p>
                                <div className="App2">
                                    <Formik
                                        initialValues={{
                                            name: '',
                                            description: '',
                                            mood: 'happy',
                                            maxS: 0,
                                        }}
                                        onSubmit={(
                                            values,
                                            { setSubmitting }
                                        ) => {
                                            setTimeout(() => {
                                                console.log(values);
                                                setSubmitting(false);
                                                this.setState((state) => {
                                                    return {
                                                        name: values.name,
                                                        description:
                                                            values.description,
                                                        mood: values.mood,
                                                        maxS: values.maxS,
                                                        playlistCreated: true,
                                                    };
                                                });
                                                this.createPlaylist();
                                            }, 400);
                                        }}
                                    >
                                        <Form>
                                            <br></br>
                                            <text style={{ color: 'white' }}>
                                                Desired source playlists
                                            </text>
                                            <MultiSelect
                                                options={this.state.userSources}
                                                selected={this.state.selected}
                                                onSelectedChanged={
                                                    this.handleSelectedChanged
                                                }
                                            />
                                            <br></br>
                                            <text style={{ color: 'white' }}>
                                                Playlist Name
                                            </text>
                                            <Field
                                                name="name"
                                                render={({
                                                    field,
                                                    formProps,
                                                }) => (
                                                    <FormGroup controlId="name">
                                                        <FormControl
                                                            type={'text'}
                                                            value={field.value}
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            placeholder="Playlist name"
                                                        />
                                                    </FormGroup>
                                                )}
                                            />
                                            <text style={{ color: 'white' }}>
                                                Description
                                            </text>
                                            <Field
                                                name="description"
                                                render={({
                                                    field,
                                                    formProps,
                                                }) => (
                                                    <FormGroup controlId="description">
                                                        <FormControl
                                                            type={'text'}
                                                            value={field.value}
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            placeholder="Playlist description"
                                                        />
                                                    </FormGroup>
                                                )}
                                            />
                                            <Row>
                                                <Col></Col>
                                                <Col>
                                                    <text
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Mood
                                                    </text>
                                                    <Field
                                                        name="mood"
                                                        render={({
                                                            field,
                                                            formProps,
                                                        }) => (
                                                            <FormGroup controlId="mood">
                                                                <FormControl
                                                                    as="select"
                                                                    onChange={
                                                                        field.onChange
                                                                    }
                                                                >
                                                                    <option value="happy">
                                                                        Happy
                                                                    </option>
                                                                    <option value="sad">
                                                                        Sad
                                                                    </option>
                                                                    <option value="dance">
                                                                        Dance
                                                                    </option>
                                                                    <option value="fast">
                                                                        Fast
                                                                    </option>
                                                                    <option value="slow">
                                                                        Slow
                                                                    </option>
                                                                    <option value="workout">
                                                                        Workout
                                                                    </option>
                                                                    <option value="chill">
                                                                        Chill
                                                                    </option>
                                                                </FormControl>
                                                            </FormGroup>
                                                        )}
                                                    />
                                                    <text
                                                        style={{
                                                            color: 'white',
                                                        }}
                                                    >
                                                        Max Songs
                                                    </text>
                                                    <Field
                                                        name="maxS"
                                                        render={({
                                                            field,
                                                            formProps,
                                                        }) => (
                                                            <FormGroup controlId="maxS">
                                                                <FormControl
                                                                    type={
                                                                        'number'
                                                                    }
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onChange={
                                                                        field.onChange
                                                                    }
                                                                    placeholder={
                                                                        0
                                                                    }
                                                                />
                                                            </FormGroup>
                                                        )}
                                                    />
                                                </Col>
                                                <Col></Col>
                                            </Row>
                                            <br></br>
                                            <div className="App">
                                                <Button
                                                    variant="success"
                                                    type="submit"
                                                >
                                                    Create Playlist
                                                </Button>
                                            </div>
                                            <br></br>.
                                        </Form>
                                    </Formik>
                                </div>
                            </Col>
                            <Col></Col>
                        </Row>
                    </Container>
                    <br></br>
                    {/* <Button
                        variant="primary"
                        onClick={() => this.getSortedTracks('chill', 100)}
                    >
                        button for testing functions
                    </Button> */}
                    <br></br>
                    <br></br>
                    <Button
                        variant="outline-success"
                        onClick={() =>
                            this.setState((state) => {
                                return { documentation: true };
                            })
                        }
                    >
                        See documentation
                    </Button>
                </div>
            );
        } else if (this.state.loggedIn === false) {
            // user not logged in
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />
                    <br></br>
                    <br></br>
                    <Button
                        variant="success"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = 'http://localhost:8888';
                        }}
                    >
                        {' '}
                        Login with Spotify
                    </Button>
                </div>
            );
        } else if (
            this.state.loggedIn === true &&
            this.state.playlistCreated === true
        ) {
            // after a user creates a playlist
            return (
                <div className="App">
                    <img
                        className="logo"
                        src="./moodify_logo_full.png"
                        alt="moodify logo"
                    />
                    <br></br>
                    <h3 style={{ color: 'white' }}>
                        Playlist successfully created!
                    </h3>
                    <br></br>
                    <Button
                        variant="success"
                        onClick={() =>
                            this.setState((state) => {
                                return { playlistCreated: false };
                            })
                        }
                    >
                        Create another playlist
                    </Button>
                </div>
            );
        }
    }
}

export default App;
