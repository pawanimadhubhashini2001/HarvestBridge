import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '@/hooks/use-app-theme';
import { BottomTabs } from '@/navigation/BottomTabs';
import type { AppStackParamList } from '@/navigation/types';
import { AddHarvestListingScreen } from '@/screens/farms/AddHarvestListingScreen';
import { AddFarmScreen } from '@/screens/farms/AddFarmScreen';
import { EditFarmScreen } from '@/screens/farms/EditFarmScreen';
import { FarmerOrdersScreen } from '@/screens/farms/FarmerOrdersScreen';
import { FarmDetailsScreen } from '@/screens/farms/FarmDetailsScreen';
import { MarketplaceProductDetailsScreen } from '@/screens/marketplace/MarketplaceProductDetailsScreen';
import { FavoritesScreen } from '@/screens/marketplace/FavoritesScreen';
import { MyOrdersScreen } from '@/screens/marketplace/MyOrdersScreen';
import { OrderCheckoutScreen } from '@/screens/marketplace/OrderCheckoutScreen';
import { StoreDetailsScreen } from '@/screens/marketplace/StoreDetailsScreen';
import { StoreReviewsScreen } from '@/screens/marketplace/StoreReviewsScreen';
import { PlantDiseaseDetectionScreen } from '@/screens/recommendation/PlantDiseaseDetectionScreen';
import { PlantDiseasePredictionScreen } from '@/screens/recommendation/PlantDiseasePredictionScreen';
import { WriteReviewScreen } from '@/screens/marketplace/WriteReviewScreen';
import { RecommendationResultScreen } from '@/screens/recommendation/RecommendationResultScreen';
import { SmartRecommendationScreen } from '@/screens/recommendation/SmartRecommendationScreen';
import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';
import { CreateStoryScreen } from '@/screens/stories/CreateStoryScreen';
import { MyStoriesScreen } from '@/screens/stories/MyStoriesScreen';
import { StoryFeedScreen } from '@/screens/stories/StoryFeedScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

function StackPlaceholder({
  title,
  description,
  badgeLabel,
}: {
  title: string;
  description: string;
  badgeLabel: string;
}) {
  return <PlaceholderScreen title={title} description={description} badgeLabel={badgeLabel} />;
}

export function AppNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FarmDetails"
        component={FarmDetailsScreen}
        options={{ title: 'Store Profile' }}
      />
      <Stack.Screen
        name="AddHarvestListing"
        component={AddHarvestListingScreen}
        options={({ route }) => ({
          title:
            route.params?.listingType === 'compost' && route.params?.compostListingId
              ? 'Edit Compost'
              : route.params?.listingType === 'donation'
              ? 'Add Donation'
              : route.params?.listingType === 'compost'
                ? 'Add Compost'
                : 'Add Product',
        })}
      />
      <Stack.Screen
        name="AddFarm"
        component={AddFarmScreen}
        options={{ title: 'Create Store Profile' }}
      />
      <Stack.Screen
        name="EditFarm"
        component={EditFarmScreen}
        options={{ title: 'Edit Store Profile' }}
      />
      <Stack.Screen
        name="MyStories"
        component={MyStoriesScreen}
        options={{ title: 'My Stories' }}
      />
      <Stack.Screen
        name="CreateStory"
        component={CreateStoryScreen}
        options={({ route }) => ({
          title: route.params?.storyId ? 'Edit Story' : 'Create Story',
        })}
      />
      <Stack.Screen
        name="StoryFeed"
        component={StoryFeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecommendationDetails"
        options={{ title: 'Recommendation Details' }}>
        {() => (
          <StackPlaceholder
            title="Recommendation Details"
            description="Prepared for recommendation detail viewing."
            badgeLabel="AI Module"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AIRecommendationForm"
        component={SmartRecommendationScreen}
        options={{ title: 'Smart Recommendation' }}
      />
      <Stack.Screen
        name="PlantDiseaseDetection"
        component={PlantDiseaseDetectionScreen}
        options={{ title: 'Plant Disease Detection' }}
      />
      <Stack.Screen
        name="PlantDiseasePrediction"
        component={PlantDiseasePredictionScreen}
        options={{ title: 'Disease Prediction' }}
      />
      <Stack.Screen
        name="RecommendationResult"
        component={RecommendationResultScreen}
        options={{ title: 'Recommendation Result' }}
      />
      <Stack.Screen
        name="MarketplaceProductDetails"
        component={MarketplaceProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen
        name="OrderCheckout"
        component={OrderCheckoutScreen}
        options={{ title: 'Order Now' }}
      />
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen
        name="FarmerOrders"
        component={FarmerOrdersScreen}
        options={{ title: 'Customer Orders' }}
      />
      <Stack.Screen
        name="StoreDetails"
        component={StoreDetailsScreen}
        options={{ title: 'Store Details' }}
      />
      <Stack.Screen
        name="StoreReviews"
        component={StoreReviewsScreen}
        options={{ title: 'Store Reviews' }}
      />
      <Stack.Screen
        name="WriteStoreReview"
        component={WriteReviewScreen}
        options={{ title: 'Write Review' }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Stack.Screen
        name="WeatherDetails"
        options={{ title: 'Weather Details' }}>
        {() => (
          <StackPlaceholder
            title="Weather Details"
            description="Prepared for detailed weather insights."
            badgeLabel="Weather"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Settings"
        options={{ title: 'Settings' }}>
        {() => (
          <StackPlaceholder
            title="Settings"
            description="Prepared for global app and account settings."
            badgeLabel="Account"
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
