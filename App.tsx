import './global.css';

import { Buffer } from 'buffer';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { TripCartProvider } from 'context/TripCartContext';

import 'react-native-get-random-values';

import 'react-native-gesture-handler';

import RootStack from './navigation';

global.Buffer = Buffer;

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <TripCartProvider>
          <RootStack />
        </TripCartProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
