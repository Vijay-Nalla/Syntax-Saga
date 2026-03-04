import { Language, LANGUAGES } from '@/game/types';

interface LanguageSelectProps {
  onSelect: (lang: Language) => void;
}

export default function LanguageSelect({ onSelect }: LanguageSelectProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      <div className="relative z-20 text-center px-3 sm:px-4 max-w-5xl w-full">
        <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-primary text-glow-primary mb-2 sm:mb-3">
          LANGUAGE SELECTION
        </h2>
        <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-12">
          Choose your programming realm
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {LANGUAGES.map((lang, i) => (
            <button
              key={lang.id}
              onClick={() => onSelect(lang.id)}
              className="group relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8
                border-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                borderColor: lang.color,
                animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both`,
                boxShadow: `0 0 15px ${lang.color}40, inset 0 0 15px ${lang.color}10`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${lang.color}80, 0 0 60px ${lang.color}30, inset 0 0 20px ${lang.color}20`;
                (e.currentTarget as HTMLElement).style.backgroundColor = `${lang.color}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 15px ${lang.color}40, inset 0 0 15px ${lang.color}10`;
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <div
                className="font-display text-3xl md:text-4xl font-black mb-3 portal-glow"
                style={{ color: lang.color }}
              >
                {lang.icon}
              </div>
              <div className="font-pixel text-[10px] mb-2" style={{ color: lang.color }}>
                {lang.name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {lang.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
