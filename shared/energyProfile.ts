export interface EnergyProfileResult {
  birth_utc_datetime: string;
  birth_local_datetime_resolved: string;
  tz_offset_minutes_at_birth: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  calc_versions: Record<string, string>;
  calculation_modes: Record<string, Record<string, string | boolean>>;
  western_tropical: WesternResult;
  western_sidereal: WesternSiderealResult;
  chinese_bazi: BaziResult;
}

export interface BodyPosition {
  longitude_deg: number;
  sign_id: string;
  element_id: string;
}

export interface ElementBalance {
  count: number;
  ratio: number;
}

export interface WesternResult {
  reference_frame_id: string;
  calculation_mode: Record<string, string>;
  bodies: Record<string, BodyPosition>;
  elements: Record<string, ElementBalance>;
}

export interface WesternSiderealResult extends WesternResult {
  ayanamsha_deg: number;
}

export interface PillarPosition {
  stem_id: string;
  branch_id: string;
}

export interface DayMaster {
  stem_id: string;
  element_id: string;
  polarity_id: string;
}

export interface LuckCycle {
  stem_id: string;
  branch_id: string;
  start_age: number;
  end_age: number;
}

export interface BaziResult {
  reference_frame_id: string;
  calculation_mode: Record<string, string | boolean>;
  pillars: Record<string, PillarPosition>;
  day_master: DayMaster;
  elements_visible: Record<string, ElementBalance>;
  elements_total: Record<string, ElementBalance>;
  polarity_visible: Record<string, ElementBalance>;
  polarity_total: Record<string, ElementBalance>;
  luck_cycles: Record<string, LuckCycle> | null;
}
