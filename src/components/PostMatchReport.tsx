import { useEffect, useState } from 'react';
import { MatchStats } from '@/game/types';
import { useAuth } from '@/hooks/useAuth';
import LearningInsightsPanel from './learning/LearningInsightsPanel';
import { fetchRecentAnswers, fetchTopicMastery, updateTopicMastery, type AnswerRow, type MasteryRow } from '@/game/learningEngine';

interface PostMatchReportProps {
  stats: MatchStats;
  onRematch: () => void;
  onNewRoom: () => void;
  onExit: () => void;
}

export default function PostMatchReport({
  stats,
  onRematch,
  onNewRoom,
  onExit
}: PostMatchReportProps) {
  const { user } = useAuth();
  const { player1, player2 } = stats;
  const isWinner = player1.score > player2.score;
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchRecentAnswers(user.id, 50).then(async (a) => {
      setAnswers(a);
      await updateTopicMastery(user.id, a);
      const m = await fetchTopicMastery(user.id);
      setMastery(m);
    });
  }, [user]);

  const topics = ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[92vh] overflow-y-auto py-4">
        {/* Match Result */}
        <div className="text-center mb-6">
          <h2 className="font-display text-4xl md:text-5xl font-black mb-2"
            style={{
              color: isWinner ? 'hsl(150, 100%, 50%)' : 'hsl(350, 80%, 65%)',
              textShadow: `0 0 30px ${isWinner ? 'hsl(150, 100%, 50%)' : 'hsl(350, 80%, 65%)'}`
            }}
          >
            {isWinner ? '🏆 YOU WIN!' : 'NICE TRY!'}
          </h2>
          <p className="font-pixel text-sm text-muted-foreground">MATCH COMPLETE</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border-2 border-primary rounded-lg bg-card/80 backdrop-blur-sm p-4 text-center">
            <p className="font-pixel text-xs text-primary mb-2">YOU</p>
            <p className="font-display text-4xl text-primary text-glow-primary">{player1.score}</p>
            <p className="font-mono text-xs text-muted-foreground mt-2">{player1.coins} coins</p>
            <div className="mt-4">
              <p className="font-pixel text-[8px] text-muted-foreground mb-1">STRENGTHS</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {player1.performance.slice(0,2).map(p => (
                  <span key={p.topic} className="text-[9px] px-2 py-1 rounded-full bg-green-900/40 text-green-300 border border-green-600">{p.topic}</span>
                ))}
              </div>
              <p className="font-pixel text-[8px] text-muted-foreground mt-3 mb-1">NEEDS IMPROVEMENT</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {player1.performance.slice(-2).map(p => (
                  <span key={p.topic} className="text-[9px] px-2 py-1 rounded-full bg-red-900/40 text-red-300 border border-red-600">{p.topic}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-2 border-secondary rounded-lg bg-card/80 backdrop-blur-sm p-4 text-center">
            <p className="font-pixel text-xs text-secondary mb-2">FRIEND</p>
            <p className="font-display text-4xl text-secondary text-glow-cyan">{player2.score}</p>
            <p className="font-mono text-xs text-muted-foreground mt-2">{player2.coins} coins</p>
          </div>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-4 mb-6">
          <p className="font-pixel text-sm text-primary text-glow-primary text-center mb-4">HEAD TO HEAD ANALYSIS</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topics.map(topic => {
              const p1Perf = player1.performance.find(p => p.topic === topic) || { accuracy: 50 };
              const p2Perf = player2.performance.find(p => p.topic === topic) || { accuracy: 50 };
              const p1Wins = p1Perf.accuracy > p2Perf.accuracy;

              return (
                <div key={topic} className="text-center">
                  <p className="font-pixel text-[8px] text-muted-foreground mb-2">{topic}</p>
                  <div className="flex justify-center gap-1 mb-1">
                    <span className={p1Wins ? 'text-primary font-bold' : 'text-muted-foreground'}>{p1Perf.accuracy}%</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={!p1Wins ? 'text-secondary font-bold' : 'text-muted-foreground'}>{p2Perf.accuracy}%</span>
                  </div>
                  <span className={`font-pixel text-[8px] ${p1Wins ? 'text-green-400' : 'text-cyan-400'}`}>
                    {p1Wins ? '🏆 YOU' : '🏆 FRIEND'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Learning Intelligence Center */}
        <div className="mb-6">
          <LearningInsightsPanel
            answers={answers}
            mastery={mastery}
            meName={player1.name}
            friendName={player2.name}
            mePerf={player1.performance.map(p => ({ topic: p.topic, accuracy: p.accuracy }))}
            friendPerf={player2.performance.map(p => ({ topic: p.topic, accuracy: p.accuracy }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRematch}
            className="font-pixel text-sm px-8 py-4 border-2 border-primary text-primary
              hover:bg-primary hover:text-primary-foreground transition-all box-glow-primary"
          >
            REMATCH
          </button>
          <button
            onClick={onNewRoom}
            className="font-pixel text-[10px] px-6 py-3 border border-border text-muted-foreground
              hover:border-secondary hover:text-secondary transition-all"
          >
            NEW ROOM
          </button>
          <button
            onClick={onExit}
            className="font-pixel text-[10px] text-muted-foreground hover:text-foreground transition-all"
          >
            EXIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
