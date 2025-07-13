// Common types used across the Meraki API

export interface MerakiApiResponse<T> {
  data: T;
  headers?: Record<string, string>;
}

export interface PaginationParams {
  perPage?: number;
  startingAfter?: string;
  endingBefore?: string;
}

export interface TimeSpanParams {
  t0?: string;
  t1?: string;
  timespan?: number;
}

export interface MerakiError {
  errors: string[];
}

export interface Tag {
  tag: string;
  scope?: string;
}

export interface Address {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export type DeviceStatus = "online" | "offline" | "alerting" | "dormant";

export interface BaseDevice {
  serial: string;
  name?: string;
  model?: string;
  mac?: string;
  tags?: string[];
  notes?: string;
  address?: Address;
  lat?: number;
  lng?: number;
}