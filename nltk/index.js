import { readFile, writeFile } from 'fs/promises'

const rawPCFG = (await readFile("./ptb_pcfg_rules.txt")).toString()

const rawRules =rawPCFG.split("\n")
const rules = rawRules.map(/** @param {string} rawRule */ rawRule => {
  const matchingStatement = rawRule.match(/(?<clause>[A-Z\$]+)(-\d+)? -> (?<subclauses>[A-Z]+ [A-Z\ ]+) \[(?<prob>.+)\]/)
  if(!matchingStatement) return

  const { groups: { prob, ...rest} } = matchingStatement

  return {
    prob: Number(prob),
    ...rest
  }
}).filter(a => a)
  .sort((a, b) => b.prob - a.prob)

console.log(rules)

await writeFile("./rules.json", JSON.stringify(rules, null, 2))

