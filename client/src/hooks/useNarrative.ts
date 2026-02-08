import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { BodyProfile } from "@shared/schema";
import type { EnergyProfileResult } from "@shared/energyProfile";
import type { ProfileInput } from "@shared/schema";
import type { NarrativeJSON } from "@shared/llmNarratives";

type NarrativePayload =
  | { profile: BodyProfile; narrativeVersion?: string }
  | { energyProfile: EnergyProfileResult; profileInput: ProfileInput; narrativeVersion?: string };

async function fetchNarrative(payload: NarrativePayload): Promise<NarrativeJSON> {
  const res = await apiRequest("POST", "/api/narratives/generate", payload);
  return res.json();
}

export function useNarrative() {
  const mutation = useMutation({
    mutationFn: fetchNarrative,
    retry: 0,
  });
  return {
    generateNarrative: mutation.mutateAsync,
    narrative: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
