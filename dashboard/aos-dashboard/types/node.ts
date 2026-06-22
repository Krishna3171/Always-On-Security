export interface NodeSecurity {
  node: string;
  status: string;
  risk_score: number;

  trust_status: string;

  replay_count: number;
  flood_count: number;

  config_tamper_count: number;
  lateral_movement_count: number;

  last_updated: string;
}
