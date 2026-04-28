export type MlSource = "questionnaire" | "history" | "general";

export type MlProfile = {
  age: number;
  gender: string;
  activity: string;
  goal: string;
  allergies: string[];
};

export type MlHistory = {
  login_30d?: number;
  view_cashew_30d?: number;
  view_peanut_30d?: number;
  click_rec_cashew_30d?: number;
  click_rec_peanut_30d?: number;
  purchase_cashew_90d?: number;
  purchase_peanut_90d?: number;
  days_since_last_purchase?: number;
  days_since_last_active?: number;
};

export type MlPredictRequest = {
  profile: MlProfile;
  history?: MlHistory;
  source: MlSource;
};

export type MlPredictResponse = {
  product: "cashew" | "peanut" | "both" | "none";
  confidence?: number;
  probs?: Record<string, number>;
  debug?: any;
  error?: string;
};

export async function predictRecommendation(payload: MlPredictRequest) {
  const r = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await r.json().catch(() => ({}))) as MlPredictResponse;
  if (!r.ok) {
    throw new Error(data?.error || "Gagal memanggil ML service");
  }
  return data;
}
