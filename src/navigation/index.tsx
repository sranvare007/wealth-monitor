import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { AddEditScreen } from './screens/AddEditScreen';

const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    MainTabs: {
      screen: MainTabs,
    },
    AddEdit: {
      screen: AddEditScreen,
      options: {
        presentation: 'modal',
        headerShown: false,
        // Match the sheet's corner radius feel on Android
        animation: 'slide_from_bottom',
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}
