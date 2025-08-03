import './global.css';

import { Buffer } from 'buffer';

import { TripCartProvider } from 'context/TripCartContext';

import 'react-native-get-random-values';

import 'react-native-gesture-handler';

import RootStack from './navigation';

global.Buffer = Buffer;

export default function App() {
  return (
    <TripCartProvider>
      <RootStack />
    </TripCartProvider>
  );
}
