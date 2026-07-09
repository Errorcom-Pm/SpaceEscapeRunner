import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHIP_WIDTH = 90;
const SHIP_HEIGHT = 90;
const SHIP_BOTTOM_OFFSET = 140;
const MOVE_STEP = 30;
const ASTEROID_SIZE = 44;
const BASE_FALL_STEP = 20;
const SPEED_INCREASE_PER_LEVEL = 1.5;
const POINTS_PER_LEVEL = 5;
const GAME_TICK_MS = 50;
const HIGH_SCORE_KEY = 'SPACE_ESCAPE_HIGH_SCORE';

// Fixed random star positions for the background (generated once)
const STARS = Array.from({ length: 25 }).map(() => ({
  x: Math.random() * SCREEN_WIDTH,
  y: Math.random() * SCREEN_HEIGHT,
  size: Math.random() * 2 + 1,
}));

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shipPosition, setShipPosition] = useState(
    SCREEN_WIDTH / 2 - SHIP_WIDTH / 2
  );
  const [asteroidX, setAsteroidX] = useState(
    Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE)
  );
  const [asteroidY, setAsteroidY] = useState(0);

  const shipPositionRef = useRef(shipPosition);
  const asteroidXRef = useRef(asteroidX);
  const levelRef = useRef(level);
  const highScoreRef = useRef(highScore);

  // ---- Animated values (drive smooth visuals, not game logic) ----
  const shipAnim = useRef(new Animated.Value(shipPosition)).current;
  const flameAnim = useRef(new Animated.Value(1)).current;
  const asteroidSpin = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const gameOverFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shipPositionRef.current = shipPosition;
  }, [shipPosition]);

  useEffect(() => {
    asteroidXRef.current = asteroidX;
  }, [asteroidX]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  // Smoothly slide the ship to its new position whenever shipPosition changes
  useEffect(() => {
    Animated.timing(shipAnim, {
      toValue: shipPosition,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // 'left' is a layout property, not supported by native driver
    }).start();
  }, [shipPosition]);

  // Continuous flame pulse (loops forever)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Continuous asteroid spin (loops forever)
  useEffect(() => {
    Animated.loop(
      Animated.timing(asteroidSpin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinInterpolate = asteroidSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ---- Load high score once, when the app first opens ----
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedValue = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (savedValue !== null) {
          setHighScore(parseInt(savedValue, 10));
        }
      } catch (error) {
        console.log('Failed to load high score:', error);
      }
    };
    loadHighScore();
  }, []);

  const saveHighScore = async (newHighScore) => {
    try {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
    } catch (error) {
      console.log('Failed to save high score:', error);
    }
  };

  const handleStartGame = () => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    gameOverFade.setValue(0);
    setShipPosition(SCREEN_WIDTH / 2 - SHIP_WIDTH / 2);
    setAsteroidX(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE));
    setAsteroidY(0);
    setGameStarted(true);
  };

  const moveLeft = () => {
    setShipPosition((prevPosition) => Math.max(prevPosition - MOVE_STEP, 0));
  };

  const moveRight = () => {
    setShipPosition((prevPosition) =>
      Math.min(prevPosition + MOVE_STEP, SCREEN_WIDTH - SHIP_WIDTH)
    );
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.94, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      setAsteroidY((prevY) => {
        const currentFallStep =
          BASE_FALL_STEP + (levelRef.current - 1) * SPEED_INCREASE_PER_LEVEL;
        const newY = prevY + currentFallStep;

        const shipLeft = shipPositionRef.current;
        const shipTop = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET - SHIP_HEIGHT;
        const asteroidLeft = asteroidXRef.current;

        const isColliding =
          asteroidLeft < shipLeft + SHIP_WIDTH &&
          asteroidLeft + ASTEROID_SIZE > shipLeft &&
          newY < shipTop + SHIP_HEIGHT &&
          newY + ASTEROID_SIZE > shipTop;

        if (isColliding) {
          clearInterval(intervalId);
          setGameStarted(false);
          setGameOver(true);

          Animated.timing(gameOverFade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }).start();

          setScore((currentScore) => {
            if (currentScore > highScoreRef.current) {
              setHighScore(currentScore);
              saveHighScore(currentScore);
            }
            return currentScore;
          });

          return newY;
        }

        if (newY >= SCREEN_HEIGHT) {
          setAsteroidX(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE));
          setScore((prevScore) => {
            const newScore = prevScore + 1;
            setLevel(Math.floor(newScore / POINTS_PER_LEVEL) + 1);
            return newScore;
          });
          return 0;
        }

        return newY;
      });
    }, GAME_TICK_MS);

    return () => clearInterval(intervalId);
  }, [gameStarted]);

  return (
    <View style={styles.root}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#0B0E1A', '#1A1145', '#2D1B4E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Static starfield */}
      {STARS.map((star, index) => (
        <View
          key={index}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
            },
          ]}
        />
      ))}

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Space Escape Runner</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreIcon}>🎯</Text>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreIcon}>⚡</Text>
              <Text style={styles.scoreLabel}>Level</Text>
              <Text style={styles.scoreValue}>{level}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreIcon}>🏆</Text>
              <Text style={styles.scoreLabel}>Best</Text>
              <Text style={styles.scoreValue}>{highScore}</Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleStartGame}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {gameStarted ? 'Restart Game' : 'Start Game'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Falling asteroid */}
        {gameStarted && (
          <View
            style={[
              styles.asteroidContainer,
              { left: asteroidX, top: asteroidY },
            ]}
          >
            <Animated.View
              style={[
                styles.asteroidBody,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <View style={styles.craterHighlight} />
              <View style={styles.crater1} />
              <View style={styles.crater2} />
              <View style={styles.crater3} />
            </Animated.View>
          </View>
        )}

        {/* Spaceship */}
        <Animated.View style={[styles.spaceshipContainer, { left: shipAnim }]}>
          <View style={styles.cockpitGlow}>
            <View style={styles.cockpit} />
          </View>
          <View style={styles.shipBody} />
          <View style={styles.bodyStripe} />
          <View style={styles.wingsRow}>
            <View style={styles.leftWing} />
            <View style={styles.rightWing} />
          </View>
          <Animated.View
            style={[styles.flame, { transform: [{ scaleY: flameAnim }] }]}
          />
        </Animated.View>

        {/* Movement controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={moveLeft} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={moveRight} activeOpacity={0.7}>
            <Text style={styles.controlButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Game Over overlay */}
        {gameOver && (
          <Animated.View style={[styles.gameOverOverlay, { opacity: gameOverFade }]}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverScoreLabel}>Final Score</Text>
            <Text style={styles.gameOverScoreValue}>{score}</Text>
            <Text style={styles.gameOverLevelText}>
              Level {level} • Best Score: {highScore}
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleStartGame} activeOpacity={0.9}>
              <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 36,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(93, 224, 230, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 46,
  },
  scoreBox: {
    backgroundColor: 'rgba(26, 31, 53, 0.75)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.35)',
  },
  scoreIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8A8FA3',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5DE0E6',
  },
  button: {
    backgroundColor: '#5D5FEF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#5D5FEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ----- Asteroid -----
  asteroidContainer: {
    position: 'absolute',
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
  },
  asteroidBody: {
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    backgroundColor: '#9B8365',
    borderWidth: 2.5,
    borderColor: '#4A3F2E',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 20,
  },
  craterHighlight: {
    position: 'absolute',
    width: 16,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: 4,
    left: 6,
  },
  crater1: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B5A42',
    top: 8,
    left: 10,
  },
  crater2: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6B5A42',
    top: 20,
    left: 22,
  },
  crater3: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6B5A42',
    top: 12,
    left: 26,
  },

  // ----- Spaceship -----
  spaceshipContainer: {
    position: 'absolute',
    bottom: SHIP_BOTTOM_OFFSET,
    width: 90,
    alignItems: 'center',
  },
  cockpitGlow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(93, 224, 230, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -12,
    zIndex: 3,
  },
  cockpit: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5DE0E6',
  },
  shipBody: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E8E8F0',
    transform: [{ rotate: '180deg' }],
    zIndex: 2,
  },
  bodyStripe: {
    position: 'absolute',
    top: 22,
    width: 6,
    height: 30,
    backgroundColor: '#5D5FEF',
    borderRadius: 3,
    zIndex: 3,
  },
  wingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 90,
    marginTop: -20,
    zIndex: 1,
  },
  leftWing: {
    width: 0,
    height: 0,
    borderTopWidth: 25,
    borderRightWidth: 20,
    borderTopColor: '#5D5FEF',
    borderRightColor: 'transparent',
  },
  rightWing: {
    width: 0,
    height: 0,
    borderTopWidth: 25,
    borderLeftWidth: 20,
    borderTopColor: '#5D5FEF',
    borderLeftColor: 'transparent',
  },
  flame: {
    width: 14,
    height: 24,
    backgroundColor: '#FF6B4A',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -4,
  },

  // ----- Controls -----
  controlsRow: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(26, 31, 53, 0.85)',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.5)',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },

  // ----- Game Over -----
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 14, 26, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B4A',
    marginBottom: 30,
    letterSpacing: 1,
  },
  gameOverScoreLabel: {
    fontSize: 14,
    color: '#8A8FA3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  gameOverScoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#5DE0E6',
    marginBottom: 12,
  },
  gameOverLevelText: {
    fontSize: 16,
    color: '#8A8FA3',
    marginBottom: 40,
    textAlign: 'center',
  },
});