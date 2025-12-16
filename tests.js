import { processSentence, processMarkdown } from "./index.js"

const sentences = [
  "here's a sentence",
  "the sentence was written in the passive tense",
  "the donut: being eaten",
  "he went to the store",
  "he played with the dog",
  "contact the api",
  "query the code",
  "fix a problem",
  "exceptions",
  "this is it",
  "what do you want?",
  "this is why we do that",
  "my dress suggests this is too much",
  "He's a good guy"
]

sentences.forEach(sentence => {
  const data = processMarkdown(sentence)

  console.log(sentence)
  if(data.gendered) {
    console.log("- gendered language")
  }
  if(data.mood === "passive") {
    console.log("- passive tense")
  }
  if(data.pronoun === "anonymous") {
    console.log("- potentially confusing pronoun")
  }
  if(data.person === "second") {
    console.log("- second-person")
  }
  if(data.person === "third") {
    console.log("- third person")
  }
  if(data.person === "first") {
    console.log("- first person")
  }
})
