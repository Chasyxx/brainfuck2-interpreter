//@ts-check
const fs = require('fs');
const readline = require('readline');
const { EventEmitter } = require('events')
const defaultCode =
	`{{1}}
	p \`\`Hello! ...This is a recording! *boom* AAGH\`\`
;;;
{{2}}
	p \`\`This is brainf**k2, \\nan evolution of brainf**k with functions and print statements.\\nWhen you run the interpreter, brainf**k2 is automatically converted into normal brainf**k code,\\nand is then interpreted by itself.\`\`
	p \`\`You can find the transpiled versions in the files inputRAW.bf and TRANSPILED.bf .\`\`
;;;
{{3}}
	p \`\`\\nInterpreter "build" 6, brainf**k2e3\`\`
;;;

||1||||2||
>++++++++[-<+++++++++>]<.>>+>-[+]++>++>+++[>[->+++<<+++>]<<]>-----.>->
+++..+++.>-.<<+[>[+>+]>>]<--------------.>>.+++.------.--------.>+.>+.
[-]
||3||`

const handler = new EventEmitter();

let state = 0;

handler.on('increase', () => {
	if (++state == 1) { // Change 1 to however many things need to finish before the program can exit
		console.log("\x1b[94mThe program will exit in a second...\x1b[0m")
		setTimeout(process.exit, 1000)
	}
})

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

let predefinedInput = [];
/** @type {string[]} */
let functions = [];

/**
 * @param {string} p1
 * @returns decoded string
 */
function decode(_match, p1) {
	let output = `\r\n\r\nPrint "${p1.replace(/[+-<>\[\],.\|{}]/g, '_')}"\r\n`;
	p1 = p1.replace(/(?<!\\)\\n/g, '\r\n').replace(/\\\\/g, '\\');
	for (let i = 0; i < p1.length; i++) {
		const size = p1.charCodeAt(i);
		const size1 = size % 10
		const size10 = Math.floor(size / 10) % 10
		const size100 = Math.floor(size / 100) % 10
		output += (size < 100 ?
			`${''.padEnd(size10 + (size1 > 5 ? 1 : 0), '+')
			}[>++++++++++<-]>${''.padEnd(size1 > 5 ? 10 - size1 : size1, size1 > 5 ? '-' : '+')
			}.[-]<\r\n`

			:

			`${size < 200 ? '++++++++++' : ''.padEnd(size100 + (size10 > 5 ? 1 : 0), '+') + '[>++++++++++<-]>'
			}${''.padEnd((size10 + (size1 > 5 ? 1 : 0)) > 5 ? 10 - (size10 + (size1 > 5 ? 1 : 0)) : (size10 + (size1 > 5 ? 1 : 0)), (size10 + (size1 > 5 ? 1 : 0)) > 5 ? '-' : '+')
			}[>++++++++++<-]>${''.padEnd(size1 > 5 ? 10 - size1 : size1, size1 > 5 ? '-' : '+')
			}.[-]<${size < 200 ? '' : '<'
			}\r\n`)
	}

	return Optimize(output + "++++++++++..[-]\r\n\r\n");
}

/**
 * @param {string} match
 * @param {number} p1
 * @param {string} p2
 */
function addFunction(match, p1, p2) {
	// @ts-ignore
	functions[parseInt(p1)] = p2/*.replace(/[^+-<>\[\],.\|]/g,'')*/.trim();
	return match;
}

/**
 * @param {any} _match
 * @param {number} p1
 */
function getFunction(_match, p1) {
	const result = functions[p1];
	if (result === undefined) {
		throw `\x1b[31mFunction ${p1} was called, but has no definition.\x1b[0m`
	}
	return result;
}

function processNestedFunctions() {
	let didSomething = false;
	functions = functions.map((/** @type {string} */ a) => a.replace(/\|\|(\w+)\|\|/g, (match, p1) => { let b = getFunction(match, p1); didSomething = true; return b; }));
	return didSomething;
}

function getInput() {
	return new Promise((resolve) => {
		if (predefinedInput.length === 0) {
			rl.question('The current brainf**k(2) program has requested further input than provided.\r\nEnter it here: ', (input) => {
				resolve(
					/\[.\]/g.test(input)
						?
						input.charCodeAt(1)
						:
						parseInt(input)
				);
			});
		} else {
			resolve(parseInt(predefinedInput.shift()));
		}
	});
}

const functionRegex = /{{(\d+)}}([^]+?);;;/g;

function Optimize(code) { // Simple model; a pull request to improve this would be appreciated
	code = code.replace(/(>+)(<+)|(<+)(>+)|(\++)(-+)|(-+)(\++)/g,/** @param {string} match*/(match, p1, p2) => {
		p1 ??= (match.match(new RegExp(`^\\${match[0]}+`)) ?? [''])[0]
		p2 ??= (match.match(new RegExp(`\\${match[match.length - 1]}+$`)) ?? [''])[0]
		const number = { m: Math.abs(p1.length - p2.length), s: Math.sign(p1.length - p2.length) == -1 };
		const output = ''.padEnd(number.m, number.s ? p2[0] : p1[0]);
		console.log('\x1b[95mOptimized strand "%s" to "%s"\x1b[0m', match, output)
		return output
	});

	// code = code.replace(/|/g,''); // Backup slot

	return code;
}

/**
 * Takes *brainf\*\*k2* code and transpiles it into normal brainf\*\*k.
 * It then interprets the brainf\*\*k code.
 * @param {string} code The code to be interpreted
 * @async
 */
