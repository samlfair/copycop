import nlp from 'compromise/three'
import { readFile } from 'fs/promises'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import remarkRetext from 'remark-retext'
import retextStringify from 'retext-stringify'
import strip from 'strip-markdown'
/** @type {array} */
import rules from './nltk/rules.json' with { type: 'json' }

function buildSentence(doc) {
  doc.compute("penn")
  const phrases = doc.chunks().json().map(chunk => {
    return chunk.terms
  })
  const { terms, sentence: { grammar, ...parts }, text } = doc.sentences().json()[0]
  /* const pennTags = chunks.map(chunk => chunk[0].penn) */
  const pennTags = phrases.flatMap(a => a.map(b => b.penn))

  function testRules(code) {
    return rules.filter(rule => code.match(new RegExp(`\\b${rule.subclauses}\\b`)))
  }

  const length = pennTags.length

  /** @param {string} code */
  function reduceCode(code) {
    const applicableRules = testRules(code)

    if (!applicableRules.length) return [code, 0]

    const bestRule = applicableRules.reduce((best, { prob, clause, subclauses }) => {
      const length = subclauses.split(" ").length
      const power = Math.pow(2, length)
      const strength = power * prob

      if (strength < best.strength) return best

      return { prob, clause, subclauses, strength }
    }, { strength: 0, subclauses: '' })

    const { prob, clause, subclauses } = bestRule

    const newCode = code.replace(subclauses, clause)

    const [parentCodes, parentStrength] = reduceCode(newCode)

    return [parentCodes, bestRule.strength + parentStrength]
  }

  const pennCode = pennTags.join(" ")

  const [reducedCode, codeStrength] = reduceCode(pennCode)

  return {
    ...grammar,
    ...parts,
    codeStrength,
    reducedCode,
    phrases,
    text,
    pennTags
  }
}

/**
 * @typedef {string} PennTag
 */

/**
 * @typedef {PennTag[]} PennTagSwitch
 */

/**
 * @param {object} term
 * @returns {PennTagSwitch} An array with one or two Penn tags.
 */
function analyzeTerm(term, doc) {
  const switches = term.json()[0].terms[0].switch

  if (!switches) return

  const initialTags = term.json()[0].terms[0].tags
  const [first, second] = switches.split("|")

  term.tag(first)
  const variantOne = buildSentence(doc)

  term.tag(second)
  const variantTwo = buildSentence(doc)

  initialTags.forEach(tag => {
    term.tag(tag)
  })

  return [variantOne, variantTwo]


}

/** @typedef {object} Term
/** @typedef {Term[]} Chunk
/** @typedef {Chunk[]} Chunks

/**
 * @param {groupedH3s[number][number]} h3
 * @returns {Chunks}
 */
function processSentence(sentence) {
  const text = unified().use(retextStringify).stringify(sentence)

  const doc = nlp(text)

  const [first, ...rest] = doc.sentences().json()

  const variants = []

  doc.terms().forEach(term => {
    const termVariants = analyzeTerm(term, doc)
    if (termVariants?.codeStrength) variants.push(termVariants)
    else if (termVariants) variants.push(...termVariants)
  })

  if (!variants.length) variants.push(buildSentence(doc))

  const bestVariant = variants.reduce((best, next) => {
    const passive = Boolean(next.reducedCode.match(/\bVB VBN\b/))
    if(!next.pennTags) console.log({ next })
    next.gerund = next.pennTags.find(a => a && a.match("VB")) === "VBG"

    if (!next.verb) {
      const verb = next.phrases.find((phrase) => {
        return phrase.find(word => {
          return word.tags.includes("Verb") && word.implicit
        })
      })
      if (verb) next.verb = verb[0].implicit
    }

    next.mood = next.subject
      ? next.verb
        ? passive
          ? "passive"
          : "active"
        : next.predicate
          ? "nominal"
          : "nominal"
      : next.verb
        ? next.predicate
          ? next.gerund
            ? "gerund"
            : "imperative"
          : "action"
        : next.predicate
          ? "fragment"
          : null


    if (next.mood === "imperative") next.person = "second"
    if (next.mood === "imperative" && next.text.match("Naming conventions")) console.log(next)

    const pronouns = [
      {
        word: "i",
        genered: false,
        singular: true,
        person: "first"
      },
      {
        word: "you",
        gendered: false,
        singular: true,
        person: "second"
      },
      {
        word: "we",
        gendered: false,
        singular: true,
        person: "first",
      },
      {
        word: "he",
        gendered: true,
        singular: true,
        person: "third"
      },
      {
        word: "she",
        gendered: true,
        singular: true,
        person: "third"
      },
      {
        word: "your",
        gendered: false,
        singular: true,
        person: "second"
      },
      {
        word: "we",
        gendered: false,
        plural: true,
        person: "first"
      }

    ]

    const pronounMatch = next.reducedCode.match(/\bPRP\b/) || next.reducedCode.match(/\b(DT) VB.?\b/)

    if (pronounMatch) {
      const beforeNoun = next.reducedCode.slice(0, pronounMatch.index)
      const nounBeforePronoun = beforeNoun
        .match(/\b(SBJ|N\w\w?)\b/)

      next.phrases.forEach(phrase => {
        return phrase.forEach(term => {
          const pronoun = pronouns.find(p => p.word === (term.implicit?.toLowerCase() || term.text.toLowerCase()))
          if (pronoun) {
            const { word, ...rest } = pronoun

            Object.assign(term, rest)

            if (!next.pronoun) {
              const person = (pronoun.person === "first" || pronoun.person === "second") ? "contextualized" : "anonymous"
              next.pronoun = person
              /* next.pronoun = pronoun.person.match(/(first|second)/) ? "contextualized" : "anonymous" */
              Object.assign(next, rest)
            }
            if (!next.person) {
              Object.assign(next, rest)
            }
          } else if (term.penn?.match(/\b(DT|PRP)\b/)) {
            if (!term.penn) console.log(term)
            if (!next.pronoun) {
              next.pronoun = nounBeforePronoun ? "contextualized" : "anonymous"
            }
          }
        })
      })
    }

    if (
      best.codeStrength === next.codeStrength
      && best.reducedCode === next.reducedCode
    ) {
      return best
    } else if (
      best.codeStrength > next.codeStrength
    ) {
      return best
    } else if (
      best.codeStrength < next.codeStrength
    ) {
      return next
    } else if (
      !best.reducedCode
    ) {
      return next
    } else if (
      best.mood === "declarative" && next.mood !== "declarative"
    ) {
      return best
    } else if (
      best.mood !== "declarative" && next.mood === "declarative"
    ) {
      return next
    } else if (
      best.mood === "imperative" && next.mood !== "imperative"
    ) {
      return best
    } else if (
      best.mood !== "imperative" && next.mood === "imperative"
    ) {
      return next
    } else if (
      best.pronoun === "contextualized" && next.pronoun === "anonymous"
    ) {
      return best
    } else if (
      best.pronoun === "anonymous" && next.pronoun === "contextualized"
    ) {
      return next
    } else {
      best.alternates
        ? best.alternates.push(next)
        : best.alternate = [next]

      return best
    }
  }, { codeStrength: 0 })

  return { ...sentence, ...bestVariant }
}



