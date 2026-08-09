import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  SePayCallbackPayload,
  SePayCallbackResponse,
} from "./payment.types";

export const sepayCallback = (payload: SePayCallbackPayload) =>
  unwrapApiData<SePayCallbackResponse>(
    apiClient.post("/sepay/callback", payload),
  );