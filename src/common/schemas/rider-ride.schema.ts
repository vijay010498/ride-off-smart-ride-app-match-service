import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum GeoJSONType {
  Point = 'Point',
}
interface Location {
  type: GeoJSONType;
  coordinates: [number, number]; // [longitude, latitude]
}

export enum RiderRideStatus {
  created = 'RIDE_CREATED',
  cancelled = 'RIDE_CANCELLED',
  booked = 'RIDE_BOOKED_BOOKED',
  started = 'RIDE_STARTED',
  completed = 'RIDE_COMPLETED',
  inProgress = 'RIDE_IN_PROGRESS',
  pendingResponse = 'RIDE_PENDING_RESPONSE',
}

@Schema({ timestamps: true, id: true })
export class RiderRide {
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
  from: Location;

  @Prop({
    type: { type: String, default: GeoJSONType.Point, enum: GeoJSONType }, // GeoJSON type
    coordinates: { type: [Number] }, // [longitude, latitude]
  })
  to: Location;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromAddress: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toAddress: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromPlaceId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toPlaceId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromUrl: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toUrl: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromPostalCode: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toPostalCode: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromCountryShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toCountryShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromCountryLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toCountryLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromProvinceShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toProvinceShortName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  fromProvinceLongName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  toProvinceLongName: string;

  // should include date and time
  @Prop({
    required: true,
    type: Date,
    index: true,
  })
  departing: Date;

  @Prop({
    type: String,
    enum: RiderRideStatus,
    default: RiderRideStatus.created,
  })
  status: string;

  @Prop({
    type: Number,
    required: true,
  })
  seats: number;

  @Prop({
    type: Number,
  })
  maxPrice: number;

  @Prop({
    type: String,
    required: false,
  })
  rideDescription: string;
}

export type RiderRideDocument = RiderRide & Document;
const RiderRideScheme = SchemaFactory.createForClass(RiderRide);

RiderRideScheme.index({
  from: '2dsphere',
  to: '2dsphere',
});

export { RiderRideScheme };
