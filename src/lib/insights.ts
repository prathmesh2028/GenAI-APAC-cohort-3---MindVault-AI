import { Conversation, WeeklyReflection, MindPattern } from '../types';

/**
 * Computes human-readable relative time (e.g. "Just now", "2 hours ago", "Yesterday").
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'No activity yet';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 172800) return 'Yesterday';
  
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates current reflection streak in days/weeks based on activity timestamps.
 */
export function calculateReflectionStreak(
  conversations: Conversation[],
  reflections: WeeklyReflection[]
): { count: number; unit: 'days' | 'weeks'; label: string } {
  const dates = new Set<string>();

  conversations.forEach((c) => {
    if (c.updatedAt) {
      dates.add(new Date(c.updatedAt).toISOString().split('T')[0]);
    }
  });

  reflections.forEach((r) => {
    if (r.createdAt) {
      dates.add(new Date(r.createdAt).toISOString().split('T')[0]);
    }
  });

  if (dates.size === 0) {
    return { count: 0, unit: 'days', label: '0 days' };
  }

  const sortedDates = Array.from(dates).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = 0;
  let checkDate = new Date();

  // If active today or yesterday, count back
  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return { count: 0, unit: 'days', label: '0 days' };
  }

  // Count consecutive days
  const dateSet = new Set(sortedDates);
  let currentCheck = new Date(mostRecent);

  while (dateSet.has(currentCheck.toISOString().split('T')[0])) {
    streak++;
    currentCheck.setDate(currentCheck.getDate() - 1);
  }

  return {
    count: streak,
    unit: 'days',
    label: streak === 1 ? '1 day' : `${streak} days`,
  };
}

/**
 * Extracts mind patterns based strictly on the user's actual stored conversation topics.
 */
export function extractMindPatterns(conversations: Conversation[]): MindPattern[] {
  if (!conversations || conversations.length === 0) return [];

  const topicCounts: Record<string, number> = {};

  conversations.forEach((c) => {
    (c.topics || []).forEach((topic) => {
      const cleaned = topic.trim();
      if (!cleaned) return;
      topicCounts[cleaned] = (topicCounts[cleaned] || 0) + 1;
    });
  });

  const patterns: MindPattern[] = Object.entries(topicCounts).map(([name, count]) => {
    const lower = name.toLowerCase();
    let category: MindPattern['category'] = 'Other';

    if (
      lower.includes('learn') ||
      lower.includes('study') ||
      lower.includes('read') ||
      lower.includes('concept') ||
      lower.includes('ai') ||
      lower.includes('tech')
    ) {
      category = 'Learning';
    } else if (
      lower.includes('career') ||
      lower.includes('work') ||
      lower.includes('job') ||
      lower.includes('leadership') ||
      lower.includes('company')
    ) {
      category = 'Career';
    } else if (
      lower.includes('project') ||
      lower.includes('build') ||
      lower.includes('app') ||
      lower.includes('system') ||
      lower.includes('code')
    ) {
      category = 'Projects';
    } else if (
      lower.includes('goal') ||
      lower.includes('plan') ||
      lower.includes('strategy') ||
      lower.includes('roadmap')
    ) {
      category = 'Goals';
    } else if (
      lower.includes('decision') ||
      lower.includes('choice') ||
      lower.includes('tradeoff') ||
      lower.includes('priority')
    ) {
      category = 'Decisions';
    } else if (
      lower.includes('growth') ||
      lower.includes('habit') ||
      lower.includes('mindset') ||
      lower.includes('reflect') ||
      lower.includes('journal')
    ) {
      category = 'Personal Growth';
    } else if (
      lower.includes('challenge') ||
      lower.includes('block') ||
      lower.includes('problem') ||
      lower.includes('stress') ||
      lower.includes('friction')
    ) {
      category = 'Challenges';
    }

    return { name, count, category };
  });

  // Sort by highest frequency
  return patterns.sort((a, b) => b.count - a.count).slice(0, 8);
}
