const vitamins = {
  psionic_drain: "vitamin_psionic_drain",
  maintained_powers: "vitamin_maintained_powers",
};
export const MindOverMatter = {
  vitamins,
  eoc: {
    PSIONICS_GAIN_NETHER_ATTUNEMENT: "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT",
    PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK:
      "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK",
    RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER:
      "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER",
    RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER:
      "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER",
    RAISE_ATTUNEMENT_BELOW_THRESHOLD: "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD",
    RAISE_ATTUNEMENT_ABOVE_THRESHOLD: "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD",
    CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST:
      "EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST",
  },
  u: {
    latest_channeled_power_difficulty: "u_latest_channeled_power_difficulty",
    nether_conduit_repeated_channeling_value:
      "u_nether_conduit_repeated_channeling_value",
    vitamin: {
      psionic_drain: `u_vitamin('${vitamins.psionic_drain}')`,
      maintained_powers: `u_vitamin('${vitamins.maintained_powers}')`,
    },
  },
  placeholder: { difficulty: "_difficulty" },
};
