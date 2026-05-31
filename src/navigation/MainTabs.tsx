import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../components/common/TabBar';
import { DashboardScreen } from './screens/Dashboard';
import { AssetsScreen } from './screens/Assets';
import { HistoryScreen } from './screens/History';
import { SettingsScreen } from './screens/Settings';

export type TabParamList = {
  Dashboard: undefined;
  Assets:    undefined;
  History:   undefined;
  Settings:  undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Assets"    component={AssetsScreen} />
      <Tab.Screen name="History"   component={HistoryScreen} />
      <Tab.Screen name="Settings"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}
