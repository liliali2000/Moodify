import React, { Component } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { Field, Form, Formik, withFormik } from 'formik';
import Button from 'react-bootstrap/Button';
import { Row, Col, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import Multiselect from '@khanacademy/react-multi-select';
import MultiSelect from '@khanacademy/react-multi-select';
import selectPanel from '@khanacademy/react-multi-select/dist/select-panel';
import Documentation from './components/documentation';
import './App.css';
const spotifyApi = new SpotifyWebApi();

// import './styles.css';

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

    handleSelectedChanged = (selected) => {
        this.setState({ selected });
    };

    options = [
        { label: 'KPI Degradtion', value: 'kpi_degradation' },
        { label: 'Sleeping Cell', value: 'sleeping_cell' },
        { label: 'Anomaly', value: 'anomaly' },
        { label: 'Label1', value: 'label_1' },
        { label: 'Label2fgfgfgfghfghgh', value: 'label_2' },
        { label: 'Label3', value: 'label_3' },
        { label: 'Label4', value: 'label_4' },
        { label: 'Label5', value: 'label_5' },
    ];

    handleSelectedChanged = (selected) => {
        this.setState({ selected });
    };

    render() {
        const { selected, isLoading } = this.state;
        return (
            <div>
                <h1>Multiselect dropdown</h1>
                <Multiselect
                    options={this.options}
                    onSelectedChanged={this.handleSelectedChanged}
                    selected={selected}
                    isLoading={isLoading}
                    disabled={isLoading}
                    disableSearch={true}
                />
                {selected.join(', ')}
            </div>
        );
    }
}

export default App;
