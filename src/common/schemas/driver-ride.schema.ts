import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum GeoJSONType {
  Point = 'Point',
}
interface Location {
  type: GeoJSONType;
  coordinates: [number, number]; // [longitude, latitude]
}

export enum DriverRideStatus {
  created = 'RIDE_CREATED',
  cancelled = 'RIDE_CANCELLED',
  full = 'RIDE_BOOKED_FULL',
  started = 'RIDE_STARTED',
  completed = 'RIDE_COMPLETED',
  inProgress = 'RIDE_IN_PROGRESS',
  pendingResponse = 'RIDE_PENDING_RESPONSE',
}

export enum LuggageEnum {
  noLuggage = 'NoLuggage',
  small = 'Small',
  medium = 'Medium',
  large = 'Large',
}
@Schema({ timestamps: true, id: true })
export class DriverRide {
  @Prop({
    required: true,
    index: true,
    ref: 'User',
    type: mongoose.Types.ObjectId,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: { type: String, default: GeoJSONType.Point, enum: GeoJSONType }, // GeoJSON type
    coordinates: { type: [Number] }, // [longitude, latitude]
  })
  origin: Location;

  @Prop({
    type: { type: String, default: GeoJSONType.Point, enum: GeoJSONType }, // GeoJSON type
    coordinates: { type: [Number] }, // [longitude, latitude]
  })
  destination: Location;

  @Prop({
    type: [Object],
  })
  stops: [object];

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originAddress: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationAddress: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originPlaceId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationPlaceId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originUrl: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationUrl: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originPostalCode: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationPostalCode: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originCountryShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationCountryShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originCountryLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationCountryLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originProvinceShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationProvinceShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  originProvinceLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  destinationProvinceLongName: string;
  // should include date and time
  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  leaving: Date;

  // TODO add recurring trip

  @Prop({
    type: String,
    enum: DriverRideStatus,
    default: DriverRideStatus.created,
  })
  status: string;

  // vehicle details
  @Prop({
    required: true,
    index: true,
    ref: 'UserVehicle',
    type: mongoose.Types.ObjectId,
  })
  vehicleId: mongoose.Types.ObjectId;

  // Trip Preferences
  @Prop({
    type: String,
    index: true,
    required: true,
    enum: LuggageEnum,
  })
  luggage: LuggageEnum;

  @Prop({
    type: Number,
    required: true,
    index: true,
  })
  emptySeats: number;

  @Prop({
    type: String,
    required: false,
  })
  tripDescription: string;
}

export type DriverRideDocument = DriverRide & Document;

const DriverRideScheme = SchemaFactory.createForClass(DriverRide);

DriverRideScheme.index({
  origin: '2dsphere',
  destination: '2dsphere',
});

export { DriverRideScheme };
