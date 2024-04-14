import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum DriverRideRequestsStatusEnums {
  WAITING_FOR_DRIVER_RESPONSE = 'DRIVER_RIDE_REQUEST_WAITING_FOR_DRIVER_RESPONSE',
  WAITING_FOR_RIDER_RESPONSE = 'DRIVER_RIDE_REQUEST_WAITING_FOR_RIDER_RESPONSE',
  ACCEPTED_BY_RIDER = 'DRIVER_RIDE_REQUEST_ACCEPTED_BY_RIDER', // when driver gives price and rider accepts it
  ACCEPTED_BY_DRIVER = 'DRIVER_RIDE_REQUEST_ACCEPTED_BY_DRIVER', // when rider negotiates for one time then driver accepts
  NEGOTIATED_BY_RIDER = 'DRIVER_RIDE_REQUEST_NEGOTIATED_BY_RIDER', // when the rider negotiates the only time -  we create new Driver Ride
  DECLINED_BY_RIDER = 'DRIVER_RIDE_REQUEST_DECLINED_BY_RIDER', // when the driver gives price then rider declines (without any negotiation)
  DECLINED_BY_DRIVER = 'DRIVER_RIDE_REQUEST_DECLINED_BY_DRIVER', // when the rider negotiates the price then driver declines it // or driver cancels in the first time itself
}

@Schema({
  timestamps: true,
  id: true,
})
export class DriverRideRequests {
  @Prop({
    required: true,
    index: true,
    ref: 'User',
    type: mongoose.Types.ObjectId,
  })
  driverId: mongoose.Types.ObjectId;

  // TODO implement expiration time

  @Prop({
    required: true,
    index: true,
    ref: 'RiderRide',
    type: mongoose.Types.ObjectId,
  })
  riderRideId: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: DriverRideRequestsStatusEnums,
    default: DriverRideRequestsStatusEnums.WAITING_FOR_DRIVER_RESPONSE,
  })
  status: string;

  @Prop({
    required: false,
    type: String,
  })
  rideRequestDetails: string;

  @Prop({
    required: false,
    default: true, // initially driver can able to decline the ride
    type: Boolean,
  })
  canDecline: boolean;

  @Prop({
    required: false,
    default: false, // can accept only when rider negotiates
    type: Boolean,
  })
  canAccept: boolean;

  @Prop({
    required: false,
    type: Number,
  })
  acceptedPrice: number;

  @Prop({
    required: false,
    type: Number,
  })
  riderRequestingPrice: number; // when rider negotiates

  @Prop({
    required: false,
    type: Number,
  })
  driverStartingPrice: number;

  @Prop({
    required: false,
    default: true,
    type: Boolean,
  })
  shouldGivePrice: boolean;
}

export type DriverRideRequestsDocument = DriverRideRequests & Document;
export const DriverRideRequestsSchema =
  SchemaFactory.createForClass(DriverRideRequests);
