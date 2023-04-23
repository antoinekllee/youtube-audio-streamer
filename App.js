import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

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
        // const response = await fetch(`http://localhost:3000/audio-url?videoUrl=${encodeURIComponent(youtubeUrl)}`);
        const response = await fetch(`http://10.0.1.169:3000/audio-url?videoUrl=${encodeURIComponent(youtubeUrl)}`);
        const { audioURL } = await response.json();

        console.log ('audioURL: ', audioURL);
        
        const { sound } = await Audio.Sound.createAsync({ uri: audioURL });
        
        console.log ('sound: ', sound);

        setAudio(sound);
        setDuration(sound._durationMillis);
        setIsLoading(false);

        sound.setOnPlaybackStatusUpdate((status) => {
          setPosition(status.positionMillis);
          if (status.didJustFinish) {
            console.log('COMPLETE');
            setIsPlaying(false);
          }
        });
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
      await audio.playAsync();
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
            <Text style={styles.button}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={handleSliderValueChange}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    fontSize: 24,
    marginBottom: 20,
  },
  slider: {
    width: '80%',
  },
  loading: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default App;