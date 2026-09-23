"use client";

import { MinionGame } from "./minion-game";

export function MinionRun({ onFinished }: { onFinished?: () => void }) {
  return <MinionGame onScoreSubmitted={async () => {}} onClose={() => onFinished?.()} />;
}
