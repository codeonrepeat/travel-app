import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { supabase } from 'utils/supabase';

import AuthScreen from 'screens/AuthScreen';
import RoleSelect from 'screens/RoleSelect';
import LenderScreen from 'screens/LenderScreen';
import DetailsScreen from 'screens/DetailsScreen';
import LenderRequestsScreen from 'screens/LenderRequestScreen';
import BorrowerRequestsScreen from 'screens/BorrowerRequest';
import FakePaymentScreen from 'screens/FakePaymentScreen';
import ProfileScreen from 'screens/ProfileScreen';
import SuccessScreen from 'screens/SuccessScreen';
import TransactionSummeryScreen from 'screens/TransactionSummeryScreen';
import UserBuilder from 'screens/UserBuilder';
import Account from 'screens/Account';
import WardrobeItemEditor from 'screens/WardrobeEditor';
import ProfileDetails from 'screens/ProfileDetails';
import ProfileSetup from 'screens/ProfileSetup';
import WardrobeItemDetails from 'screens/WardrobeItemDetails';
import TripCartScreen from 'screens/TripCartScreen';
import LenderAvailabilitySection from 'screens/LenderAvailability';
import Notifications from 'screens/Notifications';
import MyRequests from 'screens/MyRequests';
import WardrobeScreen from 'screens/WardrobeScreen';
import DeliveryInfoScreen from 'screens/DeliveryInfo';
import FinalChecklistScreen from 'screens/FinalChecklist';
import EditProfile from 'screens/EditProfile';
import MyTrip from 'screens/MyTrip';
import InboxScreen from 'screens/InboxScreen';
import DirectMessageScreen from 'screens/DirectMessageScreen';
import Step1BasicInfo from 'screens/Onboarding/Step1BasicInfo';
import Step2StyleTags from 'screens/Onboarding/Step2StyleTags';
import Step3Location from 'screens/Onboarding/Step3Location';
import Step4Sizing from 'screens/Onboarding/Step4Sizing';
import ProfileSummary from 'screens/Onboarding/ProfileSummary';
import Onboarding from 'screens/Onboarding/Onboarding';

export type RootStackParamList = {
  Auth: undefined;
  RoleSelect: undefined;
  LenderScreen: undefined;
  DetailsScreen: undefined;
  LenderRequestScreen: undefined;
  BorrowerRequest: undefined;
  FakePaymentScreen: undefined;
  ProfileScreen: undefined;
  SuccessScreen: undefined;
  TransactionSummaryScreen: undefined;
  UserBuilder: undefined;
  Account: undefined;
  WardrobeEditor: undefined;
  ProfileDetails: undefined;
  ProfileSetup: undefined;
  WardrobeItemDetails: undefined;
  EditProfile: undefined;
  LenderAvailability: undefined;
  TripCartScreen: undefined;
  Notifications: undefined;
  MyRequests: undefined;
  WardrobeScreen: undefined;
  DeliveryInfo: undefined;
  FinalChecklist: undefined;
  MyTrip: undefined;
  InboxScreen: undefined;
  DirectMessageScreen: undefined;
  Step1BasicInfo: undefined;
  Step2StyleTags: undefined;
  Step3Location: undefined;
  Step4Sizing: undefined;
  ProfileSummary: undefined;
  Onboarding: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || error) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }

      setInitializing(false);
    };

    checkSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkSessionAndProfile();
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (initializing) return null; // Or a splash screen

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={Onboarding} />

            <Stack.Screen name="RoleSelect" component={RoleSelect} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
            <Stack.Screen name="LenderScreen" component={LenderScreen} />
            <Stack.Screen name="DetailsScreen" component={DetailsScreen} />
            <Stack.Screen name="LenderRequestScreen" component={LenderRequestsScreen} />
            <Stack.Screen name="BorrowerRequest" component={BorrowerRequestsScreen} />
            <Stack.Screen name="FakePaymentScreen" component={FakePaymentScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="SuccessScreen" component={SuccessScreen} />
            <Stack.Screen name="TransactionSummaryScreen" component={TransactionSummeryScreen} />
            <Stack.Screen name="UserBuilder" component={UserBuilder} />
            <Stack.Screen name="Account" component={Account} />
            <Stack.Screen name="WardrobeEditor" component={WardrobeItemEditor} />
            <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
            <Stack.Screen name="WardrobeItemDetails" component={WardrobeItemDetails} />
            <Stack.Screen name="LenderAvailability" component={LenderAvailabilitySection} />
            <Stack.Screen name="TripCartScreen" component={TripCartScreen} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="MyRequests" component={MyRequests} />
            <Stack.Screen name="WardrobeScreen" component={WardrobeScreen} />
            <Stack.Screen name="DeliveryInfo" component={DeliveryInfoScreen} />
            <Stack.Screen name="FinalChecklist" component={FinalChecklistScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="MyTrip" component={MyTrip} />
            <Stack.Screen name="InboxScreen" component={InboxScreen} />
            <Stack.Screen name="DirectMessageScreen" component={DirectMessageScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
