import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CypherPluginSettings {
	cypherStyle: string;
}

const DEFAULT_SETTINGS: CypherPluginSettings = {
	cypherStyle: 'diagrammatic'
};

export default class CypherPlugin extends Plugin {
	settings: CypherPluginSettings;
	private typingTimeout: number | undefined;
	private isTypingHandled: boolean = false;
	private isCypherEnabled: boolean = false;

	async onload() {
		await this.loadSettings();

		// Ribbon icon for toggling cypher mode
		this.addRibbonIcon('dice', 'Cypher Text', () => {
			this.isCypherEnabled = !this.isCypherEnabled;
			if (this.isCypherEnabled) {
				new Notice('Cypher Plugin Activated!');
				this.applyCypher();
			} else {
				new Notice('Cypher Plugin Deactivated!');
				this.revertCypher();
			}
		}).addClass('cypher-plugin-ribbon-class');

		// Command to cypher selected text
		this.addCommand({
			id: 'cypher-transform',
			name: 'Transform Selected Text to Encrypted Value',
			editorCallback: (editor: Editor, view: MarkdownView) => this.transformText(editor),
		});

		// Add settings tab
		this.addSettingTab(new CypherSettingTab(this.app, this));

		// Editor change event for real-time typing transformation
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				if (editor && this.isCypherEnabled) {
					this.debounceTyping(editor, 500);
				}
			})
		);
	}

	onunload() {
		console.log("Cypher Plugin unloaded.");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Debounce function to delay the execution of handleTyping
	debounceTyping(editor: Editor, delay = 500) {
		if (this.isTypingHandled) return;

		// Clear existing timeout, if any
		if (this.typingTimeout) clearTimeout(this.typingTimeout);

		this.isTypingHandled = true;
		this.typingTimeout = window.setTimeout(() => {
			this.handleTyping(editor);
			this.isTypingHandled = false;
		}, delay);
	}

	// Cypher transformation with distinct symbols for uppercase and lowercase
	toCypherText(input: string): string {
		const iconCypherMap: Record<string, string> = {
			A: "🔺", B: "🅱️", C: "🌜", D: "🔷", E: "🍏",
			F: "🍀", G: "🌀", H: "🏠", I: "🦋", J: "🎷",
			K: "🔑", L: "🌿", M: "🏆", N: "🎵", O: "💎",
			P: "🎩", Q: "🎈", R: "🌹", S: "🌞", T: "🎾",
			U: "🐢", V: "🎻", W: "🍉", X: "❌", Y: "🌱",
			Z: "⚡️", 
			a: "🍎", b: "🍌", c: "🍒", d: "🍩", e: "🌽",
			f: "🐸", g: "🦍", h: "🍯", i: "🍦", j: "🌶️",
			k: "🥝", l: "🦁", m: "🍈", n: "🥜", o: "🍊",
			p: "🍕", q: "👑", r: "🐀", s: "🐍", t: "🌮",
			u: "🐡", v: "🍇", w: "💫", x: "🍪", y: "🦓",
			z: "🍫"
		};
		
	
		let result = "";
		let wasLastCharSpace = false;
	
		for (let i = 0; i < input.length; i++) {
			const char = input[i];
	
			if (char === " ") {
				if (!wasLastCharSpace) {
					result += "  ";
					wasLastCharSpace = true;
				}
			} else {
				result += iconCypherMap[char] || char;
				wasLastCharSpace = false;
			}
		}
	
		return result;
	}

	// Revert cyphered text back to normal
	revertCypherText(input: string): string {
		const reverseCypherMap: Record<string, string> = {
			"🔺": "A", "🅱️": "B", "🌜": "C", "🔷": "D", "🍏": "E",
			"🍀": "F", "🌀": "G", "🏠": "H", "🦋": "I", "🎷": "J",
			"🔑": "K", "🌿": "L", "🏆": "M", "🎵": "N", "💎": "O",
			"🎩": "P", "🎈": "Q", "🌹": "R", "🌞": "S", "🎾": "T",
			"🐢": "U", "🎻": "V", "🍉": "W", "❌": "X", "🌱": "Y",
			"⚡️": "Z", 
			"🍎": "a", "🍌": "b", "🍒": "c", "🍩": "d", "🌽": "e",
			"🐸": "f", "🦍": "g", "🍯": "h", "🍦": "i", "🌶️": "j",
			"🥝": "k", "🦁": "l", "🍈": "m", "🥜": "n", "🍊": "o",
			"🍕": "p", "👑": "q", "🐀": "r", "🐍": "s", "🌮": "t",
			"🐡": "u", "🍇": "v", "💫": "w", "🍪": "x", "🦓": "y",
			"🍫": "z"
		};
		

		return Array.from(input).map(char => reverseCypherMap[char] || char).join("");
	}

	handleTyping(editor: Editor) {
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);
		const modifiedText = this.isCypherEnabled ? this.toCypherText(lineText) : this.revertCypherText(lineText);
		editor.setLine(cursor.line, modifiedText);
	}

	applyCypher() {
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			const fullText = editor.getValue();
			editor.setValue(this.toCypherText(fullText));
		}
	}

	revertCypher() {
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			const fullText = editor.getValue();
			editor.setValue(this.revertCypherText(fullText));
		}
	}

	transformText(editor: Editor) {
		const selections = editor.getSelection();
		const cypheredText = this.isCypherEnabled ? this.toCypherText(selections) : this.revertCypherText(selections);
		editor.replaceSelection(cypheredText);
	}
}

class CypherSettingTab extends PluginSettingTab {
	plugin: CypherPlugin;

	constructor(app: App, plugin: CypherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Cypher Plugin Settings' });

		new Setting(containerEl)
			.setName('Cypher Style')
			.setDesc('Choose the style for cyphering text')
			.addDropdown(dropdown => dropdown
				.addOption('diagrammatic', 'Diagrammatic')
				.setValue(this.plugin.settings.cypherStyle)
				.onChange(async (value) => {
					this.plugin.settings.cypherStyle = value;
					await this.plugin.saveSettings();
				}));
	}
}
