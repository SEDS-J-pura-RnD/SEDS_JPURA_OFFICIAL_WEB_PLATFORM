import { prisma } from "./db";

export interface MetricConfig {
  mode: "auto" | "custom";
  value: number;
  suffix: string;
  label: string;
}

export interface HomePageStatsSettings {
  activeMembers: MetricConfig;
  projectsLaunched: MetricConfig;
  eventsHosted: MetricConfig;
  researchDivisions: MetricConfig;
}

export const DEFAULT_HOME_STATS: HomePageStatsSettings = {
  activeMembers: {
    mode: "auto",
    value: 150,
    suffix: "+",
    label: "Active Members",
  },
  projectsLaunched: {
    mode: "auto",
    value: 12,
    suffix: "+",
    label: "Projects Launched",
  },
  researchDivisions: {
    mode: "custom",
    value: 5,
    suffix: "",
    label: "Research Divisions",
  },
  eventsHosted: {
    mode: "auto",
    value: 45,
    suffix: "+",
    label: "Events Hosted",
  },
};

export const HOME_STATS_SETTING_KEY = "home_stats";

/**
 * Parses and sanitizes stored settings with defaults fallback
 */
export function parseHomePageStats(rawJson?: string | null): HomePageStatsSettings {
  if (!rawJson) return { ...DEFAULT_HOME_STATS };
  try {
    const parsed = JSON.parse(rawJson);
    return {
      activeMembers: {
        mode: parsed.activeMembers?.mode === "custom" ? "custom" : "auto",
        value: typeof parsed.activeMembers?.value === "number" ? parsed.activeMembers.value : DEFAULT_HOME_STATS.activeMembers.value,
        suffix: typeof parsed.activeMembers?.suffix === "string" ? parsed.activeMembers.suffix : DEFAULT_HOME_STATS.activeMembers.suffix,
        label: parsed.activeMembers?.label || DEFAULT_HOME_STATS.activeMembers.label,
      },
      projectsLaunched: {
        mode: parsed.projectsLaunched?.mode === "custom" ? "custom" : "auto",
        value: typeof parsed.projectsLaunched?.value === "number" ? parsed.projectsLaunched.value : DEFAULT_HOME_STATS.projectsLaunched.value,
        suffix: typeof parsed.projectsLaunched?.suffix === "string" ? parsed.projectsLaunched.suffix : DEFAULT_HOME_STATS.projectsLaunched.suffix,
        label: parsed.projectsLaunched?.label || DEFAULT_HOME_STATS.projectsLaunched.label,
      },
      eventsHosted: {
        mode: parsed.eventsHosted?.mode === "custom" ? "custom" : "auto",
        value: typeof parsed.eventsHosted?.value === "number" ? parsed.eventsHosted.value : DEFAULT_HOME_STATS.eventsHosted.value,
        suffix: typeof parsed.eventsHosted?.suffix === "string" ? parsed.eventsHosted.suffix : DEFAULT_HOME_STATS.eventsHosted.suffix,
        label: parsed.eventsHosted?.label || DEFAULT_HOME_STATS.eventsHosted.label,
      },
      researchDivisions: {
        mode: parsed.researchDivisions?.mode === "auto" ? "auto" : "custom",
        value: typeof parsed.researchDivisions?.value === "number" ? parsed.researchDivisions.value : DEFAULT_HOME_STATS.researchDivisions.value,
        suffix: typeof parsed.researchDivisions?.suffix === "string" ? parsed.researchDivisions.suffix : DEFAULT_HOME_STATS.researchDivisions.suffix,
        label: parsed.researchDivisions?.label || DEFAULT_HOME_STATS.researchDivisions.label,
      },
    };
  } catch {
    return { ...DEFAULT_HOME_STATS };
  }
}

/**
 * Fetches current site settings and resolves values for public display
 */
export async function getResolvedHomePageStats() {
  try {
    const [liveUsers, liveProjects, liveEvents, liveDivisions, settingRecord] = await Promise.all([
      prisma.user.count().catch(() => 150),
      prisma.project.count().catch(() => 12),
      prisma.event.count({ where: { isPublished: true } }).catch(() => 45),
      prisma.division.count().catch(() => 5),
      prisma.siteSetting.findUnique({
        where: { key: HOME_STATS_SETTING_KEY },
      }).catch(() => null),
    ]);

    const liveCounts = {
      members: liveUsers,
      projects: liveProjects,
      events: liveEvents,
      divisions: liveDivisions > 0 ? liveDivisions : 5,
    };

    const settings = parseHomePageStats(settingRecord?.value);

    // Compute display numbers based on mode
    const displayStats = [
      {
        key: "activeMembers",
        number: `${settings.activeMembers.mode === "auto" ? liveCounts.members : settings.activeMembers.value}${settings.activeMembers.suffix}`,
        label: settings.activeMembers.label,
        mode: settings.activeMembers.mode,
      },
      {
        key: "projectsLaunched",
        number: `${settings.projectsLaunched.mode === "auto" ? liveCounts.projects : settings.projectsLaunched.value}${settings.projectsLaunched.suffix}`,
        label: settings.projectsLaunched.label,
        mode: settings.projectsLaunched.mode,
      },
      {
        key: "researchDivisions",
        number: `${settings.researchDivisions.mode === "auto" ? liveCounts.divisions : settings.researchDivisions.value}${settings.researchDivisions.suffix}`,
        label: settings.researchDivisions.label,
        mode: settings.researchDivisions.mode,
      },
      {
        key: "eventsHosted",
        number: `${settings.eventsHosted.mode === "auto" ? liveCounts.events : settings.eventsHosted.value}${settings.eventsHosted.suffix}`,
        label: settings.eventsHosted.label,
        mode: settings.eventsHosted.mode,
      },
    ];

    return {
      displayStats,
      settings,
      liveCounts,
      updatedAt: settingRecord?.updatedAt || null,
    };
  } catch (error) {
    console.error("Error resolving home page stats:", error);
    return {
      displayStats: [
        { key: "activeMembers", number: "150+", label: "Active Members", mode: "auto" as const },
        { key: "projectsLaunched", number: "12+", label: "Projects Launched", mode: "auto" as const },
        { key: "researchDivisions", number: "5", label: "Research Divisions", mode: "custom" as const },
        { key: "eventsHosted", number: "45+", label: "Events Hosted", mode: "auto" as const },
      ],
      settings: DEFAULT_HOME_STATS,
      liveCounts: { members: 150, projects: 12, events: 45, divisions: 5 },
      updatedAt: null,
    };
  }
}
