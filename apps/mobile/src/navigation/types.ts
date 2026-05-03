export type RootStackParamList = {
  Tabs: undefined;
  Detail: { vehicleId: string };
  RouteMap: { vehicleId: string; plateNumber: string; from: string; to: string };
};

export type TabsParamList = {
  Home: undefined;
  Profile: undefined;
};
