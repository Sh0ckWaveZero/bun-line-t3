export interface AqicnIaqi {
  co?: { v: number };
  h?: { v: number };
  no2?: { v: number };
  o3?: { v: number };
  p?: { v: number };
  pm10?: { v: number };
  pm25?: { v: number };
  so2?: { v: number };
  t?: { v: number };
  w?: { v: number };
}

export interface AqicnData {
  aqi: number;
  city: { name: string; geo: [number, number] };
  dominentpol: string;
  iaqi: AqicnIaqi;
  time: { iso: string };
}

export interface AqicnResponse {
  status: "ok" | "error";
  data: AqicnData;
}