async function interpret(code) {
	let output = '',
		tapePosition = 100,
		programCounter = -1,
		safetyNet = 0;
	try {
		const tapeSize = 32768, limit = 16384;
		code = code.replace(/(?<!;);(?!;)[^]*?\n/g, '')		// Remove explicit comments
		code = code.replace(functionRegex, addFunction)		// Begin transpiling, note functions
		let quikNet = 0;
		while (processNestedFunctions() && ++quikNet < 256) {// Handle nested functions
			console.log("\x1b[94mProcessed layer %d of nested functions\x1b[0m", quikNet)
		}
		code = code.replace(/\|\|(\d+)\|\|/g, getFunction)	// Handle function calls
		code = code.replace(functionRegex, '').trim()		// Remove function definitions
		console.log("\x1b[94mProcessed functions.\x1b[0m")
		code = code.replace(/p\s*``(.+?)``/g, decode)
		console.log("\x1b[94mProcessed print statements. Transpilation complete\x1b[0m")
		console.log('Optimization pass 1')
		code = Optimize(code);								// Optimize code once at this stage. At this point we have transpiled brainf**k code
		if (code.length < limit) console.log('Optimization pass 2')
		if (code.length < limit) code = Optimize(code);
		code = code.trim();
		fs.writeFileSync('inputRAW.bf', code + "\r\n", { encoding: 'utf8' })
		code = code.replace(/[^+-<>\[\],.]/g, ''); 			// Remove all non-commands
		console.log('Optimization pass 3')
		code = Optimize(code);								// Optimize code again
		if (code.length < limit) console.log('Optimization pass 4')
		if (code.length < limit) code = Optimize(code);
		code = code.trim();
		fs.writeFileSync('TRANSPILED.bf', (code.replace(/(.{103})/g, '$1\n')) + "\r\n", { encoding: 'utf8' })
		console.log('\x1b[92mBeginning processing\x1b[0m')

		const tape = new Array(tapeSize).fill(0),
			netLimit = 1 << 23;

		while (++programCounter < code.length && safetyNet++ <= netLimit) {
			const operation = code[programCounter];
			switch (operation) {
				case '+':
					tape[tapePosition]++;
					break;
				case '-':
					tape[tapePosition]--;
					break;
				case '<':
					tapePosition--;
					break;
				case '>':
					tapePosition++;
					break;
				case '[':
					if (tape[tapePosition] === 0) {
						let bracketDepth = 1;
						while (bracketDepth > 0) {
							programCounter++;
							if (code[programCounter] === '[') {
								bracketDepth++;
							} else if (code[programCounter] === ']') {
								bracketDepth--;
							}
							if (programCounter >= code.length) {
								throw 'Unmatched [';
							}
						}
					}
					break;
				case ']':
					if (tape[tapePosition] !== 0) {
						let bracketDepth = 1;
						while (bracketDepth > 0) {
							programCounter--;
							if (code[programCounter] === ']') {
								bracketDepth++;
							} else if (code[programCounter] === '[') {
								bracketDepth--;
							}
							if (programCounter < 0) {
								throw 'Unmatched ]';
							}
						}
					}
					break;
				case ',':
					tape[tapePosition] = await getInput();
					break;
				case '.':
					console.log(`\x1b[34mWrote           : \x1b[0m${String(tape[tapePosition]).padEnd(20, ' ')} ${String.fromCharCode(tape[tapePosition]).replace(/\x0D/g, '\\r').replace(/\x0A/g, '\\n')}`);
					output += String.fromCharCode(tape[tapePosition]);
					break;
			}
			if (tapePosition < 0 || tapePosition >= tapeSize) {
				break;
			}
		}

		if (tapePosition < 0 || tapePosition >= tapeSize) {
			console.log("Error: The program has indexed a bad cell (cell %d)", tapePosition)
		}
		if (safetyNet > netLimit) {
			console.log("Error: The program has taken too long (%d ticks) and triggered the safety net.", netLimit + 1)
		}

	} catch (e) {
		console.error(`\x1b[33mError: ${e}\x1b[0m`)
	}

	console.log(`\r\n\x1b[34mOutput (numbers): \x1b[0m${output.split('').map(a => a.charCodeAt(0)).join(',')}`);
	console.log(`\x1b[34mOutput (string) : \x1b[0m${output}\r\n`);
	handler.emit('increase');
}

const inputPosition = process.argv.indexOf('--input');
if (inputPosition !== -1) {
	predefinedInput = process.argv[inputPosition + 1].split('').map(a => a.charCodeAt(0))
}

console.log("Chasyxx's brainf**k(2) interpreter")
console.log("use --input <input> to predefine an input")
console.log("if extra input is required, put in 5 for character code 5, or [A] for A's unicode (65)")
console.log("(This works for all numbers and characters)")
console.log("You may put in 10 or 0 to end/continue the interpreted program if it knows what to")
console.log("do with those.")
console.log("This interpreter has a safety net of 2^23, and if the program takes that many ticks it")
console.log("will halt execution early.")

fs.readFile("input.bf2", { encoding: "utf8" }, function (err, code) {
	if (err) {
		if (err.code == 'ENOENT') {
			console.log("Couldn't find input.bf2")
			fs.writeFileSync("input.bf2", defaultCode, { encoding: "utf8" })
			console.log(`Created the file input.bf2`)
			console.log("Put your code into that file and try again.")
			process.exit(1);
		} else {
			throw err;
		}
	} else {
		interpret(code);
	}
}) 