/* const processedH3Groups = groupedH3s.map(processH3Group) */

/**
 * @param {groupedH3s[number]} group
 */
function processH3Group(group) {
  const processedGroup = group.map((h3) => processSentence(h3.text))
  return processedGroup
}

function checkStructure(sentence) {
  return ""
    + sentence.subject && 1
    + sentence.verb && 2
    + sentence.predicate && 3
}

/**
 * @param {processedH3Groups[number]} headings
 */
function checkHeadings(headings, logger, keyword) {
  const sameVoice = headings.every(heading => {
    return heading.mood === headings[0].mood
  })

  const sameTense = headings.some(({ tense }) => tense === null)
    || headings.every(({ tense }) => tense === headings[0].tense)

  const same = sameVoice && sameTense

  if (!same) {
    const report = headings.map(h => {
      return `    - ${h.text} (${h.mood}, ${h.tense || "tense unclear"})`
    }).join("\n")

    logger.warn(`Divergent ${keyword}:\n\n${report}\n\n  Items should all follow the same grammatical tense and voice.\n\n  https://npmjs.com/package/copycop#correlate-parallel-ideas\n`)
  }

  const [heading, ...siblings] = headings
}

function handleNode(node) {
  if (node.type === "SentenceNode") {
    const processed = processSentence(node)
    Object.assign(node, processed)
  } else if (node.type === "ParagraphNode") {
    node.children.forEach(c => handleNode(c))
  } else if (node.type === "list") {
    node.children.forEach(c => handleNode(c))
    return node
  } else if (node.children) {
    return node
  } else {
    return node
  }
}

function colons() {
  return function(tree) {
    visit(tree, { type: "PunctuationNode", value: ":" }, (node, index, parent) => {
      /* console.log(parent.children.flatMap(({ children }) => children?.map(({ value }) => value)).join(" ")) */
      /* const sentence = unified().use(retextStringify).stringify(tree) */
      /* console.log(sentence) */

      const beforeColon = parent.children.slice(0, index)
      /* console.log(beforeColon.flatMap(({ children }) => children?.map(({ value }) => value)).join(" ")) */
      /* console.log(beforeColon.map(child => child.value || child.children)) */
      const afterColon = parent.children.slice(index + 1)
      /* console.log(afterColon.flatMap(({ children }) => children?.map(({ value }) => value)).join(" ")) */
      /* console.log(afterColon.map(child => child.value || child.children)) */
      if (afterColon.length) {
        parent.type = "ParagraphNode"
        parent.children = [
          {
            type: "SentenceNode",
            children: beforeColon
          },
          {
            type: "SentenceNode",
            children: afterColon
          }
        ]
      }
    })
    visit(tree, (node, index, parent) => {
      return node.type === "ParagraphNode"
        && parent.type === "ParagraphNode"
    }, (node, index, parent) => {
      parent.children.splice(index, 1, node.children[0], node.children[1])
    })
  }
}

