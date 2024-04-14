import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
export enum RiderRideRequestsStatusEnums {
  WAITING_FOR_RIDER_RESPONSE = 'RIDER_RIDE_REQUEST_WAITING_FOR_RIDER_RESPONSE', // initial
  WAITING_FOR_DRIVER_RESPONSE = 'RIDER_RIDE_REQUEST_WAITING_FOR_DRIVER_RESPONSE', // When Rider Negotiates and waits for driver response
  ACCEPTED_BY_RIDER = 'RIDER_RIDE_REQUEST_ACCEPTED_BY_RIDER', // When Rider Accepts on first go when driver gives amount
  ACCEPTED_BY_DRIVER = 'RIDER_RIDE_REQUEST_ACCEPTED_BY_DRIVER', // when rider negotiates for one time then driver acceptNEGOTIATED_BY_RIDER = 'RIDER_RIDE_REQUEST_NEGOTIATED_BY_RIDER', // when the rider negotiates the only time -  we create new Driver Ride
  DECLINED_BY_RIDER = 'RIDER_RIDE_REQUEST_DECLINED_BY_RIDER', // When the rider declines only first time if not negotiating
  DECLINED_BY_DRIVER = 'RIDER_RIDE_REQUEST_DECLINED_BY_DRIVER', // when the rider negotiates the price then driver declines it
  OTHER_REQUEST_ACCEPTED = 'RIDER_RIDE_REQUEST_OTHER_REQUEST_ACCEPTED', // when the rider negotiates the price then driver declines it
}
@Schema({
  timestamps: true,
  id: true,
})
export class RiderRideRequests {
  @Prop({
    required: true,
    index: true,
    ref: 'User',
    type: mongoose.Types.ObjectId,
  })
  riderId: mongoose.Types.ObjectId;

  // TODO implement expiration time

  @Prop({
    required: true,
    index: true,
    ref: 'DriverRide',
    type: mongoose.Types.ObjectId,
  })
  driverRideId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    index: true,
    ref: 'RiderRide',
    type: mongoose.Types.ObjectId,
  })
  riderRideId: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    index: true,
    ref: 'DriverRideRequests',
    type: mongoose.Types.ObjectId,
  })
  driverRideRequestId: mongoose.Types.ObjectId; // basically connecting driver ride request and rider ride request

  @Prop({
    type: String,
    enum: RiderRideRequestsStatusEnums,
    default: RiderRideRequestsStatusEnums.WAITING_FOR_RIDER_RESPONSE,
  })
  status: string;

  @Prop({
    required: false,
    type: String,
  })
  rideRequestDetails: string;

  @Prop({
    required: false,
    default: true, // initially rider can decline the ride
    type: Boolean,
  })
  canDecline: boolean;

  @Prop({
    required: false,
    default: true, // initially rider can accept the ride
    type: Boolean,
  })
  canAccept: boolean;

  @Prop({
    required: false,
    default: true, // initially rider can negotiate the price
    type: Boolean,
  })
  canNegotiate: boolean;

  @Prop({
    required: false,
    type: Number,
  })
  acceptedPrice: number; // either priceByDriver / negotiatedPrice

  @Prop({
    required: true, // required to create this rider ride itself
    type: Number,
  })
  priceByDriver: number;

  @Prop({
    required: false, // when rider negotiates
    type: Number,
  })
  negotiatedPrice: number;
}

export type RiderRideRequestsDocument = RiderRideRequests & Document;

export const RiderRideRequestsSchema =
  SchemaFactory.createForClass(RiderRideRequests);
