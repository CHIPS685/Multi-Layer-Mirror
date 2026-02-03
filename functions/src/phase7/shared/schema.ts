import { DialogueAIOutput, PrefillAIOutput } from "./types";
import { clamp } from "./sanitize";

export function validateDialogueOutput(obj: any): DialogueAIOutput {
  if (!obj) throw new Error("invalid_ai_output");
  if (obj.policyVersion !== "phase7_dialogue_v1") throw new Error("invalid_policy_version");
  if (typeof obj.dialogueText !== "string") throw new Error("invalid_dialogueText");
  if (!Array.isArray(obj.evidenceRefs)) throw new Error("invalid_evidenceRefs");
  if (!Array.isArray(obj.evidenceQuotes)) throw new Error("invalid_evidenceQuotes");
  if (typeof obj.coverage !== "number") throw new Error("invalid_coverage");
  if (!Array.isArray(obj.missing)) throw new Error("invalid_missing");

  obj.coverage = clamp(obj.coverage, 0, 1);
  return obj as DialogueAIOutput;
}

export function validatePrefillOutput(obj: any): PrefillAIOutput {
  if (!obj) throw new Error("invalid_ai_output");
  if (obj.policyVersion !== "phase7_prefill_v1") throw new Error("invalid_policy_version");
  if (!Array.isArray(obj.prefillCandidates)) throw new Error("invalid_candidates");
  if (typeof obj.draftText !== "string") throw new Error("invalid_draftText");
  return obj as PrefillAIOutput;
}