function grammar() {
  return function(tree) {
    /* visit(tree, { value: ":" }, (node) => console.log({ node })) */
    tree.children.forEach(child => {
      handleNode(child)
    })

    return tree
  }
}

async function processMarkdown(string, logger) {
  /** @typedef {ReturnType<import("remark")["remark"]>} RemarkDoc */
  /** @typedef {ReturnType<RemarkDoc["parse"]>} RemarkTree */
  /** @typedef {Extract<RemarkTree["children"][number], { type: "heading"}> & { group?: number }} Heading */
  /** @typedef {Array<Heading>} Headings */

  const fallback = "# No string present"

  const file = unified()
    .use(remarkParse)
    .parse(string)



  const blocks = file.children.map(child => {
    if (child.type === "heading") {
      return handleBlock(child)
    } else if (child.type === "paragraph") {
      return handleBlock(child)
    } else if (child.type === "list") {
      const items = child.children.map(item => handleBlock(item))
      return { ...child, items }
    } else {
      return child
    }
  })

  function handleBlock(block) {
    unified().use(strip).run(block)
    const text = unified()
      .use(remarkStringify)
      .stringify(block)
      .replace(/^#+\ /, "")
      .replace(/^\* /, "")

    const output = unified().use(retextEnglish).use(strip).parse(text)
    unified().use(colons).run(output)
    unified().use(grammar).run(output)

    const paragraphNode = output.children[0]
    const headingNode = output.children[0].children[0]
    const node = block.type === "heading" ? headingNode : paragraphNode

    return {
      ...node,
      type: block.type,
      depth: block.depth,
      position: block.position
    }
  }

  /** @type {Headings} */
  const headings = blocks.filter((b) => b.type === "heading")



  blocks.forEach((block, index) => {
    if (block.type === "heading") {
      if (block.text.endsWith(":")) logger.warn(`Colon heading:\n\n    - ${block.text}\n\n  Headings work without colons.`)
      if (block.depth > 3) logger.warn(`Sub-subheading:\n\n    - ${block.text}\n\n  Only use H2s and H3s.\n`)

      if (block.depth === 1 && index > 0) logger.warn(`Title heading:\n\n    - ${block.text}\n\n  Only use H2s and H3s.\n`)

      if (block.depth === 3) {
        const prev = blocks.slice(0, index)
        if (prev.at(-1).type === "heading") logger.warn(`Immediate sibling headings:\n\n    - ${prev.at(-1).text}\n    - ${block.text}\n\n  A heading should follow text, not another heading.\n\n  https://npmjs.com/package/copycop#introduce-each-section\n`)
        if (!prev.find(x => x.depth === 2)) logger.warn(`Orphan heading:\n\n  - ${block.text}\n\n  Every H3 should have a parent H2.`)
      }
    }
  })

  /* @type {Headings} */
  const h2s = headings.filter((h) => h.depth === 2)

  const sections = Object.values(Object.groupBy(headings.filter((h, i, a) => {
    if (h.depth === 3) {
      // TODO: This isn't the correct way to get the heading
      if (a[i - 1].depth !== 3) {
        h.group = i
      } else {
        h.group = a[i - 1].group
      }
      return true
    }
  }), (item) => item.group))

  if (h2s.length === 1) logger?.warn(`Singleton H2:\n\n    - ${h2s[0].text}\n\n  If a section has headings, it should have more than one.\n\n  https://npmjs.com/package/copycop#only-use-headings-in-multiples\n`)

  checkHeadings(h2s, logger, "headings")

  sections.forEach(section => {
    if (section.length === 1) logger.warn(`Singleton H3:\n\n    - ${section[0].text}\n\n  If a section has subheadings, it should have more than one.\n\n  https://npmjs.com/package/copycop$only-use-headings-in-multiples\n`)
    checkHeadings(section, logger, "headings")
  })

  blocks.forEach(block => {
    switch (block.type) {
      case ("paragraph"):
        const [first, rest] = block.children
        if (first.pronoun === "anonymous") {
          logger.warn(`Anonymous pronoun:\n\n    - ${first.text}\n\n  It looks like there is a pronoun near the beginning of this paragraph. Use explicit nouns in the introduction to a paragraph.\n`)
        }

        block.children.forEach(sentence => {
          if (sentence.mood === "passive") logger.info(`Passive tense:\n\n    - ${sentence.text}\n\n  Consider rephrasing to active tense.\n\n  https://npmjs.com/package/copycop#define-a-subject\n`)
          if (sentence.mood === "gerund") logger.info(`Gerund:\n\n    - ${sentence.text}\n\n  Avoid gerunds.\n`)
        })
        break;
      case ("list"):
        const firstSentences = block.items.map(child => child.children[0])
        checkHeadings(firstSentences, logger, "list items")
    }
  })
}

export { processSentence, processMarkdown }
