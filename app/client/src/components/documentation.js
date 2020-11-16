import React from 'react';
import Button from 'react-bootstrap/Button';
import { Row, Col, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Documentation = () => {
    return (
        <div>
            <Container>
                <Row>
                    <Col></Col>
                    <Col xs={8}>
                        <br></br>
                        <h1 style={{ color: 'white' }}>Documentation</h1>
                        <p style={{ color: 'white' }}>
                            All mood playlists are created by sorting the songs
                            you provide by a certain combination of Spotify's
                            "audio features" that are available through their
                            web API. You can read more about them{' '}
                            <a href="https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/">
                                here
                            </a>
                            .
                        </p>
                        <h3 style={{ color: 'white' }}>
                            Moodify Mood Algorithms
                        </h3>
                        <p style={{ color: 'white' }}>
                            <b style={{ color: 'grey' }}>Happy:</b> ordered
                            descending by valence<br></br>
                            <b style={{ color: 'grey' }}>Sad:</b> ordered
                            ascending by valence<br></br>
                            <b style={{ color: 'grey' }}>Dance:</b> ordered
                            descending by danceability
                            <br></br>
                            <b style={{ color: 'grey' }}>Fast:</b> ordered
                            descending by tempo<br></br>
                            <b style={{ color: 'grey' }}>Slow:</b> ordered
                            ascending by tempo<br></br>
                            <b style={{ color: 'grey' }}>Workout:</b> ordered
                            descending by tempo and energy, ascending by
                            acousticness<br></br>
                            <b style={{ color: 'grey' }}>Chill:</b> ordered by
                            proximity of acousticness and energy to 0.5<br></br>
                        </p>
                    </Col>
                    <Col></Col>
                </Row>
            </Container>
        </div>
    );
};

export default Documentation;
