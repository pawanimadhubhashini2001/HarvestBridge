import type {
  CompositeScreenProps,
  LinkingOptions,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

export type RootStackParamList = {
  Auth: {
    initialRouteName?: keyof AuthStackParamList;
  };
  App: NavigatorScreenParams<AppStackParamList>;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Marketplace: undefined;
  ProductSearch: undefined;
  Favorites: undefined;
  MyOrders: undefined;
  Farms: undefined;
  FarmerOrders: undefined;
  Recommendations: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList>;
  FarmDetails: {
    farmId?: string;
  };
  AddHarvestListing: {
    listingType?: 'product' | 'donation' | 'compost' | 'pre_order';
    compostListingId?: number;
  } | undefined;
  AddFarm: undefined;
  EditFarm: {
    farmId?: string;
  };
  MyStories: undefined;
  CreateStory: {
    storyId?: string;
  } | undefined;
  StoryFeed: {
    initialStoryId?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    sort?: 'distance' | 'newest';
  } | undefined;
  RecommendationDetails: {
    recommendationId?: string;
  };
  PlantDiseaseDetection: undefined;
  PlantDiseasePrediction: undefined;
  RecommendationResult: {
    predictionId?: string;
  };
  MarketplaceProductDetails: {
    listingId?: string;
    latitude?: number;
    longitude?: number;
    distanceKm?: number | null;
  };
  OrderCheckout: {
    listingId?: string;
    listingType?: 'product' | 'donation' | 'compost' | 'pre_order';
    title?: string;
    storeName?: string;
    unit?: string;
    availableQuantity?: string;
    pricePerUnit?: string;
    expectedHarvestDate?: string;
    description?: string;
  };
  StoreDetails: {
    storeId?: string;
    latitude?: number;
    longitude?: number;
    distanceKm?: number | null;
  };
  StoreReviews: {
    storeId?: string;
    storeName?: string;
  };
  WriteStoreReview: {
    storeId?: string;
    storeName?: string;
    reviewId?: string;
  };
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>;

export type AppTabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'harvestbridgemobile://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      App: {
        screens: {
          MainTabs: {
            screens: {
              Home: '',
              Marketplace: 'marketplace',
              ProductSearch: 'search',
              Favorites: 'favorites',
              MyOrders: 'orders',
              Farms: 'store',
              FarmerOrders: 'farmer/orders',
              Recommendations: 'recommendations/new',
              Notifications: 'notifications',
              Profile: 'profile',
            },
          },
          MarketplaceProductDetails: 'marketplace/:listingId',
          OrderCheckout: 'marketplace/:listingId/order',
          StoreDetails: 'marketplace/store/:storeId',
          StoreReviews: 'marketplace/store/:storeId/reviews',
          WriteStoreReview: 'marketplace/store/:storeId/reviews/write',
          FarmDetails: 'store/:farmId',
          AddHarvestListing: 'store/products/new',
          AddFarm: 'store/new',
          EditFarm: 'store/:farmId/edit',
          MyStories: 'store/stories',
          CreateStory: 'store/stories/new',
          StoryFeed: 'marketplace/stories',
          RecommendationDetails: 'recommendations/:recommendationId',
          PlantDiseaseDetection: 'recommendations/disease-detect',
          PlantDiseasePrediction: 'recommendations/disease-result',
          RecommendationResult: 'recommendations/result',
          Settings: 'settings',
        },
      },
    },
  },
};
