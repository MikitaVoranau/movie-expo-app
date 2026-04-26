
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}


export function fuzzyMatch(target: string, query: string): boolean {
  if (!query.trim()) return true;
  const t = target.toLowerCase();
  const q = query.toLowerCase().trim();

  
  if (t.includes(q)) return true;

  
  const queryWords = q.split(/\s+/);
  const targetWords = t.split(/\s+/);

  return queryWords.every((qw) => {
    
    const threshold = Math.max(1, Math.floor(qw.length / 4));
    return targetWords.some((tw) => levenshtein(qw, tw) <= threshold);
  });
}


export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getField: (item: T) => string
): T[] {
  if (!query.trim()) return items;
  return items.filter((item) => fuzzyMatch(getField(item), query));
}
