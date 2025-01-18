export interface DataRow {
  team_name: string
  last_name: string
  first_name: string
  DateColumn: string | Date
  not_ready_reason: string
  not_ready_time: number
  total_ready_time: number
  total_ringing_time_in: number
  total_ringing_time_out: number
  total_login_time: number
  total_acw_time_in: number
  total_acw_time_out: number
  total_hold_time_in: number
  total_hold_time_out: number
  total_talk_time_in: number
  total_talk_time_out: number
  num_calls_answered: number
  num_calls_answered_ot: number
  num_calls_out: number
  num_calls_rejected: number
  service_name: string
  TimeGroupColumn30: string
}

