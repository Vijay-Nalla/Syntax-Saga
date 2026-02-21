import { useState } from 'react';
import { Question, HINT_COST } from '@/game/types';

interface CodingChallengeProps {
  question: Question;
  onAnswer: (correct: boolean) => void;
  playerCoins: number;
  onUseHint: () => void;
}

export default function CodingChallenge({ question, onAnswer, playerCoins, onUseHint }: CodingChallengeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const handleSubmit = (answer: string) => {
    const correct = answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setAnswered(true);
    setTimeout(() => onAnswer(correct), 1500);
  };

  const handleBuyHint = () => {
    if (playerCoins >= HINT_COST && !hintUsed) {
      setHintUsed(true);
      onUseHint();
    }
  };

  // Generate a partial hint from the answer
  const getHintText = (): string => {
    if (question.hint) return question.hint;
    const ans = question.answer;
    if (ans.length <= 2) return `The answer has ${ans.length} character(s).`;
    const revealed = ans.slice(0, Math.ceil(ans.length / 3));
    return `The answer starts with "${revealed}..." (${ans.length} chars total)`;
  };

  const typeLabel = question.type === 'mcq' ? 'MULTIPLE CHOICE' :
    question.type === 'fill-blank' ? 'FILL IN THE BLANK' :
    question.type === 'debug' ? 'DEBUG THE CODE' : 'PREDICT OUTPUT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-4 border-2 border-primary rounded-lg bg-card p-6 box-glow-primary"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-pixel text-[9px] text-primary text-glow-green">{typeLabel}</span>
          <span className="font-pixel text-[9px] text-accent">SYSTEM TERMINAL</span>
        </div>

        {/* Question */}
        <p className="font-mono text-sm text-foreground mb-4">{question.question}</p>

        {/* Code block */}
        {question.code && (
          <pre className="bg-muted p-4 rounded border border-border font-mono text-xs text-secondary mb-6 overflow-x-auto">
            {question.code}
          </pre>
        )}

        {/* Hint button */}
        {!answered && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBuyHint}
              disabled={hintUsed || playerCoins < HINT_COST}
              className={`font-pixel text-[8px] px-4 py-2 border-2 rounded transition-all
                ${hintUsed ? 'border-muted text-muted-foreground opacity-50' :
                  playerCoins < HINT_COST ? 'border-border text-muted-foreground opacity-30 cursor-not-allowed' :
                  'border-neon-yellow text-neon-yellow hover:bg-neon-yellow/10'}`}
            >
              💡 HINT ({HINT_COST} coins)
            </button>
            <span className="font-pixel text-[7px] text-muted-foreground">
              $ {playerCoins} coins
            </span>
          </div>
        )}

        {/* Hint display */}
        {hintUsed && !answered && (
          <div className="border border-neon-yellow/30 rounded p-3 mb-4 bg-neon-yellow/5">
            <p className="font-mono text-xs text-neon-yellow">{getHintText()}</p>
          </div>
        )}

        {/* Answers */}
        {question.type === 'fill-blank' ? (
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !answered && handleSubmit(inputValue)}
              disabled={answered}
              placeholder="Type your answer..."
              className="flex-1 bg-muted border border-border rounded px-4 py-3 font-mono text-sm text-foreground
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                placeholder:text-muted-foreground disabled:opacity-50"
              autoFocus
            />
            <button
              onClick={() => handleSubmit(inputValue)}
              disabled={answered || !inputValue}
              className="font-pixel text-[9px] px-6 py-3 border-2 border-secondary text-secondary
                hover:bg-secondary hover:text-secondary-foreground transition-all disabled:opacity-30"
            >
              SUBMIT
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {question.options?.map((opt) => {
              let borderColor = 'border-border';
              let bgColor = 'bg-transparent';
              if (answered && opt === question.answer) { borderColor = 'border-primary'; bgColor = 'bg-primary/10'; }
              else if (answered && opt === selected && !isCorrect) { borderColor = 'border-destructive'; bgColor = 'bg-destructive/10'; }
              else if (opt === selected && !answered) { borderColor = 'border-secondary'; bgColor = 'bg-secondary/10'; }

              return (
                <button
                  key={opt}
                  onClick={() => { if (!answered) { setSelected(opt); handleSubmit(opt); } }}
                  disabled={answered}
                  className={`text-left px-4 py-3 border-2 rounded font-mono text-sm text-foreground
                    transition-all hover:border-secondary disabled:cursor-default ${borderColor} ${bgColor}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Result */}
        {answered && (
          <div className={`border-2 rounded p-4 ${isCorrect ? 'border-primary bg-primary/5' : 'border-destructive bg-destructive/5'}`}>
            <p className={`font-pixel text-[10px] mb-2 ${isCorrect ? 'text-primary text-glow-green' : 'text-destructive'}`}>
              {isCorrect ? '✓ CORRECT! SYSTEM RESTORED.' : '✗ ERROR! SYSTEM DAMAGED.'}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
