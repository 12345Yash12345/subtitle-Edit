import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    // Use the effect to send the request when subtitles change
    if (subtitles.length > 0 && videoFile) {
      console.log('Video File to be sent:', videoFile);  
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('subtitles', JSON.stringify(subtitles));

      console.log('Subtitles to be sent to the server:', subtitles);

      axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then(response => {
          console.log(response.data.message);
        })
        .catch(error => {
          console.error('Error uploading video:', error.message);

          if (error.response) {
            console.error('Server responded with status:', error.response.status);
            console.error('Server responded with data:', error.response.data);
          } else if (error.request) {
            console.error('No response received from the server.');
          } else {
            console.error('Error setting up the request:', error.message);
          }
        });
    }
  }, [subtitles, videoFile]);

  const handleVideoUpload = async (event) => {
    try {
      const file = event.target.files[0];
      setVideoFile(URL.createObjectURL(file));

      setSubtitles([]); // Reset subtitles when a new video is uploaded
    } catch (error) {
      console.error('Error handling video upload:', error);
    }
  };

  const handleSubtitleAdd = (event) => {
    event.preventDefault();

    const timestamp = videoRef.current.currentTime.toFixed(2);
    const text = event.target.value.trim();

    setSubtitles((prevSubtitles) => [
      ...prevSubtitles,
      { timestamp, text },
    ]);

    event.target.value = '';
  };


  const handleVideoPlay = () => {
    const video = videoRef.current;
    if (video.paused || video.ended) {
      setSubtitles([]);
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video started playing');
          })
          .catch((error) => {
            console.error('Unable to play video:', error);
          });
      }
    }
  };

  const fetchSubtitles = async (filename) => {
    try {
      const response = await axios.get(`http://localhost:3001/subtitles/${filename}`);
      const subtitlesData = response.data.subtitles;

      // Handle the subtitles data as needed
      console.log('Subtitles data:', subtitlesData);
    } catch (error) {
      console.error('Error fetching subtitles:', error);
    }
  };

  return (
    <div className="app">
      <h1>Video Subtitle Editor</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />

      {videoFile && (
        <div>
          {console.log('Video File:', videoFile)}
          <video
            ref={videoRef}
            controls
            width={480}
            style={{ unicodeBidi: 'plaintext', direction: 'ltr' }}
            onError={(e) => {
              console.error('Video playback error:', e.nativeEvent.error);
              console.log('Network State:', videoRef.current.networkState);
              console.log('Ready State:', videoRef.current.readyState);
            }}
          >
            <source src={videoFile} type="video/mp4" />
          </video>








          <textarea
            placeholder="Add subtitles..."
            onChange={(e) => handleSubtitleAdd(e)}
          ></textarea>

          <div className="subtitle-container">
            {subtitles.map((subtitle, index) => (
              <span key={index} className="subtitle">
                {subtitle.text}
              </span>
            ))}
          </div>

          <button onClick={handleVideoPlay}>Play Video</button>
        </div>
      )}
    </div>
  );
};

export default App;
