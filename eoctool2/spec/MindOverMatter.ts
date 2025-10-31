const vitamins = {
  psionic_drain: "vitamin_psionic_drain",
  maintained_powers: "vitamin_maintained_powers",
};
export const MindOverMatter = {
  vitamins,
  u: {
    vitamin: {
      psionic_drain: `u_vitamin('${vitamins.psionic_drain}')`,
      maintained_powers: `u_vitamin('${vitamins.maintained_powers}')`,
    },
  },
  placeholder: { difficulty: "_difficulty" },
};
