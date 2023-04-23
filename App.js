import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

const App = () => {
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const youtubeUrl = 'https://www.youtube.com/watch?v=JJNQbAqPwI0';

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://10.0.1.169:3000/audio-url?videoUrl=${encodeURIComponent(youtubeUrl)}`);
        const { audioURL } = await response.json();

        console.log('audioURL: ', audioURL);

        const { sound } = await Audio.Sound.createAsync({ uri: audioURL });

        setAudio(sound);
        setDuration(sound._durationMillis);

        // Set the listener here, right after creating the audio object
        sound.setOnPlaybackStatusUpdate((status) => {
          console.log ("Updating position to " + status.positionMillis + "/" + duration)
          setPosition(status.positionMillis);
          if (status.didJustFinish) {
            console.log('COMPLETE');
            setIsPlaying(false);
          }
        });

        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching audio URL:', error);
        setIsLoading(false);
      }
    })();

    return () => {
      if (audio) {
        audio.unloadAsync();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await audio.pauseAsync();
    } else {
      const playbackStatus = await audio.playAsync();
      setPosition(playbackStatus.positionMillis);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderValueChange = async (value) => {
    if (audio) {
      await audio.setPositionAsync(value);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text style={styles.loading}>Loading audio...</Text>
      ) : (
        <>
          <TouchableOpacity onPress={handlePlayPause} disabled={!audio}>
            <MaterialIcons
              name={isPlaying ? 'pause-circle-outline' : 'play-circle-outline'}
              size={48}
              color={'#3d5875'}
            />
          </TouchableOpacity>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={handleSliderValueChange}
            onSlidingComplete={handleSliderValueChange}
            minimumTrackTintColor="#3d5875"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#3d5875"
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    width: '80%',
    marginTop: 20,
  },
  loading: {
    fontSize: 18,
    marginBottom: 20,
    color: '#3d5875',
  },
});

export default App;