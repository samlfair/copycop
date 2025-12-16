# NLTK

This module uses the python package NLTK to compile a Penn Treebank ruleset. `./extract_pcfg.py` uses the corpus from NLTK to generate a _probabalistic context-free grammar_ (PCFG), which is a set of rules that categorize phrases based on probabilities. It saves those rules in `./ptb_pcfg_rules.txt`.

`./index.js` parses the `./ptb_pcfg_rules.txt` file and converts it to the JSON in `./rules.json`. The JSON file is then imported and used in `./../index.js`.
