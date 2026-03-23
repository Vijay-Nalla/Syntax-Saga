import { describe, it, expect } from 'vitest';
import { getQuestionsForLevel } from '@/game/questions';
import type { Question } from '@/game/types';

describe('Static 200-question pool', () => {
  it('returns 4 questions per level for 50 levels (JS)', () => {
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('javascript', level);
      expect(qs.length).toBe(4);
    }
  });

  it('has globally unique questions and answers across JS levels', () => {
    const allQs: Question[] = [];
    for (let level = 1; level <= 50; level++) {
      allQs.push(...getQuestionsForLevel('javascript', level));
    }
    expect(allQs.length).toBe(200);

    const qTexts = new Set(allQs.map(q => (q.question + '|' + (q.code || '')).toLowerCase().trim()));
    const answers = new Set(allQs.map(q => q.answer.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '')));

    expect(qTexts.size).toBe(200);
    expect(answers.size).toBe(200);
  });

  it('no JS level shares a question with another JS level', () => {
    const seen = new Set<string>();
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('javascript', level);
      for (const q of qs) {
        const key = (q.question + '|' + (q.code || '')).toLowerCase().trim();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('returns 4 questions per level for 50 levels (Python)', () => {
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('python', level);
      expect(qs.length).toBe(4);
    }
  });

  it('has globally unique questions and answers across Python levels', () => {
    const allQs: Question[] = [];
    for (let level = 1; level <= 50; level++) {
      allQs.push(...getQuestionsForLevel('python', level));
    }
    expect(allQs.length).toBe(200);

    const qTexts = new Set(allQs.map(q => (q.question + '|' + (q.code || '')).toLowerCase().trim()));
    const answers = new Set(allQs.map(q => q.answer.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '')));

    expect(qTexts.size).toBe(200);
    expect(answers.size).toBe(200);
  });

  it('no Python level shares a question with another Python level', () => {
    const seen = new Set<string>();
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('python', level);
      for (const q of qs) {
        const key = (q.question + '|' + (q.code || '')).toLowerCase().trim();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('returns 4 questions per level for 50 levels (Java)', () => {
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('java', level);
      expect(qs.length).toBe(4);
    }
  });

  it('has globally unique questions and answers across Java levels', () => {
    const allQs: Question[] = [];
    for (let level = 1; level <= 50; level++) {
      allQs.push(...getQuestionsForLevel('java', level));
    }
    expect(allQs.length).toBe(200);

    const qTexts = new Set(allQs.map(q => (q.question + '|' + (q.code || '')).toLowerCase().trim()));
    const answers = new Set(allQs.map(q => q.answer.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '')));

    expect(qTexts.size).toBe(200);
    expect(answers.size).toBe(200);
  });

  it('no Java level shares a question with another Java level', () => {
    const seen = new Set<string>();
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('java', level);
      for (const q of qs) {
        const key = (q.question + '|' + (q.code || '')).toLowerCase().trim();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('returns 4 questions per level for 50 levels (C)', () => {
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('c', level);
      expect(qs.length).toBe(4);
    }
  });

  it('has globally unique questions and answers across C levels', () => {
    const allQs: Question[] = [];
    for (let level = 1; level <= 50; level++) {
      allQs.push(...getQuestionsForLevel('c', level));
    }
    expect(allQs.length).toBe(200);

    const qTexts = new Set(allQs.map(q => (q.question + '|' + (q.code || '')).toLowerCase().trim()));
    const answers = new Set(allQs.map(q => q.answer.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '')));

    expect(qTexts.size).toBe(200);
    expect(answers.size).toBe(200);
  });

  it('no C level shares a question with another C level', () => {
    const seen = new Set<string>();
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('c', level);
      for (const q of qs) {
        const key = (q.question + '|' + (q.code || '')).toLowerCase().trim();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it('returns 4 questions per level for 50 levels (C++)', () => {
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('cpp', level);
      expect(qs.length).toBe(4);
    }
  });

  it('has globally unique questions and answers across C++ levels', () => {
    const allQs: Question[] = [];
    for (let level = 1; level <= 50; level++) {
      allQs.push(...getQuestionsForLevel('cpp', level));
    }
    expect(allQs.length).toBe(200);

    const qTexts = new Set(allQs.map(q => (q.question + '|' + (q.code || '')).toLowerCase().trim()));
    const answers = new Set(allQs.map(q => q.answer.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '')));

    expect(qTexts.size).toBe(200);
    expect(answers.size).toBe(200);
  });

  it('no C++ level shares a question with another C++ level', () => {
    const seen = new Set<string>();
    for (let level = 1; level <= 50; level++) {
      const qs = getQuestionsForLevel('cpp', level);
      for (const q of qs) {
        const key = (q.question + '|' + (q.code || '')).toLowerCase().trim();
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });
});
