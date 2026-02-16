import { Language, Question } from './types';

const jsQuestions: Question[][] = [
  // Level 1 - Console Output
  [
    {
      type: 'mcq',
      question: 'Which method prints output to the console in JavaScript?',
      options: ['console.log()', 'print()', 'echo()', 'System.out.println()'],
      answer: 'console.log()',
      explanation: 'console.log() is the standard way to output messages to the browser console.',
    },
    {
      type: 'fill-blank',
      question: 'Complete the code to print "Hello World":',
      code: '___("Hello World");',
      answer: 'console.log',
      explanation: 'console.log() outputs text to the console.',
    },
    {
      type: 'output',
      question: 'What is the output of this code?',
      code: 'console.log(2 + 3);',
      options: ['23', '5', 'undefined', 'NaN'],
      answer: '5',
      explanation: '2 + 3 performs arithmetic addition, resulting in 5.',
    },
  ],
  // Level 2 - Variables
  [
    {
      type: 'mcq',
      question: 'Which keyword declares a variable that can be reassigned?',
      options: ['let', 'const', 'final', 'static'],
      answer: 'let',
      explanation: '"let" declares a block-scoped variable that can be reassigned.',
    },
    {
      type: 'fill-blank',
      question: 'Declare a constant named "PI" with value 3.14:',
      code: '___ PI = 3.14;',
      answer: 'const',
      explanation: '"const" declares a variable that cannot be reassigned.',
    },
    {
      type: 'debug',
      question: 'Find the error in this code:',
      code: 'const name = "Alice";\nname = "Bob";',
      options: ['Cannot reassign const', 'Missing semicolon', 'Invalid variable name', 'Syntax error'],
      answer: 'Cannot reassign const',
      explanation: 'Variables declared with const cannot be reassigned.',
    },
  ],
  // Level 3 - Data Types
  [
    {
      type: 'mcq',
      question: 'What is the typeof "Hello"?',
      options: ['string', 'text', 'char', 'String'],
      answer: 'string',
      explanation: 'Strings in JavaScript have the type "string" (lowercase).',
    },
    {
      type: 'output',
      question: 'What does typeof 42 return?',
      code: 'console.log(typeof 42);',
      options: ['number', 'integer', 'int', 'Number'],
      answer: 'number',
      explanation: 'All numbers in JavaScript are of type "number".',
    },
  ],
];

const pythonQuestions: Question[][] = [
  [
    {
      type: 'mcq',
      question: 'Which function prints output in Python?',
      options: ['print()', 'console.log()', 'echo()', 'printf()'],
      answer: 'print()',
      explanation: 'print() is Python\'s built-in function for outputting text.',
    },
    {
      type: 'fill-blank',
      question: 'Complete the code to print "Hello World":',
      code: '___("Hello World")',
      answer: 'print',
      explanation: 'print() outputs text to the console in Python.',
    },
  ],
  [
    {
      type: 'mcq',
      question: 'How do you create a variable in Python?',
      options: ['x = 5', 'let x = 5', 'int x = 5', 'var x = 5'],
      answer: 'x = 5',
      explanation: 'Python uses simple assignment without type keywords.',
    },
  ],
  [
    {
      type: 'mcq',
      question: 'What is type("Hello") in Python?',
      options: ["<class 'str'>", 'string', 'text', 'String'],
      answer: "<class 'str'>",
      explanation: 'Python strings are of type str.',
    },
  ],
];

const cQuestions: Question[][] = [
  [
    {
      type: 'mcq',
      question: 'Which function prints output in C?',
      options: ['printf()', 'print()', 'cout', 'echo()'],
      answer: 'printf()',
      explanation: 'printf() is C\'s standard output function from stdio.h.',
    },
  ],
  [
    {
      type: 'mcq',
      question: 'Which keyword declares an integer variable in C?',
      options: ['int', 'let', 'var', 'integer'],
      answer: 'int',
      explanation: 'int declares an integer variable in C.',
    },
  ],
  [
    {
      type: 'mcq',
      question: 'What is the size of char in C?',
      options: ['1 byte', '2 bytes', '4 bytes', '8 bytes'],
      answer: '1 byte',
      explanation: 'A char in C always occupies 1 byte of memory.',
    },
  ],
];

const questionBanks: Record<Language, Question[][]> = {
  javascript: jsQuestions,
  python: pythonQuestions,
  c: cQuestions,
  cpp: cQuestions, // reuse for now
  java: jsQuestions, // similar enough for demo
};

export function getQuestionsForLevel(language: Language, level: number): Question[] {
  const bank = questionBanks[language];
  const index = Math.min(level - 1, bank.length - 1);
  return bank[index] || bank[0];
}
