export enum Events {
  userCreatedByPhone = 'AUTH_USER_CREATED_BY_PHONE',
  userUpdated = 'AUTH_USER_UPDATED',
  tokenBlackList = 'AUTH_TOKEN_BLACKLIST',
  newVehicleCreated = 'AUTH_NEW_VEHICLE_CREATED',
  vehicleDeleted = 'AUTH_VEHICLE_DELETED',
  newDriverRideCreated = 'RIDE_NEW_DRIVER_RIDE_CREATED',
  newRiderRideCreated = 'RIDE_NEW_RIDER_RIDE_CREATED',
  driverRideCancelled = 'RIDE_DRIVER_RIDE_CANCELLED',
  riderRideCancelled = 'RIDE_RIDER_RIDE_CANCELLED',
}
