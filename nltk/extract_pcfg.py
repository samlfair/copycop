import nltk
from nltk.corpus import treebank
from nltk.grammar import Nonterminal, induce_pcfg

S = Nonterminal('S')

productions = []
for sent in treebank.parsed_sents():
        productions += sent.productions()

pcfg = induce_pcfg(S, productions)

with open("ptb_pcfg_rules.txt", "w") as f:
        for prod in pcfg.productions():
            f.write(str(prod) + "\n")