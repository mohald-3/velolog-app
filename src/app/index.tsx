import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VeloLog</Text>
      <Text style={styles.subtitle}>Bike garage coming together.</Text>
      <Link href="/dev/gps-spike" style={styles.link}>
        GPS spike test screen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  link: {
    fontSize: 14,
    color: '#2f6f4f',
    marginTop: 20,
  },
});
