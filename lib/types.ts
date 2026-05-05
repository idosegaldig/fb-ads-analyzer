export interface RawRow {
  [key: string]: string;
}

export interface AdRow {
  campaign_name: string;
  adset_name: string;
  ad_name: string;
  display_name: string;
  platform: string;
  reach: number;
  results: number;
  result_type: string;
  cpr: number;
  spend: number;
  landing_page_views: number;
  impressions: number;
  frequency: number;
}

export interface CampaignSummary {
  campaign_name: string;
  reach: number;
  results: number;
  result_type: string;
  cpr: number;
  spend: number;
  landing_page_views: number;
}

export interface AdSetSummary {
  campaign_name: string;
  adset_name: string;
  reach: number;
  results: number;
  cpr: number;
  spend: number;
  landing_page_views: number;
}

export interface AdSummary {
  campaign_name: string;
  adset_name: string;
  ad_name: string;
  display_name: string;
  reach: number;
  results: number;
  cpr: number;
  spend: number;
  landing_page_views: number;
}

export interface ParsedData {
  campaigns: CampaignSummary[];
  adsets: AdSetSummary[];
  ads: AdSummary[];
  currency: 'NIS' | 'USD';
  dateRange: string;
  rawRows: AdRow[];
}

export const CHART_COLORS = [
  '#2563EB', '#0891B2', '#7C3AED', '#D97706',
  '#059669', '#DC2626', '#9333EA', '#0F766E',
];
