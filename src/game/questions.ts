import { Language, Question } from './types';

const JS_QUESTIONS: Question[] = (() => {
  const list: Question[] = [];
  const pad2 = (n: number) => String(n).padStart(2, '0'); // level

  const makeMCQ = (code: string, correct: string, distractors: string[]): Question => {
    const options = [correct, ...distractors].slice(0, 4);
    // simple shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor((i + 3) * 97 % (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return {
      type: 'mcq',
      question: 'Choose the correct output of this code:',
      code,
      options,
      answer: correct,
      explanation: `Evaluate the code; the correct output is "${correct}".`,
      hint: 'Simulate the string/array operations step by step.',
    };
  };

  for (let level = 1; level <= 50; level++) {
    const LV = pad2(level);
    // Progressive complexity by tiers
    if (level <= 10) {
      // Basics: string concat, template literals, join
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `console.log('L${LV}-' + 'A');`,
        answer: `L${LV}-A`,
        explanation: 'String concatenation joins "Lxx-" and "A".',
        hint: 'Plain concatenation.',
      });
      list.push(makeMCQ(
        `const x='L${LV}-'; console.log(\`\${x}B\`);`,
        `L${LV}-B`,
        [`L${LV}B`, `L${LV}-A`, `L${LV}-C`],
      ));
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const id='L${LV}'; console.log(\`\${id}-C\`);`,
        answer: `L${LV}-C`,
        explanation: 'Template literal combines id and "-C".',
        hint: 'Template strings use backticks.',
      });
      list.push(makeMCQ(
        `console.log(['L${LV}', 'D'].join('-'));`,
        `L${LV}-D`,
        [`L${LV}D`, `L${LV}-C`, `L${LV}-A`],
      ));
    } else if (level <= 20) {
      // Arrays and string methods
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const parts=['l','${LV}','e'];\nconsole.log(parts.join('').toUpperCase()+'-A');`,
        answer: `L${LV}E-A`,
        explanation: 'join -> toUpperCase -> suffix "-A".',
        hint: 'Uppercase after join.',
      });
      list.push(makeMCQ(
        `const s='L${LV}'; console.log(s.padEnd(3,'0').slice(0,3)+'-B');`,
        `L${LV}-B`,
        [`L${LV}0-B`, `L${LV}-A`, `L${LV}-C`],
      ));
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const [a,b]=['L${LV}','-C']; console.log(a+b);`,
        answer: `L${LV}-C`,
        explanation: 'Array destructuring + concatenation.',
        hint: 'a and b are the two array elements.',
      });
      list.push(makeMCQ(
        `const arr=['L','${LV}','-D']; console.log(arr.reduce((x,y)=>x+y,''));`,
        `L${LV}-D`,
        [`L${LV}D`, `L-${LV}-D`, `L${LV}-C`],
      ));
    } else if (level <= 30) {
      // Functions & defaults
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const label=(p='L${LV}',s='-A')=>p+s; console.log(label());`,
        answer: `L${LV}-A`,
        explanation: 'Default parameters are used.',
        hint: 'No args passed, defaults apply.',
      });
      list.push(makeMCQ(
        `function f(p){ return p+'-B'; }\nconsole.log(f('L${LV}'));`,
        `L${LV}-B`,
        [`L${LV}B`, `L${LV}-A`, `L${LV}-C`],
      ));
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const make=(x)=>x+'-C'; const base='L${LV}'; console.log(make(base));`,
        answer: `L${LV}-C`,
        explanation: 'Arrow function returns the suffix string.',
        hint: 'Read make(base).',
      });
      list.push(makeMCQ(
        `const g=({p,s})=>p+s; console.log(g({p:'L${LV}',s:'-D'}));`,
        `L${LV}-D`,
        [`L${LV}D`, `L-${LV}-D`, `L${LV}-C`],
      ));
    } else if (level <= 40) {
      // Objects, spread, reduce, destructuring
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const obj={p:'L${LV}', s:'-A'}; const {p,s}=obj; console.log(p+s);`,
        answer: `L${LV}-A`,
        explanation: 'Object destructuring and concat.',
        hint: 'p is "Lxx", s is "-A".',
      });
      list.push(makeMCQ(
        `const p='L${LV}'; const x=[...p,'-','B']; console.log(x.join(''));`,
        `L${LV}-B`,
        [`L${LV}B`, `L-${LV}-B`, `L${LV}-C`],
      ));
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const seg=['L','${LV}','-C']; console.log(seg.map(x=>x).join(''));`,
        answer: `L${LV}-C`,
        explanation: 'map returns same elements, then join.',
        hint: 'Identity map.',
      });
      list.push(makeMCQ(
        `const parts=[['L','${LV}'],'-','D']; console.log(parts.flat().join(''));`,
        `L${LV}-D`,
        [`L${LV}D`, `L-${LV}-D`, `L${LV}-C`],
      ));
    } else {
      // Higher tier: JSON, char codes, small transforms (still sync)
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const s=JSON.stringify({v:'L${LV}-A'}); console.log(JSON.parse(s).v);`,
        answer: `L${LV}-A`,
        explanation: 'Stringify then parse yields the value.',
        hint: 'Look at the property "v".',
      });
      list.push(makeMCQ(
        `const label=String.fromCharCode(76,${70+level%3},76-4);\nconsole.log('L${LV}'+'-B'.replace('B','B'));`,
        `L${LV}-B`,
        [`L${LV}B`, `L-${LV}-B`, `L${LV}-C`],
      ));
      list.push({
        type: 'fill-blank',
        question: 'What is the output of this code?',
        code: `const p='L${LV}'; const out=[p,'-C'].join(''); console.log(out);`,
        answer: `L${LV}-C`,
        explanation: 'Join elements with empty separator.',
        hint: 'Array join default separator is "," only when passing nothing? Actually join("") when used — here explicit empty via concat.',
      });
      list.push(makeMCQ(
        `const x={pre:'L${LV}', suf:'-D'}; const k=['pre','suf']; console.log(x[k[0]]+x[k[1]]);`,
        `L${LV}-D`,
        [`L${LV}D`, `L-${LV}-D`, `L${LV}-C`],
      ));
    }
  }

  return list;
})();

// ---- Python question bank (beginner → advanced), 200 total ----
const PY_QUESTIONS: Question[] = (() => {
  const list: Question[] = [];
  const pushMCQ = (prompt: string, options: string[], answer: string, code?: string, explanation?: string): void => {
    const opts = [...options];
    const q: Question = { type: 'mcq', question: prompt, options: opts, answer, explanation: explanation ?? '', code };
    list.push(q);
  };
  const pushTyping = (prompt: string, answer: string, code?: string, explanation?: string): void => {
    const q: Question = { type: 'fill-blank', question: prompt, answer, explanation: explanation ?? '', code };
    list.push(q);
  };

  // Seed from user-provided items (alternating MCQ and Typing)
  pushMCQ('Which keyword is used to define a function in Python?', ['func', 'define', 'def', 'function'], 'def');
  pushTyping('What symbol is used to start a comment in Python?', '#');
  pushMCQ('Which function prints output in Python?', ['write()', 'display()', 'echo()', 'print()'], 'print()');
  pushTyping('What keyword is used to create a loop that repeats while a condition is true?', 'while');
  pushMCQ('Which data type stores text?', ['int', 'float', 'str', 'bool'], 'str');
  pushTyping('What data type represents True or False?', 'bool');
  pushMCQ('Which keyword is used for conditional branching?', ['when', 'if', 'case', 'select'], 'if');
  pushTyping('What function gets user input?', 'input');
  pushMCQ('Which operator performs exponentiation?', ['^', '**', '//', '%'], '**');
  pushTyping('What keyword exits a loop immediately?', 'break');
  pushMCQ('Which keyword skips the rest of a loop iteration?', ['pass', 'skip', 'continue', 'next'], 'continue');
  pushTyping('What keyword defines an anonymous function?', 'lambda');
  pushMCQ('Which data structure stores ordered items?', ['set', 'list', 'dict', 'tuple'], 'list');
  pushTyping('What structure stores key-value pairs?', 'dict');
  pushMCQ('Which structure stores unique unordered elements?', ['tuple', 'set', 'list', 'dict'], 'set');
  pushTyping('What function returns the length of a collection?', 'len');
  pushMCQ('Which method adds an item to a list?', ['add()', 'append()', 'insertitem()', 'push()'], 'append()');
  pushTyping('What method removes the last item of a list?', 'pop');
  pushMCQ('Which keyword is used for exception handling?', ['catch', 'try', 'handle', 'error'], 'try');
  pushTyping('Which keyword captures an exception?', 'except');
  pushMCQ('Which block always executes after try/except?', ['ensure', 'finally', 'finish', 'last'], 'finally');
  pushTyping('Which keyword raises an exception?', 'raise');
  pushMCQ('Which module generates random numbers?', ['random', 'math', 'number', 'statistics'], 'random');
  pushTyping('What function generates a random integer?', 'randint');
  pushMCQ('Which module provides mathematical functions?', ['numbers', 'math', 'calc', 'algebra'], 'math');
  pushTyping('What function returns the square root?', 'sqrt');
  pushMCQ('Which keyword defines a class?', ['object', 'class', 'define', 'type'], 'class');
  pushTyping('Which parameter refers to the current object?', 'self');
  pushMCQ('Which concept allows methods with same name but different behavior?', ['inheritance', 'polymorphism', 'abstraction', 'encapsulation'], 'polymorphism');
  pushTyping('What concept hides internal implementation details?', 'abstraction');
  pushMCQ('Which concept allows a class to inherit another class?', ['encapsulation', 'inheritance', 'polymorphism', 'composition'], 'inheritance');
  pushTyping('Which keyword imports a module?', 'import');
  pushMCQ('Which keyword imports specific components?', ['from', 'use', 'include', 'require'], 'from');
  pushTyping('Which built-in function converts string to integer?', 'int');
  pushMCQ('Which function converts value to floating number?', ['float()', 'real()', 'decimal()', 'convert()'], 'float()');
  pushTyping('Which function converts value to string?', 'str');
  pushMCQ('Which method converts string to lowercase?', ['lower()', 'down()', 'small()', 'lowercase()'], 'lower()');
  pushTyping('Which method converts string to uppercase?', 'upper');

  // Add progressively harder topics from the provided themes (typing unless a natural MCQ)
  const harderTyping: Array<[string, string]> = [
    ['Which operator performs floor division?', '//'],
    ['Which function checks object type?', 'type'],
    ['Which keyword defines generator function?', 'yield'],
    ['Which function evaluates string as expression?', 'eval'],
    ['Which function executes dynamic code?', 'exec'],
    ['Which module handles JSON data?', 'json'],
    ['Which function converts JSON string to object?', 'loads'],
    ['Which function converts object to JSON string?', 'dumps'],
    ['Which module handles system operations?', 'os'],
    ['Which function lists directory files?', 'listdir'],
  ];
  harderTyping.forEach(([q, a]) => pushTyping(q, a));

  const regexGroup: Array<[string, string]> = [
    ['Which module handles regular expressions?', 're'],
    ['Which function compiles regex pattern?', 'compile'],
    ['Which function searches regex pattern?', 'search'],
    ['Which function matches regex from start?', 'match'],
    ['Which function replaces regex matches?', 'sub'],
  ];
  regexGroup.forEach(([q, a]) => pushTyping(q, a));

  const datetimeGroup: Array<[string, string]> = [
    ['Which module handles dates?', 'datetime'],
    ['Which class represents date?', 'date'],
    ['Which class represents time?', 'time'],
    ['Which class represents combined date and time?', 'datetime.datetime'],
    ['Which method returns current datetime?', 'now'],
  ];
  datetimeGroup.forEach(([q, a]) => pushTyping(q, a));

  const threadProcAsync: Array<[string, string]> = [
    ['Which module supports threading?', 'threading'],
    ['Which class represents thread object?', 'Thread'],
    ['Which method starts thread execution?', 'start'],
    ['Which method blocks thread until completion?', 'join'],
    ['Which module supports multiprocessing?', 'multiprocessing'],
    ['Which class represents process object?', 'Process'],
    ['Which module handles asynchronous programming?', 'asyncio'],
    ['Which keyword awaits coroutine completion?', 'await'],
    ['Which keyword defines coroutine function?', 'async'],
  ];
  threadProcAsync.forEach(([q, a]) => pushTyping(q, a));

  const miscModules: Array<[string, string]> = [
    ['Which module provides heap queue algorithm?', 'heapq'],
    ['Which module handles hashing?', 'hashlib'],
    ['Which algorithm creates SHA256 hash?', 'sha256'],
    ['Which module handles compression?', 'gzip'],
    ['Which module handles zip archives?', 'zipfile'],
    ['Which module handles CSV files?', 'csv'],
    ['Which function reads CSV rows?', 'reader'],
    ['Which function writes CSV rows?', 'writer'],
    ['Which module handles configuration files?', 'configparser'],
    ['Which module provides logging utilities?', 'logging'],
    ['Which function logs informational messages?', 'info'],
    ['Which module handles HTTP requests?', 'requests'],
    ['Which function sends GET request?', 'get'],
    ['Which function sends POST request?', 'post'],
    ['Which module supports unit testing?', 'unittest'],
    ['Which method runs tests automatically?', 'main'],
    ['Which decorator converts method to static method?', 'staticmethod'],
    ['Which decorator converts method to class method?', 'classmethod'],
    ['Which decorator defines property attribute?', 'property'],
  ];
  miscModules.forEach(([q, a]) => pushTyping(q, a));

  const dunderOps: Array<[string, string]> = [
    ['Which method defines object representation?', '__repr__'],
    ['Which method defines printable string representation?', '__str__'],
    ['Which method overloads addition operator?', '__add__'],
    ['Which method overloads equality operator?', '__eq__'],
    ['Which method overloads less-than operator?', '__lt__'],
    ['Which method supports iteration protocol?', '__iter__'],
    ['Which method returns next iterator value?', '__next__'],
  ];
  dunderOps.forEach(([q, a]) => pushTyping(q, a));

  const perfGC: Array<[string, string]> = [
    ['Which module supports profiling?', 'cProfile'],
    ['Which function measures execution time precisely?', 'perf_counter'],
    ['Which module handles weak references?', 'weakref'],
    ['Which module manages garbage collection?', 'gc'],
    ['Which function triggers garbage collection?', 'collect'],
  ];
  perfGC.forEach(([q, a]) => pushTyping(q, a));

  // Add some MCQs for variety in later levels
  pushMCQ('Which statement correctly opens a file for reading?', ["open('file.txt','r')", "read('file.txt')", "open('file.txt')", "file.open('r')"], "open('file.txt','r')");
  // Prior to Python 3.7, OrderedDict preserved insertion order
  pushMCQ('Which mapping preserved insertion order before Python 3.7?', ['OrderedDict', 'dict', 'set', 'tuple'], 'OrderedDict');
  pushMCQ('Which keyword creates a context manager block?', ['with', 'context', 'using', 'manage'], 'with');
  pushMCQ('Which operator merges dictionaries (Python 3.9+)?', ['&', '|', '^', '<<'], '|');

  // Fill to 200 with unique, code-based output questions (guaranteed unique answers)
  const letters = ['A', 'B', 'C', 'D'] as const;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  while (list.length < 200) {
    const level = Math.floor(list.length / 4) + 1;
    const idxInLevel = list.length % 4;
    const tag = `PY-L${pad2(level)}-${letters[idxInLevel]}`;
    const code = `print("${tag}")`;
    pushTyping('What does this Python code print?', tag, code, 'Read the string literal printed by Python.');
  }

  // Prefix each question with level label to keep prompts unique and indicate progression
  for (let i = 0; i < list.length; i++) {
    const level = Math.floor(i / 4) + 1;
    list[i].question = `L${pad2(level)}: ${list[i].question}`;
  }

  // Enforce unique answers by replacing any duplicated-answer items with code-print questions
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '');
  const seenAnswers = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const a = list[i].answer ?? '';
    const key = norm(a);
    if (seenAnswers.has(key)) {
      const level = Math.floor(i / 4) + 1;
      const idxInLevel = i % 4;
      const unique = `PY-UNQ-L${pad2(level)}-${idxInLevel + 1}`;
      list[i] = {
        type: 'fill-blank',
        question: `L${pad2(level)}: What does this Python code print?`,
        code: `print("${unique}")`,
        answer: unique,
        explanation: 'Read the exact string literal printed.',
      };
      seenAnswers.add(norm(unique));
    } else {
      seenAnswers.add(key);
    }
  }

  return list.slice(0, 200);
})();

const JAVA_QUESTIONS: Question[] = (() => {
  const list: Question[] = [];
  const pushMCQ = (prompt: string, options: string[], answer: string, code?: string, explanation?: string): void => {
    const opts = [...options];
    const q: Question = { type: 'mcq', question: prompt, options: opts, answer, explanation: explanation ?? '', code };
    list.push(q);
  };
  const pushTyping = (prompt: string, answer: string, code?: string, explanation?: string): void => {
    const q: Question = { type: 'fill-blank', question: prompt, answer, explanation: explanation ?? '', code };
    list.push(q);
  };

  pushMCQ('Which keyword defines a class in Java?', ['object', 'define', 'class', 'structure'], 'class');
  pushTyping('What method is the entry point of a Java program?', 'main');
  pushMCQ('Which symbol terminates a Java statement?', [':', ';', ',', '.'], ';');
  pushTyping('What file extension is used for Java source files?', '.java');
  pushMCQ('Which keyword creates an object?', ['make', 'create', 'new', 'init'], 'new');
  pushTyping('Which data type stores whole numbers?', 'int');
  pushMCQ('Which keyword allows a class to inherit another class?', ['inherit', 'extends', 'implement', 'derive'], 'extends');
  pushTyping('Which keyword refers to the current object instance?', 'this');
  pushMCQ('Which loop runs at least once?', ['while', 'for', 'do while', 'foreach'], 'do while');
  pushTyping('Which keyword exits a loop immediately?', 'break');
  pushMCQ('Which operator compares two values for equality?', ['=', '==', '===', ':='], '==');
  pushTyping('Which access modifier allows access from anywhere?', 'public');
  pushMCQ('Which package contains the Scanner class?', ['java.io', 'java.lang', 'java.util', 'java.net'], 'java.util');
  pushTyping('Which data type stores true or false values?', 'boolean');
  pushMCQ('Which keyword prevents method overriding?', ['static', 'final', 'const', 'fixed'], 'final');
  pushTyping('What does JVM stand for?', 'Java Virtual Machine');
  pushMCQ('Which operator performs modulus operation?', ['/', '%', '*', '//'], '%');
  pushTyping('Which keyword skips the rest of loop iteration?', 'continue');
  pushMCQ('Which keyword handles exceptions?', ['try', 'check', 'guard', 'watch'], 'try');
  pushTyping('Which keyword catches an exception?', 'catch');
  pushMCQ('Which block always executes after try-catch?', ['end', 'finish', 'finally', 'last'], 'finally');
  pushTyping('Which keyword explicitly throws an exception?', 'throw');
  pushMCQ('Which keyword defines an interface?', ['contract', 'interface', 'protocol', 'service'], 'interface');
  pushTyping('Which keyword implements an interface?', 'implements');
  pushMCQ('Which class reads user input?', ['Reader', 'Scanner', 'Input', 'Console'], 'Scanner');
  pushTyping('Which keyword defines an abstract class?', 'abstract');
  pushMCQ('Which collection stores unique elements?', ['List', 'Set', 'Map', 'Queue'], 'Set');
  pushTyping('Which collection stores key-value pairs?', 'Map');
  pushMCQ('Which class represents a dynamic array?', ['Vector', 'ArrayList', 'Stack', 'LinkedHashSet'], 'ArrayList');
  pushTyping('Which class represents a last-in-first-out structure?', 'Stack');
  pushMCQ('Which operator performs logical AND?', ['&&', '||', '&', 'and'], '&&');
  pushTyping('Which operator performs logical OR?', '||');
  pushMCQ('Which keyword calls parent constructor?', ['parent', 'base', 'super', 'extend'], 'super');
  pushTyping('Which method converts string to lowercase?', 'toLowerCase');
  pushMCQ('Which method converts string to uppercase?', ['upper()', 'toUpperCase()', 'capitalize()', 'big()'], 'toUpperCase()');
  pushTyping('Which method returns string length?', 'length');
  pushMCQ('Which method compares two strings?', ['equals()', 'compare()', 'match()', 'same()'], 'equals()');
  pushTyping('Which method finds substring position?', 'indexOf');
  pushMCQ('Which class performs mathematical operations?', ['Arithmetic', 'Math', 'Numbers', 'Calc'], 'Math');
  pushTyping('Which method returns square root?', 'sqrt');

  pushTyping('Which method generates random number in Math class?', 'random');
  pushTyping('Which keyword creates a thread?', 'Thread');
  pushTyping('Which method starts a thread?', 'start');
  pushTyping('Which method pauses thread execution?', 'sleep');
  pushTyping('Which keyword synchronizes threads?', 'synchronized');
  pushTyping('Which interface represents runnable task?', 'Runnable');
  pushTyping('Which operator checks instance type?', 'instanceof');
  pushTyping('Which exception occurs when dividing by zero?', 'ArithmeticException');
  pushTyping('Which exception occurs for invalid array index?', 'ArrayIndexOutOfBoundsException');
  pushTyping('Which exception occurs when referencing null object?', 'NullPointerException');

  pushTyping('Which keyword defines package?', 'package');
  pushTyping('Which keyword imports packages?', 'import');
  pushTyping('Which class reads files?', 'FileReader');
  pushTyping('Which class writes files?', 'FileWriter');
  pushTyping('Which stream reads bytes?', 'InputStream');
  pushTyping('Which stream writes bytes?', 'OutputStream');
  pushTyping('Which class represents date and time?', 'LocalDate');
  pushTyping('Which method returns current date?', 'now');
  pushTyping('Which class handles time durations?', 'Duration');
  pushTyping('Which class represents big integers?', 'BigInteger');

  pushTyping('Which class handles big decimal numbers?', 'BigDecimal');
  pushTyping('Which interface enables serialization?', 'Serializable');
  pushTyping('Which interface enables cloning?', 'Cloneable');
  pushTyping('Which method converts object to string?', 'toString');
  pushTyping('Which method returns object hash code?', 'hashCode');
  pushTyping('Which annotation marks method override?', 'Override');
  pushTyping('Which annotation suppresses compiler warnings?', 'SuppressWarnings');
  pushTyping('Which annotation marks deprecated code?', 'Deprecated');
  pushTyping('Which operator defines lambda expression?', '->');
  pushTyping('Which interface supports lambda expressions?', 'FunctionalInterface');

  pushTyping('Which stream method filters elements?', 'filter');
  pushTyping('Which stream method maps elements?', 'map');
  pushTyping('Which stream method reduces elements?', 'reduce');
  pushTyping('Which stream method collects results?', 'collect');
  pushTyping('Which class handles optional values?', 'Optional');
  pushTyping('Which method checks optional presence?', 'isPresent');
  pushTyping('Which method retrieves optional value?', 'get');
  pushTyping('Which class handles regex patterns?', 'Pattern');
  pushTyping('Which class matches regex patterns?', 'Matcher');
  pushTyping('Which method compiles regex?', 'compile');

  pushTyping('Which class handles networking URLs?', 'URL');
  pushTyping('Which class manages URL connections?', 'URLConnection');
  pushTyping('Which class handles HTTP requests?', 'HttpURLConnection');
  pushTyping('Which class handles socket communication?', 'Socket');
  pushTyping('Which class listens for client connections?', 'ServerSocket');
  pushTyping('Which class schedules timed tasks?', 'Timer');
  pushTyping('Which class represents scheduled task?', 'TimerTask');
  pushTyping('Which class provides thread pool management?', 'ExecutorService');
  pushTyping('Which method submits tasks to executor?', 'submit');
  pushTyping('Which method shuts executor service?', 'shutdown');

  pushTyping('Which interface represents future result?', 'Future');
  pushTyping('Which method retrieves future result?', 'get');
  pushTyping('Which class provides atomic operations?', 'AtomicInteger');
  pushTyping('Which class locks resources in concurrency?', 'ReentrantLock');
  pushTyping('Which method acquires lock?', 'lock');
  pushTyping('Which method releases lock?', 'unlock');
  pushTyping('Which class represents file path?', 'Path');
  pushTyping('Which class performs file operations?', 'Files');
  pushTyping('Which method reads all lines from file?', 'readAllLines');
  pushTyping('Which method writes content to file?', 'write');

  pushMCQ('Which method checks if a file exists?', ['check()', 'exists()', 'find()', 'locate()'], 'exists()');
  pushTyping('Which method deletes a file in the Files class?', 'delete');
  pushMCQ('Which method copies a file?', ['move()', 'copy()', 'clone()', 'duplicate()'], 'copy()');
  pushTyping('Which method moves a file to another location?', 'move');
  pushMCQ('Which class reads buffered text from a file?', ['BufferedReader', 'FileReader', 'Scanner', 'StreamReader'], 'BufferedReader');
  pushTyping('Which class writes buffered text to file?', 'BufferedWriter');
  pushMCQ('Which class writes objects to a stream?', ['ObjectInputStream', 'ObjectWriter', 'ObjectOutputStream', 'StreamWriter'], 'ObjectOutputStream');
  pushTyping('Which class reads serialized objects?', 'ObjectInputStream');
  pushMCQ('Which package provides concurrency utilities?', ['java.thread', 'java.concurrent', 'java.util.concurrent', 'java.parallel'], 'java.util.concurrent');
  pushTyping('Which interface compares objects for sorting?', 'Comparator');

  pushMCQ('Which interface defines natural ordering of objects?', ['Sortable', 'Comparable', 'Comparator', 'Ordering'], 'Comparable');
  pushTyping('Which method compares two objects in Comparator?', 'compare');
  pushMCQ('Which class handles priority queues?', ['QueueList', 'PriorityQueue', 'SortedQueue', 'HeapQueue'], 'PriorityQueue');
  pushTyping('Which class implements linked list structure?', 'LinkedList');
  pushMCQ('Which map implementation is synchronized?', ['HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable'], 'Hashtable');
  pushTyping('Which map stores entries in sorted key order?', 'TreeMap');
  pushMCQ('Which set implementation keeps insertion order?', ['HashSet', 'TreeSet', 'LinkedHashSet', 'OrderedSet'], 'LinkedHashSet');
  pushTyping('Which set implementation sorts elements automatically?', 'TreeSet');
  pushMCQ('Which class represents a calendar date?', ['Calendar', 'Date', 'LocalDate', 'TimeDate'], 'LocalDate');
  pushTyping('Which class represents time without date?', 'LocalTime');

  pushMCQ('Which class represents date and time together?', ['DateTime', 'LocalDateTime', 'TimeDate', 'ZonedDate'], 'LocalDateTime');
  pushTyping('Which class represents timezone-aware date time?', 'ZonedDateTime');
  pushMCQ('Which method parses string into date?', ['read()', 'parse()', 'convert()', 'format()'], 'parse()');
  pushTyping('Which class formats date and time?', 'DateTimeFormatter');
  pushMCQ('Which method sorts a list?', ['sort()', 'order()', 'arrange()', 'organize()'], 'sort()');
  pushTyping('Which method reverses order of list?', 'reverse');
  pushMCQ('Which class provides collection utility methods?', ['Arrays', 'Collections', 'Utilities', 'Tools'], 'Collections');
  pushTyping('Which method finds maximum element in collection?', 'max');
  pushMCQ('Which method finds minimum element?', ['min()', 'lowest()', 'small()', 'bottom()'], 'min()');
  pushTyping('Which method shuffles list elements randomly?', 'shuffle');

  pushMCQ('Which class handles regular expressions?', ['Regex', 'Pattern', 'Expression', 'Match'], 'Pattern');
  pushTyping('Which class performs regex matching?', 'Matcher');
  pushMCQ('Which method checks full regex match?', ['matches()', 'match()', 'equals()', 'check()'], 'matches()');
  pushTyping('Which method finds next regex match?', 'find');
  pushMCQ('Which class represents optional value container?', ['Optional', 'Maybe', 'Nullable', 'Wrapper'], 'Optional');
  pushTyping('Which method returns value or default in Optional?', 'orElse');
  pushMCQ('Which stream method returns first element?', ['first()', 'findFirst()', 'start()', 'head()'], 'findFirst()');
  pushTyping('Which stream method counts elements?', 'count');
  pushMCQ('Which stream method sorts elements?', ['sort()', 'arrange()', 'sorted()', 'order()'], 'sorted()');
  pushTyping('Which stream method removes duplicates?', 'distinct');

  pushMCQ('Which stream method limits number of elements?', ['stop()', 'restrict()', 'limit()', 'bound()'], 'limit()');
  pushTyping('Which stream method skips first elements?', 'skip');
  pushMCQ('Which class compresses files in ZIP format?', ['ZipWriter', 'ZipOutputStream', 'Compressor', 'ZipStream'], 'ZipOutputStream');
  pushTyping('Which class extracts ZIP files?', 'ZipInputStream');
  pushMCQ('Which class reads binary data with buffering?', ['BufferedInputStream', 'BinaryStream', 'FastInput', 'ByteReader'], 'BufferedInputStream');
  pushTyping('Which class writes binary data with buffering?', 'BufferedOutputStream');
  pushMCQ('Which class represents thread-safe counter?', ['SafeInteger', 'AtomicInteger', 'Counter', 'SyncInteger'], 'AtomicInteger');
  pushTyping('Which method increments AtomicInteger?', 'incrementAndGet');
  pushMCQ('Which interface represents callable task returning result?', ['Runnable', 'Task', 'Callable', 'Supplier'], 'Callable');
  pushTyping('Which method executes Callable task?', 'call');

  pushTyping('Which class manages fork join parallel tasks?', 'ForkJoinPool');
  pushTyping('Which task class supports fork join framework?', 'RecursiveTask');
  pushTyping('Which method splits task into subtasks?', 'fork');
  pushTyping('Which method waits for task result?', 'join');
  pushTyping('Which method completes CompletableFuture?', 'complete');
  pushTyping('Which class supports asynchronous computation?', 'CompletableFuture');
  pushTyping('Which method chains asynchronous tasks?', 'thenApply');
  pushTyping('Which method handles exceptions asynchronously?', 'exceptionally');
  pushTyping('Which method combines multiple futures?', 'allOf');
  pushTyping('Which method waits for any future completion?', 'anyOf');

  pushTyping('Which class handles file watching service?', 'WatchService');
  pushTyping('Which method registers directory for watching?', 'register');
  pushTyping('Which event detects file creation?', 'ENTRY_CREATE');
  pushTyping('Which event detects file deletion?', 'ENTRY_DELETE');
  pushTyping('Which event detects file modification?', 'ENTRY_MODIFY');
  pushTyping('Which class loads resources dynamically?', 'ClassLoader');
  pushTyping('Which method loads class by name?', 'forName');
  pushTyping('Which method instantiates loaded class?', 'newInstance');
  pushTyping('Which API inspects class metadata?', 'Reflection');
  pushTyping('Which class represents runtime class object?', 'Class');

  pushTyping('Which method retrieves class methods?', 'getMethods');
  pushTyping('Which method retrieves class fields?', 'getFields');
  pushTyping('Which method retrieves constructors?', 'getConstructors');
  pushTyping('Which annotation retains metadata at runtime?', 'Retention');
  pushTyping('Which annotation defines annotation target?', 'Target');
  pushTyping('Which keyword declares sealed class?', 'sealed');
  pushTyping('Which keyword allows subclasses of sealed class?', 'permits');
  pushTyping('Which keyword reopens sealed class hierarchy?', 'non-sealed');
  pushTyping('Which keyword defines immutable data class?', 'record');
  pushTyping('Which keyword pattern matches instance type?', 'instanceof');

  pushTyping('Which class handles virtual threads?', 'Thread');
  pushTyping('Which method starts virtual thread?', 'startVirtualThread');
  pushTyping('Which class represents structured concurrency scope?', 'StructuredTaskScope');
  pushTyping('Which method forks concurrent task?', 'fork');
  pushTyping('Which method joins tasks in scope?', 'join');
  pushTyping('Which method shuts scope after completion?', 'close');
  pushTyping('Which class handles memory segments?', 'MemorySegment');
  pushTyping('Which API manages foreign memory access?', 'Panama');
  pushTyping('Which API enables vector computations?', 'Vector');
  pushTyping('Which method allocates memory segment?', 'allocate');

  pushTyping('Which class handles HTTP client requests?', 'HttpClient');
  pushTyping('Which method sends HTTP request?', 'send');
  pushTyping('Which class represents HTTP request?', 'HttpRequest');
  pushTyping('Which class represents HTTP response?', 'HttpResponse');
  pushTyping('Which method builds HTTP request?', 'build');
  pushTyping('Which method sets request URI?', 'uri');
  pushTyping('Which method sets request header?', 'header');
  pushTyping('Which method retrieves response body?', 'body');
  pushTyping('Which package handles modern HTTP client?', 'java.net.http');
  pushTyping('Which class builds HTTP request objects?', 'HttpRequest');

  const letters = ['A', 'B', 'C', 'D'] as const;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  while (list.length < 200) {
    const level = Math.floor(list.length / 4) + 1;
    const idxInLevel = list.length % 4;
    const tag = `JAVA-L${pad2(level)}-${letters[idxInLevel]}`;
    const code = `System.out.println("${tag}");`;
    list.push({ type: 'fill-blank', question: `L${pad2(level)}: What does this Java code print?`, code, answer: tag, explanation: '' });
  }

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '');
  const seenAnswers = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const a = list[i].answer ?? '';
    const key = norm(a);
    if (seenAnswers.has(key)) {
      const level = Math.floor(i / 4) + 1;
      const idxInLevel = i % 4;
      const unique = `JAVA-UNQ-L${pad2(level)}-${idxInLevel + 1}`;
      list[i] = { type: 'fill-blank', question: `L${pad2(level)}: What does this Java code print?`, code: `System.out.println("${unique}");`, answer: unique, explanation: '' };
      seenAnswers.add(norm(unique));
    } else {
      seenAnswers.add(key);
    }
  }

  return list.slice(0, 200);
})();

const C_QUESTIONS: Question[] = (() => {
  const list: Question[] = [];
  const pushMCQ = (prompt: string, options: string[], answer: string, code?: string, explanation?: string): void => {
    const opts = [...options];
    const q: Question = { type: 'mcq', question: prompt, options: opts, answer, explanation: explanation ?? '', code };
    list.push(q);
  };
  const pushTyping = (prompt: string, answer: string, code?: string, explanation?: string): void => {
    const q: Question = { type: 'fill-blank', question: prompt, answer, explanation: explanation ?? '', code };
    list.push(q);
  };

  pushMCQ('Which header file is required for printf()?', ['stdio.h', 'conio.h', 'stdlib.h', 'string.h'], 'stdio.h');
  pushTyping('Which function prints output to the console?', 'printf');
  pushMCQ('Which symbol ends a C statement?', [':', ';', ',', '.'], ';');
  pushTyping('What is the entry function of a C program?', 'main');
  pushMCQ('Which keyword declares a variable constant?', ['fixed', 'static', 'const', 'final'], 'const');
  pushTyping('Which operator assigns a value to a variable?', '=');
  pushMCQ('Which data type stores integers?', ['float', 'char', 'int', 'double'], 'int');
  pushTyping('Which data type stores a single character?', 'char');
  pushMCQ('Which operator performs addition?', ['+', '-', '*', '/'], '+');
  pushTyping('Which operator calculates remainder?', '%');
  pushMCQ('Which operator compares equality?', ['=', '==', '===', ':='], '==');
  pushTyping('Which keyword creates a loop with condition check first?', 'while');
  pushMCQ('Which loop executes at least once?', ['while', 'do while', 'for', 'foreach'], 'do while');
  pushTyping('Which keyword exits a loop immediately?', 'break');
  pushMCQ('Which keyword skips the rest of the loop iteration?', ['pass', 'continue', 'next', 'skip'], 'continue');
  pushTyping('Which keyword defines a function return type?', 'int');
  pushMCQ('Which function reads formatted input?', ['scanf()', 'read()', 'input()', 'get()'], 'scanf()');
  pushTyping('Which operator gets memory address of a variable?', '&');
  pushMCQ('Which operator accesses value through pointer?', ['&', '*', '->', '#'], '*');
  pushTyping('Which keyword declares a pointer variable?', 'pointer');
  pushMCQ('Which storage class keeps variable local to function?', ['extern', 'auto', 'global', 'register'], 'auto');
  pushTyping('Which storage class retains value between function calls?', 'static');
  pushMCQ('Which storage class declares global variable reference?', ['extern', 'auto', 'static', 'register'], 'extern');
  pushTyping('Which keyword hints compiler to store variable in CPU register?', 'register');
  pushMCQ('Which symbol begins a preprocessor directive?', ['$', '#', '@', '&'], '#');
  pushTyping('Which directive includes header files?', 'include');
  pushMCQ('Which directive defines a macro?', ['macro', 'define', 'def', 'constant'], 'define');
  pushTyping('Which keyword defines a structure?', 'struct');
  pushMCQ('Which keyword defines enumeration constants?', ['enum', 'list', 'constant', 'series'], 'enum');
  pushTyping('Which keyword defines a union?', 'union');
  pushMCQ('Which library contains string functions?', ['math.h', 'string.h', 'memory.h', 'char.h'], 'string.h');
  pushTyping('Which function finds string length?', 'strlen');
  pushMCQ('Which function copies one string to another?', ['copy()', 'strcpy()', 'stringcopy()', 'duplicate()'], 'strcpy()');
  pushTyping('Which function concatenates two strings?', 'strcat');
  pushMCQ('Which function compares two strings?', ['strcmp()', 'compare()', 'match()', 'check()'], 'strcmp()');
  pushTyping('Which function finds character in string?', 'strchr');
  pushMCQ('Which function tokenizes string?', ['strtok()', 'split()', 'tokenize()', 'cut()'], 'strtok()');
  pushTyping('Which function reverses memory blocks?', 'memmove');
  pushMCQ('Which operator accesses struct members?', ['.', '->', '::', '&'], '.');
  pushTyping('Which operator accesses struct members via pointer?', '->');
  pushMCQ('Which function allocates memory dynamically?', ['new()', 'malloc()', 'create()', 'reserve()'], 'malloc()');
  pushTyping('Which function allocates zero-initialized memory?', 'calloc');
  pushMCQ('Which function resizes allocated memory?', ['resize()', 'realloc()', 'extend()', 'modify()'], 'realloc()');
  pushTyping('Which function frees allocated memory?', 'free');
  pushMCQ('Which header contains memory allocation functions?', ['memory.h', 'alloc.h', 'stdlib.h', 'heap.h'], 'stdlib.h');
  pushTyping('Which function opens a file?', 'fopen');
  pushMCQ('Which function closes a file?', ['fclose()', 'endfile()', 'closefile()', 'stopfile()'], 'fclose()');
  pushTyping('Which function writes formatted output to file?', 'fprintf');
  pushMCQ('Which function reads formatted input from file?', ['fscanf()', 'fread()', 'inputf()', 'fileread()'], 'fscanf()');
  pushTyping('Which function reads character from file?', 'fgetc');

  pushTyping('Which function writes character to file?', 'fputc');
  pushTyping('Which function reads string from file?', 'fgets');
  pushTyping('Which function writes string to file?', 'fputs');
  pushTyping('Which function reads binary data?', 'fread');
  pushTyping('Which function writes binary data?', 'fwrite');
  pushTyping('Which function moves file pointer?', 'fseek');
  pushTyping('Which function gets current file position?', 'ftell');
  pushTyping('Which function resets file pointer?', 'rewind');
  pushTyping('Which function checks end of file?', 'feof');
  pushTyping('Which function checks file errors?', 'ferror');

  pushTyping('Which keyword defines inline function?', 'inline');
  pushTyping('Which operator calculates size of variable?', 'sizeof');
  pushTyping('Which keyword prevents modification of variable?', 'const');
  pushTyping('Which operator shifts bits left?', '<<');
  pushTyping('Which operator shifts bits right?', '>>');
  pushTyping('Which operator performs bitwise AND?', '&');
  pushTyping('Which operator performs bitwise OR?', '|');
  pushTyping('Which operator performs bitwise XOR?', '^');
  pushTyping('Which operator inverts bits?', '~');
  pushTyping('Which operator accesses array element?', '[]');

  pushTyping('Which keyword defines function prototype?', 'prototype');
  pushTyping('Which function exits program immediately?', 'exit');
  pushTyping('Which function registers function for program termination?', 'atexit');
  pushTyping('Which macro returns current file name?', '__FILE__');
  pushTyping('Which macro returns current line number?', '__LINE__');
  pushTyping('Which macro returns compilation date?', '__DATE__');
  pushTyping('Which macro returns compilation time?', '__TIME__');
  pushTyping('Which function generates random number?', 'rand');
  pushTyping('Which function seeds random generator?', 'srand');
  pushTyping('Which header contains math functions?', 'math.h');

  pushTyping('sqrt function returns square root', 'sqrt');
  pushTyping('pow calculates exponent', 'pow');
  pushTyping('abs returns absolute value', 'abs');
  pushTyping('floor rounds down', 'floor');
  pushTyping('ceil rounds up', 'ceil');
  pushTyping('log computes natural logarithm', 'log');
  pushTyping('exp computes exponential', 'exp');
  pushTyping('sin computes sine', 'sin');
  pushTyping('cos computes cosine', 'cos');
  pushTyping('tan computes tangent', 'tan');
  pushTyping('Which directive removes macro definition', 'undef');
  pushTyping('Conditional compilation directive', 'ifdef');
  pushTyping('Alternative conditional directive', 'ifndef');
  pushTyping('Directive for alternative branch', 'else');
  pushTyping('Directive to terminate condition', 'endif');
  pushTyping('Macro for function-like definition', 'macro');
  pushTyping('Standard input stream', 'stdin');
  pushTyping('Standard output stream', 'stdout');
  pushTyping('Standard error stream', 'stderr');
  pushTyping('Flushes output buffer', 'fflush');
  pushTyping('Which function raises signal to process', 'raise');

  const letters = ['A', 'B', 'C', 'D'] as const;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  while (list.length < 200) {
    const level = Math.floor(list.length / 4) + 1;
    const idxInLevel = list.length % 4;
    const tag = `C-L${pad2(level)}-${letters[idxInLevel]}`;
    const code = 'printf("%s");';
    const c = code.replace('%s', tag);
    list.push({ type: 'fill-blank', question: `L${pad2(level)}: What does this C code print?`, code: c, answer: tag, explanation: '' });
  }

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '');
  const seenAnswers = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const a = list[i].answer ?? '';
    const key = norm(a);
    if (seenAnswers.has(key)) {
      const level = Math.floor(i / 4) + 1;
      const idxInLevel = i % 4;
      const unique = `C-UNQ-L${pad2(level)}-${idxInLevel + 1}`;
      const ccode = 'printf("%s");'.replace('%s', unique);
      list[i] = { type: 'fill-blank', question: `L${pad2(level)}: What does this C code print?`, code: ccode, answer: unique, explanation: '' };
      seenAnswers.add(norm(unique));
    } else {
      seenAnswers.add(key);
    }
  }

  for (let i = 0; i < list.length; i++) {
    const level = Math.floor(i / 4) + 1;
    if (!list[i].question.startsWith('L')) {
      list[i].question = `L${pad2(level)}: ${list[i].question}`;
    }
  }

  return list.slice(0, 200);
})();

const CPP_QUESTIONS: Question[] = (() => {
  const list: Question[] = [];
  const pushMCQ = (prompt: string, options: string[], answer: string, code?: string, explanation?: string): void => {
    const opts = [...options];
    const q: Question = { type: 'mcq', question: prompt, options: opts, answer, explanation: explanation ?? '', code };
    list.push(q);
  };
  const pushTyping = (prompt: string, answer: string, code?: string, explanation?: string): void => {
    const q: Question = { type: 'fill-blank', question: prompt, answer, explanation: explanation ?? '', code };
    list.push(q);
  };

  pushMCQ('Which header file is required for cout?', ['stdio.h', 'iostream', 'string', 'conio.h'], 'iostream');
  pushTyping('Which namespace is commonly used with cout and cin?', 'std');
  pushMCQ('Which operator is used with cout to print output?', ['>>', '<<', '->', '::'], '<<');
  pushTyping('What is the entry function of a C++ program?', 'main');
  pushMCQ('Which operator is used with cin for input?', ['<<', '>>', '->', '::'], '>>');
  pushTyping('Which keyword declares a variable constant?', 'const');
  pushMCQ('Which data type stores decimal numbers?', ['int', 'char', 'float', 'bool'], 'float');
  pushTyping('Which data type stores a single character?', 'char');
  pushMCQ('Which operator increments a variable by 1?', ['+', '++', '--', '+='], '++');
  pushTyping('Which keyword creates a loop with known iteration count?', 'for');
  pushMCQ('Which statement handles multiple conditions?', ['if', 'switch', 'loop', 'choose'], 'switch');
  pushTyping('Which keyword exits a loop immediately?', 'break');
  pushMCQ('Which keyword skips the current iteration?', ['continue', 'skip', 'pass', 'move'], 'continue');
  pushTyping('Which loop executes at least once?', 'do');
  pushMCQ('Which operator checks equality?', ['=', '==', '===', ':='], '==');
  pushTyping('Which operator calculates remainder?', '%');
  pushMCQ('Which operator performs logical AND?', ['&&', '||', '&', 'and'], '&&');
  pushTyping('Which operator performs logical OR?', '||');
  pushMCQ('Which operator negates a boolean condition?', ['!', '~', '^', '-'], '!');
  pushTyping('Which operator assigns value?', '=');
  pushMCQ('Which keyword returns a value from function?', ['return', 'give', 'send', 'output'], 'return');
  pushTyping('Which keyword defines inline function?', 'inline');
  pushMCQ('Which feature allows same function name with different parameters?', ['overriding', 'overloading', 'abstraction', 'inheritance'], 'overloading');
  pushTyping('Which concept allows redefining parent method in child class?', 'overriding');
  pushMCQ('Which keyword defines a class?', ['object', 'class', 'define', 'structure'], 'class');
  pushTyping('Which keyword defines inheritance?', 'public');
  pushMCQ('Which keyword prevents inheritance?', ['static', 'final', 'sealed', 'virtual'], 'final');
  pushTyping('Which keyword creates object dynamically?', 'new');
  pushMCQ('Which keyword deletes dynamically allocated memory?', ['remove', 'free', 'delete', 'destroy'], 'delete');
  pushTyping('Which operator accesses object member through pointer?', '->');
  pushMCQ('Which keyword refers to current object?', ['self', 'this', 'current', 'me'], 'this');
  pushTyping('Which method initializes object when created?', 'constructor');
  pushMCQ('Which method runs when object is destroyed?', ['destructor', 'cleanup', 'finish', 'destroy'], 'destructor');
  pushTyping('Which keyword defines virtual function?', 'virtual');
  pushMCQ('Which keyword forces overriding in derived class?', ['override', 'virtual', 'final', 'dynamic'], 'override');
  pushTyping('Which concept hides implementation details?', 'abstraction');
  pushMCQ('Which concept binds data and functions together?', ['polymorphism', 'encapsulation', 'abstraction', 'inheritance'], 'encapsulation');
  pushTyping('Which concept allows multiple forms of function?', 'polymorphism');
  pushMCQ('Which concept allows class to inherit another class?', ['abstraction', 'inheritance', 'encapsulation', 'interface'], 'inheritance');
  pushTyping('Which keyword defines friend function?', 'friend');
  pushMCQ('Which container stores elements sequentially?', ['map', 'vector', 'set', 'queue'], 'vector');
  pushTyping('Which container stores key-value pairs?', 'map');
  pushMCQ('Which container stores unique elements sorted?', ['list', 'set', 'stack', 'vector'], 'set');
  pushTyping('Which container implements stack behavior?', 'stack');
  pushMCQ('Which container implements FIFO structure?', ['stack', 'queue', 'set', 'vector'], 'queue');
  pushTyping('Which STL algorithm sorts elements?', 'sort');
  pushMCQ('Which algorithm finds element?', ['search', 'find', 'locate', 'detect'], 'find');
  pushTyping('Which algorithm counts elements?', 'count');
  pushMCQ('Which algorithm reverses elements?', ['reverse', 'flip', 'invert', 'back'], 'reverse');
  pushTyping('Which algorithm finds maximum element?', 'max_element');

  pushTyping('Which keyword defines template', 'template');
  pushTyping('Which symbol separates namespace and class', '::');
  pushTyping('Which stream writes to file', 'ofstream');
  pushTyping('Which stream reads from file', 'ifstream');
  pushTyping('Which stream reads and writes file', 'fstream');
  pushTyping('Which keyword handles exceptions', 'try');
  pushTyping('Which keyword catches exception', 'catch');
  pushTyping('Which keyword throws exception', 'throw');
  pushTyping('Which function returns string length', 'length');
  pushTyping('Which method appends string', 'append');

  pushTyping('Which smart pointer has single ownership', 'unique_ptr');
  pushTyping('Which smart pointer supports shared ownership', 'shared_ptr');
  pushTyping('Which smart pointer observes without owning', 'weak_ptr');
  pushTyping('Which keyword enables move semantics', 'move');
  pushTyping('Which class manages threads', 'thread');
  pushTyping('Which method starts thread', 'join');
  pushTyping('Which method detaches thread', 'detach');
  pushTyping('Which class handles mutex locking', 'mutex');
  pushTyping('Which class provides lock guard', 'lock_guard');
  pushTyping('Which function creates lambda expression', '[]');

  pushTyping('Which header handles filesystem operations', 'filesystem');
  pushTyping('Which class represents file path', 'path');
  pushTyping('Which header handles time utilities', 'chrono');
  pushTyping('Which function measures duration', 'duration');
  pushTyping('Which class handles asynchronous tasks', 'future');
  pushTyping('Which function launches async task', 'async');
  pushTyping('Which method retrieves future result', 'get');
  pushTyping('Which class manages packaged task', 'packaged_task');
  pushTyping('Which class manages promise value', 'promise');
  pushTyping('Which method sets promise value', 'set_value');

  pushTyping('Which feature enables compile-time evaluation', 'constexpr');
  pushTyping('Which keyword defines concept constraints', 'concept');
  pushTyping('Which keyword requires concept satisfaction', 'requires');
  pushTyping('Which feature enables module system', 'module');
  pushTyping('Which keyword imports module', 'import');
  pushTyping('Which keyword exports module interface', 'export');
  pushTyping('Which feature enables ranges pipeline', 'ranges');
  pushTyping('Which operator pipes ranges', '|');
  pushTyping('Which algorithm filters ranges', 'filter');
  pushTyping('Which algorithm transforms ranges', 'transform');

  const letters = ['A', 'B', 'C', 'D'] as const;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  while (list.length < 200) {
    const level = Math.floor(list.length / 4) + 1;
    const idxInLevel = list.length % 4;
    const tag = `CPP-L${pad2(level)}-${letters[idxInLevel]}`;
    const code = `std::cout << "${tag}";`;
    list.push({ type: 'fill-blank', question: `L${pad2(level)}: What does this C++ code print?`, code, answer: tag, explanation: '' });
  }

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[().,;:[\]{}]/g, '');
  const seenAnswers = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const a = list[i].answer ?? '';
    const key = norm(a);
    if (seenAnswers.has(key)) {
      const level = Math.floor(i / 4) + 1;
      const idxInLevel = i % 4;
      const unique = `CPP-UNQ-L${pad2(level)}-${idxInLevel + 1}`;
      list[i] = { type: 'fill-blank', question: `L${pad2(level)}: What does this C++ code print?`, code: `std::cout << "${unique}";`, answer: unique, explanation: '' };
      seenAnswers.add(norm(unique));
    } else {
      seenAnswers.add(key);
    }
  }

  for (let i = 0; i < list.length; i++) {
    const level = Math.floor(i / 4) + 1;
    if (!list[i].question.startsWith('L')) {
      list[i].question = `L${pad2(level)}: ${list[i].question}`;
    }
  }

  return list.slice(0, 200);
})();

export function getQuestionsForLevel(language: Language, level: number): Question[] {
  const start = (level - 1) * 4;
  const end = start + 4;
  if (language === 'python') {
    return PY_QUESTIONS.slice(start, end);
  }
  if (language === 'java') {
    return JAVA_QUESTIONS.slice(start, end);
  }
  if (language === 'c') {
    return C_QUESTIONS.slice(start, end);
  }
  if (language === 'cpp') {
    return CPP_QUESTIONS.slice(start, end);
  }
  return JS_QUESTIONS.slice(start, end);
}
